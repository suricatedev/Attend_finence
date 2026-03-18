import csv
from datetime import datetime
from pathlib import Path

from django.core.management.base import BaseCommand
from django.db.models import Q

from solicitacoes.models import SolicitacaoRotaItem


def _norm(s: str | None) -> str:
    return (s or "").strip()


class Command(BaseCommand):
    help = (
        "Exporta (somente leitura) itens de solicitações Em Rota com dados legados "
        "para CSV, em 4 arquivos separados."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--output-dir",
            default=".",
            help="Diretório onde os CSVs serão salvos (default: diretório atual).",
        )
        parser.add_argument(
            "--no-count",
            action="store_true",
            help="Não executa .count() ao final (mais leve em bases grandes).",
        )
        parser.add_argument(
            "--chunk-size",
            type=int,
            default=2000,
            help="Tamanho do chunk do iterator() (default: 2000).",
        )

    def handle(self, *args, **options):
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_dir = Path(options["output_dir"]).expanduser().resolve()
        output_dir.mkdir(parents=True, exist_ok=True)
        chunk_size = int(options["chunk_size"] or 2000)
        no_count = bool(options["no_count"])

        cols = [
            "tag",
            "solicitacao_id",
            "solicitacao_ticket",
            "solicitacao_status",
            "solicitacao_tipo",
            "solicitacao_data_criacao",
            "item_id",
            "item_ordem",
            "item_ticket_item",
            "item_servico",
            "recebedor_texto",
            "chave_pix_texto",
            "cliente_empresa_texto",
            "cnpj_texto",
            "recebedor_fk_id",
            "recebedor_fk_nome",
            "recebedor_fk_pix",
        ]

        def export_items_to_csv(path: Path, item_qs, tag: str) -> None:
            with path.open("w", newline="", encoding="utf-8-sig") as f:
                w = csv.writer(
                    f, delimiter=",", quoting=csv.QUOTE_MINIMAL, lineterminator="\r\n"
                )
                w.writerow(cols)

                for item in item_qs.iterator(chunk_size=chunk_size):
                    sol = item.solicitacao
                    servico_nome = item.servico.nome if item.servico else ""

                    fk = getattr(item, "recebedor_fk", None)
                    fk_id = getattr(fk, "id", None) if fk else None
                    fk_nome = getattr(fk, "nome", "") if fk else ""
                    fk_pix = getattr(fk, "chave_pix", "") if fk else ""

                    w.writerow(
                        [
                            tag,
                            sol.id,
                            _norm(getattr(sol, "ticket", "")),
                            _norm(getattr(sol, "status", "")),
                            _norm(getattr(sol, "tipo", "")),
                            getattr(sol, "data_de_criacao", None),
                            item.id,
                            getattr(item, "ordem", None),
                            _norm(getattr(item, "ticket_item", "")),
                            _norm(servico_nome),
                            _norm(getattr(item, "recebedor", "")),
                            _norm(getattr(item, "chave_pix", "")),
                            _norm(getattr(item, "cliente_empresa", "")),
                            _norm(getattr(item, "cnpj", "")),
                            fk_id,
                            _norm(fk_nome),
                            _norm(fk_pix),
                        ]
                    )

        # Base: itens de rota de solicitações Em Rota (não excluídas)
        base_items = (
            SolicitacaoRotaItem.objects.select_related(
                "solicitacao", "servico", "recebedor_fk"
            )
            .filter(solicitacao__excluida=False, solicitacao__tipo="em_rota")
            .order_by("solicitacao_id", "ordem", "id")
        )

        # 1) Itens sem recebedor_fk
        qs1 = base_items.filter(recebedor_fk__isnull=True)
        file1 = output_dir / f"legados_em_rota_1_sem_recebedor_fk_{ts}.csv"
        export_items_to_csv(file1, qs1, "1_sem_recebedor_fk")

        # 2) Itens com nome legado preenchido
        qs2 = base_items.exclude(Q(recebedor__isnull=True) | Q(recebedor=""))
        file2 = output_dir / f"legados_em_rota_2_nome_legado_preenchido_{ts}.csv"
        export_items_to_csv(file2, qs2, "2_nome_legado_preenchido")

        # 3) Itens com pix legado vazio
        qs3 = base_items.filter(Q(chave_pix__isnull=True) | Q(chave_pix=""))
        file3 = output_dir / f"legados_em_rota_3_pix_legado_vazio_{ts}.csv"
        export_items_to_csv(file3, qs3, "3_pix_legado_vazio")

        # 4) Itens sem FK e sem pix legado
        qs4 = base_items.filter(recebedor_fk__isnull=True).filter(
            Q(chave_pix__isnull=True) | Q(chave_pix="")
        )
        file4 = output_dir / f"legados_em_rota_4_sem_fk_e_sem_pix_{ts}.csv"
        export_items_to_csv(file4, qs4, "4_sem_fk_e_sem_pix")

        self.stdout.write(self.style.SUCCESS("✅ CSVs gerados (somente leitura):"))
        self.stdout.write(f" - {file1}")
        self.stdout.write(f" - {file2}")
        self.stdout.write(f" - {file3}")
        self.stdout.write(f" - {file4}")

        if not no_count:
            self.stdout.write("")
            self.stdout.write("Linhas por arquivo:")
            self.stdout.write(f" - 1_sem_recebedor_fk: {qs1.count()}")
            self.stdout.write(f" - 2_nome_legado_preenchido: {qs2.count()}")
            self.stdout.write(f" - 3_pix_legado_vazio: {qs3.count()}")
            self.stdout.write(f" - 4_sem_fk_e_sem_pix: {qs4.count()}")

