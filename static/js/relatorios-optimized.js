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
            dateFrom: '',
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
        
        // Colapsar filtros por padrão para dar mais espaço à tabela
        const filtersToggle = document.getElementById('filtersToggle');
        const filtersContent = document.getElementById('filtersContent');
        if (filtersToggle && filtersContent) {
            filtersToggle.classList.add('collapsed');
            filtersContent.classList.add('collapsed');
        }
        
        this.renderTableOptimized();
        this.updateStats();
    }

    async loadDataAsync() {
        try {
            // Mostrar indicador de carregamento
            this.showLoadingIndicator();
            
            // Simular carregamento assíncrono
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Carregar dados do localStorage ou gerar dados
            const savedData = localStorage.getItem('kanbanCards');
            if (savedData) {
                this.data = JSON.parse(savedData);
            } else {
                this.data = this.generateSampleDataOptimized();
            }
            
            this.filteredData = [...this.data];
            
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            this.data = this.generateSampleDataOptimized();
            this.filteredData = [...this.data];
        } finally {
            this.hideLoadingIndicator();
        }
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
    }

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
            if (this.currentFilters.status !== 'all' && item.status !== this.currentFilters.status) {
                return false;
            }

            // Filtro de data
            if (this.currentFilters.dateFrom && item.dataCriacao < this.currentFilters.dateFrom) {
                return false;
            }
            if (this.currentFilters.dateTo && item.dataCriacao > this.currentFilters.dateTo) {
                return false;
            }

            // Filtro de serviço
            if (this.currentFilters.service && item.service !== this.currentFilters.service) {
                return false;
            }

            // Filtro de prioridade
            if (this.currentFilters.priority && item.priority !== this.currentFilters.priority) {
                return false;
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
            dateFrom: '',
            dateTo: '',
            service: '',
            priority: '',
            search: ''
        };

        // Resetar UI
        document.querySelectorAll('.status-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector('[data-status="all"]')?.classList.add('active');
        
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
            row.innerHTML = this.getRowHTML(item);
            fragment.appendChild(row);
        });

        // Limpar e adicionar todas as linhas de uma vez
        tbody.innerHTML = '';
        tbody.appendChild(fragment);

        this.updatePagination();
        this.updateTableInfo();
        
        this.cache.lastRenderTime = performance.now();
        const endTime = performance.now();
        console.log(`Tabela renderizada em ${(endTime - startTime).toFixed(2)}ms`);
    }

    // HTML otimizado para linhas da tabela
    getRowHTML(item) {
        return `
            <td>${item.id}</td>
            <td>${item.title}</td>
            <td>${item.solicitante}</td>
            <td>${item.recebedor}</td>
            <td>${this.getServiceName(item.service)}</td>
            <td>${item.valor}</td>
            <td><span class="status-badge status-${item.status}">${this.getStatusName(item.status)}</span></td>
            <td><span class="priority-badge priority-${item.priority}">${this.getPriorityName(item.priority)}</span></td>
            <td>${this.formatDate(item.dataCriacao)}</td>
            <td>${this.formatDate(item.dataPagamento)}</td>
            <td>
                <button class="action-btn view" onclick="relatoriosOptimized.showDetails('${item.id}')" title="Ver detalhes">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn edit" onclick="relatoriosOptimized.editItem('${item.id}')" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete" onclick="relatoriosOptimized.deleteItem('${item.id}')" title="Excluir">
                    <i class="fas fa-trash"></i>
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
        const total = this.filteredData.length;
        const aprovadas = this.filteredData.filter(item => item.status === 'aprovado').length;
        const pendentes = this.filteredData.filter(item => item.status === 'pendente').length;
        
        const valorTotal = this.filteredData.reduce((sum, item) => {
            const valor = parseFloat(item.valor.replace('R$ ', '').replace(',', '.'));
            return sum + valor;
        }, 0);

        const totalSolicitacoes = document.getElementById('totalSolicitacoes');
        const valorTotalEl = document.getElementById('valorTotal');
        const aprovadasEl = document.getElementById('aprovadas');
        const pendentesEl = document.getElementById('pendentes');

        if (totalSolicitacoes) totalSolicitacoes.textContent = total;
        if (valorTotalEl) valorTotalEl.textContent = `R$ ${valorTotal.toFixed(2).replace('.', ',')}`;
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

    showDetails(id) {
        const item = this.data.find(d => d.id === id);
        if (!item) return;

        const modal = document.getElementById('detailsModal');
        const content = document.getElementById('detailsContent');
        
        if (modal && content) {
            content.innerHTML = `
                <div class="detail-section">
                    <h4>Informações Básicas</h4>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <label>ID:</label>
                            <span>${item.id}</span>
                        </div>
                        <div class="detail-item">
                            <label>Título:</label>
                            <span>${item.title}</span>
                        </div>
                        <div class="detail-item">
                            <label>Solicitante:</label>
                            <span>${item.solicitante}</span>
                        </div>
                        <div class="detail-item">
                            <label>Recebedor:</label>
                            <span>${item.recebedor}</span>
                        </div>
                    </div>
                </div>
                
                <div class="detail-section">
                    <h4>Detalhes Financeiros</h4>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <label>Valor:</label>
                            <span>${item.valor}</span>
                        </div>
                        <div class="detail-item">
                            <label>Serviço:</label>
                            <span>${this.getServiceName(item.service)}</span>
                        </div>
                        <div class="detail-item">
                            <label>Status:</label>
                            <span class="status-badge status-${item.status}">${this.getStatusName(item.status)}</span>
                        </div>
                        <div class="detail-item">
                            <label>Prioridade:</label>
                            <span class="priority-badge priority-${item.priority}">${this.getPriorityName(item.priority)}</span>
                        </div>
                    </div>
                </div>
                
                <div class="detail-section">
                    <h4>Datas e Tempos</h4>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <label>Data de Criação:</label>
                            <span>${this.formatDate(item.dataCriacao)}</span>
                        </div>
                        <div class="detail-item">
                            <label>Data de Pagamento:</label>
                            <span>${this.formatDate(item.dataPagamento)}</span>
                        </div>
                        <div class="detail-item">
                            <label>Tempo de Criação:</label>
                            <span>${item.tempoCriacao}</span>
                        </div>
                        <div class="detail-item">
                            <label>Tempo na Fila:</label>
                            <span>${item.tempoFila}</span>
                        </div>
                    </div>
                </div>
                
                <div class="detail-section">
                    <h4>Descrição</h4>
                    <p>${item.description}</p>
                </div>
            `;

            modal.classList.add('show');
        }
    }

    closeModal() {
        const modal = document.getElementById('detailsModal');
        if (modal) {
            modal.classList.remove('show');
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
        console.log('Exportar para Excel');
    }

    exportToPDF() {
        console.log('Exportar para PDF');
    }

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
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    // Verificar se estamos na página de relatórios
    if (document.querySelector('.reports-fullscreen')) {
        window.relatoriosOptimized = new RelatoriosOptimized();
    }
});
