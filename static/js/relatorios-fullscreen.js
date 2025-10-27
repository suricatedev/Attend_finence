// JavaScript para Relatórios em Tela Cheia
class RelatoriosFullscreen {
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
        
        this.init();
    }

    init() {
        this.loadData();
        this.setupEventListeners();
        this.setDefaultDates();
        this.renderTable();
        this.updateStats();
    }

    loadData() {
        // Carregar dados do localStorage ou simular dados
        const savedData = localStorage.getItem('kanbanCards');
        if (savedData) {
            this.data = JSON.parse(savedData);
        } else {
            // Dados simulados para demonstração
            this.data = this.generateSampleData();
        }
        this.filteredData = [...this.data];
    }

    generateSampleData() {
        const services = ['consultoria_TI', 'desenvolvimento', 'manutencao_equipamentos', 'treinamento_corporativo'];
        const statuses = ['pendente', 'aprovado', 'recusado', 'concluido'];
        const priorities = ['baixa', 'media', 'alta'];
        const solicitantes = ['João Silva', 'Maria Santos', 'Pedro Costa', 'Ana Oliveira', 'Carlos Lima'];
        const recebedores = ['Financeiro', 'Contabilidade', 'Tesouraria', 'Gerência'];

        const data = [];
        for (let i = 1; i <= 50; i++) {
            const dataCriacao = new Date();
            dataCriacao.setDate(dataCriacao.getDate() - Math.floor(Math.random() * 30));
            
            const dataPagamento = new Date(dataCriacao);
            dataPagamento.setDate(dataPagamento.getDate() + Math.floor(Math.random() * 15));

            data.push({
                id: `SOL-2024-${String(i).padStart(3, '0')}`,
                title: `Solicitação ${i} - ${services[Math.floor(Math.random() * services.length)].replace('_', ' ')}`,
                solicitante: solicitantes[Math.floor(Math.random() * solicitantes.length)],
                recebedor: recebedores[Math.floor(Math.random() * recebedores.length)],
                service: services[Math.floor(Math.random() * services.length)],
                valor: `R$ ${(Math.random() * 10000 + 1000).toFixed(2).replace('.', ',')}`,
                status: statuses[Math.floor(Math.random() * statuses.length)],
                priority: priorities[Math.floor(Math.random() * priorities.length)],
                dataCriacao: dataCriacao.toISOString().split('T')[0],
                dataPagamento: dataPagamento.toISOString().split('T')[0],
                description: `Descrição detalhada da solicitação ${i}`,
                tempoCriacao: `${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
                tempoFila: `${String(Math.floor(Math.random() * 48)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`
            });
        }
        return data;
    }

    setupEventListeners() {
        // Filtros de status
        document.querySelectorAll('.status-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.status-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentFilters.status = e.target.dataset.status;
                this.applyFilters();
            });
        });

        // Filtros de data
        document.getElementById('dateFrom').addEventListener('change', () => {
            this.currentFilters.dateFrom = document.getElementById('dateFrom').value;
            this.applyFilters();
        });

        document.getElementById('dateTo').addEventListener('change', () => {
            this.currentFilters.dateTo = document.getElementById('dateTo').value;
            this.applyFilters();
        });

        // Filtro de serviço
        document.getElementById('serviceFilter').addEventListener('change', () => {
            this.currentFilters.service = document.getElementById('serviceFilter').value;
            this.applyFilters();
        });

        // Filtro de prioridade
        document.getElementById('priorityFilter').addEventListener('change', () => {
            this.currentFilters.priority = document.getElementById('priorityFilter').value;
            this.applyFilters();
        });

        // Busca
        document.getElementById('searchInput').addEventListener('input', () => {
            this.currentFilters.search = document.getElementById('searchInput').value.toLowerCase();
            this.applyFilters();
        });

        document.getElementById('applySearch').addEventListener('click', () => {
            this.applyFilters();
        });

        // Botões de ação
        document.getElementById('clearFilters').addEventListener('click', () => {
            this.clearFilters();
        });

        document.getElementById('applyFilters').addEventListener('click', () => {
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
                this.renderTable();
            });
        });

        // Paginação
        document.getElementById('prevPage').addEventListener('click', () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.renderTable();
            }
        });

        document.getElementById('nextPage').addEventListener('click', () => {
            const totalPages = Math.ceil(this.filteredData.length / this.itemsPerPage);
            if (this.currentPage < totalPages) {
                this.currentPage++;
                this.renderTable();
            }
        });

        // Exportação
        document.getElementById('exportExcel').addEventListener('click', () => {
            this.exportToExcel();
        });

        document.getElementById('exportPDF').addEventListener('click', () => {
            this.exportToPDF();
        });

        document.getElementById('exportCSV').addEventListener('click', () => {
            this.exportToCSV();
        });

        // Modal de detalhes
        document.getElementById('closeDetailsModal').addEventListener('click', () => {
            this.closeModal();
        });

        // Fechar modal ao clicar fora
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal();
            }
        });
    }

    setDefaultDates() {
        const today = new Date();
        const lastMonth = new Date(today);
        lastMonth.setMonth(lastMonth.getMonth() - 1);

        document.getElementById('dateFrom').value = lastMonth.toISOString().split('T')[0];
        document.getElementById('dateTo').value = today.toISOString().split('T')[0];

        this.currentFilters.dateFrom = lastMonth.toISOString().split('T')[0];
        this.currentFilters.dateTo = today.toISOString().split('T')[0];
    }

    applyFilters() {
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
        this.renderTable();
        this.updateStats();
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
        document.querySelector('[data-status="all"]').classList.add('active');
        
        document.getElementById('dateFrom').value = '';
        document.getElementById('dateTo').value = '';
        document.getElementById('serviceFilter').value = '';
        document.getElementById('priorityFilter').value = '';
        document.getElementById('searchInput').value = '';

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

    renderTable() {
        const tbody = document.getElementById('reportsTableBody');
        tbody.innerHTML = '';

        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageData = this.filteredData.slice(startIndex, endIndex);

        pageData.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
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
                    <button class="action-btn view" onclick="relatoriosFullscreen.showDetails('${item.id}')" title="Ver detalhes">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn edit" onclick="relatoriosFullscreen.editItem('${item.id}')" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" onclick="relatoriosFullscreen.deleteItem('${item.id}')" title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });

        this.updatePagination();
        this.updateTableInfo();
    }

    updatePagination() {
        const totalPages = Math.ceil(this.filteredData.length / this.itemsPerPage);
        
        // Atualizar botões de navegação
        document.getElementById('prevPage').disabled = this.currentPage === 1;
        document.getElementById('nextPage').disabled = this.currentPage === totalPages;

        // Atualizar números de página
        const paginationNumbers = document.getElementById('paginationNumbers');
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
                this.renderTable();
            });
            paginationNumbers.appendChild(pageBtn);
        }

        // Atualizar informação de paginação
        document.getElementById('paginationInfo').textContent = `Página ${this.currentPage} de ${totalPages}`;
    }

    updateTableInfo() {
        document.getElementById('totalRecords').textContent = `Total: ${this.data.length}`;
        document.getElementById('filteredRecords').textContent = `Filtrados: ${this.filteredData.length}`;
    }

    updateStats() {
        const total = this.filteredData.length;
        const aprovadas = this.filteredData.filter(item => item.status === 'aprovado').length;
        const pendentes = this.filteredData.filter(item => item.status === 'pendente').length;
        
        const valorTotal = this.filteredData.reduce((sum, item) => {
            const valor = parseFloat(item.valor.replace('R$ ', '').replace(',', '.'));
            return sum + valor;
        }, 0);

        document.getElementById('totalSolicitacoes').textContent = total;
        document.getElementById('valorTotal').textContent = `R$ ${valorTotal.toFixed(2).replace('.', ',')}`;
        document.getElementById('aprovadas').textContent = aprovadas;
        document.getElementById('pendentes').textContent = pendentes;
    }

    showDetails(id) {
        const item = this.data.find(d => d.id === id);
        if (!item) return;

        const modal = document.getElementById('detailsModal');
        const content = document.getElementById('detailsContent');
        
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

    closeModal() {
        document.getElementById('detailsModal').classList.remove('show');
    }

    editItem(id) {
        // Implementar edição
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
        // Implementar exportação para Excel
        console.log('Exportar para Excel');
    }

    exportToPDF() {
        // Implementar exportação para PDF
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

    // Métodos auxiliares
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
    window.relatoriosFullscreen = new RelatoriosFullscreen();
});
