# Checklist – Gráficos da aba Relatórios

Referência: **Especificação dos Gráficos – Walisson Silva**

Este documento lista o que cada gráfico da aba **Relatórios** deve exibir, conforme a especificação, e o status em relação à implementação atual.

---

## 1. Eficiência Operacional – Lead Time Médio

**O que deve mostrar:** Tempo médio de processamento em dias (ex.: 1,2 dias). Tempo entre abertura da solicitação e conclusão.

**Papel na operação:** Indicador de velocidade. Mede o tempo entre a abertura de uma solicitação e sua conclusão. Um aumento pode sinalizar gargalos ou falta de pessoal na equipe financeira.

**Implementação atual:**
- Backend: `dashborads/views.py` calcula `lead_time_medio` (dias entre `data_de_criacao` e `data_de_pagamento`), `lead_time_vs_mes` (variação % vs mês anterior).
- Front: card "Lead Time Médio" + tendência "(vs Mês Passado)" + mini gráfico de linha "Pendências p/ Analista".

**Checklist:**
- [ ] Valor principal em dias (ex.: "1,2 Dias")
- [ ] Setas/indicador de variação em relação ao mês passado
- [ ] (Opcional) Mini gráfico de apoio (ex.: evolução ou pendências)

**Status:** Implementado conforme especificação (valor em dias, tendência vs mês passado e mini gráfico presentes).

---

## 2. Eficiência – Porcentagem de Erros/Ajustes

**O que deve mostrar:** Índice em % (ex.: 3%) com setas indicando variação comparada ao mês passado.

**Papel na operação:** Indicador de qualidade. Monitora a precisão dos processos. Manter esse número baixo significa menos retrabalho e maior confiabilidade nos dados.

**Implementação atual:**
- Backend: `taxa_pendencia` (% de solicitações pendentes no período) e `taxa_vs_mes` (diferença em pontos percentuais vs mês anterior).
- Front: card "Taxa de Pendência" com % e tendência + mini gráfico de barras "Pendências p/ Analista".

**Checklist:**
- [ ] Valor em % (ex.: "3%")
- [ ] Setas/indicador de variação vs mês passado
- [ ] **Observação:** Na especificação o indicador é "Porcentagem de Erros/Ajustes" (qualidade); no sistema está como "Taxa de Pendência". Se for necessário alinhar ao texto da spec, considerar renomear o card e/ou trocar a métrica para "erros/ajustes" quando o dado existir no sistema.

**Status:** Implementado com métrica alternativa (Taxa de Pendência). Ajustar para "Erros/Ajustes" quando a fonte de dados estiver disponível.

---

## 3. Pareto de Gastos (Serviço/Departamento)

**O que deve mostrar:** Gráfico de barras que destaca os maiores centros de custo (ex.: Manutenção 45%, Marketing 15%). Aplica o princípio 80/20.

**Papel na operação:** Ferramenta de estratégia e corte. Mostra exatamente onde o dinheiro está concentrado. Para reduzir custos, é nas maiores barras que se deve focar primeiro.

**Implementação atual:**
- Backend: `pareto_servico` (valor e % por serviço, % acumulado), `total_departamento`.
- Front: "Pareto de Gastos (Serviço)" com barras + linha de acumulado e legenda "Departamento (R$ total)".

**Checklist:**
- [ ] Barras por serviço/departamento com percentual (ex.: Manutenção 45%)
- [ ] Linha de % acumulado (Pareto)
- [ ] Legenda com total em R$ (ex.: "Departamento (R$ 350.126,00)")

**Status:** Implementado conforme especificação.

---

## 4. Concentração por Categoria/Favorecido (Gráfico de Rosca)

**O que deve mostrar:** Distribuição percentual dos pagamentos entre diferentes fornecedores ou categorias (ex.: SENCNET).

**Papel na operação:** Monitor de dependência. Revela se a empresa está muito dependente de um único fornecedor, ajudando na gestão de riscos e na negociação de contratos.

**Implementação atual:**
- Backend: `concentracao_favorecido` (por `nome_do_recebedor`, top 5 + "Outros").
- Front: "Concentração por Favorecido" em gráfico de rosca (donut).

**Checklist:**
- [ ] Gráfico de rosca (donut) com percentuais
- [ ] Fatias por favorecido (e/ou por categoria, se houver)
- [ ] Legenda identificando cada fatia (ex.: SENCNET, etc.)

**Status:** Implementado conforme especificação (por favorecido/recebedor).

---

## 5. Previsão Próximos 7 Dias (Conciliação)

**O que deve mostrar:** Barra (ou anel) de progresso indicando % das previsões já conciliadas (ex.: 75%).

**Papel na operação:** Guia de planejamento de curto prazo. Garante que o fluxo de caixa para a próxima semana esteja sob controle e que as entradas/saídas previstas batam com a realidade bancária.

**Implementação atual:**
- Backend: `previsao_conciliado_pct` (conciliação = aprovado + concluído no período), `dias_mes` (calendário com dias conciliados).
- Front: anel de progresso "X% Conciliado", calendário do mês, toggle "Domiciliação".

**Checklist:**
- [ ] Indicador de % conciliado (ex.: "75% Conciliado")
- [ ] Barra ou anel de progresso visual
- [ ] (Opcional) Calendário/visão dos próximos 7 dias ou do mês
- [ ] (Opcional) Toggle ou filtro (ex.: Domiciliação) se aplicável

**Status:** Implementado conforme especificação (anel, % e calendário presentes).
