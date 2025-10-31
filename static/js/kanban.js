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
        // ✅ NÃO controlar o modal se já está sendo controlado pelo base-minimal.js
        if (window.MODAL_CONTROLLED_BY_BASE) {
            console.log('🔒 Modal já controlado pelo base.html - pulando configuração do kanban.js');
            
            // Apenas configurar o formulário, não os botões de abrir/fechar
            const createCampaignForm = document.getElementById('createCampaignForm');
            if (createCampaignForm) {
                createCampaignForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.createCampaign();
                });
            }
            return;
        }
        
        // Create campaign button (APENAS se não estiver controlado pelo base)
        const createCampaignBtn = document.getElementById('createCampaignBtn');
        if (createCampaignBtn) {
            createCampaignBtn.addEventListener('click', () => {
                this.showModal();
            });
        }

        // Close modal buttons (APENAS se não estiver controlado pelo base)
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
        this.setupFormSubmit();
    }
    
    setupFormSubmit() {
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
        // Apenas Financeiro e Admin podem arrastar cards para mudar status
        document.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('card')) {
                // Verificar se o usuário tem permissão para mudar status
                if (typeof window.USER_CAN_CHANGE_STATUS !== 'undefined' && !window.USER_CAN_CHANGE_STATUS) {
                    e.preventDefault();
                    return false;
                }
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
            
            // Verificar se o usuário tem permissão para mudar status
            if (typeof window.USER_CAN_CHANGE_STATUS !== 'undefined' && !window.USER_CAN_CHANGE_STATUS) {
                return false;
            }
            
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
        // ✅ NÃO configurar se já está sendo controlado pelo base-minimal.js
        if (window.MODAL_CONTROLLED_BY_BASE) {
            console.log('🔒 Modal setup pulado - controlado pelo base.html');
            return;
        }
        
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

        // Validação básica
        if (!formData.get('title') || !formData.get('solicitante') || !formData.get('recebedor')) {
            alert('Por favor, preencha todos os campos obrigatórios');
            return;
        }

        try {
            // Botão está FORA do form, buscar no modal-footer
            const submitBtn = document.querySelector('button[form="createCampaignForm"]');
            
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Criando...';
            }

            // ✅ ENVIAR DE VERDADE PARA O DJANGO
            const response = await fetch('/solicitacoes/home/', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRFToken': getCookie('csrftoken')
                }
            });

            if (response.ok) {
                // Recarregar a página para mostrar a nova solicitação
                window.location.reload();
            } else {
                const error = await response.text();
                console.error('Erro do servidor:', error);
                alert('Erro ao criar solicitação. Verifique os dados e tente novamente.');
                
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Criar Solicitação';
                }
            }

        } catch (error) {
            console.error('Erro ao criar solicitação:', error);
            alert('Erro ao criar solicitação');
            
            const submitBtn = document.querySelector('button[form="createCampaignForm"]');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Criar Solicitação';
            }
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
        // Permitir drag apenas se o usuário tem permissão
        cardDiv.draggable = (typeof window.USER_CAN_CHANGE_STATUS !== 'undefined' && window.USER_CAN_CHANGE_STATUS);
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
            
            // Enviar requisição para o backend
            fetch('/solicitacoes/atualizar-status/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCookie('csrftoken')
                },
                body: JSON.stringify({
                    card_id: cardId,
                    status: newColumn
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    card.status = newStatus;
                    card.updatedAt = new Date();
                    
                    this.renderCards();
                    this.saveCards();
                    
                    // Atualizar contadores após mover
                    if (typeof updateColumnCounters === 'function') {
                        updateColumnCounters();
                    }
                    
                    Utils.showNotification('✅ Card movido e salvo com sucesso!', 'success');
                } else {
                    Utils.showNotification(`❌ Erro: ${data.message}`, 'error');
                }
            })
            .catch(error => {
                console.error('Erro ao atualizar status:', error);
                Utils.showNotification('❌ Erro ao salvar. Tente novamente.', 'error');
            });
        }
    }
    
    getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
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
