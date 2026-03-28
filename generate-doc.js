const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, PageNumber, PageBreak, LevelFormat
} = require("docx");

const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };
const cellMargins = { top: 80, bottom: 80, left: 120, right: 120 };

const GOLD = "FFCB57";
const DARK = "1C1C1C";
const PURPLE = "544350";

function headerCell(text, width) {
  return new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    shading: { fill: PURPLE, type: ShadingType.CLEAR },
    margins: cellMargins,
    verticalAlign: "center",
    children: [new Paragraph({ children: [new TextRun({ text, bold: true, color: "FFFFFF", font: "Arial", size: 20 })] })]
  });
}

function bodyCell(text, width) {
  return new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    margins: cellMargins,
    children: [new Paragraph({ children: [new TextRun({ text, font: "Arial", size: 20 })] })]
  });
}

function bullet(text, ref) {
  return new Paragraph({
    numbering: { reference: ref || "bullets", level: 0 },
    spacing: { after: 60 },
    children: [new TextRun({ text, font: "Arial", size: 22 })]
  });
}

function subBullet(text, ref) {
  return new Paragraph({
    numbering: { reference: ref || "bullets", level: 1 },
    spacing: { after: 40 },
    children: [new TextRun({ text, font: "Arial", size: 20 })]
  });
}

function heading1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 200 },
    children: [new TextRun({ text, bold: true, font: "Arial", size: 32, color: DARK })]
  });
}

function heading2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 160 },
    children: [new TextRun({ text, bold: true, font: "Arial", size: 26, color: PURPLE })]
  });
}

function heading3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 120 },
    children: [new TextRun({ text, bold: true, font: "Arial", size: 22, color: DARK })]
  });
}

function para(text) {
  return new Paragraph({
    spacing: { after: 120 },
    children: [new TextRun({ text, font: "Arial", size: 22 })]
  });
}

function boldPara(label, text) {
  return new Paragraph({
    spacing: { after: 120 },
    children: [
      new TextRun({ text: label, bold: true, font: "Arial", size: 22 }),
      new TextRun({ text, font: "Arial", size: 22 })
    ]
  });
}

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, font: "Arial", color: DARK },
        paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, font: "Arial", color: PURPLE },
        paragraph: { spacing: { before: 280, after: 160 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 22, bold: true, font: "Arial", color: DARK },
        paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 2 } },
    ]
  },
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [
          { level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
          { level: 1, format: LevelFormat.BULLET, text: "\u25E6", alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 1440, hanging: 360 } } } },
        ]
      },
      {
        reference: "numbers",
        levels: [
          { level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
        ]
      },
    ]
  },
  sections: [
    {
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
        }
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: GOLD, space: 4 } },
            children: [
              new TextRun({ text: "Attend Finance", bold: true, font: "Arial", size: 18, color: PURPLE }),
              new TextRun({ text: "  |  Documentacao de Alteracoes", font: "Arial", size: 18, color: "888888" }),
            ]
          })]
        })
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            border: { top: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC", space: 4 } },
            children: [
              new TextRun({ text: "Attend Finance - Documento Interno  |  Pagina ", font: "Arial", size: 16, color: "999999" }),
              new TextRun({ children: [PageNumber.CURRENT], font: "Arial", size: 16, color: "999999" }),
            ]
          })]
        })
      },
      children: [
        // ===== CAPA =====
        new Paragraph({ spacing: { before: 2400 } }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [new TextRun({ text: "ATTEND FINANCE", bold: true, font: "Arial", size: 48, color: PURPLE })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 600 },
          children: [new TextRun({ text: "Sistema de Gestao Financeira", font: "Arial", size: 28, color: "666666" })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          border: { top: { style: BorderStyle.SINGLE, size: 8, color: GOLD, space: 8 },
                    bottom: { style: BorderStyle.SINGLE, size: 8, color: GOLD, space: 8 } },
          spacing: { before: 200, after: 200 },
          children: [new TextRun({ text: "Documentacao de Alteracoes", bold: true, font: "Arial", size: 36, color: DARK })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 100 },
          children: [new TextRun({ text: "Scrollbars, Responsividade, CRM Dashboard", font: "Arial", size: 24, color: "666666" })]
        }),
        new Paragraph({ spacing: { before: 1200 } }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "Data: 28/03/2026", font: "Arial", size: 22, color: "666666" })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "Versao: 1.0", font: "Arial", size: 22, color: "666666" })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [new TextRun({ text: "Branch: backend", font: "Arial", size: 22, color: "666666" })]
        }),

        // ===== PAGE BREAK =====
        new Paragraph({ children: [new PageBreak()] }),

        // ===== SUMARIO =====
        heading1("1. Resumo Executivo"),
        para("Este documento descreve todas as alteracoes realizadas no sistema Attend Finance durante a sprint atual. As mudancas abrangem melhorias visuais (scrollbars estilizadas), responsividade global para todas as paginas, redesign do CRM Dashboard e correcoes na arquitetura de carregamento CSS."),
        para("Total de arquivos alterados: 49 | Insercoes: 4.566 linhas | Remocoes: 926 linhas"),

        // ===== TABELA RESUMO =====
        heading2("1.1 Resumo das Alteracoes"),
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [3200, 4160, 2000],
          rows: [
            new TableRow({ children: [
              headerCell("Area", 3200),
              headerCell("Descricao", 4160),
              headerCell("Arquivos", 2000),
            ]}),
            new TableRow({ children: [
              bodyCell("Scrollbars Estilizadas", 3200),
              bodyCell("Scrollbars visiveis (#FFCB57) em todas as 12 paginas", 4160),
              bodyCell("3 arquivos", 2000),
            ]}),
            new TableRow({ children: [
              bodyCell("Responsividade Global", 3200),
              bodyCell("Layout adaptativo para mobile, tablet e desktop", 4160),
              bodyCell("4 arquivos", 2000),
            ]}),
            new TableRow({ children: [
              bodyCell("CRM Dashboard", 3200),
              bodyCell("Redesign completo com KPIs, pipeline e leads", 4160),
              bodyCell("2 arquivos", 2000),
            ]}),
            new TableRow({ children: [
              bodyCell("Arquitetura CSS", 3200),
              bodyCell("Correcao ordem de carregamento no base.html", 4160),
              bodyCell("1 arquivo", 2000),
            ]}),
            new TableRow({ children: [
              bodyCell("Modulo CRM", 3200),
              bodyCell("Backend completo: models, views, URLs, admin", 4160),
              bodyCell("12 arquivos", 2000),
            ]}),
          ]
        }),

        new Paragraph({ children: [new PageBreak()] }),

        // ===== 2. SCROLLBARS =====
        heading1("2. Scrollbars Estilizadas"),
        heading2("2.1 Problema Identificado"),
        para("O arquivo hide-scrollbars.css continha regras globais que ocultavam TODAS as scrollbars do sistema usando ::-webkit-scrollbar { display: none !important } e scrollbar-width: none !important. Isso impedia os usuarios de visualizar e usar as barras de rolagem em qualquer pagina."),

        heading2("2.2 Solucao Implementada"),
        para("O arquivo foi completamente reescrito para exibir scrollbars estilizadas com a identidade visual do sistema:"),
        bullet("Cor do thumb (barra): #FFCB57 (dourado Attend)"),
        bullet("Cor do thumb hover: #544350 (roxo escuro)"),
        bullet("Cor do track (trilha): rgba(84, 67, 80, 0.08)"),
        bullet("Largura: 8px (principal) / 6px (secundarias)"),
        bullet("Border-radius: 4px para aparencia moderna"),

        heading2("2.3 Paginas Cobertas"),
        para("Scrollbars foram aplicadas individualmente em cada container de pagina:"),

        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [2500, 3430, 3430],
          rows: [
            new TableRow({ children: [
              headerCell("Pagina", 2500),
              headerCell("Classe CSS", 3430),
              headerCell("Tipo de Scroll", 3430),
            ]}),
            new TableRow({ children: [
              bodyCell("Solicitacoes", 2500), bodyCell(".column-content", 3430), bodyCell("Vertical nos cards kanban", 3430),
            ]}),
            new TableRow({ children: [
              bodyCell("Relatorios", 2500), bodyCell(".reports-fullscreen", 3430), bodyCell("Vertical na pagina", 3430),
            ]}),
            new TableRow({ children: [
              bodyCell("Dashboard", 2500), bodyCell(".dashboard-view", 3430), bodyCell("Vertical (tema escuro)", 3430),
            ]}),
            new TableRow({ children: [
              bodyCell("Dashboard Custos", 2500), bodyCell(".dashboard-custos-view", 3430), bodyCell("Vertical na pagina", 3430),
            ]}),
            new TableRow({ children: [
              bodyCell("Servicos", 2500), bodyCell(".services-view", 3430), bodyCell("Vertical na pagina", 3430),
            ]}),
            new TableRow({ children: [
              bodyCell("Gerenciar Usuarios", 2500), bodyCell(".users-container", 3430), bodyCell("Vertical no container", 3430),
            ]}),
            new TableRow({ children: [
              bodyCell("Equipes", 2500), bodyCell(".equipes-container", 3430), bodyCell("Vertical no container", 3430),
            ]}),
            new TableRow({ children: [
              bodyCell("Auditoria", 2500), bodyCell(".auditoria-container", 3430), bodyCell("Vertical na pagina", 3430),
            ]}),
            new TableRow({ children: [
              bodyCell("CRM Dashboard", 2500), bodyCell(".crm-dashboard", 3430), bodyCell("Vertical na pagina", 3430),
            ]}),
            new TableRow({ children: [
              bodyCell("CRM Leads/Pipeline", 2500), bodyCell(".container-fluid", 3430), bodyCell("Vertical + horizontal", 3430),
            ]}),
            new TableRow({ children: [
              bodyCell("Tabelas", 2500), bodyCell(".table-responsive", 3430), bodyCell("Horizontal em tabelas", 3430),
            ]}),
            new TableRow({ children: [
              bodyCell("Modais", 2500), bodyCell(".modal-body", 3430), bodyCell("Vertical no conteudo", 3430),
            ]}),
          ]
        }),

        heading2("2.4 Arquivos Modificados"),
        bullet("static/css/hide-scrollbars.css - Reescrito completamente"),
        bullet("static/css/base.css - overflow-y alterado de scroll para auto"),
        bullet("static/css/kanban.css - Scrollbar visivel nos cards kanban"),

        new Paragraph({ children: [new PageBreak()] }),

        // ===== 3. RESPONSIVIDADE =====
        heading1("3. Responsividade Global"),
        heading2("3.1 Problema Identificado"),
        para("Diversas paginas do sistema nao se adaptavam corretamente a telas menores (tablets e smartphones). Elementos ficavam cortados, filtros nao empilhavam e tabelas nao tinham scroll horizontal."),

        heading2("3.2 Breakpoints Utilizados"),
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [2340, 2340, 4680],
          rows: [
            new TableRow({ children: [
              headerCell("Breakpoint", 2340),
              headerCell("Dispositivo", 2340),
              headerCell("Adaptacoes", 4680),
            ]}),
            new TableRow({ children: [
              bodyCell("<= 991px", 2340),
              bodyCell("Tablet", 2340),
              bodyCell("Sidebar oculta, kanban horizontal com scroll", 4680),
            ]}),
            new TableRow({ children: [
              bodyCell("<= 768px", 2340),
              bodyCell("Mobile", 2340),
              bodyCell("Colunas empilhadas, filtros full-width, touch-friendly", 4680),
            ]}),
            new TableRow({ children: [
              bodyCell("<= 480px", 2340),
              bodyCell("Mobile pequeno", 2340),
              bodyCell("Cards KPI em 1 coluna, fontes reduzidas", 4680),
            ]}),
          ]
        }),

        heading2("3.3 Melhorias por Pagina"),
        heading3("Paginas com container-fluid (CRM)"),
        bullet("Filtros empilham verticalmente em mobile"),
        bullet("Cards KPI: 4 colunas > 2 colunas > 1 coluna"),
        bullet("Tabelas com scroll horizontal e scrollbar visivel"),
        bullet("Modais full-width em telas pequenas"),

        heading3("Pagina de Servicos"),
        bullet("Header com acoes empilhadas em mobile"),
        bullet("Filtros em coluna unica"),

        heading3("CRM Dashboard"),
        bullet("KPI grid: 4 > 2 > 1 coluna"),
        bullet("Content grid: 2 > 1 coluna"),
        bullet("Pipeline grid: 5 > 2 > 1 coluna"),
        bullet("Quick links: 3 > 1 coluna"),

        heading2("3.4 Arquivos Modificados"),
        bullet("static/css/responsive-global.css - Adicionadas 125 linhas de responsividade"),
        bullet("static/css/crm.css - Responsividade para CRM"),
        bullet("static/css/kanban-responsive.css - Correcao de comentario quebrado"),
        bullet("static/css/hide-scrollbars.css - Media queries para mobile"),

        new Paragraph({ children: [new PageBreak()] }),

        // ===== 4. CRM DASHBOARD =====
        heading1("4. CRM Dashboard - Redesign"),
        heading2("4.1 Problema Identificado"),
        para("O dashboard do CRM apresentava layout desestruturado com cards sem estilo visual, pipeline sem formatacao e links rapidos desproporcionais. Os dados estavam sendo carregados via API mas a apresentacao nao era satisfatoria."),

        heading2("4.2 Novo Design"),
        para("O template foi completamente reescrito com design moderno seguindo a identidade visual do sistema:"),

        heading3("KPI Cards (4 indicadores)"),
        bullet("Total de Leads - Icone de usuarios, barra lateral azul (#3B82F6)"),
        bullet("Valor do Pipeline - Icone de dolar, barra lateral verde (#10B981)"),
        bullet("Taxa de Conversao - Icone de grafico, barra lateral ciano (#06B6D4)"),
        bullet("Tarefas Pendentes - Icone de tasks, barra lateral dourada (#FFCB57)"),
        para("Cada card possui: icone com fundo translucido, label em uppercase, valor em destaque (1.75rem, 800 weight), subtexto com informacoes adicionais, hover com elevacao e sombra."),

        heading3("Pipeline por Estagio"),
        bullet("Grid responsivo com cards por estagio do funil"),
        bullet("Barra colorida no topo de cada card (cor do estagio)"),
        bullet("Nome do estagio, quantidade de leads e valor em R$"),
        bullet("Estado vazio com icone e mensagem orientativa"),

        heading3("Leads por Status"),
        bullet("Lista estilizada com 6 status: Novo, Contatado, Qualificado, Proposta, Convertido, Perdido"),
        bullet("Cada item com dot colorido, label e badge de contagem arredondado"),
        bullet("Hover sutil para feedback visual"),

        heading3("Links Rapidos"),
        bullet("Gerenciar Leads - Gradiente roxo escuro (#544350)"),
        bullet("Pipeline de Vendas - Gradiente dourado (#FFCB57)"),
        bullet("Relatorios CRM - Desabilitado (em breve)"),

        heading2("4.3 Arquivos Modificados"),
        bullet("templates/crm/dashboard.html - Template completo reescrito (250 linhas)"),
        bullet("static/css/crm.css - Estilos e responsividade do CRM"),

        new Paragraph({ children: [new PageBreak()] }),

        // ===== 5. ARQUITETURA CSS =====
        heading1("5. Correcao da Arquitetura CSS"),
        heading2("5.1 Problema Identificado"),
        para("O arquivo hide-scrollbars.css era carregado na linha 19 do base.html (dentro do bloco de CSS base), ANTES do bloco {% block extra_css %} (linha 159). Isso significava que os CSS especificos de cada pagina (dashboard.css, relatorios-compact.css, servicos.css, etc.) eram carregados DEPOIS e sobrescreviam as regras de scrollbar."),

        heading2("5.2 Solucao"),
        para("O hide-scrollbars.css foi movido para APOS o bloco {% block extra_css %}, garantindo que suas regras com !important tenham prioridade sobre qualquer CSS especifico de pagina."),

        heading3("Antes"),
        para("Linha 16: base.css"),
        para("Linha 17: sidebar-responsive.css"),
        para("Linha 18: responsive-global.css"),
        para("Linha 19: hide-scrollbars.css    <-- carregado cedo demais"),
        para("..."),
        para("Linha 159: {% block extra_css %}  <-- CSS das paginas sobrescreviam"),

        heading3("Depois"),
        para("Linha 16: base.css"),
        para("Linha 17: sidebar-responsive.css"),
        para("Linha 18: responsive-global.css"),
        para("..."),
        para("Linha 158: {% block extra_css %}  <-- CSS das paginas carregam primeiro"),
        para("Linha 161: hide-scrollbars.css    <-- ULTIMO CSS, prioridade maxima"),

        heading2("5.3 Arquivo Modificado"),
        bullet("templates/base.html - Reordenacao do carregamento CSS"),

        new Paragraph({ children: [new PageBreak()] }),

        // ===== 6. MODULO CRM =====
        heading1("6. Modulo CRM - Backend Completo"),
        heading2("6.1 Models (crm/models.py)"),
        para("6 modelos criados para o modulo CRM:"),

        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [2200, 4960, 2200],
          rows: [
            new TableRow({ children: [
              headerCell("Model", 2200),
              headerCell("Descricao", 4960),
              headerCell("Campos-chave", 2200),
            ]}),
            new TableRow({ children: [
              bodyCell("Segmento", 2200),
              bodyCell("Categorias de clientes por segmento", 4960),
              bodyCell("nome, descricao", 2200),
            ]}),
            new TableRow({ children: [
              bodyCell("PipelineEstagio", 2200),
              bodyCell("Estagios do funil de vendas com cores e ordem", 4960),
              bodyCell("nome, cor, ordem", 2200),
            ]}),
            new TableRow({ children: [
              bodyCell("Lead", 2200),
              bodyCell("Prospectos com status e rastreamento de origem", 4960),
              bodyCell("nome, email, status, origem", 2200),
            ]}),
            new TableRow({ children: [
              bodyCell("Oportunidade", 2200),
              bodyCell("Negocios com valor estimado e probabilidade", 4960),
              bodyCell("titulo, valor, prob, estagio", 2200),
            ]}),
            new TableRow({ children: [
              bodyCell("Interacao", 2200),
              bodyCell("Historico de ligacoes, emails, reunioes", 4960),
              bodyCell("tipo, descricao, data", 2200),
            ]}),
            new TableRow({ children: [
              bodyCell("Tarefa", 2200),
              bodyCell("Follow-ups e atividades agendadas", 4960),
              bodyCell("titulo, prazo, status", 2200),
            ]}),
          ]
        }),

        heading2("6.2 Views e API Endpoints (crm/views.py)"),
        para("14 endpoints implementados com decorador @group_required:"),

        heading3("Paginas"),
        bullet("GET /crm/ - Dashboard CRM"),
        bullet("GET /crm/leads/ - Gestao de Leads"),
        bullet("GET /crm/pipeline/ - Pipeline de Vendas"),

        heading3("APIs"),
        bullet("GET /crm/api/dashboard/ - Dados do dashboard (KPIs, pipeline, leads)"),
        bullet("GET /crm/api/leads/ - Listar leads com filtros"),
        bullet("POST /crm/api/leads/criar/ - Criar novo lead"),
        bullet("PUT /crm/api/leads/<id>/atualizar/ - Atualizar lead"),
        bullet("GET /crm/api/oportunidades/ - Listar oportunidades"),
        bullet("POST /crm/api/oportunidades/criar/ - Criar oportunidade"),
        bullet("GET /crm/api/tarefas/ - Listar tarefas"),
        bullet("GET /crm/api/interacoes/ - Listar interacoes"),
        bullet("POST /crm/api/interacoes/criar/ - Criar interacao"),
        bullet("GET /crm/api/segmentos/ - Listar segmentos ativos"),
        bullet("GET /crm/api/estagios/ - Listar estagios do pipeline"),

        heading2("6.3 Permissoes"),
        para("Todos os endpoints requerem autenticacao e pertencimento a um dos grupos: Administrador, Financeiro ou Vendas."),

        heading2("6.4 Templates"),
        bullet("templates/crm/dashboard.html - Dashboard com KPIs e graficos"),
        bullet("templates/crm/leads.html - Tabela de leads com filtros e modal"),
        bullet("templates/crm/pipeline.html - Kanban de oportunidades"),

        heading2("6.5 Arquivos do Modulo"),
        bullet("crm/__init__.py"),
        bullet("crm/admin.py - Registro no Django Admin"),
        bullet("crm/apps.py - Configuracao do app"),
        bullet("crm/models.py - 6 modelos"),
        bullet("crm/views.py - 14 endpoints"),
        bullet("crm/urls.py - Roteamento"),
        bullet("crm/serializers.py - Serializadores"),
        bullet("crm/migrations/0001_initial.py - Migracao aplicada"),

        new Paragraph({ children: [new PageBreak()] }),

        // ===== 7. LISTA COMPLETA =====
        heading1("7. Lista Completa de Arquivos Alterados"),
        heading2("7.1 Arquivos CSS (Frontend)"),
        bullet("static/css/hide-scrollbars.css - Scrollbars estilizadas globais"),
        bullet("static/css/base.css - Overflow do main-content-body"),
        bullet("static/css/kanban.css - Scrollbar nos cards kanban"),
        bullet("static/css/kanban-responsive.css - Correcao syntax error"),
        bullet("static/css/responsive-global.css - Responsividade global"),
        bullet("static/css/crm.css - Estilos e responsividade CRM (novo)"),

        heading2("7.2 Templates (Frontend)"),
        bullet("templates/base.html - Reordenacao CSS"),
        bullet("templates/crm/dashboard.html - Dashboard CRM (novo)"),
        bullet("templates/crm/leads.html - Gestao de Leads (novo)"),
        bullet("templates/crm/pipeline.html - Pipeline de Vendas (novo)"),

        heading2("7.3 Backend"),
        bullet("crm/ - Modulo CRM completo (12 arquivos)"),
        bullet("attend_finence/settings.py - Registro do app CRM"),
        bullet("attend_finence/urls.py - Include das URLs CRM"),

        heading2("7.4 Commit"),
        boldPara("Hash: ", "11b1e1f"),
        boldPara("Branch: ", "backend"),
        boldPara("Mensagem: ", "feat: adicionar scrollbars estilizadas em todas as paginas, responsividade e CRM dashboard"),
        boldPara("Estatisticas: ", "49 arquivos alterados, 4.566 insercoes, 926 remocoes"),
      ]
    }
  ]
});

const outputPath = "C:\\Users\\WalissonSilva\\Downloads\\Financeiro\\projeto_finança\\projeto_finança\\attend_finence\\Documentacao_Alteracoes_AttendFinance.docx";

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(outputPath, buffer);
  console.log("Documento gerado com sucesso: " + outputPath);
}).catch(err => {
  console.error("Erro:", err);
});
