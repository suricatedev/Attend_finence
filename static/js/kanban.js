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
            
            // REMOVIDO: FormManager já controla o submit
            // Não adicionar listener que bloqueia o submit
            console.log('🔒 FormManager controla o submit - não adicionar listener duplicado');            return;
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
        // REMOVIDO: O FormManager em app.js já gerencia o submit
        // Não adicionar listener adicional que bloqueia o submit para Django
        console.log('🔒 FormManager controla o submit do formulário - kanban.js não intercepta');
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
        // ✅ Desabilitar o setup antigo - usar o novo sistema dedicado
        // O drag and drop agora é gerenciado por kanban-drag-drop.js
        console.log('ℹ️ Drag and drop gerenciado por kanban-drag-drop.js');
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
        // ⚠️ ESTA FUNÇÃO FOI DESATIVADA
        // O FormManager em app.js já gerencia o submit do formulário
        // Esta função não deve ser chamada para evitar conflitos
        console.warn('⚠️ createCampaign() chamada, mas FormManager já controla o submit');
        console.warn('⚠️ Se você vê esta mensagem, há um listener duplicado em algum lugar');
        
        // NÃO fazer nada - deixar o FormManager processar
        return;    }

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
            'concluido': 'success',
            'estorno': 'refund'
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
                        <span class="info-value">${typeof Utils !== 'undefined' && Utils.formatCurrency ? Utils.formatCurrency(card.valor) : card.valor || 'R$ 0,00'}</span>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-calendar-plus"></i>
                        <span class="info-label">CRIAÇÃO</span>
                        <span class="info-value">${typeof Utils !== 'undefined' && Utils.formatDate ? Utils.formatDate(card.dataCriacao) : card.dataCriacao || ''}</span>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-calendar-check"></i>
                        <span class="info-label">PAGAMENTO</span>
                        <span class="info-value">${typeof Utils !== 'undefined' && Utils.formatDate ? Utils.formatDate(card.dataPagamento) : card.dataPagamento || ''}</span>
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
            'concluido': 'Solicitação concluída com sucesso',
            'estorno': 'Solicitação movida para estorno'
        };
        return statusMap[status] || status;
    }

    moveCard(cardId, newColumn, justificativaEstorno = '') {
        console.log('🔄 moveCard chamado:', { cardId, newColumn });

        if (newColumn === 'refund' && !justificativaEstorno) {
            if (typeof window.solicitarJustificativaEstorno !== 'function') {
                if (typeof Utils !== 'undefined' && Utils.showNotification) {
                    Utils.showNotification('❌ Não foi possível abrir o card de justificativa.', 'error');
                }
                return;
            }

            const cardPreview = document.querySelector(`[data-card-id="${cardId}"]`);
            const cardTitle = cardPreview?.querySelector('.card-title')?.textContent?.trim() || `Solicitação #${cardId}`;
            window.solicitarJustificativaEstorno({
                cardTitle,
                sourceName: 'Status atual',
                targetName: 'Estorno'
            }).then((textoJustificativa) => {
                if (!textoJustificativa) {
                    return;
                }
                this.moveCard(cardId, newColumn, textoJustificativa);
            });
            return;
        }
        
        // Buscar o card no DOM - pode haver múltiplos com mesmo ID, pegar o primeiro
        const cardElements = document.querySelectorAll(`[data-card-id="${cardId}"]`);
        if (cardElements.length === 0) {
            console.error('❌ Card não encontrado no DOM:', cardId);
            if (typeof Utils !== 'undefined' && Utils.showNotification) {
                Utils.showNotification('❌ Erro: Card não encontrado', 'error');
            } else {
                alert('❌ Erro: Card não encontrado');
            }
            return;
        }
        
        // Se houver múltiplos cards com o mesmo ID, remover os duplicados
        if (cardElements.length > 1) {
            console.warn(`⚠️ Múltiplos cards encontrados com ID ${cardId}, removendo duplicados...`);
            // Manter apenas o primeiro, remover os outros
            for (let i = 1; i < cardElements.length; i++) {
                console.log(`🗑️ Removendo card duplicado #${i + 1}`);
                cardElements[i].remove();
            }
        }
        
        const cardElement = cardElements[0];
        const oldColumn = cardElement.closest('.kanban-column')?.dataset.column;
        const targetColumnContent = document.querySelector(`[data-column="${newColumn}"] .column-content`);
        
        if (!targetColumnContent) {
            console.error('❌ Coluna destino não encontrada:', newColumn);
            if (typeof Utils !== 'undefined' && Utils.showNotification) {
                Utils.showNotification('❌ Erro: Coluna destino não encontrada', 'error');
            } else {
                alert('❌ Erro: Coluna destino não encontrada');
            }
            return;
        }
        
        // Se for a mesma coluna, não fazer nada
        if (oldColumn === newColumn) {
            console.log('ℹ️ Card já está na coluna correta');
            return;
        }
        
        console.log('📍 Colunas:', { oldColumn, newColumn, cardId });
        
        // Obter o novo status baseado na coluna
        const newStatus = this.getStatusByColumn(newColumn);
        
        console.log('📤 Enviando requisição ao backend:', { card_id: cardId, status: newColumn });
        
        // Enviar requisição para o backend
        fetch('/solicitacoes/atualizar-status/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': this.getCookie('csrftoken')
            },
            body: JSON.stringify({
                card_id: cardId,
                status: newColumn,
                justificativa_estorno: justificativaEstorno
            })
        })
        .then(response => {
            console.log('📥 Resposta recebida:', response.status);
            return response.json();
        })
        .then(data => {
            console.log('📥 Dados recebidos:', data);
            
            if (data.success) {
                // Mover card para nova coluna no DOM
                cardElement.classList.remove('dragging');
                
                // Remover classes de status antigas
                cardElement.classList.remove('card-status-pending', 'card-status-rejected', 'card-status-approved', 'card-status-completed', 'card-status-refund');
                
                // Adicionar classe de status correta
                const statusClasses = {
                    'planning': 'card-status-pending',
                    'test': 'card-status-rejected',
                    'launch': 'card-status-approved',
                    'success': 'card-status-completed',
                    'refund': 'card-status-refund'
                };
                
                if (statusClasses[newColumn]) {
                    cardElement.classList.add(statusClasses[newColumn]);
                }
                
                // Atualizar footer do card com novo status
                const cardFooter = cardElement.querySelector('.card-footer');
                if (cardFooter) {
                    const statusLabels = {
                        'planning': 'Solicitação pendente de análise',
                        'test': 'Solicitação recusada',
                        'launch': 'Solicitação aprovada',
                        'success': 'Solicitação concluída',
                        'refund': 'Solicitação movida para estorno'
                    };
                    const stageElement = cardFooter.querySelector('.card-stage');
                    if (stageElement) {
                        stageElement.textContent = statusLabels[newColumn] || 'Solicitação';
                    }
                }
                
                // Atualizar data-entry-time para reiniciar contador
                const cardTimeElement = cardElement.querySelector('.card-time');
                if (cardTimeElement) {
                    const now = new Date();
                    const timeString = now.getFullYear() + '-' + 
                        String(now.getMonth() + 1).padStart(2, '0') + '-' + 
                        String(now.getDate()).padStart(2, '0') + ' ' + 
                        String(now.getHours()).padStart(2, '0') + ':' + 
                        String(now.getMinutes()).padStart(2, '0') + ':' + 
                        String(now.getSeconds()).padStart(2, '0');
                    cardTimeElement.setAttribute('data-entry-time', timeString);
                    
                    const timeSpan = cardTimeElement.querySelector('.queue-time');
                    if (timeSpan) {
                        timeSpan.textContent = '0min';
                    }
                }
                
                // ✅ IMPORTANTE: Remover o card da coluna antiga primeiro para evitar duplicação
                const oldParent = cardElement.parentNode;
                if (oldParent) {
                    console.log('🗑️ Removendo card da coluna antiga:', oldParent.className);
                    oldParent.removeChild(cardElement);
                    console.log('✅ Card removido da coluna antiga');
                }
                
                // Verificar se o card ainda está no DOM antes de adicionar
                if (cardElement.parentNode) {
                    console.warn('⚠️ Card ainda tem parent após remoção, removendo novamente');
                    cardElement.parentNode.removeChild(cardElement);
                }
                
                // Agora adicionar à nova coluna
                console.log('➕ Adicionando card à nova coluna:', newColumn);
                targetColumnContent.appendChild(cardElement);
                console.log('✅ Card adicionado à nova coluna. Nova posição:', cardElement.parentNode?.className);
                
                // Verificar e garantir que o card está na nova coluna (múltiplas verificações)
                const verifyCardPosition = () => {
                    // Verificar se há cards duplicados em qualquer lugar
                    const allCardsWithId = document.querySelectorAll(`[data-card-id="${cardId}"]`);
                    if (allCardsWithId.length > 1) {
                        console.warn(`⚠️ Encontrados ${allCardsWithId.length} cards com ID ${cardId}, removendo duplicados...`);
                        // Manter apenas o primeiro que está na nova coluna, remover os outros
                        allCardsWithId.forEach((card, index) => {
                            const cardColumn = card.closest('.kanban-column')?.dataset.column;
                            if (cardColumn !== newColumn || index > 0) {
                                console.log(`🗑️ Removendo card duplicado da coluna ${cardColumn}`);
                                card.remove();
                            }
                        });
                    }
                    
                    // Verificar se o card está na nova coluna
                    const cardInNewColumn = document.querySelector(`[data-column="${newColumn}"] .column-content [data-card-id="${cardId}"]`);
                    if (cardInNewColumn) {
                        console.log('✅ CONFIRMADO: Card está na nova coluna:', newColumn);
                    } else {
                        console.error('❌ ERRO: Card não está na nova coluna! Tentando corrigir...');
                        // Tentar encontrar o card em qualquer lugar e movê-lo
                        const cardAnywhere = document.querySelector(`[data-card-id="${cardId}"]`);
                        if (cardAnywhere) {
                            const oldParent = cardAnywhere.parentNode;
                            if (oldParent) oldParent.removeChild(cardAnywhere);
                            targetColumnContent.appendChild(cardAnywhere);
                            console.log('✅ Card foi reposicionado para a nova coluna');
                        }
                    }
                    
                    // Verificar se o card ainda está na coluna antiga (duplicação)
                    if (oldColumn) {
                        const cardInOldColumn = document.querySelector(`[data-column="${oldColumn}"] .column-content [data-card-id="${cardId}"]`);
                        if (cardInOldColumn) {
                            console.error('❌ ERRO: Card ainda está na coluna antiga! Removendo...');
                            cardInOldColumn.remove();
                        }
                    }
                };
                
                // Verificar imediatamente e depois de um pequeno delay
                verifyCardPosition();
                setTimeout(verifyCardPosition, 100);
                setTimeout(verifyCardPosition, 500);
                
                // Garantir visibilidade
                cardElement.style.display = '';
                cardElement.style.visibility = 'visible';
                cardElement.style.opacity = '1';
                
                // Remover mensagem de coluna vazia se houver na coluna destino
                const emptyColumn = targetColumnContent.querySelector('.empty-column');
                if (emptyColumn) {
                    emptyColumn.remove();
                }
                
                // Adicionar mensagem de coluna vazia na coluna antiga se necessário
                if (oldColumn) {
                    const oldColumnContent = document.querySelector(`[data-column="${oldColumn}"] .column-content`);
                    if (oldColumnContent) {
                        const oldColumnCards = oldColumnContent.querySelectorAll('.card:not(.empty-column)');
                        if (oldColumnCards.length === 0) {
                            const emptyMsg = document.createElement('div');
                            emptyMsg.className = 'empty-column';
                            const emptyMessages = {
                                'planning': 'Nenhuma solicitação pendente',
                                'test': 'Nenhuma solicitação recusada',
                                'launch': 'Nenhuma solicitação aprovada',
                                'success': 'Nenhuma solicitação concluída',
                                'refund': 'Nenhuma solicitação em estorno'
                            };
                            emptyMsg.innerHTML = `
                                <i class="fas fa-inbox"></i>
                                <p>${emptyMessages[oldColumn] || 'Nenhuma solicitação'}</p>
                            `;
                            oldColumnContent.appendChild(emptyMsg);
                        }
                    }
                }
                
                // Atualizar contadores - SEMPRE contar apenas cards visíveis (não usar valores do backend que são totais)
                if (typeof window.updateCardCountersAfterFilter === 'function') {
                    window.updateCardCountersAfterFilter();
                } else {
                    // Fallback: contar cards visíveis manualmente
                    document.querySelectorAll('.kanban-column').forEach(column => {
                        const columnContent = column.querySelector('.column-content');
                        const counter = column.querySelector('.card-count');
                        if (columnContent && counter) {
                            const allCards = columnContent.querySelectorAll('.card');
                            const visibleCards = Array.from(allCards).filter(card => {
                                const style = window.getComputedStyle(card);
                                return style.display !== 'none' && 
                                       card.style.display !== 'none' &&
                                       style.visibility !== 'hidden' &&
                                       style.opacity !== '0';
                            });
                            counter.textContent = visibleCards.length;
                        }
                    });
                }
                
                // Recalcular o tempo
                if (typeof calculateQueueTime === 'function') {
                    calculateQueueTime();
                }
                
                // Atualizar no array this.cards se existir
                const card = this.cards.find(c => c.id == cardId);
                if (card) {
                    card.status = newStatus;
                    card.updatedAt = new Date();
                    this.saveCards();
                }
                
                // Notificação de sucesso
                const columnNames = {
                    'planning': 'Pendente',
                    'test': 'Recusado',
                    'launch': 'Aprovado',
                    'success': 'Concluído',
                    'refund': 'Estorno'
                };
                
                if (typeof Utils !== 'undefined' && Utils.showNotification) {
                    Utils.showNotification(`✅ Solicitação movida para "${columnNames[newColumn]}" com sucesso!`, 'success');
                } else {
                    console.log(`✅ Solicitação movida para "${columnNames[newColumn]}" com sucesso!`);
                }
                
                // Salvar filtro atual ANTES de recarregar - preservar o valor que o usuário selecionou
                const requestTypeSelect = document.getElementById('requestTypeSelect');
                if (requestTypeSelect && requestTypeSelect.value) {
                    // Salvar o valor atual do select (que o usuário escolheu)
                    localStorage.setItem('filterType', requestTypeSelect.value);
                    console.log('✅ Filtro salvo antes do reload:', requestTypeSelect.value);
                } else {
                    // Se não houver valor no select, manter o que está no localStorage
                    const currentFilter = localStorage.getItem('filterType');
                    if (!currentFilter) {
                        // Se não houver nada salvo, usar deslocamento como padrão
                        localStorage.setItem('filterType', 'deslocamento');
                    }
                }
                
                // Recarregar a página para garantir que todos os dados sejam atualizados do banco
                setTimeout(() => {
                    window.location.reload();
                }, 500);
            } else {
                // Erro
                console.error('❌ Erro do backend:', data.message);
                if (typeof Utils !== 'undefined' && Utils.showNotification) {
                    Utils.showNotification(`❌ Erro: ${data.message || 'Erro ao mover solicitação'}`, 'error');
                } else {
                    alert(`❌ Erro: ${data.message || 'Erro ao mover solicitação'}`);
                }
            }
        })
        .catch(error => {
            console.error('❌ Erro ao atualizar status:', error);
            
            // Verificar se é erro de conexão
            let errorMessage = '❌ Erro ao salvar. Tente novamente.';
            if (error.message && error.message.includes('Failed to fetch')) {
                errorMessage = '❌ Servidor não disponível. Verifique se o servidor Django está rodando.';
            } else if (error.message && error.message.includes('ERR_CONNECTION_REFUSED')) {
                errorMessage = '❌ Não foi possível conectar ao servidor. Inicie o servidor Django.';
            }
            
            if (typeof Utils !== 'undefined' && Utils.showNotification) {
                Utils.showNotification(errorMessage, 'error');
            } else {
                alert(errorMessage);
            }
        });
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
            'success': 'concluido',
            'refund': 'estorno'
        };
        return columnMap[column] || 'pendente';
    }

    addCardToColumn(column) {
        // Implementar adição rápida de card
        console.log('Adicionar card à coluna:', column);
        if (typeof Utils !== 'undefined' && Utils.showNotification) {
            Utils.showNotification('Funcionalidade de adição rápida em desenvolvimento', 'info');
        } else {
            console.log('Funcionalidade de adição rápida em desenvolvimento');
        }
    }

    showColumnMenu(button) {
        // Implementar menu da coluna
        console.log('Mostrar menu da coluna');
        if (typeof Utils !== 'undefined' && Utils.showNotification) {
            Utils.showNotification('Menu da coluna em desenvolvimento', 'info');
        } else {
            console.log('Menu da coluna em desenvolvimento');
        }
    }

    updateCardCounts() {
        const counts = {
            planning: 0,
            test: 0,
            launch: 0,
            success: 0,
            refund: 0
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
        if (typeof Utils !== 'undefined' && Utils.showNotification) {
            Utils.showNotification('Card excluído com sucesso!', 'success');
        } else {
            console.log('Card excluído com sucesso!');
        }
    }

    updateCard(id, updates) {
        const card = this.getCardById(id);
        if (card) {
            Object.assign(card, updates);
            card.updatedAt = new Date();
            this.renderCards();
            this.saveCards();
            if (typeof Utils !== 'undefined' && Utils.showNotification) {
                Utils.showNotification('Card atualizado com sucesso!', 'success');
            } else {
                console.log('Card atualizado com sucesso!');
            }
        }
    }
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    window.kanbanManager = new KanbanManager();
});
