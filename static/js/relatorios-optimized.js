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
            tipo: 'all',            dateFrom: '',
            dateTo: '',
            service: '',
            priority: '',
            search: ''
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
        
        // ✅ NÃO renderizar inicialmente - usar dados do Django
        // Apenas atualizar estatísticas e info
        this.updateTableInfo();
        // this.updateStats(); // Deixar as estatísticas do Django
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
        const data = [];
        
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
                
                // Encontrar índice correto das células (considerando colunas adicionais)
                // Estrutura: ID(0), Título(1), Solicitante(2), Recebedor(3), Serviço(4), Valor(5), 
                // [Toggle Cell(6)], [Receita(7)], [EM ROTA(8)], [KM(9)], [Pedágio(10)], [Hospedagem(11)], [Fluvial(12)], [Outros(13)], 
                // Status(14), Prioridade(15), Criação(16), Pagamento(17), Ações(18)
                let statusIdx = 14, priorityIdx = 15, dataCriacaoIdx = 16, dataPagamentoIdx = 17;
                
                // Se não há colunas de valores detalhados visíveis, ajustar índices
                if (valoresCells.length === 0) {
                    statusIdx = 6;
                    priorityIdx = 7;
                    dataCriacaoIdx = 8;
                    dataPagamentoIdx = 9;
                }
                
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
                let service = row.dataset.service || '';
                if (!service) {
                    const serviceText = cells[4]?.textContent.trim() || '';
                    const serviceMap = {
                        'Consultoria em TI': 'consultoria_TI',
                        'Desenvolvimento de Software': 'desenvolvimento',
                        'Manutenção de Equipamentos': 'manutencao_equipamentos',
                        'Treinamento Corporativo': 'treinamento_corporativo'
                    };
                    service = serviceMap[serviceText] || serviceText.toLowerCase().replace(/\s+/g, '_');
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
                const ticket = cells[0]?.textContent.trim() || '';
                
                data.push({
                    id: rowId || ticket, // Usar ID numérico se disponível, senão usar ticket
                    ticket: ticket, // Manter ticket separado para exibição
                    title: cells[1]?.textContent.trim() || '',
                    solicitante: cells[2]?.textContent.trim() || '',
                    recebedor: cells[3]?.textContent.trim() || '',
                    service: service,
                    valor: cells[5]?.textContent.trim() || '',
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
                    dataCriacao: parseDate(cells[dataCriacaoIdx]?.textContent.trim() || ''),
                    dataPagamento: parseDate(cells[dataPagamentoIdx]?.textContent.trim() || ''),
                });
            }
        });
        
        console.log(`✅ Carregadas ${data.length} solicitações reais do banco de dados`);
        console.log('📊 Dados carregados:', data);
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
            this.debouncedApplyFilters();
        });

        document.getElementById('dateTo')?.addEventListener('change', () => {
            this.currentFilters.dateTo = document.getElementById('dateTo').value;
            this.debouncedApplyFilters();
        });

        // Filtro de serviço
        document.getElementById('serviceFilter')?.addEventListener('change', () => {
            this.currentFilters.service = document.getElementById('serviceFilter').value;
            this.debouncedApplyFilters();
        });

        // Filtro de prioridade
        document.getElementById('priorityFilter')?.addEventListener('change', () => {
            this.currentFilters.priority = document.getElementById('priorityFilter').value;
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

        document.getElementById('exportCSV')?.addEventListener('click', () => {
            this.exportToCSV();
        });

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
            this.applyFilters();
        }, 150); // Reduzido de 300ms para 150ms
    }

    applyFilters() {
        const startTime = performance.now();
        
        this.filteredData = this.data.filter(item => {
            // Filtro de status
            if (this.currentFilters.status !== 'all') {
                const itemStatus = (item.status || '').toLowerCase();
                const filterStatus = (this.currentFilters.status || '').toLowerCase();
                if (itemStatus !== filterStatus) {
                    return false;
                }
            }

            // Filtro de tipo
            if (this.currentFilters.tipo !== 'all') {
                const itemTipo = (item.tipo || '').toLowerCase();
                const filterTipo = (this.currentFilters.tipo || '').toLowerCase();
                if (itemTipo !== filterTipo) {
                    return false;
                }
            }
            // Filtro de data
            if (this.currentFilters.dateFrom && item.dataCriacao) {
                const itemDate = new Date(item.dataCriacao);
                const filterDateFrom = new Date(this.currentFilters.dateFrom);
                if (isNaN(itemDate.getTime()) || itemDate < filterDateFrom) {
                    return false;
                }
            }
            if (this.currentFilters.dateTo && item.dataCriacao) {
                const itemDate = new Date(item.dataCriacao);
                const filterDateTo = new Date(this.currentFilters.dateTo);
                // Adicionar 1 dia para incluir o dia final completo
                filterDateTo.setHours(23, 59, 59, 999);
                if (isNaN(itemDate.getTime()) || itemDate > filterDateTo) {
                    return false;
                }
            }

            // Filtro de serviço
            if (this.currentFilters.service && item.service) {
                const itemService = (item.service || '').toLowerCase().trim();
                const filterService = (this.currentFilters.service || '').toLowerCase().trim();
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

            // Filtro de busca
            if (this.currentFilters.search) {
                const searchTerm = this.currentFilters.search;
                const searchableText = `${item.id} ${item.title} ${item.solicitante} ${item.recebedor}`.toLowerCase();
                if (!searchableText.includes(searchTerm)) {
                    return false;
                }
            }

            return true;
        });

        this.currentPage = 1;
        this.renderTableOptimized();
        this.updateStats();
        
        const endTime = performance.now();
        console.log(`Filtros aplicados em ${(endTime - startTime).toFixed(2)}ms`);
    }

    clearFilters() {
        this.currentFilters = {
            status: 'all',
            tipo: 'all',            dateFrom: '',
            dateTo: '',
            service: '',
            priority: '',
            search: ''
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

        if (dateFrom) dateFrom.value = '';
        if (dateTo) dateTo.value = '';
        if (serviceFilter) serviceFilter.value = '';
        if (priorityFilter) priorityFilter.value = '';
        if (searchInput) searchInput.value = '';

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
            row.setAttribute('data-id', item.id || '');            row.innerHTML = this.getRowHTML(item);
            fragment.appendChild(row);
        });

        // Limpar e adicionar todas as linhas de uma vez
        tbody.innerHTML = '';
        // Se não houver dados filtrados, mostrar mensagem de estado vazio
        if (pageData.length === 0) {
            const emptyRow = document.createElement('tr');
            emptyRow.className = 'empty-state';
            const isExpanded = localStorage.getItem('valoresDetalhadosExpanded') === 'true';
            const colspan = isExpanded ? 18 : 11;
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
            <td>${item.recebedor}</td>
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
        
        if (totalRecords) totalRecords.textContent = `Total: ${this.data.length}`;
        if (filteredRecords) filteredRecords.textContent = `Filtrados: ${this.filteredData.length}`;
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
            // Pegar dados diretamente da tabela HTML
            const table = document.getElementById('reportsTable');
            if (!table) {
                alert('Tabela não encontrada!');
                return;
            }

            let csvContent = '\uFEFF'; // UTF-8 BOM para Excel
            const delimiter = ';'; // Usar ponto e vírgula para Excel brasileiro
            
            // Pegar cabeçalhos (excluindo coluna de ações)
            const headers = [];
            table.querySelectorAll('thead th').forEach(th => {
                // Pular coluna de ações
                if (th.classList.contains('actions-header')) {
                    return;
                }
                
                let text = th.textContent.replace(/\s+/g, ' ').trim();
                
                // Remover ícones de ordenação (setas)
                text = text.replace(/↑|↓/g, '').trim();
                
                // Remover espaços extras e quebras de linha
                text = text.replace(/\s+/g, ' ').trim();
                
                // Se contém delimitador, vírgula ou aspas, envolver em aspas
                if (text.includes(delimiter) || text.includes(',') || text.includes('"') || text.includes('\n')) {
                    text = '"' + text.replace(/"/g, '""') + '"';
                }
                
                if (text && text.length > 0) {
                    headers.push(text);
                }
            });
            csvContent += headers.join(delimiter) + '\n';

            // Pegar dados das linhas
            table.querySelectorAll('tbody tr:not(.empty-state)').forEach(tr => {
                const row = [];
                tr.querySelectorAll('td').forEach((td, index) => {
                    // Se for a coluna de ações, pular
                    if (td.classList.contains('actions-cell')) {
                        return;
                    }
                    
                    let cellValue = td.textContent.trim();
                    
                    // Remover espaços extras e quebras de linha
                    cellValue = cellValue.replace(/\s+/g, ' ').trim();
                    
                    // Limpar valores de status e prioridade (remover badges)
                    if (td.querySelector('.status-badge')) {
                        cellValue = td.querySelector('.status-badge').textContent.trim();
                    } else if (td.querySelector('.priority-badge')) {
                        cellValue = td.querySelector('.priority-badge').textContent.trim();
                    }
                    
                    // Para valores monetários, manter formato original
                    // Não precisa envolver em aspas se não contiver delimitador
                    
                    // Se contém delimitador, vírgula, aspas ou quebra de linha, envolver em aspas e escapar aspas
                    if (cellValue.includes(delimiter) || cellValue.includes(',') || cellValue.includes('"') || cellValue.includes('\n')) {
                        cellValue = '"' + cellValue.replace(/"/g, '""') + '"';
                    }
                    
                    row.push(cellValue || ''); // Garantir que sempre tenha um valor
                });
                
                // Só adicionar linha se tiver dados (não vazia)
                if (row.length > 0) {
                    csvContent += row.join(delimiter) + '\n';
                }
            });

            // Criar blob e download
            // Usar CSV com encoding UTF-8 BOM e ponto e vírgula como delimitador
            const blob = new Blob([csvContent], { 
                type: 'text/csv;charset=utf-8;' 
            });
            const link = document.createElement('a');
            const dateStr = new Date().toISOString().split('T')[0];
            const fileName = `relatorios_financeiros_${dateStr}.csv`;
            link.href = URL.createObjectURL(blob);
            link.download = fileName;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            
            // Limpar após um tempo
            setTimeout(() => {
                document.body.removeChild(link);
                URL.revokeObjectURL(link.href);
            }, 100);
            
            // Mostrar mensagem de sucesso
            this.showNotification('Arquivo Excel exportado com sucesso!', 'success');
            
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

            // Headers da tabela
            const headers = ['ID', 'Título', 'Solicitante', 'Recebedor', 'Serviço', 'Valor', 'Status', 'Prioridade', 'Criação', 'Pagamento'];
            const colWidths = [20, 40, 30, 30, 30, 25, 20, 20, 25, 25];
            
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
            
            // Pegar dados da tabela HTML
            const table = document.getElementById('reportsTable');
            const rows = table.querySelectorAll('tbody tr:not(.empty-state)');
            
            rows.forEach((row, rowIndex) => {
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
                
                // Dados da linha
                const cells = row.querySelectorAll('td');
                let cellX = 10;
                
                cells.forEach((cell, cellIndex) => {
                    if (cell.classList.contains('actions-cell')) {
                        return; // Pular célula de ações
                    }
                    
                    let cellValue = cell.textContent.trim();
                    
                    // Extrair texto dos badges
                    const statusBadge = cell.querySelector('.status-badge');
                    const priorityBadge = cell.querySelector('.priority-badge');
                    if (statusBadge) {
                        cellValue = statusBadge.textContent.trim();
                    } else if (priorityBadge) {
                        cellValue = priorityBadge.textContent.trim();
                    }
                    
                    // Truncar texto muito longo
                    const maxLength = headers[cellIndex].length * 2;
                    if (cellValue.length > maxLength) {
                        cellValue = cellValue.substring(0, maxLength - 3) + '...';
                    }
                    
                    doc.setTextColor(84, 67, 80);
                    doc.text(cellValue, cellX + 2, currentY + 5);
                    cellX += colWidths[cellIndex];
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
            doc.text(`Total de solicitações: ${rows.length}`, 10, finalY + 8);
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

    exportToCSV() {
        const csvContent = this.generateCSV();
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `relatorios_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    }

    generateCSV() {
        const headers = ['ID', 'Título', 'Solicitante', 'Recebedor', 'Serviço', 'Valor', 'Status', 'Prioridade', 'Data Criação', 'Data Pagamento'];
        const rows = this.filteredData.map(item => [
            item.id,
            item.title,
            item.solicitante,
            item.recebedor,
            this.getServiceName(item.service),
            item.valor,
            this.getStatusName(item.status),
            this.getPriorityName(item.priority),
            this.formatDate(item.dataCriacao),
            this.formatDate(item.dataPagamento)
        ]);

        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

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
        window.relatoriosOptimized = new RelatoriosOptimized();
    }
});
