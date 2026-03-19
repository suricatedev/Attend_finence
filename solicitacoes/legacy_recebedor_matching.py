from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass
from difflib import SequenceMatcher
from typing import Iterable


@dataclass(frozen=True)
class MatchConfig:
    fuzzy_min_score: int = 95
    fuzzy_min_gap: int = 5


@dataclass(frozen=True)
class Candidate:
    recebedor_id: int
    nome: str
    chave_pix: str
    nome_normalizado: str


@dataclass(frozen=True)
class MatchResult:
    strategy: str
    decision: str
    score: int
    confidence: str
    reason: str
    chosen: Candidate | None
    contenders: list[Candidate]


def strip_accents(value: str) -> str:
    normalized = unicodedata.normalize("NFD", value or "")
    return "".join(ch for ch in normalized if unicodedata.category(ch) != "Mn")


def normalize_name(value: str) -> str:
    text = strip_accents((value or "").strip().lower())
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def normalize_pix(value: str) -> str:
    return re.sub(r"\s+", "", (value or "").strip().lower())


def tokenize_name(value: str) -> set[str]:
    normalized = normalize_name(value)
    if not normalized:
        return set()
    return {tok for tok in normalized.split(" ") if tok}


def _score_name_similarity(a: str, b: str) -> int:
    if not a or not b:
        return 0
    seq = SequenceMatcher(None, a, b).ratio()
    tok_a = tokenize_name(a)
    tok_b = tokenize_name(b)
    overlap = (len(tok_a & tok_b) / max(1, len(tok_a | tok_b))) if (tok_a or tok_b) else 0.0
    weighted = (seq * 0.8) + (overlap * 0.2)
    return int(round(weighted * 100))


def build_candidates(recebedores: Iterable) -> list[Candidate]:
    out: list[Candidate] = []
    for r in recebedores:
        nome = (getattr(r, "nome", "") or "").strip()
        chave_pix = (getattr(r, "chave_pix", "") or "").strip()
        out.append(
            Candidate(
                recebedor_id=int(r.id),
                nome=nome,
                chave_pix=chave_pix,
                nome_normalizado=normalize_name(nome),
            )
        )
    return out


def match_legacy_item(
    recebedor_texto: str,
    chave_pix_texto: str,
    candidates: list[Candidate],
    config: MatchConfig | None = None,
) -> MatchResult:
    cfg = config or MatchConfig()
    nome_norm = normalize_name(recebedor_texto)
    pix_norm = normalize_pix(chave_pix_texto)

    # Nível A: PIX exato e único
    if pix_norm:
        pix_hits = [c for c in candidates if normalize_pix(c.chave_pix) == pix_norm]
        if len(pix_hits) == 1:
            return MatchResult(
                strategy="nivel_a_pix_exato",
                decision="auto_nivel_a",
                score=100,
                confidence="alta",
                reason="PIX legado coincide com um único recebedor.",
                chosen=pix_hits[0],
                contenders=pix_hits,
            )
        if len(pix_hits) > 1:
            return MatchResult(
                strategy="nivel_a_pix_ambiguo",
                decision="manual",
                score=100,
                confidence="baixa",
                reason="PIX legado corresponde a múltiplos recebedores.",
                chosen=None,
                contenders=pix_hits,
            )

    # Nível B: nome normalizado exato e único
    if nome_norm:
        name_hits = [c for c in candidates if c.nome_normalizado == nome_norm]
        if len(name_hits) == 1:
            return MatchResult(
                strategy="nivel_b_nome_exato",
                decision="auto_nivel_b",
                score=100,
                confidence="alta",
                reason="Nome legado normalizado coincide com um único recebedor.",
                chosen=name_hits[0],
                contenders=name_hits,
            )
        if len(name_hits) > 1:
            return MatchResult(
                strategy="nivel_b_nome_ambiguo",
                decision="manual",
                score=100,
                confidence="baixa",
                reason="Nome legado normalizado coincide com múltiplos recebedores.",
                chosen=None,
                contenders=name_hits,
            )

    # Nível C: fuzzy com limiar + gap de segurança
    if nome_norm:
        scored: list[tuple[int, Candidate]] = [
            (_score_name_similarity(nome_norm, c.nome_normalizado), c) for c in candidates
        ]
        scored.sort(key=lambda pair: pair[0], reverse=True)
        if scored:
            top_score, top_candidate = scored[0]
            second_score = scored[1][0] if len(scored) > 1 else 0
            gap = top_score - second_score
            if top_score >= cfg.fuzzy_min_score and gap >= cfg.fuzzy_min_gap:
                return MatchResult(
                    strategy="nivel_c_fuzzy",
                    decision="auto_nivel_c",
                    score=top_score,
                    confidence="media",
                    reason=(
                        f"Fuzzy acima do limiar (score={top_score}) com gap seguro "
                        f"(gap={gap})."
                    ),
                    chosen=top_candidate,
                    contenders=[top_candidate],
                )
            top_contenders = [pair[1] for pair in scored[:3] if pair[0] > 0]
            return MatchResult(
                strategy="nivel_c_fuzzy_ambiguo",
                decision="manual",
                score=top_score,
                confidence="baixa",
                reason=(
                    "Fuzzy sem segurança para decisão automática "
                    f"(top={top_score}, segundo={second_score}, gap={gap})."
                ),
                chosen=None,
                contenders=top_contenders,
            )

    return MatchResult(
        strategy="sem_dados_suficientes",
        decision="manual",
        score=0,
        confidence="baixa",
        reason="Sem dados legados suficientes (nome/pix) para vincular automaticamente.",
        chosen=None,
        contenders=[],
    )

