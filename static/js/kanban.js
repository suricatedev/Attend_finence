// JavaScript específico para Kanban Board

class KanbanManager {
    constructor() {
        this.cards = [];
        this.currentCardId = 1;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadInitialData();
        this.setupDragAndDrop();
        this.setupModal();
    }

    setupEventListeners() {
        // Create campaign button
        const createCampaignBtn = document.getElementById('createCampaignBtn');
        if (createCampaignBtn) {
            createCampaignBtn.addEventListener('click', () => {
                this.showModal();
            });
        }

        // Close modal buttons
        const closeModal = document.getElementById('closeModal');
        const cancelCreate = document.getElementById('cancelCreate');
        
        if (closeModal) {
            closeModal.addEventListener('click', () => {
                this.hideModal();
            });
        }
        
        if (cancelCreate) {
            cancelCreate.addEventListener('click', () => {
                this.hideModal();
            });
        }

        // Create campaign form
        const createCampaignForm = document.getElementById('createCampaignForm');
        if (createCampaignForm) {
            createCampaignForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.createCampaign();
            });
        }

        // Add card buttons
        document.querySelectorAll('.add-card-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const column = e.target.closest('.kanban-column');
                this.addCardToColumn(column.dataset.column);
            });
        });

        // Column menu buttons
        document.querySelectorAll('.column-menu-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.showColumnMenu(e.target);
            });
        });
    }

    loadInitialData() {
        // Carregar dados iniciais do servidor ou localStorage
        const savedCards = localStorage.getItem('kanbanCards');
        if (savedCards) {
            this.cards = JSON.parse(savedCards);
            this.renderCards();
        }
    }

    setupDragAndDrop() {
        // Configurar drag and drop para os cards
        document.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('card')) {
                e.target.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/html', e.target.outerHTML);
            }
        });

        document.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('card')) {
                e.target.classList.remove('dragging');
            }
        });

        document.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
        });

        document.addEventListener('dragenter', (e) => {
            e.preventDefault();
            const columnContent = e.target.closest('.column-content');
            if (columnContent) {
                columnContent.classList.add('drag-over');
            }
        });

        document.addEventListener('dragleave', (e) => {
            const columnContent = e.target.closest('.column-content');
            if (columnContent && !columnContent.contains(e.relatedTarget)) {
                columnContent.classList.remove('drag-over');
            }
        });

        document.addEventListener('drop', (e) => {
            e.preventDefault();
            const columnContent = e.target.closest('.column-content');
            if (columnContent) {
                columnContent.classList.remove('drag-over');
                
                const card = document.querySelector('.dragging');
                if (card) {
                    const newColumn = columnContent.dataset.column;
                    const cardId = card.dataset.cardId;
                    
                    this.moveCard(cardId, newColumn);
                }
            }
        });
    }

    setupModal() {
        // Configurar modal de criação de solicitação
        const modal = document.getElementById('createCampaignModal');
        if (modal) {
            // Fechar modal ao clicar no overlay
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideModal();
                }
            });

            // Fechar modal com ESC
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && modal.classList.contains('active')) {
                    this.hideModal();
                }
            });
        }
    }

    showModal() {
        const modal = document.getElementById('createCampaignModal');
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            // Focar no primeiro campo
            const firstInput = modal.querySelector('input[required]');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
        }
    }

    hideModal() {
        const modal = document.getElementById('createCampaignModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
            
            // Limpar formulário
            const form = document.getElementById('createCampaignForm');
            if (form) {
                form.reset();
            }
        }
    }

    async createCampaign() {
        const form = document.getElementById('createCampaignForm');
        if (!form) return;

        const formData = new FormData(form);
        const campaignData = {
            id: formData.get('id') || `SOL-${Date.now()}`,
            title: formData.get('title'),
            solicitante: formData.get('solicitante'),
            recebedor: formData.get('recebedor'),
            valor: formData.get('valor'),
            service: formData.get('service'),
            description: formData.get('description'),
            status: formData.get('status') || 'pendente',
            priority: formData.get('priority'),
            dataCriacao: formData.get('dataCriacao'),
            dataPagamento: formData.get('dataPagamento'),
            tempoCriacao: formData.get('tempoCriacao'),
            tempoFila: formData.get('tempoFila'),
            anexos: formData.get('anexos')
        };

        // Validação básica
        if (!campaignData.title || !campaignData.solicitante || !campaignData.recebedor) {
            Utils.showNotification('Por favor, preencha todos os campos obrigatórios', 'error');
            return;
        }

        try {
            // Simular envio para o servidor
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Criando...';

            // Em uma implementação real, isso seria uma chamada para a API
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Adicionar card ao kanban
            const newCard = {
                id: this.currentCardId++,
                ...campaignData,
                createdAt: new Date()
            };

            this.cards.push(newCard);
            this.renderCards();
            this.saveCards();
            this.hideModal();
            Utils.showNotification('Solicitação criada com sucesso!', 'success');

        } catch (error) {
            console.error('Erro ao criar solicitação:', error);
            Utils.showNotification('Erro ao criar solicitação', 'error');
        } finally {
            const submitBtn = form.querySelector('button[type="submit"]');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Criar Solicitação';
        }
    }

    renderCards() {
        // Limpar cards existentes
        document.querySelectorAll('.column-content .card').forEach(card => {
            card.remove();
        });

        // Renderizar cards por coluna
        this.cards.forEach(card => {
            const column = this.getColumnByStatus(card.status);
            if (column) {
                const cardElement = this.createCardElement(card);
                column.appendChild(cardElement);
            }
        });

        this.updateCardCounts();
    }

    getColumnByStatus(status) {
        const statusMap = {
            'pendente': 'planning',
            'recusado': 'test',
            'aprovado': 'launch',
            'concluido': 'success'
        };

        const columnType = statusMap[status] || 'planning';
        return document.querySelector(`[data-column="${columnType}"] .column-content`);
    }

    createCardElement(card) {
        const cardDiv = document.createElement('div');
        cardDiv.className = `card card-status-${card.status}`;
        cardDiv.draggable = true;
        cardDiv.dataset.cardId = card.id;

        const priorityClass = this.getPriorityClass(card.priority);
        const statusLabel = this.getStatusLabel(card.status);

        cardDiv.innerHTML = `
            <div class="card-header">
                <span class="priority ${priorityClass}">${card.priority}</span>
            </div>
            <div class="card-body">
                <h3 class="card-title">${card.title}</h3>
                <div class="card-info">
                    <div class="info-item">
                        <i class="fas fa-user"></i>
                        <span class="info-label">SOLICITANTE</span>
                        <span class="info-value">${card.solicitante}</span>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-user-check"></i>
                        <span class="info-label">RECEBEDOR</span>
                        <span class="info-value">${card.recebedor}</span>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-dollar-sign"></i>
                        <span class="info-label">VALOR</span>
                        <span class="info-value">${Utils.formatCurrency(card.valor)}</span>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-calendar-plus"></i>
                        <span class="info-label">CRIAÇÃO</span>
                        <span class="info-value">${Utils.formatDate(card.dataCriacao)}</span>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-calendar-check"></i>
                        <span class="info-label">PAGAMENTO</span>
                        <span class="info-value">${Utils.formatDate(card.dataPagamento)}</span>
                    </div>
                </div>
                <div class="card-time">
                    <i class="fas fa-clock"></i>
                    <span>0min</span>
                </div>
            </div>
            <div class="card-footer">
                <span class="card-stage">${statusLabel}</span>
            </div>
        `;

        return cardDiv;
    }

    getPriorityClass(priority) {
        const priorityMap = {
            'alta': 'high',
            'media': 'medium',
            'baixa': 'low'
        };
        return priorityMap[priority] || 'medium';
    }

    getStatusLabel(status) {
        const statusMap = {
            'pendente': 'Solicitação pendente de análise',
            'aprovado': 'Aprovado e em processamento',
            'recusado': 'Solicitação recusada - orçamento insuficiente',
            'concluido': 'Solicitação concluída com sucesso'
        };
        return statusMap[status] || status;
    }

    moveCard(cardId, newColumn) {
        const card = this.cards.find(c => c.id == cardId);
        if (card) {
            const newStatus = this.getStatusByColumn(newColumn);
            card.status = newStatus;
            card.updatedAt = new Date();
            
            this.renderCards();
            this.saveCards();
            
            Utils.showNotification('Card movido com sucesso!', 'success');
        }
    }

    getStatusByColumn(column) {
        const columnMap = {
            'planning': 'pendente',
            'test': 'recusado',
            'launch': 'aprovado',
            'success': 'concluido'
        };
        return columnMap[column] || 'pendente';
    }

    addCardToColumn(column) {
        // Implementar adição rápida de card
        console.log('Adicionar card à coluna:', column);
        Utils.showNotification('Funcionalidade de adição rápida em desenvolvimento', 'info');
    }

    showColumnMenu(button) {
        // Implementar menu da coluna
        console.log('Mostrar menu da coluna');
        Utils.showNotification('Menu da coluna em desenvolvimento', 'info');
    }

    updateCardCounts() {
        const counts = {
            planning: 0,
            test: 0,
            launch: 0,
            success: 0
        };

        this.cards.forEach(card => {
            const column = this.getColumnByStatus(card.status);
            if (column) {
                const columnType = column.closest('.kanban-column').dataset.column;
                counts[columnType]++;
            }
        });

        // Atualizar contadores na interface
        Object.keys(counts).forEach(columnType => {
            const countElement = document.querySelector(`[data-column="${columnType}"] .card-count`);
            if (countElement) {
                countElement.textContent = counts[columnType];
            }
        });
    }

    saveCards() {
        localStorage.setItem('kanbanCards', JSON.stringify(this.cards));
    }

    // Métodos utilitários
    getCardById(id) {
        return this.cards.find(card => card.id == id);
    }

    deleteCard(id) {
        this.cards = this.cards.filter(card => card.id != id);
        this.renderCards();
        this.saveCards();
        Utils.showNotification('Card excluído com sucesso!', 'success');
    }

    updateCard(id, updates) {
        const card = this.getCardById(id);
        if (card) {
            Object.assign(card, updates);
            card.updatedAt = new Date();
            this.renderCards();
            this.saveCards();
            Utils.showNotification('Card atualizado com sucesso!', 'success');
        }
    }
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    window.kanbanManager = new KanbanManager();
});
