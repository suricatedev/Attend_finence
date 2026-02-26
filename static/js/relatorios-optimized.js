// JavaScript Otimizado para Relatórios - Performance Melhorada
class RelatoriosOptimized {
    constructor() {
        this.data = [];
        this.filteredData = [];
        this.currentPage = 1;
        this.itemsPerPage = 20;
        this.sortColumn = null;
        this.sortDirection = 'asc';
        this.currentFilters = {
            status: 'all',
            tipo: 'all',
            dateFrom: '',
            dateTo: '',
            service: '',
            recebedor: '',
            priority: '',
            search: '',
            clienteEmpresa: '',
            cnpj: '',
            chavePix: ''
        };
        
        // Cache para melhor performance
        this.cache = {
            renderedRows: new Map(),
            lastRenderTime: 0,
            debounceTimer: null
        };
        
        this.init();
    }

    async init() {
        // Carregar dados de forma assíncrona
        await this.loadDataAsync();
        
        console.log('🔍 Debug - Dados carregados:', this.data.length, 'itens');
        console.log('🔍 Debug - Dados filtrados:', this.filteredData.length, 'itens');
        
        this.setupEventListeners();
        this.setDefaultDates();
        this.initValoresDetalhados();
        
        // Filtros visíveis por padrão
        const filtersToggle = document.getElementById('filtersToggle');
        const filtersContent = document.getElementById('filtersContent');
        if (filtersToggle && filtersContent) {
            // Não colapsar por padrão - deixar visível
            filtersToggle.classList.remove('collapsed');
            filtersContent.classList.remove('collapsed');
        }
        
        // Renderizar tabela inicialmente com todos os dados
        // Isso garante que os dados estejam visíveis e os filtros funcionem
        if (this.data.length > 0) {
            this.filteredData = [...this.data];
            console.log('🔍 Debug - Renderizando tabela inicial com', this.filteredData.length, 'itens');
            this.renderTableOptimized();
        } else {
            console.warn('⚠️ Nenhum dado carregado da tabela!');
        }
        this.updateTableInfo();
        this.updateStats();
        this.updateMiniReports();
    }

    async loadDataAsync() {
        try {
            // Mostrar indicador de carregamento
            this.showLoadingIndicator();
            
            // Simular carregamento assíncrono
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // ✅ USAR DADOS REAIS DO DJANGO (da tabela HTML)
            this.data = this.loadRealDataFromTable();
            
            // Se não houver dados na tabela, não gerar mockados
            if (this.data.length === 0) {
                console.log('📊 Nenhuma solicitação no banco de dados');
            }
            
            this.filteredData = [...this.data];
            
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            this.data = [];
            this.filteredData = [];
        } finally {
            this.hideLoadingIndicator();
        }
    }
    
    loadRealDataFromTable() {
        // Ler dados reais da tabela HTML renderizada pelo Django
        const rows = document.querySelectorAll('#reportsTableBody tr:not(.empty-state)');
        console.log('🔍 Debug - Linhas encontradas na tabela:', rows.length);
        const data = [];
        
        // Mapear índices das colunas pelos headers
        const table = document.getElementById('reportsTable');
        const headers = table?.querySelectorAll('thead th');
        const columnIndexMap = {};
        if (headers) {
            headers.forEach((th, index) => {
                const headerText = th.textContent.trim().toLowerCase();
                if (headerText.includes('criação') || headerText.includes('criacao')) {
                    columnIndexMap.dataCriacao = index;
                } else if (headerText.includes('pagamento')) {
                    columnIndexMap.dataPagamento = index;
                } else if (headerText.includes('status')) {
                    columnIndexMap.status = index;
                } else if (headerText.includes('prioridade')) {
                    columnIndexMap.priority = index;
                }
            });
        }
        
        console.log('🔍 Mapeamento de colunas:', columnIndexMap);
        
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length > 0) {
                // Extrair dados usando data attributes (mais confiável)
                let status = row.dataset.status || '';
                
                // Tentar encontrar células de valores detalhados primeiro
                const valoresCells = row.querySelectorAll('.valores-detalhados-col');
                let valorReceita = '', valorEmRota = '', valorKm = '', valorPedagio = '', valorHospedagem = '', valorFluvial = '', valorOutros = '';
                
                if (valoresCells.length >= 7) {
                    valorReceita = valoresCells[0]?.textContent.trim() || '';
                    valorEmRota = valoresCells[1]?.textContent.trim() || '';
                    valorKm = valoresCells[2]?.textContent.trim() || '';
                    valorPedagio = valoresCells[3]?.textContent.trim() || '';
                    valorHospedagem = valoresCells[4]?.textContent.trim() || '';
                    valorFluvial = valoresCells[5]?.textContent.trim() || '';
                    valorOutros = valoresCells[6]?.textContent.trim() || '';
                } else if (valoresCells.length >= 6) {
                    // Compatibilidade: se não houver coluna EM ROTA ainda
                    valorReceita = valoresCells[0]?.textContent.trim() || '';
                    valorEmRota = '';
                    valorKm = valoresCells[1]?.textContent.trim() || '';
                    valorPedagio = valoresCells[2]?.textContent.trim() || '';
                    valorHospedagem = valoresCells[3]?.textContent.trim() || '';
                    valorFluvial = valoresCells[4]?.textContent.trim() || '';
                    valorOutros = valoresCells[5]?.textContent.trim() || '';
                }
                
                // Usar índices mapeados ou fallback para índices fixos
                const statusIdx = columnIndexMap.status !== undefined ? columnIndexMap.status : 18;
                const priorityIdx = columnIndexMap.priority !== undefined ? columnIndexMap.priority : 19;
                const dataCriacaoIdx = columnIndexMap.dataCriacao !== undefined ? columnIndexMap.dataCriacao : 20;
                const dataPagamentoIdx = columnIndexMap.dataPagamento !== undefined ? columnIndexMap.dataPagamento : 21;
                
                // Log apenas para a primeira linha para debug
                if (data.length === 0) {
                    console.log(`🔍 Índices mapeados - Total de células: ${cells.length}`, {
                        status: statusIdx,
                        priority: priorityIdx,
                        dataCriacao: dataCriacaoIdx,
                        dataPagamento: dataPagamentoIdx,
                        statusCellText: cells[statusIdx]?.textContent.trim()?.substring(0, 20),
                        priorityCellText: cells[priorityIdx]?.textContent.trim()?.substring(0, 20),
                        dataCriacaoCellText: cells[dataCriacaoIdx]?.textContent.trim()?.substring(0, 20),
                        dataPagamentoCellText: cells[dataPagamentoIdx]?.textContent.trim()?.substring(0, 20)
                    });
                }
                
                // Extrair novos campos
                const supervisor = cells[3]?.textContent.trim() || '-';
                const recebedor = cells[4]?.textContent.trim() || '';
                const chavePix = cells[5]?.textContent.trim() || '';
                const clienteEmpresa = cells[6]?.textContent.trim() || '';
                const cnpj = cells[7]?.textContent.trim() || '';
                const serviceText = cells[8]?.textContent.trim() || '';
                
                const statusBadge = cells[statusIdx]?.querySelector('.status-badge');
                if (!status && statusBadge) {
                    const statusClass = statusBadge.className.match(/status-(\w+)/);
                    if (statusClass) {
                        status = statusClass[1];
                    }
                }
                
                // Extrair prioridade do data attribute
                let priority = row.dataset.priority || '';
                const priorityBadge = cells[priorityIdx]?.querySelector('.priority-badge');
                if (!priority && priorityBadge) {
                    const priorityClass = priorityBadge.className.match(/priority-(\w+)/);
                    if (priorityClass) {
                        priority = priorityClass[1].toLowerCase();
                    }
                }
                
                // Extrair serviço do data attribute (usa ID do serviço)
                // IMPORTANTE: O filtro compara por ID, então precisamos usar o ID do serviço
                let service = row.dataset.service || '';
                // Se não tiver no data attribute e houver texto do serviço, tentar extrair
                // Mas normalmente deve vir do data-service do template
                if (!service && serviceText && serviceText !== 'N/A') {
                    // Se não tiver data-service, deixar vazio (será filtrado se necessário)
                    // O ideal é que sempre venha do data-service do template
                    service = '';
                }
                // Garantir que service seja string vazia se não houver
                if (!service) {
                    service = '';
                }
                
                // Extrair tipo do data attribute
                const tipo = row.dataset.tipo || '';                
                
                // Converter data de dd/mm/yyyy para yyyy-mm-dd
                const parseDate = (dateStr) => {
                    if (!dateStr) return '';
                    const parts = dateStr.split('/');
                    if (parts.length === 3) {
                        return `${parts[2]}-${parts[1]}-${parts[0]}`;
                    }
                    return dateStr;
                };
                
                // Extrair ID numérico da linha (data-id) ao invés do ticket
                const rowId = row.getAttribute('data-id') || row.dataset.id || '';
                let ticket = cells[0]?.textContent.trim() || '';
                
                data.push({
                    id: rowId || ticket, // Usar ID numérico se disponível, senão usar ticket
                    ticket: ticket, // Ticket da solicitação
                    title: cells[1]?.textContent.trim() || '',
                    solicitante: cells[2]?.textContent.trim() || '',
                    supervisor: supervisor,
                    recebedor: recebedor,
                    chavePix: chavePix,
                    clienteEmpresa: clienteEmpresa,
                    cnpj: cnpj,
                    service: service, // ID do serviço (string vazia se não houver)
                    serviceName: serviceText || 'N/A', // Nome do serviço para mini relatórios
                    valor: cells[9]?.textContent.trim() || '',
                    valorReceita: valorReceita,
                    valorEmRota: valorEmRota,
                    valorKm: valorKm,
                    valorPedagio: valorPedagio,
                    valorHospedagem: valorHospedagem,
                    valorFluvial: valorFluvial,
                    valorOutros: valorOutros,
                    status: status.toLowerCase(),
                    statusDisplay: cells[statusIdx]?.textContent.trim() || '',
                    priority: priority,
                    tipo: tipo.toLowerCase(),
                    dataCriacao: (() => {
                        // Extrair data do índice correto (20) e validar
                        const cell = cells[dataCriacaoIdx];
                        if (!cell) return '';
                        
                        const text = cell.textContent.trim();
                        // Validar que é uma data no formato dd/mm/yyyy
                        if (text && /^\d{2}\/\d{2}\/\d{4}$/.test(text)) {
                            return parseDate(text);
                        }
                        
                        // Se não encontrou no índice esperado, procurar em todas as células
                        for (let i = 10; i < cells.length - 1; i++) {
                            const cellText = cells[i]?.textContent.trim() || '';
                            // Pular células com badges (status, prioridade)
                            if (cells[i]?.querySelector('.status-badge') || cells[i]?.querySelector('.priority-badge')) {
                                continue;
                            }
                            // Se encontrar uma data válida
                            if (cellText && /^\d{2}\/\d{2}\/\d{4}$/.test(cellText)) {
                                return parseDate(cellText);
                            }
                        }
                        
                        return '';
                    })(),
                    dataPagamento: (() => {
                        // Extrair data do índice correto (21) e validar
                        const cell = cells[dataPagamentoIdx];
                        if (!cell) return '';
                        
                        const text = cell.textContent.trim();
                        // Validar que é uma data no formato dd/mm/yyyy
                        if (text && /^\d{2}\/\d{2}\/\d{4}$/.test(text)) {
                            return parseDate(text);
                        }
                        
                        // Se não encontrou, procurar todas as datas e pegar a última (pagamento)
                        let lastDate = '';
                        for (let i = 10; i < cells.length - 1; i++) {
                            const cellText = cells[i]?.textContent.trim() || '';
                            // Pular células com badges
                            if (cells[i]?.querySelector('.status-badge') || cells[i]?.querySelector('.priority-badge')) {
                                continue;
                            }
                            // Se encontrar uma data válida, atualizar (pegará a última)
                            if (cellText && /^\d{2}\/\d{2}\/\d{4}$/.test(cellText)) {
                                lastDate = parseDate(cellText);
                            }
                        }
                        
                        return lastDate;
                    })(),
                });
            }
        });
        
        console.log(`✅ Carregadas ${data.length} solicitações reais do banco de dados`);
        if (data.length > 0) {
            console.log('📊 Primeiro item de exemplo:', {
                id: data[0].id,
                ticket: data[0].ticket,
                status: data[0].status,
                tipo: data[0].tipo,
                dataCriacao: data[0].dataCriacao,
                service: data[0].service
            });
        } else {
            console.warn('⚠️ Nenhum dado foi carregado da tabela! Verifique se a tabela tem linhas.');
        }
        return data;
    }

    generateSampleDataOptimized() {
        const services = ['consultoria_TI', 'desenvolvimento', 'manutencao_equipamentos', 'treinamento_corporativo'];
        const statuses = ['pendente', 'aprovado', 'recusado', 'concluido'];
        const priorities = ['baixa', 'media', 'alta'];
        const solicitantes = ['João Silva', 'Maria Santos', 'Pedro Costa', 'Ana Oliveira', 'Carlos Lima'];
        const recebedores = ['Financeiro', 'Contabilidade', 'Tesouraria', 'Gerência'];

        const data = [];
        const today = new Date();
        
        // Gerar dados de forma mais eficiente
        for (let i = 1; i <= 30; i++) { // Reduzido de 50 para 30 para melhor performance
            const dataCriacao = new Date(today);
            dataCriacao.setDate(dataCriacao.getDate() - Math.floor(Math.random() * 30));
            
            const dataPagamento = new Date(dataCriacao);
            dataPagamento.setDate(dataPagamento.getDate() + Math.floor(Math.random() * 15));

            data.push({
                id: `SOL-2024-${String(i).padStart(3, '0')}`,
                title: `Solicitação ${i}`,
                solicitante: solicitantes[i % solicitantes.length],
                recebedor: recebedores[i % recebedores.length],
                service: services[i % services.length],
                valor: `R$ ${(Math.random() * 10000 + 1000).toFixed(2).replace('.', ',')}`,
                status: statuses[i % statuses.length],
                priority: priorities[i % priorities.length],
                dataCriacao: dataCriacao.toISOString().split('T')[0],
                dataPagamento: dataPagamento.toISOString().split('T')[0],
                description: `Descrição da solicitação ${i}`,
                tempoCriacao: `${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
                tempoFila: `${String(Math.floor(Math.random() * 48)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`
            });
        }
        return data;
    }

    setupEventListeners() {
        // Toggle para colapsar filtros
        const filtersToggle = document.getElementById('filtersToggle');
        
        // Toggle para expandir/colapsar colunas de valores detalhados
        const toggleValoresBtn = document.getElementById('toggleValoresDetalhados');
        if (toggleValoresBtn) {
            toggleValoresBtn.addEventListener('click', () => {
                this.toggleValoresDetalhados();
            });
        }
        const filtersContent = document.getElementById('filtersContent');
        
        if (filtersToggle && filtersContent) {
            filtersToggle.addEventListener('click', () => {
                filtersToggle.classList.toggle('collapsed');
                filtersContent.classList.toggle('collapsed');
            });
        }

        // Filtros de status com debounce
        document.querySelectorAll('.status-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.status-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentFilters.status = e.target.dataset.status;
                this.debouncedApplyFilters();
            });
        });

        // Filtros de tipo com debounce
        document.querySelectorAll('.type-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentFilters.tipo = e.target.dataset.type;
                this.debouncedApplyFilters();
            });
        });
        // Filtros de data
        document.getElementById('dateFrom')?.addEventListener('change', () => {
            this.currentFilters.dateFrom = document.getElementById('dateFrom').value;
            this.clearPeriodQuickActive();
            this.debouncedApplyFilters();
        });

        document.getElementById('dateTo')?.addEventListener('change', () => {
            this.currentFilters.dateTo = document.getElementById('dateTo').value;
            this.clearPeriodQuickActive();
            this.debouncedApplyFilters();
        });

        // Botões de período rápido (Hoje, Esta Semana, Última Semana, Mês, 3 meses, Ano, Outros, Individual)
        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const period = btn.getAttribute('data-period');
                const today = new Date();
                const y = today.getFullYear();
                const m = String(today.getMonth() + 1).padStart(2, '0');
                const day = today.getDate();
                const d = String(day).padStart(2, '0');
                let dateFrom = '';
                let dateTo = '';
                if (period === 'hoje') {
                    dateFrom = `${y}-${m}-${d}`;
                    dateTo = dateFrom;
                } else if (period === 'semana') {
                    const dayOfWeek = today.getDay();
                    const toMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                    const start = new Date(today);
                    start.setDate(today.getDate() - toMonday);
                    const end = new Date(start);
                    end.setDate(start.getDate() + 6);
                    dateFrom = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
                    dateTo = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`;
                } else if (period === 'ultima_semana') {
                    const dayOfWeek = today.getDay();
                    const toMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                    const end = new Date(today);
                    end.setDate(today.getDate() - toMonday - 1);
                    const start = new Date(end);
                    start.setDate(end.getDate() - 6);
                    dateFrom = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
                    dateTo = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`;
                } else if (period === 'mes') {
                    dateFrom = `${y}-${m}-01`;
                    const lastDay = new Date(y, today.getMonth() + 1, 0).getDate();
                    dateTo = `${y}-${m}-${String(lastDay).padStart(2, '0')}`;
                } else if (period === '3meses') {
                    const start = new Date(today);
                    start.setDate(today.getDate() - 90);
                    dateFrom = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
                    dateTo = `${y}-${m}-${d}`;
                } else if (period === 'ano') {
                    dateFrom = `${y}-01-01`;
                    dateTo = `${y}-${m}-${d}`;
                } else if (period === 'outros' || period === 'individual') {
                    dateFrom = document.getElementById('dateFrom')?.value || '';
                    dateTo = document.getElementById('dateTo')?.value || (period === 'individual' ? dateFrom : '');
                }
                this.currentFilters.dateFrom = dateFrom;
                this.currentFilters.dateTo = dateTo;
                const dateFromEl = document.getElementById('dateFrom');
                const dateToEl = document.getElementById('dateTo');
                if (dateFromEl && dateFrom) dateFromEl.value = dateFrom;
                if (dateToEl && dateTo) dateToEl.value = dateTo;
                document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                // Atualizar gráficos do dashboard de indicadores
                document.dispatchEvent(new CustomEvent('relatorio:periodChange', { detail: { period: period, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined } }));
                this.applyFilters();
            });
        });

        // Filtro de serviço
        document.getElementById('serviceFilter')?.addEventListener('change', () => {
            this.currentFilters.service = document.getElementById('serviceFilter').value;
            this.debouncedApplyFilters();
        });
        document.getElementById('recebedorFilter')?.addEventListener('change', () => {
            const recebedorFilter = document.getElementById('recebedorFilter');
            this.currentFilters.recebedor = recebedorFilter ? (recebedorFilter.value || '').trim() : '';
            this.debouncedApplyFilters();
        });

        // Filtro de prioridade
        document.getElementById('priorityFilter')?.addEventListener('change', () => {
            this.currentFilters.priority = document.getElementById('priorityFilter').value;
            this.debouncedApplyFilters();
        });

        // Filtro de Cliente/Empresa
        document.getElementById('clienteEmpresaFilter')?.addEventListener('input', (e) => {
            this.currentFilters.clienteEmpresa = e.target.value.toLowerCase();
            this.debouncedApplyFilters();
        });

        // Filtro de CNPJ
        document.getElementById('cnpjFilter')?.addEventListener('input', (e) => {
            this.currentFilters.cnpj = e.target.value.toLowerCase();
            this.debouncedApplyFilters();
        });

        // Filtro de Chave PIX
        document.getElementById('chavePixFilter')?.addEventListener('input', (e) => {
            this.currentFilters.chavePix = e.target.value.toLowerCase();
            this.debouncedApplyFilters();
        });

        // Busca com debounce otimizado
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.currentFilters.search = e.target.value.toLowerCase();
                this.debouncedApplyFilters();
            });
        }

        // Botões de ação
        document.getElementById('clearFilters')?.addEventListener('click', () => {
            this.clearFilters();
        });

        document.getElementById('applyFilters')?.addEventListener('click', () => {
            // ✅ IMPORTANTE: Ler todos os valores dos campos antes de aplicar filtros
            this.readFilterValues();
            this.applyFilters();
        });

        // Ordenação da tabela
        document.querySelectorAll('.sortable').forEach(th => {
            th.addEventListener('click', () => {
                const column = th.dataset.column;
                if (this.sortColumn === column) {
                    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
                } else {
                    this.sortColumn = column;
                    this.sortDirection = 'asc';
                }
                this.sortData();
                this.renderTableOptimized();
            });
        });

        // Paginação
        document.getElementById('prevPage')?.addEventListener('click', () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.renderTableOptimized();
            }
        });

        document.getElementById('nextPage')?.addEventListener('click', () => {
            const totalPages = Math.ceil(this.filteredData.length / this.itemsPerPage);
            if (this.currentPage < totalPages) {
                this.currentPage++;
                this.renderTableOptimized();
            }
        });

        // Exportação
        document.getElementById('exportExcel')?.addEventListener('click', () => {
            this.exportToExcel();
        });

        document.getElementById('exportPDF')?.addEventListener('click', () => {
            this.exportToPDF();
        });

        // CSV removido - apenas Excel e PDF disponíveis

        // Modal de detalhes
        document.getElementById('closeDetailsModal')?.addEventListener('click', () => {
            this.closeModal();
        });
        // Event delegation para botões de ação (view e edit)
        const reportsTable = document.querySelector('.reports-table, table');
        if (reportsTable) {
            reportsTable.addEventListener('click', (e) => {
                const btn = e.target.closest('.btn-action, .btn-view');
                if (btn) {
                    // Tentar buscar pelo atributo data-id (usado no template)
                    let solicitacaoId = btn.getAttribute('data-id');
                    if (!solicitacaoId) {
                        // Fallback para outros atributos
                        solicitacaoId = btn.getAttribute('data-solicitacao-id');
                    }
                    
                    if (solicitacaoId) {
                        solicitacaoId = parseInt(solicitacaoId);
                        console.log('🔍 Botão clicado, ID da solicitação:', solicitacaoId);
                        
                        // Se for botão de visualizar, chamar função de detalhes
                        if (btn.classList.contains('btn-view') || btn.classList.contains('btn-action')) {
                            this.showDetails(solicitacaoId);
                        }
                    }
                }
            });
        }    }

    // Debounce otimizado para filtros
    debouncedApplyFilters() {
        if (this.cache.debounceTimer) {
            clearTimeout(this.cache.debounceTimer);
        }
        this.cache.debounceTimer = setTimeout(() => {
            this.readFilterValues();
            this.applyFilters();
        }, 150); // Reduzido de 300ms para 150ms
    }

    readFilterValues() {
        // ✅ Ler todos os valores dos campos de filtro e atualizar this.currentFilters
        const statusBtn = document.querySelector('.status-btn.active');
        if (statusBtn) {
            this.currentFilters.status = statusBtn.dataset.status || 'all';
        }
        
        const typeBtn = document.querySelector('.type-btn.active');
        if (typeBtn) {
            this.currentFilters.tipo = typeBtn.dataset.type || 'all';
        }
        
        const dateFrom = document.getElementById('dateFrom');
        if (dateFrom) {
            this.currentFilters.dateFrom = dateFrom.value || '';
        }
        
        const dateTo = document.getElementById('dateTo');
        if (dateTo) {
            this.currentFilters.dateTo = dateTo.value || '';
        }
        
        const serviceFilter = document.getElementById('serviceFilter');
        if (serviceFilter) {
            this.currentFilters.service = serviceFilter.value || '';
        }
        
        const priorityFilter = document.getElementById('priorityFilter');
        if (priorityFilter) {
            this.currentFilters.priority = priorityFilter.value || '';
        }
        
        const recebedorFilter = document.getElementById('recebedorFilter');
        if (recebedorFilter) {
            this.currentFilters.recebedor = recebedorFilter.value ? recebedorFilter.value.trim() : '';
        }
        
        const clienteEmpresaFilter = document.getElementById('clienteEmpresaFilter');
        if (clienteEmpresaFilter) {
            this.currentFilters.clienteEmpresa = clienteEmpresaFilter.value.toLowerCase().trim() || '';
        }
        
        const cnpjFilter = document.getElementById('cnpjFilter');
        if (cnpjFilter) {
            this.currentFilters.cnpj = cnpjFilter.value.toLowerCase().trim() || '';
        }
        
        const chavePixFilter = document.getElementById('chavePixFilter');
        if (chavePixFilter) {
            this.currentFilters.chavePix = chavePixFilter.value.toLowerCase().trim() || '';
        }
        
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            this.currentFilters.search = searchInput.value.toLowerCase().trim() || '';
        }
        
        console.log('🔍 Valores dos filtros lidos:', this.currentFilters);
    }

    applyFilters() {
        const startTime = performance.now();
        
        console.log('🔍 Debug - Aplicando filtros:', this.currentFilters);
        console.log('🔍 Debug - Total de dados:', this.data.length);
        console.log('🔍 Debug - Filtro de data:', {
            dateFrom: this.currentFilters.dateFrom,
            dateTo: this.currentFilters.dateTo,
            primeiroItemData: this.data.length > 0 ? this.data[0].dataCriacao : 'N/A'
        });
        
        // Se não houver dados, não aplicar filtros
        if (this.data.length === 0) {
            console.warn('⚠️ Nenhum dado disponível para filtrar!');
            this.filteredData = [];
            this.renderTableOptimized();
            this.updateTableInfo();
            return;
        }
        
        let filteredCount = 0;
        let debugCount = 0; // Contador para logs de debug
        this.filteredData = this.data.filter(item => {
            let passes = true;
            
            // Filtro de status
            if (this.currentFilters.status !== 'all') {
                const itemStatus = (item.status || '').toLowerCase();
                const filterStatus = (this.currentFilters.status || '').toLowerCase();
                if (itemStatus !== filterStatus) {
                    passes = false;
                }
            }
            
            if (!passes) return false;

            // Filtro de tipo
            if (this.currentFilters.tipo !== 'all') {
                const itemTipo = (item.tipo || '').toLowerCase();
                const filterTipo = (this.currentFilters.tipo || '').toLowerCase();
                if (itemTipo !== filterTipo) {
                    return false;
                }
            }
            // Filtro de data - usar data de criação para filtrar
            // Função auxiliar para normalizar data para yyyy-mm-dd
            const normalizeDate = (dateStr) => {
                if (!dateStr) return null;
                
                // Remover espaços e limpar
                dateStr = String(dateStr).trim();
                if (!dateStr) return null;
                
                // Se já está no formato yyyy-mm-dd, retornar como está
                if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
                    return dateStr.split('T')[0].split(' ')[0];
                }
                
                // Se está no formato dd/mm/yyyy, converter para yyyy-mm-dd
                if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(dateStr)) {
                    const parts = dateStr.split('/');
                    if (parts.length === 3) {
                        const day = parts[0].padStart(2, '0');
                        const month = parts[1].padStart(2, '0');
                        const year = parts[2];
                        return `${year}-${month}-${day}`;
                    }
                }
                
                console.warn('⚠️ Formato de data não reconhecido:', dateStr);
                return null;
            };
            
            // Aplicar filtro de data inicial (dateFrom)
            if (this.currentFilters.dateFrom) {
                const itemDateStr = normalizeDate(item.dataCriacao);
                const filterDateFrom = this.currentFilters.dateFrom.trim(); // Já vem no formato yyyy-mm-dd do input
                
                if (filterDateFrom) {
                    if (!itemDateStr) {
                        // Se o item não tem data válida e há filtro, excluir
                        if (debugCount < 3) {
                            console.log(`❌ Item ${item.id || item.ticket} excluído: sem data válida. Data original: "${item.dataCriacao}"`);
                            debugCount++;
                        }
                    return false;
                }
                    
                    // Comparar como strings (yyyy-mm-dd pode ser comparado diretamente como string)
                    if (itemDateStr < filterDateFrom) {
                        if (debugCount < 3) {
                            console.log(`❌ Item ${item.id || item.ticket} excluído por dateFrom: ${itemDateStr} < ${filterDateFrom} (original: ${item.dataCriacao})`);
                            debugCount++;
                        }
                        return false;
                    }
                }
            }
            
            // Aplicar filtro de data final (dateTo)
            if (this.currentFilters.dateTo) {
                const itemDateStr = normalizeDate(item.dataCriacao);
                const filterDateTo = this.currentFilters.dateTo.trim(); // Já vem no formato yyyy-mm-dd do input
                
                if (filterDateTo) {
                    if (!itemDateStr) {
                        // Se o item não tem data válida e há filtro, excluir
                        if (debugCount < 3) {
                            console.log(`❌ Item ${item.id || item.ticket} excluído: sem data válida. Data original: "${item.dataCriacao}"`);
                            debugCount++;
                        }
                    return false;
                    }
                    
                    // Comparar como strings (yyyy-mm-dd pode ser comparado diretamente como string)
                    if (itemDateStr > filterDateTo) {
                        if (debugCount < 3) {
                            console.log(`❌ Item ${item.id || item.ticket} excluído por dateTo: ${itemDateStr} > ${filterDateTo} (original: ${item.dataCriacao})`);
                            debugCount++;
                        }
                        return false;
                    }
                }
            }
            
            // Se chegou aqui, o item passou em todos os filtros
            filteredCount++;

            // Filtro de serviço
            // IMPORTANTE: Comparar IDs diretamente (sem toLowerCase) pois são números/strings
            if (this.currentFilters.service && this.currentFilters.service !== '') {
                const itemService = String(item.service || '').trim();
                const filterService = String(this.currentFilters.service || '').trim();
                // Comparar como strings (IDs são strings)
                if (itemService !== filterService) {
                    return false;
                }
            }

            // Filtro de prioridade
            if (this.currentFilters.priority && item.priority) {
                const itemPriority = (item.priority || '').toLowerCase().trim();
                const filterPriority = (this.currentFilters.priority || '').toLowerCase().trim();
                if (itemPriority !== filterPriority) {
                    return false;
                }
            }

            // Filtro de recebedor
            if (this.currentFilters.recebedor) {
                const itemRecebedor = (item.recebedor || '').trim();
                const filterRecebedor = this.currentFilters.recebedor.trim();
                if (itemRecebedor !== filterRecebedor) {
                    return false;
                }
            }

            // Filtro de Cliente/Empresa
            if (this.currentFilters.clienteEmpresa) {
                const clienteEmpresa = (item.clienteEmpresa || '').toLowerCase();
                if (!clienteEmpresa.includes(this.currentFilters.clienteEmpresa)) {
                    return false;
                }
            }

            // Filtro de CNPJ
            if (this.currentFilters.cnpj) {
                const cnpj = (item.cnpj || '').toLowerCase();
                if (!cnpj.includes(this.currentFilters.cnpj)) {
                    return false;
                }
            }

            // Filtro de Chave PIX
            if (this.currentFilters.chavePix) {
                const chavePix = (item.chavePix || '').toLowerCase();
                if (!chavePix.includes(this.currentFilters.chavePix)) {
                    return false;
                }
            }

            // Filtro de busca (inclui novos campos)
            if (this.currentFilters.search) {
                const searchTerm = this.currentFilters.search;
                const searchableText = `${item.id} ${item.title} ${item.solicitante} ${item.supervisor || ''} ${item.recebedor} ${item.service || ''} ${item.clienteEmpresa || ''} ${item.cnpj || ''} ${item.chavePix || ''}`.toLowerCase();
                if (!searchableText.includes(searchTerm)) {
                    return false;
                }
            }

            return true;
        });

        this.currentPage = 1;
        
        console.log('🔍 Debug - Dados após filtro:', this.filteredData.length, 'itens de', this.data.length, 'totais');
        console.log('🔍 Debug - Filtros aplicados:', {
            dateFrom: this.currentFilters.dateFrom,
            dateTo: this.currentFilters.dateTo,
            status: this.currentFilters.status,
            tipo: this.currentFilters.tipo,
            service: this.currentFilters.service,
            priority: this.currentFilters.priority,
            search: this.currentFilters.search
        });
        
        this.renderTableOptimized();
        this.updateStats();
        this.updateMiniReports();
        // Atualizar gráficos do dashboard de indicadores ao aplicar filtros (ex.: datas em Outros/Individual)
        const activePeriodBtn = document.querySelector('.period-btn.active');
        const period = activePeriodBtn ? activePeriodBtn.getAttribute('data-period') : 'outros';
        document.dispatchEvent(new CustomEvent('relatorio:periodChange', {
            detail: {
                period: period,
                dateFrom: this.currentFilters.dateFrom || undefined,
                dateTo: this.currentFilters.dateTo || undefined
            }
        }));
        const endTime = performance.now();
        console.log(`Filtros aplicados em ${(endTime - startTime).toFixed(2)}ms`);
    }

    clearPeriodQuickActive() {
        document.querySelectorAll('.period-btn').forEach(btn => btn.classList.remove('active'));
    }

    clearFilters() {
        this.currentFilters = {
            status: 'all',
            tipo: 'all',
            dateFrom: '',
            dateTo: '',
            service: '',
            recebedor: '',
            priority: '',
            search: '',
            clienteEmpresa: '',
            cnpj: '',
            chavePix: ''
        };

        // Resetar UI
        document.querySelectorAll('.status-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector('[data-status="all"]')?.classList.add('active');
        
        document.querySelectorAll('.type-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector('[data-type="all"]')?.classList.add('active');
        
        const dateFrom = document.getElementById('dateFrom');
        const dateTo = document.getElementById('dateTo');
        const serviceFilter = document.getElementById('serviceFilter');
        const priorityFilter = document.getElementById('priorityFilter');
        const searchInput = document.getElementById('searchInput');
        const clienteEmpresaFilter = document.getElementById('clienteEmpresaFilter');
        const cnpjFilter = document.getElementById('cnpjFilter');
        const chavePixFilter = document.getElementById('chavePixFilter');

        if (dateFrom) dateFrom.value = '';
        if (dateTo) dateTo.value = '';
        this.clearPeriodQuickActive();
        if (serviceFilter) serviceFilter.value = '';
        const recebedorFilter = document.getElementById('recebedorFilter');
        if (recebedorFilter) recebedorFilter.value = '';
        if (priorityFilter) priorityFilter.value = '';
        if (searchInput) searchInput.value = '';
        if (clienteEmpresaFilter) clienteEmpresaFilter.value = '';
        if (cnpjFilter) cnpjFilter.value = '';
        if (chavePixFilter) chavePixFilter.value = '';

        this.setDefaultDates();
        this.applyFilters();
    }

    sortData() {
        this.filteredData.sort((a, b) => {
            let aVal = a[this.sortColumn];
            let bVal = b[this.sortColumn];

            // Tratamento especial para valores monetários
            if (this.sortColumn === 'valor') {
                aVal = parseFloat(aVal.replace('R$ ', '').replace(',', '.'));
                bVal = parseFloat(bVal.replace('R$ ', '').replace(',', '.'));
            }

            // Tratamento especial para datas
            if (this.sortColumn === 'dataCriacao' || this.sortColumn === 'dataPagamento') {
                aVal = new Date(aVal);
                bVal = new Date(bVal);
            }

            if (aVal < bVal) return this.sortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return this.sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }

    // Renderização otimizada da tabela
    renderTableOptimized() {
        const tbody = document.getElementById('reportsTableBody');
        if (!tbody) return;

        const startTime = performance.now();
        
        // Limpar cache se necessário
        if (performance.now() - this.cache.lastRenderTime > 1000) {
            this.cache.renderedRows.clear();
        }

        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageData = this.filteredData.slice(startIndex, endIndex);

        // Usar DocumentFragment para melhor performance
        const fragment = document.createDocumentFragment();
        
        pageData.forEach(item => {
            const row = document.createElement('tr');
            // Adicionar data attributes para filtros
            row.setAttribute('data-status', item.status || '');
            row.setAttribute('data-priority', item.priority || '');
            row.setAttribute('data-service', item.service || '');
            row.setAttribute('data-tipo', item.tipo || '');
            row.setAttribute('data-id', item.id || '');
            // Não estamos mais expandindo itens - todas as solicitações aparecem em uma única linha
            row.innerHTML = this.getRowHTML(item);
            fragment.appendChild(row);
        });

        // Limpar e adicionar todas as linhas de uma vez
        tbody.innerHTML = '';
        // Se não houver dados filtrados, mostrar mensagem de estado vazio
        if (pageData.length === 0) {
            const emptyRow = document.createElement('tr');
            emptyRow.className = 'empty-state';
            const isExpanded = localStorage.getItem('valoresDetalhadosExpanded') === 'true';
            const colspan = isExpanded ? 21 : 14;
            emptyRow.innerHTML = `
                <td colspan="${colspan}" style="text-align: center; padding: 3rem;">
                    <i class="fas fa-inbox" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>
                    <p style="color: #999; font-size: 1.1rem;">Nenhuma solicitação encontrada com os filtros aplicados</p>
                    <p style="color: #ccc; font-size: 0.9rem;">Tente ajustar os filtros para ver mais resultados</p>
                </td>
            `;
            tbody.appendChild(emptyRow);
        } else {
            tbody.appendChild(fragment);
        }
        this.updatePagination();
        this.updateTableInfo();
        
        this.cache.lastRenderTime = performance.now();
        const endTime = performance.now();
        console.log(`Tabela renderizada em ${(endTime - startTime).toFixed(2)}ms`);
    }

    // HTML otimizado para linhas da tabela
    getRowHTML(item) {
        const isExpanded = localStorage.getItem('valoresDetalhadosExpanded') === 'true';
        const displayStyle = isExpanded ? 'table-cell' : 'none';
        
        return `
            <td>${item.ticket || item.id}</td>
            <td>${item.title}</td>
            <td>${item.solicitante}</td>
            <td>${item.supervisor || '-'}</td>
            <td>${item.recebedor || '-'}</td>
            <td>${item.chavePix || '-'}</td>
            <td>${item.clienteEmpresa || '-'}</td>
            <td>${item.cnpj || '-'}</td>
            <td>${item.service}</td>
            <td><strong>${item.valor}</strong></td>
            <td class="valores-detalhados-toggle-cell" style="display: ${displayStyle};"></td>
            <td class="valores-detalhados-col" style="display: ${displayStyle};">
                <span class="valor-receita">${item.valorReceita || 'R$ 0,00'}</span>
            </td>
            <td class="valores-detalhados-col" style="display: ${displayStyle};">
                <span class="valor-em-rota" style="color: #FF6B6B; font-weight: 700;">${item.valorEmRota || 'R$ 0,00'}</span>
            </td>
            <td class="valores-detalhados-col" style="display: ${displayStyle};">
                <span class="valor-detail">${item.valorKm || 'R$ 0,00'}</span>
            </td>
            <td class="valores-detalhados-col" style="display: ${displayStyle};">
                <span class="valor-detail">${item.valorPedagio || 'R$ 0,00'}</span>
            </td>
            <td class="valores-detalhados-col" style="display: ${displayStyle};">
                <span class="valor-detail">${item.valorHospedagem || 'R$ 0,00'}</span>
            </td>
            <td class="valores-detalhados-col" style="display: ${displayStyle};">
                <span class="valor-detail">${item.valorFluvial || 'R$ 0,00'}</span>
            </td>
            <td class="valores-detalhados-col" style="display: ${displayStyle};">
                <span class="valor-detail">${item.valorOutros || 'R$ 0,00'}</span>
            </td>
            <td><span class="status-badge status-${item.status}">${item.statusDisplay}</span></td>
            <td><span class="priority-badge priority-${item.priority}">${item.priority}</span></td>
            <td>${item.dataCriacao}</td>
            <td>${item.dataPagamento}</td>
            <td class="actions-cell">
                <button class="btn-action btn-view" data-id="${item.id}" title="Ver detalhes">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        `;
    }

    updatePagination() {
        const totalPages = Math.ceil(this.filteredData.length / this.itemsPerPage);
        
        // Atualizar botões de navegação
        const prevBtn = document.getElementById('prevPage');
        const nextBtn = document.getElementById('nextPage');
        
        if (prevBtn) prevBtn.disabled = this.currentPage === 1;
        if (nextBtn) nextBtn.disabled = this.currentPage === totalPages;

        // Atualizar números de página
        const paginationNumbers = document.getElementById('paginationNumbers');
        if (paginationNumbers) {
            paginationNumbers.innerHTML = '';

            const maxVisiblePages = 5;
            let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
            let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

            if (endPage - startPage + 1 < maxVisiblePages) {
                startPage = Math.max(1, endPage - maxVisiblePages + 1);
            }

            for (let i = startPage; i <= endPage; i++) {
                const pageBtn = document.createElement('button');
                pageBtn.className = `pagination-number ${i === this.currentPage ? 'active' : ''}`;
                pageBtn.textContent = i;
                pageBtn.addEventListener('click', () => {
                    this.currentPage = i;
                    this.renderTableOptimized();
                });
                paginationNumbers.appendChild(pageBtn);
            }
        }

        // Atualizar informação de paginação
        const paginationInfo = document.getElementById('paginationInfo');
        if (paginationInfo) {
            paginationInfo.textContent = `Página ${this.currentPage} de ${totalPages}`;
        }
    }

    updateTableInfo() {
        const totalRecords = document.getElementById('totalRecords');
        const filteredRecords = document.getElementById('filteredRecords');
        
        // Atualizar contadores com dados reais
        const total = this.data.length;
        const filtered = this.filteredData.length;
        
        if (totalRecords) totalRecords.textContent = `Total: ${this.data.length}`;
        if (filteredRecords) filteredRecords.textContent = `Exibindo: ${this.filteredData.length}`;
        
        // Atualizar paginação
        const totalPages = Math.ceil(this.filteredData.length / this.itemsPerPage);
        const paginationInfo = document.getElementById('paginationInfo');
        if (paginationInfo) {
            paginationInfo.textContent = `Página ${this.currentPage} de ${totalPages || 1}`;
        }
        
        // Atualizar botões de paginação
        const prevPage = document.getElementById('prevPage');
        const nextPage = document.getElementById('nextPage');
        if (prevPage) prevPage.disabled = this.currentPage === 1;
        if (nextPage) nextPage.disabled = this.currentPage >= totalPages;
    }

    updateStats() {
        // ✅ Atualizar estatísticas baseado nos dados filtrados
        // Apenas quando filtros são aplicados, não na carga inicial
        const total = this.filteredData.length;
        const aprovadas = this.filteredData.filter(item => item.status === 'aprovado').length;
        const pendentes = this.filteredData.filter(item => item.status === 'pendente').length;
        
        const valorTotal = this.filteredData.reduce((sum, item) => {
            // Extrair valor numérico
            const valorStr = item.valor.replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
            const valor = parseFloat(valorStr) || 0;
            return sum + valor;
        }, 0);

        const totalSolicitacoes = document.getElementById('totalSolicitacoes');
        const valorTotalEl = document.getElementById('valorTotal');
        const aprovadasEl = document.getElementById('aprovadas');
        const pendentesEl = document.getElementById('pendentes');

        // Atualizar apenas se houver filtros aplicados
        if (totalSolicitacoes) totalSolicitacoes.textContent = total;
        if (valorTotalEl) valorTotalEl.textContent = `R$ ${valorTotal.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        if (aprovadasEl) aprovadasEl.textContent = aprovadas;
        if (pendentesEl) pendentesEl.textContent = pendentes;
    }

    parseValorNum(valorStr) {
        if (!valorStr || typeof valorStr !== 'string') return 0;
        const cleaned = valorStr.replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
        return parseFloat(cleaned) || 0;
    }

    updateMiniReports() {
        if (!document.getElementById('miniReportsGrid')) return;
        const data = this.filteredData;
        const total = data.length;

        // Valor médio por solicitação
        const valorTotal = data.reduce((s, item) => s + this.parseValorNum(item.valor), 0);
        const valorMedioEl = document.getElementById('miniReportValorMedioVal');
        if (valorMedioEl) {
            if (total === 0) {
                valorMedioEl.textContent = '—';
            } else {
                const medio = valorTotal / total;
                valorMedioEl.textContent = `R$ ${medio.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            }
        }

        // Distribuição por status (barras)
        const statusCounts = { pendente: 0, aprovado: 0, concluido: 0, recusado: 0 };
        data.forEach(item => {
            const s = (item.status || '').toLowerCase();
            if (statusCounts.hasOwnProperty(s)) statusCounts[s]++;
        });
        const statusLabels = { pendente: 'Pendente', aprovado: 'Aprovado', concluido: 'Concluído', recusado: 'Recusado' };
        const statusBarsEl = document.getElementById('miniReportStatusBars');
        if (statusBarsEl) {
            if (total === 0) {
                statusBarsEl.innerHTML = '<span class="mini-report-sub">Nenhum dado</span>';
            } else {
                statusBarsEl.innerHTML = Object.entries(statusCounts).map(([key, count]) => {
                    const pct = Math.round((count / total) * 100);
                    return `<div class="mini-report-bar-row">
                        <span class="mini-report-bar-label">${statusLabels[key]}</span>
                        <div class="mini-report-bar-track"><div class="mini-report-bar-fill status-${key}" style="width:${pct}%"></div></div>
                        <span class="mini-report-bar-pct">${pct}%</span>
                    </div>`;
                }).join('');
            }
        }

        // Top 5 serviços por valor
        const byService = {};
        data.forEach(item => {
            const name = item.serviceName || 'N/A';
            if (!byService[name]) byService[name] = 0;
            byService[name] += this.parseValorNum(item.valor);
        });
        const topServicos = Object.entries(byService)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
        const servicosListEl = document.getElementById('miniReportServicosList');
        if (servicosListEl) {
            if (topServicos.length === 0) {
                servicosListEl.innerHTML = '<span class="mini-report-sub">Nenhum dado</span>';
            } else {
                servicosListEl.innerHTML = topServicos.map(([nome, val]) => {
                    const label = nome.length > 18 ? nome.substring(0, 18) + '…' : nome;
                    return `<div class="mini-report-list-item"><span class="mini-report-list-label" title="${nome}">${label}</span><span class="mini-report-list-value">R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span></div>`;
                }).join('');
            }
        }

        // Top 5 recebedores por valor
        const byRecebedor = {};
        data.forEach(item => {
            const name = (item.recebedor || '-').trim() || '-';
            if (!byRecebedor[name]) byRecebedor[name] = 0;
            byRecebedor[name] += this.parseValorNum(item.valor);
        });
        const topRecebedores = Object.entries(byRecebedor)
            .filter(([n]) => n !== '-')
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
        const recebedoresListEl = document.getElementById('miniReportRecebedoresList');
        if (recebedoresListEl) {
            if (topRecebedores.length === 0) {
                recebedoresListEl.innerHTML = '<span class="mini-report-sub">Nenhum dado</span>';
            } else {
                recebedoresListEl.innerHTML = topRecebedores.map(([nome, val]) => {
                    const label = nome.length > 18 ? nome.substring(0, 18) + '…' : nome;
                    return `<div class="mini-report-list-item"><span class="mini-report-list-label" title="${nome}">${label}</span><span class="mini-report-list-value">R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span></div>`;
                }).join('');
            }
        }

        // Taxa de aprovação (aprovadas + concluídas) / processadas
        const processadas = data.filter(item => ['aprovado', 'concluido', 'recusado'].includes((item.status || '').toLowerCase())).length;
        const aprovadasOuConcluidas = data.filter(item => ['aprovado', 'concluido'].includes((item.status || '').toLowerCase())).length;
        const taxaValEl = document.getElementById('miniReportTaxaVal');
        if (taxaValEl) {
            if (processadas === 0) {
                taxaValEl.textContent = '—';
            } else {
                const taxa = Math.round((aprovadasOuConcluidas / processadas) * 100);
                taxaValEl.textContent = `${taxa}%`;
            }
        }
    }

    setDefaultDates() {
        const today = new Date();
        const lastMonth = new Date(today);
        lastMonth.setMonth(lastMonth.getMonth() - 1);

        const dateFrom = document.getElementById('dateFrom');
        const dateTo = document.getElementById('dateTo');

        if (dateFrom) dateFrom.value = lastMonth.toISOString().split('T')[0];
        if (dateTo) dateTo.value = today.toISOString().split('T')[0];

        this.currentFilters.dateFrom = lastMonth.toISOString().split('T')[0];
        this.currentFilters.dateTo = today.toISOString().split('T')[0];
    }

    showLoadingIndicator() {
        const existingIndicator = document.getElementById('loadingIndicator');
        if (existingIndicator) return;

        const indicator = document.createElement('div');
        indicator.id = 'loadingIndicator';
        indicator.innerHTML = `
            <div style="
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 20px;
                border-radius: 8px;
                z-index: 10000;
                display: flex;
                align-items: center;
                gap: 10px;
            ">
                <div style="
                    width: 20px;
                    height: 20px;
                    border: 2px solid #f3f3f3;
                    border-top: 2px solid #FFCB57;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                "></div>
                Carregando dados...
            </div>
        `;
        document.body.appendChild(indicator);
    }

    hideLoadingIndicator() {
        const indicator = document.getElementById('loadingIndicator');
        if (indicator) {
            indicator.remove();
        }
    }

    async showDetails(id) {
        console.log('🔍 Buscando detalhes completos da solicitação:', id, 'Tipo:', typeof id);

        const modal = document.getElementById('detailsModal');
        const content = document.getElementById('detailsContent');
        
        if (!modal || !content) {
            console.error('❌ Modal ou conteúdo não encontrado');
            return;
        }
        
        // Garantir que o ID é um número
        let solicitacaoId = id;
        if (typeof solicitacaoId === 'string') {
            // Tentar extrair ID numérico se for um ticket
            const numericId = parseInt(solicitacaoId);
            if (!isNaN(numericId)) {
                solicitacaoId = numericId;
            } else {
                // Se não é um número, tentar buscar pelo ticket na linha
                const row = document.querySelector(`tr[data-id="${id}"]`);
                if (row) {
                    const rowId = row.getAttribute('data-id');
                    solicitacaoId = parseInt(rowId) || rowId;
                } else {
                    console.error('❌ ID inválido:', id);
                    content.innerHTML = '<div class="error-details"><i class="fas fa-exclamation-triangle"></i><p>Erro: ID da solicitação inválido</p></div>';
                    modal.classList.add('show');
                    modal.style.display = 'block';
                    return;
                }
            }
        }
        
        console.log('🔍 ID processado:', solicitacaoId);
        
        // Mostrar loading
        content.innerHTML = '<div class="loading-details"><i class="fas fa-spinner fa-spin"></i> Carregando detalhes...</div>';
        modal.classList.add('show');
        modal.style.display = 'block';
        
        try {
            // Buscar CSRF token
            const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value || 
                             document.cookie.match(/csrftoken=([^;]+)/)?.[1] || '';
            
            // Buscar detalhes completos via AJAX
            const url = `/solicitacoes/obter-detalhes-completos/${solicitacaoId}/`;
            console.log('📡 Fazendo requisição para:', url);
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken
                },
                credentials: 'same-origin'
            });
            
            console.log('📦 Resposta recebida:', response.status, response.statusText);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Erro na resposta:', errorText);
                throw new Error(`Erro ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.message || 'Erro ao buscar detalhes');
            }
            
            const dados = result.dados;
            console.log('✅ Detalhes recebidos:', dados);
            
            // Construir HTML com todos os detalhes
            let html = `
                <div class="detail-section">
                    <h4><i class="fas fa-info-circle"></i> Informações Básicas</h4>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <label>ID/Ticket:</label>
                            <span><strong>${dados.ticket || dados.id}</strong></span>
                        </div>
                        <div class="detail-item">
                            <label>Título:</label>
                            <span>${dados.titulo || 'N/A'}</span>
                        </div>
                        <div class="detail-item">
                            <label>Tipo:</label>
                            <span class="badge badge-${dados.tipo === 'em_rota' ? 'route' : 'casual'}">${dados.tipo === 'em_rota' ? 'Em rota' : 'Casual'}</span>
                        </div>
                        <div class="detail-item">
                            <label>Solicitante:</label>
                            <span>${dados.solicitante || 'N/A'}</span>
                        </div>
                        <div class="detail-item">
                            <label>Recebedor:</label>
                            <span>${dados.recebedor || 'N/A'}</span>
                        </div>
                        <div class="detail-item">
                            <label>Serviço:</label>
                            <span>${dados.servico || 'N/A'}</span>
                        </div>
                        <div class="detail-item">
                            <label>Status:</label>
                            <span class="status-badge status-${dados.status}">${this.getStatusName(dados.status)}</span>
                        </div>
                        <div class="detail-item">
                            <label>Prioridade:</label>
                            <span class="priority-badge priority-${dados.prioridade}">${this.getPriorityName(dados.prioridade)}</span>
                        </div>
                        <div class="detail-item">
                            <label>Data de Criação:</label>
                            <span>${dados.data_criacao || 'N/A'}</span>
                        </div>
                        <div class="detail-item">
                            <label>Data de Pagamento:</label>
                            <span>${dados.data_pagamento || 'N/A'}</span>
                        </div>
                    </div>
                </div>
                
                <div class="detail-section">
                    <h4><i class="fas fa-dollar-sign"></i> Valores Detalhados</h4>
                    <div class="detail-grid">
                        <div class="detail-item highlight">
                            <label>Valor Total:</label>
                            <span class="valor-total-detail">${dados.valor_total}</span>
                        </div>
                        <div class="detail-item highlight">
                            <label>Valor de Receita:</label>
                            <span class="valor-receita-detail">${dados.valor_receita}</span>
                        </div>
                        ${dados.tipo === 'em_rota' && dados.valor_em_rota && parseFloat(dados.valor_em_rota.replace(/[^\d,]/g, '').replace(',', '.')) > 0 ? `
                        <div class="detail-item highlight" style="background: linear-gradient(135deg, rgba(255, 107, 107, 0.1) 0%, rgba(238, 90, 111, 0.1) 100%);">
                            <label>EM ROTA:</label>
                            <span class="valor-receita-detail" style="color: #FF6B6B;">${dados.valor_em_rota}</span>
                        </div>
                        ` : ''}
                        <div class="detail-item">
                            <label>Valor KM:</label>
                            <span>${dados.valor_km}</span>
                        </div>
                        <div class="detail-item">
                            <label>Valor Pedágio:</label>
                            <span>${dados.valor_pedagio}</span>
                        </div>
                        <div class="detail-item">
                            <label>Valor Hospedagem:</label>
                            <span>${dados.valor_hospedagem}</span>
                        </div>
                        <div class="detail-item">
                            <label>Valor Fluvial:</label>
                            <span>${dados.valor_fluvial}</span>
                        </div>
                        <div class="detail-item">
                            <label>Valor Outros:</label>
                            <span>${dados.valor_outros}</span>
                    </div>
                </div>
                </div>
            `;
                
            // Se for "Em Rota", mostrar itens da rota
            if (dados.tipo === 'em_rota' && dados.itens_rota && dados.itens_rota.length > 0) {
                html += `
                <div class="detail-section">
                        <h4><i class="fas fa-route"></i> Itens da Rota</h4>
                        <div class="route-items-detail">
                `;
                
                // Adicionar item "EM ROTA" se houver valor
                if (dados.valor_em_rota && parseFloat(dados.valor_em_rota.replace(/[^\d,]/g, '').replace(',', '.')) > 0) {
                    const descricaoHTML = dados.descricao_em_rota && dados.descricao_em_rota.trim() 
                        ? `<div class="route-item-info" style="margin-top: 0.5rem;">
                            <label>Descrição:</label>
                            <span>${dados.descricao_em_rota}</span>
                        </div>`
                        : '';
                    
                    html += `
                        <div class="route-item-detail-card" style="border-left: 4px solid #FF6B6B;">
                            <div class="route-item-header">
                                <h5 style="color: #FF6B6B;">EM ROTA - Forma de Pagamento</h5>
                                <span class="route-item-total" style="background: linear-gradient(135deg, #FF6B6B 0%, #EE5A6F 100%);">${dados.valor_em_rota}</span>
                            </div>
                            <div class="route-item-body">
                                <p><strong>Tipo:</strong> Pagamento EM ROTA</p>
                                ${descricaoHTML}
                            </div>
                        </div>
                    `;
                }
                
                dados.itens_rota.forEach((item, index) => {
                    // Construir informações adicionais (recebedor, PIX, cliente/empresa, CNPJ)
                    let infoAdicional = '';
                    if (item.recebedor || item.chave_pix || item.cliente_empresa || item.cnpj) {
                        infoAdicional = '<div class="route-item-info-adicional">';
                        if (item.recebedor) {
                            infoAdicional += `<div class="route-item-info"><label><i class="fas fa-user-check"></i> Recebedor:</label><span>${item.recebedor}</span></div>`;
                        }
                        if (item.chave_pix) {
                            infoAdicional += `<div class="route-item-info"><label><i class="fas fa-qrcode"></i> Chave PIX:</label><span>${item.chave_pix}</span></div>`;
                        }
                        if (item.cliente_empresa) {
                            infoAdicional += `<div class="route-item-info"><label><i class="fas fa-building"></i> Cliente/Empresa:</label><span>${item.cliente_empresa}</span></div>`;
                        }
                        if (item.cnpj) {
                            infoAdicional += `<div class="route-item-info"><label><i class="fas fa-id-card"></i> CNPJ:</label><span>${item.cnpj}</span></div>`;
                        }
                        infoAdicional += '</div>';
                    }
                    
                    html += `
                        <div class="route-item-detail-card">
                            <div class="route-item-header">
                                <h5>ID ${item.ordem}: ${item.ticket_item}</h5>
                                <span class="route-item-total">${item.valor}</span>
                            </div>
                            <div class="route-item-details">
                                <div class="route-item-info">
                                    <label>Serviço:</label>
                                    <span>${item.servico}</span>
                                </div>
                                ${infoAdicional}
                                <div class="route-item-valores">
                                    <div class="valor-detail"><label>KM:</label><span>${item.valor_km}</span></div>
                                    <div class="valor-detail"><label>Pedágio:</label><span>${item.valor_pedagio}</span></div>
                                    <div class="valor-detail"><label>Hospedagem:</label><span>${item.valor_hospedagem}</span></div>
                                    <div class="valor-detail"><label>Fluvial:</label><span>${item.valor_fluvial}</span></div>
                                    <div class="valor-detail"><label>Outros:</label><span>${item.valor_outros}</span></div>
                                </div>
                            </div>
                </div>
            `;
                });
                
                html += `
                        </div>
                    </div>
                `;
            }
            
            // Adicionar descrição se existir
            if (dados.descricao && dados.descricao !== 'N/A') {
                html += `
                    <div class="detail-section">
                        <h4><i class="fas fa-align-left"></i> Descrição</h4>
                        <div class="detail-description">
                            <p>${dados.descricao}</p>
                        </div>
                    </div>
                `;
            }
            
            content.innerHTML = html;
            
        } catch (error) {
            console.error('❌ Erro ao buscar detalhes:', error);
            content.innerHTML = `
                <div class="error-details">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Erro ao carregar detalhes da solicitação</p>
                    <p class="error-message">${error.message}</p>
                </div>
            `;
        }
        
        // Adicionar event listener para fechar modal
        const closeBtn = document.getElementById('closeDetailsModal');
        if (closeBtn) {
            closeBtn.onclick = () => {
                modal.style.display = 'none';
                modal.classList.remove('show');
            };
        }
        
        // Fechar ao clicar fora do modal
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
                modal.classList.remove('show');
            }
        };
    }

    closeModal() {
        const modal = document.getElementById('detailsModal');
        if (modal) {
            modal.classList.remove('show');
        }
    }

    toggleValoresDetalhados() {
        const colunas = document.querySelectorAll('.valores-detalhados-col');
        const toggleCells = document.querySelectorAll('.valores-detalhados-toggle-cell');
        const toggleHeader = document.querySelector('.valores-detalhados-toggle-header');
        const toggleIcon = document.getElementById('toggleIcon');
        const isVisible = colunas[0] && colunas[0].style.display !== 'none' && colunas[0].style.display !== '';
        const newDisplay = isVisible ? 'none' : 'table-cell';
        
        // Atualizar todas as colunas de valores detalhados
        colunas.forEach(col => {
            col.style.display = newDisplay;
        });
        
        // Atualizar células toggle (vazias, apenas para alinhamento)
        toggleCells.forEach(cell => {
            cell.style.display = newDisplay;
            // Garantir que está vazia
            if (cell.textContent.trim()) {
                cell.textContent = '';
            }
        });
        
        // Atualizar ícone do botão
        if (toggleIcon) {
            if (isVisible) {
                toggleIcon.classList.remove('fa-chevron-down');
                toggleIcon.classList.add('fa-chevron-right');
            } else {
                toggleIcon.classList.remove('fa-chevron-right');
                toggleIcon.classList.add('fa-chevron-down');
            }
        }
        
        // Salvar estado no localStorage
        localStorage.setItem('valoresDetalhadosExpanded', !isVisible);
        
        // Re-renderizar tabela para atualizar empty-state colspan
        this.renderTableOptimized();
    }

    initValoresDetalhados() {
        // Verificar se estava expandido anteriormente
        const wasExpanded = localStorage.getItem('valoresDetalhadosExpanded') === 'true';
        if (wasExpanded) {
            const colunas = document.querySelectorAll('.valores-detalhados-col');
            const toggleCells = document.querySelectorAll('.valores-detalhados-toggle-cell');
            const toggleIcon = document.getElementById('toggleIcon');
            
            colunas.forEach(col => {
                col.style.display = 'table-cell';
            });
            
            toggleCells.forEach(cell => {
                cell.style.display = 'table-cell';
                // Garantir que está vazia
                if (cell.textContent.trim()) {
                    cell.textContent = '';
                }
            });
            
            if (toggleIcon) {
                toggleIcon.classList.remove('fa-chevron-right');
                toggleIcon.classList.add('fa-chevron-down');
            }
        } else {
            // Se não estava expandido, garantir que as células toggle estão vazias
            const toggleCells = document.querySelectorAll('.valores-detalhados-toggle-cell');
            toggleCells.forEach(cell => {
                if (cell.textContent.trim()) {
                    cell.textContent = '';
                }
            });
        }
    }

    editItem(id) {
        console.log('Editar item:', id);
    }

    deleteItem(id) {
        if (confirm('Tem certeza que deseja excluir esta solicitação?')) {
            this.data = this.data.filter(item => item.id !== id);
            this.applyFilters();
            localStorage.setItem('kanbanCards', JSON.stringify(this.data));
        }
    }

    exportToExcel() {
        try {
            // Verificar se a biblioteca XLSX está disponível
            if (typeof XLSX === 'undefined') {
                alert('Biblioteca XLSX não carregada. Por favor, recarregue a página.');
                console.error('XLSX não encontrado');
                return;
            }

            // Pegar dados diretamente da tabela HTML apenas para os headers
            const table = document.getElementById('reportsTable');
            if (!table) {
                alert('Tabela não encontrada!');
                return;
            }

            // Coletar cabeçalhos (excluindo apenas coluna de ações e toggle de valores detalhados)
            // IMPORTANTE: Sempre incluir colunas de valores detalhados na exportação, mesmo que estejam ocultas na tela
            const headers = [];
            table.querySelectorAll('thead th').forEach(th => {
                // Pular apenas coluna de ações e toggle de valores detalhados
                if (th.classList.contains('actions-header') || th.classList.contains('valores-detalhados-toggle-header')) {
                    return;
                }
                
                // NÃO pular colunas de valores detalhados - sempre incluir na exportação
                // Mesmo que estejam ocultas na tela, devem aparecer no Excel/PDF
                
                let text = th.textContent.replace(/\s+/g, ' ').trim();
                // Remover ícones de ordenação (setas)
                text = text.replace(/↑|↓/g, '').trim();
                text = text.replace(/\s+/g, ' ').trim();
                
                // Remover texto do botão de toggle se houver
                if (text.includes('Valores Detalhados')) {
                    return; // Não incluir o cabeçalho do toggle
                }
                
                if (text && text.length > 0) {
                    headers.push(text);
                }
            });

            // Coletar dados das linhas
            const rows = [];
            const monetaryColumns = []; // Índices das colunas que contêm valores monetários
            const dateColumns = []; // Índices das colunas que contêm datas
            
            // Identificar colunas monetárias e de data pelos cabeçalhos
            headers.forEach((header, idx) => {
                const headerLower = header.toLowerCase();
                if (headerLower.includes('valor') || headerLower.includes('receita') || headerLower.includes('km') || 
                    headerLower.includes('pedágio') || headerLower.includes('pedagio') || headerLower.includes('hospedagem') || 
                    headerLower.includes('fluvial') || headerLower.includes('outros') || headerLower.includes('em rota')) {
                    monetaryColumns.push(idx);
                }
                if (headerLower.includes('data') || headerLower.includes('criação') || headerLower.includes('criacao') || 
                    headerLower.includes('pagamento')) {
                    dateColumns.push(idx);
                }
            });
            
            // Função auxiliar para extrair número de valor monetário
            function extractMonetaryValue(text) {
                if (!text) return null;
                // Remover R$, espaços, e pontos (milhares), substituir vírgula por ponto
                const cleaned = String(text).replace(/R\$\s?/g, '').replace(/\./g, '').replace(',', '.').trim();
                const num = parseFloat(cleaned);
                return isNaN(num) ? null : num;
            }
            
            // ✅ IMPORTANTE: Usar TODOS os dados filtrados, não apenas a página atual
            const allFilteredData = this.filteredData || [];
            console.log(`📊 Exportando ${allFilteredData.length} solicitações (todas as páginas)`);
            
            // Função auxiliar para obter status display
            const getStatusDisplay = (status) => {
                const statusMap = {
                    'pendente': 'Pendente',
                    'aprovado': 'Aprovado',
                    'recusado': 'Recusado',
                    'concluido': 'Concluído'
                };
                return statusMap[status?.toLowerCase()] || status || '';
            };
            
            // Função auxiliar para obter prioridade display
            const getPriorityDisplay = (priority) => {
                const priorityMap = {
                    'baixa': 'Baixa',
                    'media': 'Média',
                    'alta': 'Alta'
                };
                return priorityMap[priority?.toLowerCase()] || priority || '';
            };
            
            // Função auxiliar para formatar data
            const formatDate = (dateStr) => {
                if (!dateStr) return '';
                // Se já estiver em formato dd/mm/yyyy, retornar como está
                if (dateStr.includes('/')) return dateStr;
                // Se estiver em formato yyyy-mm-dd, converter para dd/mm/yyyy
                if (dateStr.includes('-') && dateStr.length >= 10) {
                    const parts = dateStr.split(' ')[0].split('-');
                    if (parts.length === 3) {
                        return `${parts[2]}/${parts[1]}/${parts[0]}`;
                    }
                }
                return dateStr;
            };
            
            // Coletar dados de TODOS os itens filtrados
            // Construir linha seguindo EXATAMENTE a ordem dos headers
            allFilteredData.forEach(item => {
                const row = [];
                
                // Mapear cada header para o valor correspondente do item
                headers.forEach(header => {
                    const headerLower = header.toLowerCase().trim();
                    
                    if (headerLower.includes('id')) {
                        // Usar o ticket da solicitação
                        const ticketToUse = item.ticket || item.id || '';
                        row.push(ticketToUse);
                    } else if (headerLower.includes('título') || headerLower.includes('titulo')) {
                        // Usar o título completo da solicitação (já contém todos os tickets se for agrupada)
                        // Não modificar - o backend já preparou o título com todos os tickets
                        let titleToUse = item.title || '';
                        row.push(titleToUse);
                    } else if (headerLower.includes('solicitante')) {
                        row.push(item.solicitante || '');
                    } else if (headerLower.includes('supervisor')) {
                        row.push(item.supervisor || '-');
                    } else if (headerLower.includes('recebedor')) {
                        row.push(item.recebedor || '-');
                    } else if (headerLower.includes('chave pix') || headerLower.includes('pix')) {
                        row.push(item.chavePix || '-');
                    } else if (headerLower.includes('cliente') || headerLower.includes('empresa')) {
                        row.push(item.clienteEmpresa || '-');
                    } else if (headerLower.includes('cnpj')) {
                        row.push(item.cnpj || '-');
                    } else if (headerLower.includes('serviço') || headerLower.includes('servico')) {
                        let serviceName = '';
                        if (item.service) {
                            const serviceSelect = document.getElementById('serviceFilter');
                            if (serviceSelect) {
                                const serviceOption = Array.from(serviceSelect.options).find(opt => opt.value == item.service);
                                serviceName = serviceOption ? serviceOption.text : item.service;
                            } else {
                                serviceName = item.service;
                            }
                        } else {
                            serviceName = 'N/A';
                        }
                        row.push(serviceName);
                    } else if (headerLower.includes('valor total')) {
                        const valorTotal = item.valor || '';
                        const valorNum = extractMonetaryValue(valorTotal);
                        if (valorNum !== null) {
                            row.push({ value: valorNum, type: 'monetary' });
                        } else {
                            row.push(valorTotal || '');
                        }
                    } else if (headerLower.includes('receita')) {
                        const valorReceitaNum = extractMonetaryValue(item.valorReceita || '');
                        if (valorReceitaNum !== null) {
                            row.push({ value: valorReceitaNum, type: 'monetary' });
                        } else {
                            row.push(item.valorReceita || '');
                        }
                    } else if (headerLower.includes('em rota')) {
                        const valorEmRotaNum = extractMonetaryValue(item.valorEmRota || '');
                        if (valorEmRotaNum !== null) {
                            row.push({ value: valorEmRotaNum, type: 'monetary' });
                        } else {
                            row.push(item.valorEmRota || '');
                        }
                    } else if (headerLower.includes('km') && !headerLower.includes('valor km')) {
                        // Coluna KM (sem "valor" no nome, para evitar conflito)
                        const valorKmNum = extractMonetaryValue(item.valorKm || '');
                        if (valorKmNum !== null) {
                            row.push({ value: valorKmNum, type: 'monetary' });
                        } else {
                            row.push(item.valorKm || 'R$ 0,00');
                        }
                    } else if (headerLower.includes('pedágio') || headerLower.includes('pedagio')) {
                        const valorPedagioNum = extractMonetaryValue(item.valorPedagio || '');
                        if (valorPedagioNum !== null) {
                            row.push({ value: valorPedagioNum, type: 'monetary' });
                        } else {
                            row.push(item.valorPedagio || 'R$ 0,00');
                        }
                    } else if (headerLower.includes('hospedagem')) {
                        const valorHospedagemNum = extractMonetaryValue(item.valorHospedagem || '');
                        if (valorHospedagemNum !== null) {
                            row.push({ value: valorHospedagemNum, type: 'monetary' });
                        } else {
                            row.push(item.valorHospedagem || 'R$ 0,00');
                        }
                    } else if (headerLower.includes('fluvial')) {
                        const valorFluvialNum = extractMonetaryValue(item.valorFluvial || '');
                        if (valorFluvialNum !== null) {
                            row.push({ value: valorFluvialNum, type: 'monetary' });
                        } else {
                            row.push(item.valorFluvial || 'R$ 0,00');
                        }
                    } else if (headerLower.includes('outros')) {
                        const valorOutrosNum = extractMonetaryValue(item.valorOutros || '');
                        if (valorOutrosNum !== null) {
                            row.push({ value: valorOutrosNum, type: 'monetary' });
                        } else {
                            row.push(item.valorOutros || 'R$ 0,00');
                        }
                    } else if (headerLower.includes('status')) {
                        row.push(getStatusDisplay(item.status));
                    } else if (headerLower.includes('prioridade')) {
                        row.push(getPriorityDisplay(item.priority));
                    } else if (headerLower.includes('criação') || headerLower.includes('criacao')) {
                        row.push(formatDate(item.dataCriacao || ''));
                    } else if (headerLower.includes('pagamento')) {
                        row.push(formatDate(item.dataPagamento || ''));
                    } else {
                        // Para qualquer outro header não mapeado, adicionar string vazia
                        row.push('');
                    }
                });
                
                // Garantir que a linha tenha exatamente o mesmo número de colunas dos headers
                if (row.length === headers.length && row.length > 0) {
                    rows.push(row);
                }
            });

            // Função auxiliar para formatar data (definir antes de usar)
            const formatDateForHeader = (dateStr) => {
                if (!dateStr) return '';
                // Se já estiver em formato dd/mm/yyyy, retornar como está
                if (dateStr.includes('/')) return dateStr;
                // Se estiver em formato yyyy-mm-dd, converter para dd/mm/yyyy
                if (dateStr.includes('-') && dateStr.length >= 10) {
                    const parts = dateStr.split(' ')[0].split('-');
                    if (parts.length === 3) {
                        return `${parts[2]}/${parts[1]}/${parts[0]}`;
                    }
                }
                return dateStr;
            };
            
            // Preparar dados para o worksheet com formatação de relatório profissional
            const wsData = [];
            
            // ========== CABEÇALHO DO RELATÓRIO ==========
            // Linha 1: Título do Relatório (vazio nas outras colunas)
            const titleRow = ['RELATÓRIO FINANCEIRO'];
            for (let i = 1; i < headers.length; i++) titleRow.push('');
            wsData.push(titleRow);
            
            // Linha 2: Data de geração
            const now = new Date();
            const dateStr = now.toLocaleDateString('pt-BR', { 
                day: '2-digit', 
                month: '2-digit', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            const dateRow = [`Gerado em: ${dateStr}`];
            for (let i = 1; i < headers.length; i++) dateRow.push('');
            wsData.push(dateRow);
            
            // Linha 3: Informações do filtro aplicado
            const filterInfo = [];
            const activeFilters = [];
            if (this.currentFilters.status !== 'all') activeFilters.push(`Status: ${this.currentFilters.status}`);
            if (this.currentFilters.tipo !== 'all') activeFilters.push(`Tipo: ${this.currentFilters.tipo}`);
            if (this.currentFilters.dateFrom) {
                const dateFromFormatted = formatDateForHeader(this.currentFilters.dateFrom);
                activeFilters.push(`De: ${dateFromFormatted}`);
            }
            if (this.currentFilters.dateTo) {
                const dateToFormatted = formatDateForHeader(this.currentFilters.dateTo);
                activeFilters.push(`Até: ${dateToFormatted}`);
            }
            if (this.currentFilters.service) {
                const serviceSelect = document.getElementById('serviceFilter');
                if (serviceSelect) {
                    const serviceOption = Array.from(serviceSelect.options).find(opt => opt.value == this.currentFilters.service);
                    if (serviceOption) activeFilters.push(`Serviço: ${serviceOption.text}`);
                }
            }
            if (this.currentFilters.priority) activeFilters.push(`Prioridade: ${this.currentFilters.priority}`);
            if (this.currentFilters.search) activeFilters.push(`Busca: ${this.currentFilters.search}`);
            
            const filterRow = [activeFilters.length > 0 ? `Filtros aplicados: ${activeFilters.join(' | ')}` : 'Todos os registros'];
            for (let i = 1; i < headers.length; i++) filterRow.push('');
            wsData.push(filterRow);
            
            // Linha 4: Vazia (espaçamento)
            wsData.push([]);
            
            // Linha 5: Cabeçalhos das colunas
            wsData.push(headers);
            
            // ========== DADOS ==========
            // Adicionar linhas de dados
            rows.forEach(row => {
                const processedRow = row.map(cell => {
                    if (typeof cell === 'object' && cell.type === 'monetary') {
                        return cell.value;
                    }
                    return cell;
                });
                wsData.push(processedRow);
            });
            
            // ========== RODAPÉ COM ESTATÍSTICAS ==========
            // Linha vazia
            wsData.push([]);
            
            // Linha de totais
            const totalRow = [];
            // Encontrar índice da coluna "Valor Total"
            const valorTotalColIdx = headers.findIndex(h => h.toLowerCase().includes('valor total'));
            
            for (let i = 0; i < headers.length; i++) {
                if (i === valorTotalColIdx && valorTotalColIdx >= 0) {
                    // Calcular total dos valores monetários
                    const total = rows.reduce((sum, row) => {
                        if (i < row.length) {
                            const cell = row[i];
                            if (typeof cell === 'object' && cell.type === 'monetary') {
                                return sum + (cell.value || 0);
                            }
                        }
                        return sum;
                    }, 0);
                    totalRow.push(i === 0 ? 'TOTAIS' : (i === valorTotalColIdx ? total : ''));
                } else {
                    totalRow.push(i === 0 ? 'TOTAIS' : '');
                }
            }
            wsData.push(totalRow);
            
            // Linha de estatísticas
            const statsRow = ['ESTATÍSTICAS'];
            for (let i = 1; i < headers.length; i++) statsRow.push('');
            wsData.push(statsRow);
            
            // Contadores por status
            const aprovadas = rows.filter(row => {
                const statusIdx = headers.findIndex(h => h.toLowerCase().includes('status'));
                return statusIdx >= 0 && row[statusIdx]?.toLowerCase() === 'aprovado';
            }).length;
            
            const recusadas = rows.filter(row => {
                const statusIdx = headers.findIndex(h => h.toLowerCase().includes('status'));
                return statusIdx >= 0 && row[statusIdx]?.toLowerCase() === 'recusado';
            }).length;
            
            const pendentes = rows.filter(row => {
                const statusIdx = headers.findIndex(h => h.toLowerCase().includes('status'));
                return statusIdx >= 0 && row[statusIdx]?.toLowerCase() === 'pendente';
            }).length;
            
            const concluidas = rows.filter(row => {
                const statusIdx = headers.findIndex(h => h.toLowerCase().includes('status'));
                return statusIdx >= 0 && row[statusIdx]?.toLowerCase() === 'concluído';
            }).length;
            
            wsData.push(['Total de Registros:', rows.length, '', '', '', '', '', '', '', '', '', '', '', '']);
            wsData.push(['Aprovadas:', aprovadas, '', '', '', '', '', '', '', '', '', '', '', '']);
            wsData.push(['Recusadas:', recusadas, '', '', '', '', '', '', '', '', '', '', '', '']);
            wsData.push(['Pendentes:', pendentes, '', '', '', '', '', '', '', '', '', '', '', '']);
            wsData.push(['Concluídas:', concluidas, '', '', '', '', '', '', '', '', '', '', '', '']);
            
            // Criar workbook
            const wb = XLSX.utils.book_new();
            
            // Converter dados para worksheet
            const ws = XLSX.utils.aoa_to_sheet(wsData);
            
            // Configurar larguras de colunas
            const colWidths = headers.map((header) => {
                const headerLower = header.toLowerCase();
                // Larguras baseadas no tipo de conteúdo
                if (headerLower.includes('valor') || headerLower.includes('receita') || headerLower.includes('km') || 
                    headerLower.includes('pedágio') || headerLower.includes('pedagio') || headerLower.includes('hospedagem') || 
                    headerLower.includes('fluvial') || headerLower.includes('outros') || headerLower.includes('em rota')) {
                    return { wch: 18 };
                } else if (headerLower.includes('data') || headerLower.includes('criação') || headerLower.includes('criacao') || 
                          headerLower.includes('pagamento')) {
                    return { wch: 12 };
                } else if (headerLower.includes('status') || headerLower.includes('prioridade')) {
                    return { wch: 12 };
                } else if (headerLower.includes('id') || headerLower.includes('título') || headerLower.includes('titulo')) {
                    return { wch: 15 };
                } else {
                    return { wch: 20 };
                }
            });
            ws['!cols'] = colWidths;
            
            // Aplicar formatação aos valores monetários
            // Cabeçalho está na linha 4 (índice 4), dados começam na linha 5 (índice 5)
            rows.forEach((row, rowIdx) => {
                row.forEach((cell, colIdx) => {
                    if (typeof cell === 'object' && cell.type === 'monetary') {
                        // Linha de dados = linha 5 (índice 4) + rowIdx + 1
                        const cellAddress = XLSX.utils.encode_cell({ r: 4 + rowIdx + 1, c: colIdx });
                        const cellObj = ws[cellAddress];
                        if (cellObj && typeof cellObj.v === 'number') {
                            // Formato monetário brasileiro: R$ 1.234,56
                            cellObj.z = '"R$"#,##0.00';
                            cellObj.t = 'n';
                        }
                    }
                });
            });
            
            // Formatar linha de totais (última linha antes das estatísticas)
            const totalRowIdx = wsData.length - 6; // Índice da linha de totais
            headers.forEach((header, colIdx) => {
                const headerLower = header.toLowerCase();
                if (headerLower.includes('valor total')) {
                    const cellAddress = XLSX.utils.encode_cell({ r: totalRowIdx, c: colIdx });
                        const cellObj = ws[cellAddress];
                        if (cellObj && typeof cellObj.v === 'number') {
                            cellObj.z = '"R$"#,##0.00';
                            cellObj.t = 'n';
                        }
                    }
            });
            
            // Congelar linha de cabeçalho (linha 5, índice 4)
            ws['!freeze'] = { xSplit: 0, ySplit: 4, topLeftCell: 'A5', activePane: 'bottomLeft', state: 'frozen' };
            
            // Auto-filtrar na linha de cabeçalho (linha 5)
            const dataEndRow = 4 + rows.length; // Linha final dos dados
            ws['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: 4, c: 0 }, e: { r: dataEndRow, c: headers.length - 1 } }) };
            
            // Adicionar worksheet ao workbook
            XLSX.utils.book_append_sheet(wb, ws, "Relatórios Financeiros");
            
            // Gerar arquivo e fazer download
            const dateStrFile = now.toISOString().split('T')[0];
            const fileName = `Relatorio_Financeiro_${dateStrFile}.xlsx`;
            
            XLSX.writeFile(wb, fileName);
            
            // Mostrar mensagem de sucesso
            this.showNotification(`Relatório Excel exportado com sucesso! ${rows.length} registros exportados.`, 'success');
            
        } catch (error) {
            console.error('Erro ao exportar para Excel:', error);
            alert('Erro ao exportar para Excel: ' + error.message);
        }
    }

    exportToPDF() {
        try {
            // Verificar se jsPDF está disponível
            if (typeof window.jspdf === 'undefined') {
                alert('Biblioteca jsPDF não carregada. Por favor, recarregue a página.');
                console.error('jsPDF não encontrado');
                return;
            }

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('landscape', 'mm', 'a4');

            // Cores e estilos
            const primaryColor = [255, 203, 87]; // #FFCB57
            const darkColor = [84, 67, 80]; // #544350
            const lightGray = [245, 245, 245];
            
            // Título do relatório
            doc.setFillColor(...primaryColor);
            doc.rect(10, 10, 277, 15, 'F');
            doc.setTextColor(28, 28, 28);
            doc.setFontSize(20);
            doc.setFont('helvetica', 'bold');
            doc.text('Relatórios Financeiros', 148.5, 20, { align: 'center' });
            
            // Data de geração
            doc.setFontSize(10);
            doc.setTextColor(84, 67, 80);
            const now = new Date();
            const dateStr = now.toLocaleDateString('pt-BR', { 
                day: '2-digit', 
                month: '2-digit', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            doc.text(`Gerado em: ${dateStr}`, 148.5, 32, { align: 'center' });

            // Headers da tabela - Incluir todas as colunas, incluindo valores detalhados
            // Ajustar larguras para caber na página A4 landscape (297mm - 20mm de margem = 277mm)
            const headers = ['ID', 'Título', 'Solicitante', 'Supervisor', 'Recebedor', 'Chave PIX', 'Cliente/Empresa', 'CNPJ', 'Serviço', 'Valor Total', 'Receita', 'EM ROTA', 'KM', 'Pedágio', 'Hospedagem', 'Fluvial', 'Outros', 'Status', 'Prioridade', 'Criação', 'Pagamento'];
            // Larguras ajustadas para caber na página (total ~277mm)
            const colWidths = [12, 25, 18, 18, 18, 22, 22, 18, 18, 15, 15, 15, 12, 12, 15, 12, 12, 12, 12, 15, 15];
            
            let startY = 40;
            let currentY = startY;
            
            // Definir altura da linha
            const lineHeight = 8;
            
            // Adicionar cabeçalhos
            doc.setFillColor(...primaryColor);
            doc.rect(10, currentY, 277, lineHeight, 'F');
            doc.setTextColor(28, 28, 28);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            
            let currentX = 10;
            headers.forEach((header, index) => {
                doc.text(header, currentX + 2, currentY + 5);
                currentX += colWidths[index];
            });
            
            currentY += lineHeight;
            
            // Adicionar linhas de dados
            doc.setFontSize(7);
            doc.setFont('helvetica', 'normal');
            
            // ✅ IMPORTANTE: Usar TODOS os dados filtrados, não apenas a página atual
            const allFilteredData = this.filteredData || [];
            console.log(`📊 Exportando ${allFilteredData.length} solicitações para PDF (todas as páginas)`);
            
            // Funções auxiliares
            const getStatusDisplay = (status) => {
                const statusMap = {
                    'pendente': 'Pendente',
                    'aprovado': 'Aprovado',
                    'recusado': 'Recusado',
                    'concluido': 'Concluído'
                };
                return statusMap[status?.toLowerCase()] || status || '';
            };
            
            const getPriorityDisplay = (priority) => {
                const priorityMap = {
                    'baixa': 'Baixa',
                    'media': 'Média',
                    'alta': 'Alta'
                };
                return priorityMap[priority?.toLowerCase()] || priority || '';
            };
            
            const formatDate = (dateStr) => {
                if (!dateStr) return '';
                if (dateStr.includes('/')) return dateStr;
                if (dateStr.includes('-') && dateStr.length >= 10) {
                    const parts = dateStr.split(' ')[0].split('-');
                    if (parts.length === 3) {
                        return `${parts[2]}/${parts[1]}/${parts[0]}`;
                    }
                }
                return dateStr;
            };
            
            allFilteredData.forEach((item, rowIndex) => {
                // Verificar se precisa de nova página
                if (currentY > 180) {
                    doc.addPage('landscape', 'a4');
                    currentY = 10;
                    
                    // Re-impressão do cabeçalho
                    doc.setFillColor(...primaryColor);
                    doc.rect(10, currentY, 277, lineHeight, 'F');
                    doc.setTextColor(28, 28, 28);
                    doc.setFontSize(9);
                    doc.setFont('helvetica', 'bold');
                    
                    let headerX = 10;
                    headers.forEach((header, index) => {
                        doc.text(header, headerX + 2, currentY + 5);
                        headerX += colWidths[index];
                    });
                    
                    currentY += lineHeight;
                    doc.setFontSize(7);
                    doc.setFont('helvetica', 'normal');
                }
                
                // Cor de fundo alternada
                if (rowIndex % 2 === 0) {
                    doc.setFillColor(...lightGray);
                    doc.rect(10, currentY, 277, lineHeight, 'F');
                }
                
                // Dados da linha - construir a partir de item
                let cellX = 10;
                let colIndex = 0;
                
                // Construir linha na ordem completa: ID, Título, Solicitante, Supervisor, Recebedor, Chave PIX, Cliente/Empresa, CNPJ, Serviço, Valor Total, Receita, EM ROTA, KM, Pedágio, Hospedagem, Fluvial, Outros, Status, Prioridade, Criação, Pagamento
                const extractMonetaryValue = (text) => {
                    if (!text) return 'R$ 0,00';
                    return text;
                };
                
                const rowData = [
                    item.ticket || item.id || '',
                    (item.title || '').substring(0, 30),
                    (item.solicitante || '').substring(0, 20),
                    (item.supervisor || '-').substring(0, 20),
                    (item.recebedor || '-').substring(0, 20),
                    (item.chavePix || '-').substring(0, 25),
                    (item.clienteEmpresa || '-').substring(0, 25),
                    (item.cnpj || '-').substring(0, 20),
                    (item.service || 'N/A').substring(0, 20),
                    item.valor || 'R$ 0,00',
                    item.valorReceita || 'R$ 0,00',
                    item.valorEmRota || 'R$ 0,00',
                    item.valorKm || 'R$ 0,00',
                    item.valorPedagio || 'R$ 0,00',
                    item.valorHospedagem || 'R$ 0,00',
                    item.valorFluvial || 'R$ 0,00',
                    item.valorOutros || 'R$ 0,00',
                    getStatusDisplay(item.status),
                    getPriorityDisplay(item.priority),
                    formatDate(item.dataCriacao || ''),
                    formatDate(item.dataPagamento || '')
                ];
                
                rowData.forEach((cellValue, idx) => {
                    if (colIndex < colWidths.length) {
                    // Truncar texto muito longo
                        const maxLength = colWidths[colIndex] / 2;
                        if (cellValue && cellValue.length > maxLength) {
                        cellValue = cellValue.substring(0, maxLength - 3) + '...';
                    }
                    
                    doc.setTextColor(84, 67, 80);
                        doc.text(cellValue || '', cellX + 2, currentY + 5);
                        cellX += colWidths[colIndex];
                        colIndex++;
                    }
                });
                
                currentY += lineHeight;
            });
            
            // Rodapé
            const finalY = currentY + 5;
            doc.setDrawColor(...darkColor);
            doc.setLineWidth(0.5);
            doc.line(10, finalY, 287, finalY);
            
            doc.setTextColor(84, 67, 80);
            doc.setFontSize(8);
            doc.text(`Total de solicitações: ${allFilteredData.length}`, 10, finalY + 8);
            doc.text('Sistema de Gestão Financeira - Attend Finance', 148.5, finalY + 8, { align: 'center' });
            doc.text('Página ' + doc.internal.getCurrentPageInfo().pageNumber, 280, finalY + 8, { align: 'right' });
            
            // Salvar PDF
            const dateStrFile = now.toISOString().split('T')[0];
            const fileName = `relatorios_financeiros_${dateStrFile}.pdf`;
            doc.save(fileName);
            
            // Mostrar mensagem de sucesso
            this.showNotification('Arquivo PDF exportado com sucesso!', 'success');
            
        } catch (error) {
            console.error('Erro ao exportar para PDF:', error);
            alert('Erro ao exportar para PDF: ' + error.message);
        }    }

    // Funções CSV removidas - usando apenas XLSX formatado

    // Métodos auxiliares otimizados
    getServiceName(service) {
        const services = {
            'consultoria_TI': 'Consultoria em TI',
            'desenvolvimento': 'Desenvolvimento de Software',
            'manutencao_equipamentos': 'Manutenção de Equipamentos',
            'treinamento_corporativo': 'Treinamento Corporativo'
        };
        return services[service] || service;
    }

    getStatusName(status) {
        const statuses = {
            'pendente': 'Pendente',
            'aprovado': 'Aprovado',
            'recusado': 'Recusado',
            'concluido': 'Concluído'
        };
        return statuses[status] || status;
    }

    getPriorityName(priority) {
        const priorities = {
            'baixa': 'Baixa',
            'media': 'Média',
            'alta': 'Alta'
        };
        return priorities[priority] || priority;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    }

    showNotification(message, type = 'info') {
        // Criar elemento de notificação
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 10000;
            font-weight: 500;
            animation: slideInRight 0.3s ease;
        `;
        notification.textContent = message;
        
        // Adicionar ao body
        document.body.appendChild(notification);
        
        // Remover após 3 segundos
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
        
        // Adicionar animações CSS se não existirem
        if (!document.getElementById('notificationStyles')) {
            const style = document.createElement('style');
            style.id = 'notificationStyles';
            style.textContent = `
                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                @keyframes slideOutRight {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    // Verificar se estamos na página de relatórios
    if (document.querySelector('.reports-fullscreen')) {
        // Evitar múltiplas inicializações
        if (!window.relatoriosOptimized) {
        window.relatoriosOptimized = new RelatoriosOptimized();
        }
    }
});
