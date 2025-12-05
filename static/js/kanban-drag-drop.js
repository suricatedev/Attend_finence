// Sistema de Drag and Drop para Kanban Board
// Implementação completa e independente

(function() {
    'use strict';
    
    let draggedCardId = null;
    let draggedCardElement = null;
    
    // Função helper para pegar cookie
    function getCookie(name) {
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
    
    // Função para mover card diretamente
    function moveCardDirectly(cardId, newColumn, cardElement, oldColumn) {
        console.log('📦 Movendo card diretamente:', { cardId, newColumn, oldColumn });
        
        // Buscar coluna de destino
        const targetColumnContent = document.querySelector(`[data-column="${newColumn}"] .column-content`);
        if (!targetColumnContent) {
            console.error('❌ Coluna destino não encontrada:', newColumn);
            return;
        }
        
        // Enviar requisição para o backend
        const csrftoken = getCookie('csrftoken');
        
        fetch('/solicitacoes/atualizar-status/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken
            },
            body: JSON.stringify({
                card_id: cardId,
                status: newColumn
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Remover card da coluna antiga
                const oldParent = cardElement.parentNode;
                if (oldParent) {
                    oldParent.removeChild(cardElement);
                }
                
                // Adicionar à nova coluna
                targetColumnContent.appendChild(cardElement);
                
                // Atualizar classes do card
                cardElement.classList.remove('dragging', 'card-status-pending', 'card-status-rejected', 'card-status-approved', 'card-status-completed');
                const statusClasses = {
                    'planning': 'card-status-pending',
                    'test': 'card-status-rejected',
                    'launch': 'card-status-approved',
                    'success': 'card-status-completed'
                };
                if (statusClasses[newColumn]) {
                    cardElement.classList.add(statusClasses[newColumn]);
                }
                
                // Atualizar footer
                const cardFooter = cardElement.querySelector('.card-footer');
                if (cardFooter) {
                    const statusLabels = {
                        'planning': 'Solicitação pendente de análise',
                        'test': 'Solicitação recusada',
                        'launch': 'Solicitação aprovada',
                        'success': 'Solicitação concluída'
                    };
                    const stageElement = cardFooter.querySelector('.card-stage');
                    if (stageElement) {
                        stageElement.textContent = statusLabels[newColumn] || 'Solicitação';
                    }
                }
                
                // Atualizar tempo
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
                
                // Remover mensagem de coluna vazia
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
                                'success': 'Nenhuma solicitação concluída'
                            };
                            emptyMsg.innerHTML = `
                                <i class="fas fa-inbox"></i>
                                <p>${emptyMessages[oldColumn] || 'Nenhuma solicitação'}</p>
                            `;
                            oldColumnContent.appendChild(emptyMsg);
                        }
                    }
                }
                
                // Atualizar contadores usando os valores do backend
                if (data.counters) {
                    const statusMapping = {
                        'pendente': 'planning',
                        'recusado': 'test',
                        'aprovado': 'launch',
                        'concluido': 'success'
                    };
                    
                    Object.keys(data.counters).forEach(status => {
                        const columnType = statusMapping[status];
                        if (columnType) {
                            const columnElement = document.querySelector(`[data-column="${columnType}"]`);
                            if (columnElement) {
                                const counter = columnElement.querySelector('.card-count');
                                if (counter) {
                                    counter.textContent = data.counters[status];
                                }
                            }
                        }
                    });
                } else {
                    // Fallback: atualizar contadores manualmente se não houver dados do backend
                    document.querySelectorAll('.kanban-column').forEach(column => {
                        const columnContent = column.querySelector('.column-content');
                        const counter = column.querySelector('.card-count');
                        if (columnContent && counter) {
                            const cards = columnContent.querySelectorAll('.card:not(.empty-column)');
                            counter.textContent = cards.length;
                        }
                    });
                }
                
                // Recalcular tempo
                if (typeof calculateQueueTime === 'function') {
                    calculateQueueTime();
                }
                
                // Notificação
                const columnNames = {
                    'planning': 'Pendente',
                    'test': 'Recusado',
                    'launch': 'Aprovado',
                    'success': 'Concluído'
                };
                
                if (typeof Utils !== 'undefined' && typeof Utils.showNotification === 'function') {
                    Utils.showNotification(`✅ Solicitação movida para "${columnNames[newColumn]}" com sucesso!`, 'success');
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
                
                console.log('✅ Card movido com sucesso');
            } else {
                console.error('❌ Erro do backend:', data.message);
                if (typeof Utils !== 'undefined' && typeof Utils.showNotification === 'function') {
                    Utils.showNotification(`❌ Erro: ${data.message || 'Erro ao mover solicitação'}`, 'error');
                }
            }
        })
        .catch(error => {
            console.error('❌ Erro ao atualizar status:', error);
            if (typeof Utils !== 'undefined' && typeof Utils.showNotification === 'function') {
                Utils.showNotification('❌ Erro ao salvar. Tente novamente.', 'error');
            }
        })
        .finally(() => {
            // Limpar estado
            cardElement.classList.remove('dragging');
            draggedCardId = null;
            draggedCardElement = null;
        });
    }
    
    // Aguardar DOM estar pronto
    function initDragAndDrop() {
        // Remover listeners antigos se existirem
        document.removeEventListener('dragstart', handleDragStart, true);
        document.removeEventListener('dragend', handleDragEnd, true);
        document.removeEventListener('dragover', handleDragOver, true);
        document.removeEventListener('drop', handleDrop, true);
        document.removeEventListener('dragleave', handleDragLeave, true);
        
        // Adicionar novos listeners
        document.addEventListener('dragstart', handleDragStart, true);
        document.addEventListener('dragend', handleDragEnd, true);
        document.addEventListener('dragover', handleDragOver, true);
        document.addEventListener('drop', handleDrop, true);
        document.addEventListener('dragleave', handleDragLeave, true);
        
        console.log('✅ Drag and Drop inicializado');
    }
    
    function handleDragStart(e) {
        const card = e.target.closest('.card');
        if (!card || !card.hasAttribute('draggable')) return;
        
        // Verificar permissão
        if (typeof window.USER_CAN_CHANGE_STATUS !== 'undefined' && !window.USER_CAN_CHANGE_STATUS) {
            e.preventDefault();
            return false;
        }
        
        draggedCardId = card.dataset.cardId;
        draggedCardElement = card;
        card.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', draggedCardId);
        
        console.log('🚀 Drag iniciado:', draggedCardId);
    }
    
    function handleDragEnd(e) {
        if (draggedCardElement) {
            draggedCardElement.classList.remove('dragging');
        }
        document.querySelectorAll('.column-content').forEach(col => {
            col.classList.remove('drag-over');
        });
        draggedCardId = null;
        draggedCardElement = null;
    }
    
    function handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
        
        if (!draggedCardId) return;
        
        // Encontrar coluna
        let columnContent = e.target.closest('.column-content');
        if (!columnContent) {
            const kanbanColumn = e.target.closest('.kanban-column');
            if (kanbanColumn) {
                columnContent = kanbanColumn.querySelector('.column-content');
            }
        }
        
        if (columnContent) {
            document.querySelectorAll('.column-content').forEach(col => {
                col.classList.remove('drag-over');
            });
            columnContent.classList.add('drag-over');
        }
    }
    
    function handleDragLeave(e) {
        const columnContent = e.target.closest('.column-content');
        if (columnContent) {
            const relatedTarget = e.relatedTarget;
            if (!relatedTarget || !columnContent.contains(relatedTarget)) {
                columnContent.classList.remove('drag-over');
            }
        }
    }
    
    function handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        
        if (!draggedCardId || !draggedCardElement) {
            return;
        }
        
        // Verificar permissão
        if (typeof window.USER_CAN_CHANGE_STATUS !== 'undefined' && !window.USER_CAN_CHANGE_STATUS) {
            return;
        }
        
        // Remover drag-over de todas as colunas
        document.querySelectorAll('.column-content').forEach(col => {
            col.classList.remove('drag-over');
        });
        
        // Encontrar coluna de destino
        let targetColumnName = null;
        
        // Tentar encontrar pelo elemento onde foi solto
        let kanbanColumn = e.target.closest('.kanban-column');
        if (kanbanColumn && kanbanColumn.dataset.column) {
            targetColumnName = kanbanColumn.dataset.column;
            console.log('✅ Coluna encontrada pelo elemento solto:', targetColumnName);
        }
        
        // Se não encontrou, tentar pela coluna com drag-over
        if (!targetColumnName) {
            const dragOverColumn = document.querySelector('.column-content.drag-over');
            if (dragOverColumn) {
                kanbanColumn = dragOverColumn.closest('.kanban-column');
                if (kanbanColumn && kanbanColumn.dataset.column) {
                    targetColumnName = kanbanColumn.dataset.column;
                    console.log('✅ Coluna encontrada pelo drag-over:', targetColumnName);
                }
            }
        }
        
        // Se ainda não encontrou, tentar encontrar pela coluna mais próxima do elemento
        if (!targetColumnName) {
            const columnContent = e.target.closest('.column-content');
            if (columnContent) {
                kanbanColumn = columnContent.closest('.kanban-column');
                if (kanbanColumn && kanbanColumn.dataset.column) {
                    targetColumnName = kanbanColumn.dataset.column;
                    console.log('✅ Coluna encontrada pelo column-content:', targetColumnName);
                }
            }
        }
        
        if (!targetColumnName) {
            console.error('❌ Coluna de destino não encontrada. Elemento:', e.target.className, e.target.tagName);
            draggedCardElement.classList.remove('dragging');
            draggedCardId = null;
            draggedCardElement = null;
            return;
        }
        
        // Verificar coluna de origem
        const sourceColumn = draggedCardElement.closest('.kanban-column');
        const sourceColumnName = sourceColumn?.dataset.column;
        
        // Se for a mesma coluna, não fazer nada
        if (sourceColumnName === targetColumnName) {
            console.log('ℹ️ Card já está nesta coluna');
            draggedCardElement.classList.remove('dragging');
            draggedCardId = null;
            draggedCardElement = null;
            return;
        }
        
        console.log('📋 Movendo card:', { cardId: draggedCardId, sourceColumnName, targetColumnName });
        
        // Mapeamento de nomes
        const columnNames = {
            'planning': 'Pendente',
            'test': 'Recusado',
            'launch': 'Aprovado',
            'success': 'Concluído'
        };
        
        // Obter título do card
        const cardTitle = draggedCardElement.querySelector('.card-title')?.textContent?.trim() || `Solicitação #${draggedCardId}`;
        const sourceName = columnNames[sourceColumnName] || 'Coluna original';
        const targetName = columnNames[targetColumnName] || 'Coluna destino';
        
        // Mostrar confirmação
        const confirmMessage = `Deseja realmente mover a solicitação "${cardTitle}" de "${sourceName}" para "${targetName}"?`;
        
        if (confirm(confirmMessage)) {
            // Tentar usar o KanbanManager se disponível, senão mover diretamente
            const manager = window.kanbanManager;
            if (manager && typeof manager.moveCard === 'function') {
                console.log('✅ Movendo card via KanbanManager');
                manager.moveCard(draggedCardId, targetColumnName);
            } else {
                console.log('ℹ️ Movendo card diretamente (sem KanbanManager)');
                moveCardDirectly(draggedCardId, targetColumnName, draggedCardElement, sourceColumnName);
            }
        } else {
            // Cancelar
            draggedCardElement.classList.remove('dragging');
            draggedCardId = null;
            draggedCardElement = null;
        }
    }
    
    // Inicializar quando o DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDragAndDrop);
    } else {
        initDragAndDrop();
    }
    
    // Re-inicializar após um delay para garantir
    setTimeout(initDragAndDrop, 500);
    setTimeout(initDragAndDrop, 1000);
    
    // Expor função globalmente para re-inicialização manual se necessário
    window.reinitDragAndDrop = initDragAndDrop;
    
})();