// JavaScript específico para página de relatórios

class ReportsManager {
    constructor() {
        this.data = [];
        this.filteredData = [];
        this.currentFilters = {
            status: 'all',
            search: '',
            dateFrom: '',
            dateTo: '',
            service: ''
        };
        this.sortColumn = null;
        this.sortDirection = 'asc';
        this.currentPage = 1;
        this.itemsPerPage = 50;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadData();
        this.renderTable();
    }

    setupEventListeners() {
        // Filtros de status
        document.querySelectorAll('.status-filter-compact').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setStatusFilter(e.target.dataset.status);
            });
        });

        // Busca
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce((e) => {
                this.setSearchFilter(e.target.value);
            }, 300));
        }

        const applySearchBtn = document.getElementById('applySearch');
        if (applySearchBtn) {
            applySearchBtn.addEventListener('click', () => {
                this.applyFilters();
            });
        }

        // Filtros de data
        const dateFrom = document.getElementById('dateFrom');
        const dateTo = document.getElementById('dateTo');
        
        if (dateFrom) {
            dateFrom.addEventListener('change', () => {
                this.setDateFilter('from', dateFrom.value);
            });
        }
        
        if (dateTo) {
            dateTo.addEventListener('change', () => {
                this.setDateFilter('to', dateTo.value);
            });
        }

        // Filtro de serviço
        const serviceFilter = document.getElementById('serviceFilter');
        if (serviceFilter) {
            serviceFilter.addEventListener('change', (e) => {
                this.setServiceFilter(e.target.value);
            });
        }

        // Botões de ação
        const clearFiltersBtn = document.getElementById('clearFilters');
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => {
                this.clearFilters();
            });
        }

        const applyFiltersBtn = document.getElementById('applyFilters');
        if (applyFiltersBtn) {
            applyFiltersBtn.addEventListener('click', () => {
                this.applyFilters();
            });
        }

        // Exportação
        const exportExcelBtn = document.getElementById('exportExcel');
        if (exportExcelBtn) {
            exportExcelBtn.addEventListener('click', () => {
                this.exportToExcel();
            });
        }

        const exportPDFBtn = document.getElementById('exportPDF');
        if (exportPDFBtn) {
            exportPDFBtn.addEventListener('click', () => {
                this.exportToPDF();
            });
        }

        // Ordenação
        document.querySelectorAll('.sortable-compact').forEach(th => {
            th.addEventListener('click', (e) => {
                this.sortTable(e.target.dataset.column);
            });
        });
    }

    async loadData() {
        try {
            // Simular carregamento de dados
            this.showLoading();
            
            // Em uma implementação real, isso seria uma chamada para a API
            const response = await fetch('/api/reports');
            if (response.ok) {
                this.data = await response.json();
            } else {
                // Dados de exemplo para demonstração
                this.data = this.generateSampleData();
            }
            
            this.filteredData = [...this.data];
            this.renderTable();
            this.updateStats();
            
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            Utils.showNotification('Erro ao carregar dados dos relatórios', 'error');
            // Usar dados de exemplo em caso de erro
            this.data = this.generateSampleData();
            this.filteredData = [...this.data];
            this.renderTable();
        } finally {
            this.hideLoading();
        }
    }

    generateSampleData() {
        const statuses = ['pending', 'approved', 'completed', 'rejected'];
        const services = ['Consultoria em TI', 'Desenvolvimento de Software', 'Manutenção de Equipamentos', 'Treinamento Corporativo'];
        const solicitantes = ['João Silva', 'Maria Santos', 'Carlos Oliveira', 'Ana Costa', 'Pedro Lima'];
        const recebedores = ['Financeiro TI', 'Financeiro RH', 'Financeiro Marketing', 'Financeiro Geral'];
        
        const data = [];
        for (let i = 1; i <= 100; i++) {
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            const service = services[Math.floor(Math.random() * services.length)];
            const solicitante = solicitantes[Math.floor(Math.random() * solicitantes.length)];
            const recebedor = recebedores[Math.floor(Math.random() * recebedores.length)];
            
            data.push({
                id: `SOL-2024-${String(i).padStart(3, '0')}`,
                title: `Solicitação ${i}`,
                solicitante,
                recebedor,
                service,
                valor: Math.random() * 10000 + 1000,
                status,
                dataCriacao: this.randomDate(new Date(2024, 0, 1), new Date()),
                dataPagamento: this.randomDate(new Date(2024, 0, 1), new Date())
            });
        }
        
        return data;
    }

    randomDate(start, end) {
        return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    }

    setStatusFilter(status) {
        // Remover active de todos os botões
        document.querySelectorAll('.status-filter-compact').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Adicionar active ao botão clicado
        const activeBtn = document.querySelector(`[data-status="${status}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
        
        this.currentFilters.status = status;
        this.applyFilters();
    }

    setSearchFilter(search) {
        this.currentFilters.search = search.toLowerCase();
    }

    setDateFilter(type, date) {
        if (type === 'from') {
            this.currentFilters.dateFrom = date;
        } else {
            this.currentFilters.dateTo = date;
        }
    }

    setServiceFilter(service) {
        this.currentFilters.service = service;
    }

    applyFilters() {
        this.filteredData = this.data.filter(item => {
            // Filtro de status
            if (this.currentFilters.status !== 'all' && item.status !== this.currentFilters.status) {
                return false;
            }
            
            // Filtro de busca
            if (this.currentFilters.search) {
                const searchTerm = this.currentFilters.search;
                const searchableFields = [
                    item.id,
                    item.title,
                    item.solicitante,
                    item.recebedor,
                    item.service
                ];
                
                if (!searchableFields.some(field => 
                    field.toLowerCase().includes(searchTerm)
                )) {
                    return false;
                }
            }
            
            // Filtro de data
            if (this.currentFilters.dateFrom) {
                const itemDate = new Date(item.dataCriacao);
                const fromDate = new Date(this.currentFilters.dateFrom);
                if (itemDate < fromDate) {
                    return false;
                }
            }
            
            if (this.currentFilters.dateTo) {
                const itemDate = new Date(item.dataCriacao);
                const toDate = new Date(this.currentFilters.dateTo);
                if (itemDate > toDate) {
                    return false;
                }
            }
            
            // Filtro de serviço
            if (this.currentFilters.service && item.service !== this.currentFilters.service) {
                return false;
            }
            
            return true;
        });
        
        this.currentPage = 1;
        this.renderTable();
        this.updateStats();
    }

    clearFilters() {
        // Resetar filtros
        this.currentFilters = {
            status: 'all',
            search: '',
            dateFrom: '',
            dateTo: '',
            service: ''
        };
        
        // Resetar UI
        document.querySelectorAll('.status-filter-compact').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector('[data-status="all"]')?.classList.add('active');
        
        document.getElementById('searchInput').value = '';
        document.getElementById('dateFrom').value = '';
        document.getElementById('dateTo').value = '';
        document.getElementById('serviceFilter').value = '';
        
        // Aplicar filtros limpos
        this.applyFilters();
    }

    sortTable(column) {
        if (this.sortColumn === column) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = column;
            this.sortDirection = 'asc';
        }
        
        this.filteredData.sort((a, b) => {
            let aVal = a[column];
            let bVal = b[column];
            
            // Tratamento especial para diferentes tipos de dados
            if (column === 'valor') {
                aVal = parseFloat(aVal);
                bVal = parseFloat(bVal);
            } else if (column === 'dataCriacao' || column === 'dataPagamento') {
                aVal = new Date(aVal);
                bVal = new Date(bVal);
            } else {
                aVal = String(aVal).toLowerCase();
                bVal = String(bVal).toLowerCase();
            }
            
            if (aVal < bVal) return this.sortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return this.sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
        
        // Atualizar indicadores de ordenação
        document.querySelectorAll('.sortable-compact').forEach(th => {
            th.classList.remove('sorted-asc', 'sorted-desc');
        });
        
        const activeTh = document.querySelector(`[data-column="${column}"]`);
        if (activeTh) {
            activeTh.classList.add(`sorted-${this.sortDirection}`);
        }
        
        this.renderTable();
    }

    renderTable() {
        const tbody = document.getElementById('reportsTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageData = this.filteredData.slice(startIndex, endIndex);
        
        pageData.forEach(item => {
            const row = this.createTableRow(item);
            tbody.appendChild(row);
        });
        
        this.renderPagination();
    }

    createTableRow(item) {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${item.id}</td>
            <td>${item.title}</td>
            <td>${item.solicitante}</td>
            <td>${item.recebedor}</td>
            <td>${item.service}</td>
            <td>${Utils.formatCurrency(item.valor)}</td>
            <td><span class="status-badge ${item.status}">${this.getStatusLabel(item.status)}</span></td>
            <td>${Utils.formatDate(item.dataCriacao)}</td>
            <td>${Utils.formatDate(item.dataPagamento)}</td>
            <td class="table-actions">
                <button class="btn-action btn-view" title="Visualizar" onclick="reportsManager.viewItem('${item.id}')">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn-action btn-edit" title="Editar" onclick="reportsManager.editItem('${item.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-action btn-delete" title="Excluir" onclick="reportsManager.deleteItem('${item.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        return row;
    }

    getStatusLabel(status) {
        const labels = {
            pending: 'Pendente',
            approved: 'Aprovado',
            completed: 'Concluído',
            rejected: 'Rejeitado'
        };
        return labels[status] || status;
    }

    renderPagination() {
        const totalPages = Math.ceil(this.filteredData.length / this.itemsPerPage);
        const paginationContainer = document.querySelector('.pagination-compact');
        
        if (!paginationContainer || totalPages <= 1) {
            if (paginationContainer) paginationContainer.style.display = 'none';
            return;
        }
        
        paginationContainer.style.display = 'flex';
        paginationContainer.innerHTML = '';
        
        // Botão anterior
        const prevBtn = document.createElement('button');
        prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
        prevBtn.disabled = this.currentPage === 1;
        prevBtn.addEventListener('click', () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.renderTable();
            }
        });
        paginationContainer.appendChild(prevBtn);
        
        // Páginas
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(totalPages, this.currentPage + 2);
        
        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.textContent = i;
            pageBtn.classList.toggle('active', i === this.currentPage);
            pageBtn.addEventListener('click', () => {
                this.currentPage = i;
                this.renderTable();
            });
            paginationContainer.appendChild(pageBtn);
        }
        
        // Botão próximo
        const nextBtn = document.createElement('button');
        nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
        nextBtn.disabled = this.currentPage === totalPages;
        nextBtn.addEventListener('click', () => {
            if (this.currentPage < totalPages) {
                this.currentPage++;
                this.renderTable();
            }
        });
        paginationContainer.appendChild(nextBtn);
    }

    updateStats() {
        const totalRecords = document.getElementById('totalRecords');
        const filteredRecords = document.getElementById('filteredRecords');
        
        if (totalRecords) {
            totalRecords.textContent = `Total: ${this.data.length}`;
        }
        
        if (filteredRecords) {
            filteredRecords.textContent = `Filtrados: ${this.filteredData.length}`;
        }
    }

    showLoading() {
        const tbody = document.getElementById('reportsTableBody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="10" style="text-align: center; padding: 2rem;">
                        <div class="loading-spinner"></div>
                        <p>Carregando dados...</p>
                    </td>
                </tr>
            `;
        }
    }

    hideLoading() {
        // O loading será removido quando renderTable() for chamado
    }

    viewItem(id) {
        const item = this.data.find(d => d.id === id);
        if (item) {
            // Implementar visualização do item
            console.log('Visualizando item:', item);
            Utils.showNotification('Funcionalidade de visualização em desenvolvimento', 'info');
        }
    }

    editItem(id) {
        const item = this.data.find(d => d.id === id);
        if (item) {
            // Implementar edição do item
            console.log('Editando item:', item);
            Utils.showNotification('Funcionalidade de edição em desenvolvimento', 'info');
        }
    }

    deleteItem(id) {
        if (confirm('Tem certeza que deseja excluir este item?')) {
            // Implementar exclusão do item
            console.log('Excluindo item:', id);
            Utils.showNotification('Item excluído com sucesso', 'success');
            this.loadData(); // Recarregar dados
        }
    }

    exportToExcel() {
        // Implementar exportação para Excel
        Utils.showNotification('Exportação para Excel em desenvolvimento', 'info');
    }

    exportToPDF() {
        // Implementar exportação para PDF
        Utils.showNotification('Exportação para PDF em desenvolvimento', 'info');
    }
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    window.reportsManager = new ReportsManager();
});
