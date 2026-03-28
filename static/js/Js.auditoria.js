function auditEscapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function parseMoney(value) {
    if (value === null || value === undefined || value === "") return null;
    if (typeof value === "number") return value;
    const raw = String(value).replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
}

function formatMoney(value) {
    const n = parseMoney(value);
    if (n === null) return "—";
    return `R$ ${n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function isMoneyField(field, label) {
    const f = String(field || "").toLowerCase();
    const l = String(label || "").toLowerCase();
    return f.includes("valor") || l.includes("valor") || l.includes("receita") || l.includes("adiantamento");
}

function detectStatusField(field, label) {
    const f = String(field || "").toLowerCase();
    const l = String(label || "").toLowerCase();
    return f.includes("status") || l.includes("status");
}

function normalizeText(value) {
    return String(value || "").toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
}
let auditPreset = "";

function buildEventTitle({ acao, ticket, detalhes, campos, objetoId }) {
    const tk = ticket || `#${objetoId}`;
    if (acao === "create") return `Solicitação ${tk} criada`;
    if (acao === "delete") return `Solicitação ${tk} excluída logicamente`;
    if (acao === "login") return `Login no sistema`;
    const statusChange = (detalhes || []).find((d) => detectStatusField(d.campo, d.label));
    if (statusChange) return `Status alterado em ${tk}`;
    const moneyChange = (detalhes || []).find((d) => isMoneyField(d.campo, d.label));
    if (moneyChange) return `Valor alterado em ${tk}`;
    if (String(campos || "").toLowerCase().includes("estorno")) return `Solicitação ${tk} movida para estorno`;
    return `Solicitação ${tk} atualizada`;
}

function extractClientFromDetails(detalhes) {
    if (!Array.isArray(detalhes)) return "";
    const found = detalhes.find((d) => {
        const k = normalizeText(d.campo || d.label || "");
        return k.includes("cliente") || k.includes("empresa");
    });
    if (!found) return "";
    return String(found.depois || found.antes || "");
}

function computeImpact(detalhes) {
    let total = 0;
    let count = 0;
    (detalhes || []).forEach((item) => {
        if (!isMoneyField(item.campo, item.label)) return;
        const before = parseMoney(item.antes);
        const after = parseMoney(item.depois);
        if (before === null || after === null) return;
        total += (after - before);
        count += 1;
    });
    return { total, count };
}

function classifyCriticality(acao, detalhes, campos) {
    const lowerA = normalizeText(acao);
    const lowerC = normalizeText(campos);
    if (lowerA.includes("delete") || lowerC.includes("estorno") || lowerC.includes("recusa")) return "alta";
    const impact = Math.abs(computeImpact(detalhes).total);
    if (impact >= 1000) return "alta";
    if (impact > 0) return "media";
    const hasStatus = (detalhes || []).some((d) => detectStatusField(d.campo, d.label));
    if (hasStatus) return "media";
    return "baixa";
}

function criticalityLabel(level) {
    if (level === "alta") return "Alta";
    if (level === "media") return "Média";
    return "Baixa";
}

function semanticValue(field, label, value) {
    if (value === null || value === undefined || value === "") return "—";
    if (isMoneyField(field, label)) return formatMoney(value);
    return auditEscapeHtml(String(value));
}

function buildDiffRows(detalhes) {
    if (!Array.isArray(detalhes) || detalhes.length === 0) {
        return `<div class="audit-sub">Nenhuma mudança detalhada disponível.</div>`;
    }
    const primary = [...detalhes].slice(0, 3);
    return primary.map((item) => {
        const label = auditEscapeHtml(item.label || item.campo || "Campo");
        const before = semanticValue(item.campo, item.label, item.antes);
        const after = semanticValue(item.campo, item.label, item.depois);
        return `
            <div class="audit-diff-row">
                <span class="audit-diff-label">${label}</span>
                <span class="audit-diff-before">${before}</span>
                <span class="audit-diff-arrow">→</span>
                <span class="audit-diff-after">${after}</span>
            </div>
        `;
    }).join("");
}

function buildRouteItemsHtml(itens) {
    if (!Array.isArray(itens) || itens.length === 0) return "";
    const cards = itens.map((item) => {
        const detalhado = (Number(item.valor_km || 0) + Number(item.valor_pedagio || 0) + Number(item.valor_hospedagem || 0) + Number(item.valor_fluvial || 0) + Number(item.valor_outros || 0));
        const totalTicket = Number(item.valor_atividade || 0) + detalhado;
        return `
            <article class="audit-route-card">
                <h4>Ticket ${auditEscapeHtml(item.ticket_item || `#${item.ordem || ""}`)}</h4>
                <div class="audit-route-line"><strong>Valor da atividade:</strong> ${formatMoney(item.valor_atividade || 0)}</div>
                <div class="audit-route-line"><strong>Valor detalhado:</strong> ${formatMoney(detalhado)}</div>
                <div class="audit-route-line"><strong>Valor total do ticket:</strong> ${formatMoney(totalTicket)}</div>
                <div class="audit-route-line"><strong>Serviço:</strong> ${auditEscapeHtml(item.servico || "—")}</div>
                <div class="audit-route-line"><strong>Recebedor:</strong> ${auditEscapeHtml(item.recebedor || "—")}</div>
                <div class="audit-route-line"><strong>Chave PIX:</strong> ${auditEscapeHtml(item.chave_pix || "—")}</div>
                <div class="audit-route-line"><strong>Cliente/Empresa:</strong> ${auditEscapeHtml(item.cliente_empresa || "—")}</div>
                <div class="audit-route-line"><strong>CNPJ:</strong> ${auditEscapeHtml(item.cnpj || "—")}</div>
            </article>
        `;
    }).join("");
    return `<div class="audit-route-title">Tickets da solicitação agrupada</div><div class="audit-route-grid">${cards}</div>`;
}

function boolToText(value) {
    return value ? "Sim" : "Não";
}

function getEventoTipoLabel(tipo) {
    const map = {
        deslocamento_individual: "Deslocamento individual",
        deslocamento_agrupada: "Deslocamento agrupada",
        tecnico_individual: "Técnico individual",
        tecnico_agrupada: "Técnico agrupada",
    };
    return map[tipo] || "Solicitação";
}

function getFieldValue(obj, key, fallback = "—") {
    const value = obj && Object.prototype.hasOwnProperty.call(obj, key) ? obj[key] : "";
    if (value === "" || value === null || value === undefined) return fallback;
    return value;
}

function buildCreateFieldRows(data, schema) {
    return schema.map((item) => {
        const raw = getFieldValue(data, item.key, "");
        let value = raw;
        if (item.type === "money") value = formatMoney(raw || 0);
        if (item.type === "bool") value = boolToText(Boolean(raw));
        if (value === "" || value === null || value === undefined) value = "—";
        return `<div class="audit-create-field"><span class="audit-create-label">${auditEscapeHtml(item.label)}</span><span class="audit-create-value">${auditEscapeHtml(String(value))}</span></div>`;
    }).join("");
}

function buildCreateModeHtml(eventoTipo, baseData, itensRota, itensTecnico) {
    const schemaBase = [
        { key: "ticket", label: "Ticket" },
        { key: "tipo", label: "Tipo" },
        { key: "status", label: "Status" },
        { key: "titulo", label: "Título" },
        { key: "solicitante", label: "Solicitante" },
        { key: "recebedor", label: "Recebedor" },
        { key: "chave_pix", label: "Chave PIX" },
        { key: "cliente_empresa", label: "Cliente/Empresa" },
        { key: "cnpj", label: "CNPJ" },
        { key: "servico", label: "Serviço" },
        { key: "prioridade", label: "Prioridade" },
        { key: "descricao", label: "Descrição" },
        { key: "descricao_em_rota", label: "Descrição Em Rota" },
        { key: "data_de_criacao", label: "Data de criação" },
        { key: "data_de_pagamento", label: "Data de pagamento" },
        { key: "valor", label: "Valor", type: "money" },
        { key: "valor_receita", label: "Valor receita", type: "money" },
        { key: "valor_em_rota", label: "Valor em rota", type: "money" },
        { key: "valor_km", label: "Valor KM", type: "money" },
        { key: "valor_pedagio", label: "Valor pedágio", type: "money" },
        { key: "valor_hospedagem", label: "Valor hospedagem", type: "money" },
        { key: "valor_fluvial", label: "Valor fluvial", type: "money" },
        { key: "valor_outros", label: "Valor outros", type: "money" },
    ];
    const schemaRota = [
        { key: "ticket_item", label: "Ticket" },
        { key: "servico", label: "Serviço" },
        { key: "recebedor", label: "Recebedor" },
        { key: "chave_pix", label: "Chave PIX" },
        { key: "cliente_empresa", label: "Cliente/Empresa" },
        { key: "cnpj", label: "CNPJ" },
        { key: "valor_atividade", label: "Valor atividade", type: "money" },
        { key: "valor_km", label: "Valor KM", type: "money" },
        { key: "valor_pedagio", label: "Valor pedágio", type: "money" },
        { key: "valor_hospedagem", label: "Valor hospedagem", type: "money" },
        { key: "valor_fluvial", label: "Valor fluvial", type: "money" },
        { key: "valor_outros", label: "Valor outros", type: "money" },
    ];
    const schemaTecnico = [
        { key: "ticket_item", label: "Ticket" },
        { key: "recebedor", label: "Técnico/Recebedor" },
        { key: "chave_pix", label: "Chave PIX" },
        { key: "servico", label: "Serviço" },
        { key: "cliente_empresa", label: "Cliente/Empresa" },
        { key: "valor_pagamento", label: "Valor pagamento", type: "money" },
        { key: "valor_extra", label: "Valor extra", type: "money" },
        { key: "valor_total", label: "Valor total", type: "money" },
        { key: "descricao", label: "Descrição" },
        { key: "data_realizacao", label: "Data realização" },
        { key: "data_pagamento", label: "Data pagamento" },
        { key: "atividade_produtiva", label: "Atividade produtiva", type: "bool" },
    ];

    const baseBlock = `
        <section class="audit-create-section">
            <h4>Campos do formulário (solicitação)</h4>
            <div class="audit-create-grid">${buildCreateFieldRows(baseData || {}, schemaBase)}</div>
        </section>
    `;

    if (eventoTipo === "deslocamento_agrupada") {
        const itens = (itensRota || []).map((item, index) => `
            <section class="audit-create-section">
                <h4>Ticket da agrupada ${index + 1}</h4>
                <div class="audit-create-grid">${buildCreateFieldRows(item, schemaRota)}</div>
            </section>
        `).join("");
        return baseBlock + itens;
    }

    if (eventoTipo === "tecnico_agrupada" || eventoTipo === "tecnico_individual") {
        const itens = (itensTecnico || []).map((item, index) => `
            <section class="audit-create-section">
                <h4>Ticket técnico ${index + 1}</h4>
                <div class="audit-create-grid">${buildCreateFieldRows(item, schemaTecnico)}</div>
            </section>
        `).join("");
        return baseBlock + itens;
    }

    return baseBlock;
}

function renderEventCards() {
    const cards = document.querySelectorAll(".audit-event-card");
    let totalCriticos = 0;
    let totalFinanceiros = 0;
    let impactoLiquido = 0;
    const statusSet = new Set();

    cards.forEach((card) => {
        let detalhes = [];
        try {
            const raw = card.getAttribute("data-detalhes");
            if (raw) detalhes = JSON.parse(raw);
        } catch (e) {
            detalhes = [];
        }

        const acao = String(card.getAttribute("data-acao") || "");
        const usuario = String(card.getAttribute("data-usuario") || "Sistema");
        const ticket = String(card.getAttribute("data-ticket") || "");
        const datahora = String(card.getAttribute("data-datahora") || "");
        const origem = String(card.getAttribute("data-origem") || "");
        const campos = String(card.getAttribute("data-campos") || "");
        const objetoId = String(card.getAttribute("data-objeto-id") || "");
        const client = extractClientFromDetails(detalhes);
        const solicitacaoTipo = String(card.getAttribute("data-solicitacao-tipo") || "");
        let itensRota = [];
        try {
            const rawItensRota = card.getAttribute("data-itens-rota");
            if (rawItensRota) itensRota = JSON.parse(rawItensRota);
        } catch (e) {
            itensRota = [];
        }

        const title = buildEventTitle({ acao, ticket, detalhes, campos, objetoId });
        const impact = computeImpact(detalhes);
        const criticidade = classifyCriticality(acao, detalhes, campos);
        const statusChange = detalhes.find((d) => detectStatusField(d.campo, d.label));
        const status = statusChange ? String(statusChange.depois || statusChange.antes || "") : "";

        card.setAttribute("data-filter-ticket", normalizeText(ticket || objetoId));
        card.setAttribute("data-filter-usuario", normalizeText(usuario));
        card.setAttribute("data-filter-cliente", normalizeText(client));
        card.setAttribute("data-filter-status", normalizeText(status));
        card.setAttribute("data-filter-criticidade", criticidade);
        card.setAttribute("data-filter-busca", normalizeText(`${ticket} ${usuario} ${client} ${campos} ${origem}`));
        card.setAttribute("data-impacto", String(impact.total || 0));
        card.setAttribute("data-acao-normalizada", normalizeText(acao));

        const titleEl = card.querySelector("[data-event-title]");
        if (titleEl) titleEl.textContent = title;
        const ticketEl = card.querySelector("[data-event-ticket]");
        if (ticketEl) ticketEl.textContent = ticket || `#${objetoId}`;
        const diffEl = card.querySelector("[data-inline-diff]");
        if (diffEl) diffEl.innerHTML = buildDiffRows(detalhes);
        const critEl = card.querySelector("[data-event-criticidade]");
        if (critEl) {
            critEl.textContent = `Criticidade ${criticalityLabel(criticidade)}`;
            critEl.classList.add(`audit-criticidade-${criticidade}`);
        }
        const impactEl = card.querySelector("[data-event-impacto]");
        if (impactEl) {
            const sign = impact.total > 0 ? "+" : "";
            impactEl.textContent = `Impacto financeiro: ${sign}${formatMoney(impact.total)}`;
            if (impact.total < 0) impactEl.classList.add("audit-impacto-neg");
            if (impact.total > 0) impactEl.classList.add("audit-impacto-pos");
        }
        if (criticidade === "alta") totalCriticos += 1;
        if (impact.count > 0) totalFinanceiros += 1;
        impactoLiquido += impact.total;
        if (status) statusSet.add(status);
    });

    const totalEl = document.getElementById("kpiTotalEventos");
    if (totalEl) totalEl.textContent = String(cards.length);
    const critEl = document.getElementById("kpiEventosCriticos");
    if (critEl) critEl.textContent = String(totalCriticos);
    const finEl = document.getElementById("kpiEventosFinanceiros");
    if (finEl) finEl.textContent = String(totalFinanceiros);
    const impactEl = document.getElementById("kpiImpactoFinanceiro");
    if (impactEl) {
        const sign = impactoLiquido > 0 ? "+" : "";
        impactEl.textContent = `${sign}${formatMoney(impactoLiquido)}`;
        if (impactoLiquido < 0) impactEl.classList.add("audit-impacto-neg");
        if (impactoLiquido > 0) impactEl.classList.add("audit-impacto-pos");
    }

    const statusSelect = document.getElementById("filterStatusLocal");
    if (statusSelect) {
        [...statusSet].sort((a, b) => a.localeCompare(b, "pt-BR")).forEach((status) => {
            const op = document.createElement("option");
            op.value = normalizeText(status);
            op.textContent = status;
            statusSelect.appendChild(op);
        });
    }
}

function applyLocalFilters() {
    const status = normalizeText(document.getElementById("filterStatusLocal")?.value || "");
    const criticidade = normalizeText(document.getElementById("filterCriticidadeLocal")?.value || "");
    const cliente = normalizeText(document.getElementById("filterClienteLocal")?.value || "");
    const ticket = normalizeText(document.getElementById("filterTicketLocal")?.value || "");
    const q = normalizeText(document.querySelector('input[name="q"]')?.value || "");

    document.querySelectorAll(".audit-event-card").forEach((card) => {
        const s = card.getAttribute("data-filter-status") || "";
        const c = card.getAttribute("data-filter-criticidade") || "";
        const cl = card.getAttribute("data-filter-cliente") || "";
        const t = card.getAttribute("data-filter-ticket") || "";
        const b = card.getAttribute("data-filter-busca") || "";
        const impacto = Math.abs(Number(card.getAttribute("data-impacto") || "0"));
        const acao = card.getAttribute("data-acao-normalizada") || "";
        const visibleByPreset =
            !auditPreset ||
            (auditPreset === "criticos" && c === "alta") ||
            (auditPreset === "financeiros" && impacto > 0) ||
            (auditPreset === "estornos" && (acao.includes("delete") || b.includes("estorno")));
        const visible =
            (!status || s.includes(status)) &&
            (!criticidade || c === criticidade) &&
            (!cliente || cl.includes(cliente)) &&
            (!ticket || t.includes(ticket)) &&
            (!q || b.includes(q)) &&
            visibleByPreset;
        card.style.display = visible ? "" : "none";
    });
    renderActiveChips();
    sortByPreset();
}

function sortByPreset() {
    const list = document.getElementById("auditEventList");
    if (!list || auditPreset !== "criticos") return;
    const cards = Array.from(list.querySelectorAll(".audit-event-card"));
    const criticalityOrder = { alta: 3, media: 2, baixa: 1 };
    cards.sort((a, b) => {
        const ca = criticalityOrder[a.getAttribute("data-filter-criticidade") || "baixa"];
        const cb = criticalityOrder[b.getAttribute("data-filter-criticidade") || "baixa"];
        if (cb !== ca) return cb - ca;
        const ia = Math.abs(Number(a.getAttribute("data-impacto") || "0"));
        const ib = Math.abs(Number(b.getAttribute("data-impacto") || "0"));
        return ib - ia;
    });
    cards.forEach((c) => list.appendChild(c));
}

function renderActiveChips() {
    const wrap = document.getElementById("auditActiveChips");
    if (!wrap) return;
    const chips = [];
    const status = document.getElementById("filterStatusLocal")?.value;
    const criticidade = document.getElementById("filterCriticidadeLocal")?.value;
    const cliente = document.getElementById("filterClienteLocal")?.value;
    const ticket = document.getElementById("filterTicketLocal")?.value;
    const busca = document.querySelector('input[name="q"]')?.value;
    if (status) chips.push(`Status: ${status}`);
    if (criticidade) chips.push(`Criticidade: ${criticidade}`);
    if (cliente) chips.push(`Cliente: ${cliente}`);
    if (ticket) chips.push(`Ticket: ${ticket}`);
    if (busca) chips.push(`Busca: ${busca}`);
    if (auditPreset) chips.push(`Preset: ${auditPreset}`);
    wrap.innerHTML = chips.map((c) => `<span class="audit-chip">${auditEscapeHtml(c)}</span>`).join("");
}

function showAuditDetailFromButton(btn) {
    const card = btn.closest(".audit-event-card");
    const modal = document.getElementById("auditDetailModal");
    const tbody = document.getElementById("auditModalTableBody");
    const wrap = document.getElementById("auditModalTableWrap");
    const routeItemsWrap = document.getElementById("auditModalRouteItems");
    const createHeader = document.getElementById("auditModalCreateHeader");
    const createWrap = document.getElementById("auditModalCreateWrap");
    const resumo = document.getElementById("auditModalResumo");
    const loginMsg = document.getElementById("auditModalLoginMsg");
    if (!card || !modal) return;

    let detalhes = [];
    try {
        const raw = card.getAttribute("data-detalhes");
        if (raw) detalhes = JSON.parse(raw);
    } catch (e) {
        detalhes = [];
    }

    const acao = card.getAttribute("data-acao") || "";
    const usuario = card.getAttribute("data-usuario") || "Sistema";
    const ticket = card.getAttribute("data-ticket") || "";
    const datahora = card.getAttribute("data-datahora") || "";
    const origem = card.getAttribute("data-origem") || "";
    const campos = card.getAttribute("data-campos") || "";
    const solicitacaoTipo = String(card.getAttribute("data-solicitacao-tipo") || "");
    const eventoTipoAuditoria = String(card.getAttribute("data-evento-tipo-auditoria") || "");
    let itensRota = [];
    try {
        const rawItensRota = card.getAttribute("data-itens-rota");
        if (rawItensRota) itensRota = JSON.parse(rawItensRota);
    } catch (e) {
        itensRota = [];
    }
    let itensTecnico = [];
    try {
        const rawItensTecnico = card.getAttribute("data-itens-tecnico");
        if (rawItensTecnico) itensTecnico = JSON.parse(rawItensTecnico);
    } catch (e) {
        itensTecnico = [];
    }
    let formCreateBase = {};
    try {
        const rawBase = card.getAttribute("data-form-create-base");
        if (rawBase) formCreateBase = JSON.parse(rawBase);
    } catch (e) {
        formCreateBase = {};
    }

    resumo.innerHTML =
        `<strong>Evento:</strong> ${auditEscapeHtml(buildEventTitle({ acao, ticket, detalhes, campos, objetoId: card.getAttribute("data-objeto-id") || "" }))}<br>` +
        `<strong>Quem:</strong> ${auditEscapeHtml(usuario || "—")}<br>` +
        `<strong>Registro:</strong> ${auditEscapeHtml(ticket || "—")}<br>` +
        `<strong>Data/Hora:</strong> ${auditEscapeHtml(datahora || "—")}<br>` +
        `<strong>Origem:</strong> <span title="${auditEscapeHtml(origem || "—")}">${auditEscapeHtml((origem || "—").length > 120 ? (origem || "").substring(0, 120) + "…" : (origem || "—"))}</span>`;

    const isCreate = acao === "create";
    const isAgrupadaEmRota = solicitacaoTipo === "em_rota" && itensRota.length > 0;
    const tipoLabel = getEventoTipoLabel(eventoTipoAuditoria);

    if (acao === "login") {
        wrap.style.display = "none";
        if (routeItemsWrap) routeItemsWrap.style.display = "none";
        if (createHeader) createHeader.style.display = "none";
        if (createWrap) createWrap.style.display = "none";
        loginMsg.style.display = "block";
        loginMsg.textContent = `Login realizado por ${usuario || "Sistema"} em ${datahora || ""}`;
    } else {
        if (createHeader) {
            createHeader.innerHTML = `<span class="audit-create-badge">${auditEscapeHtml(tipoLabel)}</span>`;
            createHeader.style.display = isCreate ? "" : "none";
        }
        if (createWrap) {
            createWrap.innerHTML = isCreate ? buildCreateModeHtml(eventoTipoAuditoria, formCreateBase, itensRota, itensTecnico) : "";
            createWrap.style.display = isCreate ? "" : "none";
        }

        wrap.style.display = (isCreate || isAgrupadaEmRota) ? "none" : "block";
        loginMsg.style.display = "none";
        tbody.innerHTML = "";

        if (!isCreate && !isAgrupadaEmRota && (!detalhes || detalhes.length === 0)) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#64748b;">Nenhum campo alterado ou detalhe disponível.</td></tr>';
        } else if (!isCreate && !isAgrupadaEmRota) {
            detalhes.forEach((item) => {
                const label = item.label || item.campo || "Campo";
                const antes = semanticValue(item.campo, item.label, item.antes);
                const depois = semanticValue(item.campo, item.label, item.depois);
                const row = document.createElement("tr");
                row.innerHTML =
                    `<td><strong>${auditEscapeHtml(label)}</strong></td>` +
                    `<td><span class="audit-diff-before">${antes}</span></td>` +
                    `<td class="audit-arrow">→</td>` +
                    `<td><span class="audit-diff-after">${depois}</span></td>`;
                tbody.appendChild(row);
            });
        }

        if (routeItemsWrap) {
            if (!isCreate && isAgrupadaEmRota) {
                routeItemsWrap.innerHTML = buildRouteItemsHtml(itensRota);
                routeItemsWrap.style.display = "";
            } else {
                routeItemsWrap.innerHTML = "";
                routeItemsWrap.style.display = "none";
            }
        }
    }

    modal.classList.add("show");
    document.body.style.overflow = "hidden";
}

function closeAuditModal() {
    const modal = document.getElementById("auditDetailModal");
    if (modal) {
        modal.classList.remove("show");
        document.body.style.overflow = "";
    }
}

document.addEventListener("DOMContentLoaded", function () {
    renderEventCards();
    applyLocalFilters();

    document.querySelectorAll(".btn-audit-detail").forEach((btn) => {
        btn.addEventListener("click", function () { showAuditDetailFromButton(this); });
    });

    document.querySelectorAll("[data-local-filter], input[name='q']").forEach((el) => {
        el.addEventListener("input", applyLocalFilters);
        el.addEventListener("change", applyLocalFilters);
    });
    document.querySelectorAll("[data-preset]").forEach((btn) => {
        btn.addEventListener("click", function () {
            const next = this.getAttribute("data-preset") || "";
            auditPreset = auditPreset === next ? "" : next;
            applyLocalFilters();
        });
    });

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") closeAuditModal();
    });
});

window.addEventListener("click", function (event) {
    const modal = document.getElementById("auditDetailModal");
    if (modal && event.target === modal) closeAuditModal();
});
