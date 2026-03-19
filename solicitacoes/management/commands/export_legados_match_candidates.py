import csv
from datetime import datetime
from pathlib import Path

from django.core.management.base import BaseCommand
from django.db.models import Q

from solicitacoes.legacy_recebedor_matching import (
    MatchConfig,
    build_candidates,
    match_legacy_item,
    normalize_name,
    normalize_pix,
)
from solicitacoes.models import Recebedor, SolicitacaoRotaItem


def _norm(s):
    return (s or "").strip()


class Command(BaseCommand):
    help = (
        "Gera CSV de dry-run com candidatos de vinculação de recebedor para itens "
        "legados de Em Rota. Não atualiza banco."
    )

    def add_arguments(self, parser):
        parser.add_argument("--output-dir", default=".")
        parser.add_argument("--chunk-size", type=int, default=2000)
        parser.add_argument("--fuzzy-min-score", type=int, default=95)
        parser.add_argument("--fuzzy-min-gap", type=int, default=5)
        parser.add_argument(
            "--include-with-fk",
            action="store_true",
            help="Inclui itens que já têm recebedor_fk (somente para diagnóstico).",
        )

    def handle(self, *args, **options):
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_dir = Path(options["output_dir"]).expanduser().resolve()
        output_dir.mkdir(parents=True, exist_ok=True)
        chunk_size = int(options["chunk_size"])
        cfg = MatchConfig(
            fuzzy_min_score=int(options["fuzzy_min_score"]),
            fuzzy_min_gap=int(options["fuzzy_min_gap"]),
        )
        include_with_fk = bool(options["include_with_fk"])

        recebedores = Recebedor.objects.all().only("id", "nome", "chave_pix")
        candidates = build_candidates(recebedores)

        qs = SolicitacaoRotaItem.objects.select_related(
            "solicitacao", "recebedor_fk", "servico"
        ).filter(
            solicitacao__excluida=False,
            solicitacao__tipo="em_rota",
        )
        if not include_with_fk:
            qs = qs.filter(recebedor_fk__isnull=True)
        else:
            # mantém todos, mas prioriza os sem FK no topo
            qs = qs.order_by("recebedor_fk_id", "solicitacao_id", "ordem", "id")

        out_file = output_dir / f"legados_em_rota_match_candidates_{ts}.csv"
        cols = [
            "item_id",
            "solicitacao_id",
            "ticket",
            "status",
            "ordem",
            "ticket_item",
            "recebedor_texto",
            "recebedor_texto_normalizado",
            "chave_pix_texto",
            "chave_pix_texto_normalizado",
            "recebedor_fk_atual_id",
            "recebedor_fk_atual_nome",
            "match_strategy",
            "decision",
            "score",
            "confidence",
            "reason",
            "suggested_recebedor_id",
            "suggested_recebedor_nome",
            "suggested_recebedor_pix",
            "candidate_1_id",
            "candidate_1_nome",
            "candidate_1_pix",
            "candidate_2_id",
            "candidate_2_nome",
            "candidate_2_pix",
            "candidate_3_id",
            "candidate_3_nome",
            "candidate_3_pix",
            "review_status",
            "review_notes",
        ]

        rows = 0
        with out_file.open("w", newline="", encoding="utf-8-sig") as f:
            w = csv.writer(
                f, delimiter=",", quoting=csv.QUOTE_MINIMAL, lineterminator="\r\n"
            )
            w.writerow(cols)

            for item in qs.iterator(chunk_size=chunk_size):
                result = match_legacy_item(
                    recebedor_texto=item.recebedor or "",
                    chave_pix_texto=item.chave_pix or "",
                    candidates=candidates,
                    config=cfg,
                )

                chosen = result.chosen
                cands = result.contenders[:3]

                fk = item.recebedor_fk
                current_fk_id = getattr(fk, "id", "")
                current_fk_nome = getattr(fk, "nome", "")

                row = [
                    item.id,
                    item.solicitacao_id,
                    _norm(getattr(item.solicitacao, "ticket", "")),
                    _norm(getattr(item.solicitacao, "status", "")),
                    item.ordem,
                    _norm(item.ticket_item),
                    _norm(item.recebedor),
                    normalize_name(item.recebedor or ""),
                    _norm(item.chave_pix),
                    normalize_pix(item.chave_pix or ""),
                    current_fk_id,
                    _norm(current_fk_nome),
                    result.strategy,
                    result.decision,
                    result.score,
                    result.confidence,
                    result.reason,
                    getattr(chosen, "recebedor_id", ""),
                    _norm(getattr(chosen, "nome", "")),
                    _norm(getattr(chosen, "chave_pix", "")),
                ]

                for idx in range(3):
                    cand = cands[idx] if idx < len(cands) else None
                    row.extend(
                        [
                            getattr(cand, "recebedor_id", ""),
                            _norm(getattr(cand, "nome", "")),
                            _norm(getattr(cand, "chave_pix", "")),
                        ]
                    )

                # Campos de revisão manual preenchidos pela equipe
                row.extend(["pending", ""])
                w.writerow(row)
                rows += 1

        self.stdout.write(self.style.SUCCESS("✅ Dry-run concluído (sem alterações no banco)."))
        self.stdout.write(f"Arquivo: {out_file}")
        self.stdout.write(f"Total de linhas: {rows}")

