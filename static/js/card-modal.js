// ========================================
// MODAL DE DETALHES DO CARD
// ========================================

// Função para calcular tempo na fila
function calculateQueueTime() {
    const timeElements = document.querySelectorAll('.card-time[data-creation-time]');
    
    timeElements.forEach(element => {
        const creationTime = element.getAttribute('data-creation-time');
        if (creationTime) {
            const creationDate = new Date(creationTime);
            const now = new Date();
            let diffMs = now - creationDate;
            
            // ✅ GARANTIR QUE NUNCA SEJA NEGATIVO
            if (diffMs < 0) {
                diffMs = 0; // Se a data de criação está no futuro, usar 0
            }
            
            // Converter para minutos
            let diffMinutes = Math.floor(diffMs / (1000 * 60));
            const diffHours = Math.floor(diffMinutes / 60);
            const diffDays = Math.floor(diffHours / 24);
            
            let timeText = '';
            if (diffDays > 0) {
                timeText = `${diffDays}d ${diffHours % 24}h`;
            } else if (diffHours > 0) {
                timeText = `${diffHours}h ${diffMinutes % 60}min`;
            } else {
                timeText = `${diffMinutes}min`;
            }
            
            const timeSpan = element.querySelector('.queue-time');
            if (timeSpan) {
                timeSpan.textContent = timeText;
            }
        }
    });
}

// Função para inicializar expansão dos cards do Django
function initializeCardExpansion() {
    const cards = document.querySelectorAll('.card');
    
    cards.forEach(card => {
        // Adicionar evento de clique para abrir modal de detalhes
        card.addEventListener('click', function(e) {
            // Não abrir modal se clicar nos botões de ação ou elementos específicos
            if (e.target.closest('.card-actions') || 
                e.target.closest('.card-action-btn') ||
                e.target.closest('.priority') ||
                e.target.closest('.card-count')) {
                return;
            }
            
            openCardDetailModal(card);
        });
        
        // Adicionar indicador visual de que o card é clicável
        if (!card.querySelector('.expand-indicator')) {
            const indicator = document.createElement('div');
            indicator.className = 'expand-indicator';
            indicator.innerHTML = '<i class="fas fa-external-link-alt"></i>';
            card.appendChild(indicator);
        }
    });
}

// Função para abrir modal de detalhes do card
function openCardDetailModal(card) {
    const modal = document.getElementById('cardDetailModal');
    const header = modal.querySelector('.modal-header');
    
    if (!modal) {
        console.error('Modal não encontrado!');
        return;
    }
    
    // Extrair dados do card
    const cardData = extractCardData(card);
    
    // Adicionar ID do card ao modal para referência
    const cardId = card.getAttribute('data-card-id') || Math.random().toString(36).substr(2, 9);
    modal.setAttribute('data-card-id', cardId);
    
    // Preencher dados do modal
    populateCardDetails(cardData);
    
    // Ajustar cor do header conforme status da coluna
    header.classList.remove('status-pendente','status-aprovado','status-recusado','status-concluido');
    const columnEl = card.closest('.kanban-column');
    const columnLabel = columnEl ? columnEl.querySelector('.column-title span:nth-child(2)') : null;
    const statusText = columnLabel ? columnLabel.textContent.trim().toLowerCase() : '';
    if (statusText.includes('pendente')) header.classList.add('status-pendente');
    else if (statusText.includes('aprovado')) header.classList.add('status-aprovado');
    else if (statusText.includes('recusado')) header.classList.add('status-recusado');
    else if (statusText.includes('concluído') || statusText.includes('concluido')) header.classList.add('status-concluido');

    // A seção "Mover para Fila" já está controlada pelo template Django (permissões)
    // Se o usuário não tem permissão, a seção não será renderizada
    
    // Mostrar modal
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    
    // Adicionar event listeners para fechar modal
    setupModalEventListeners();
}

// Função para extrair dados do card
function extractCardData(card) {
    const data = {};
    
    // Extrair informações básicas
    const title = card.querySelector('.card-title');
    data.titulo = title ? title.textContent : 'Sem título';
    
    // ✅ Extrair ID (primeiro info-item que não tem label - é o ticket)
    const firstInfoItem = card.querySelector('.info-item');
    if (firstInfoItem) {
        const firstValue = firstInfoItem.querySelector('.info-value');
        const firstLabel = firstInfoItem.querySelector('.info-label');
        if (firstValue && !firstLabel) {
            // Remove o # do início se existir
            data.id = firstValue.textContent.replace(/^#/, '').trim();
        }
    }
    
    // ✅ Backup: se não encontrou ID no primeiro item, tenta pegar do data-card-id
    if (!data.id || data.id === '') {
        const cardId = card.getAttribute('data-card-id');
        if (cardId) {
            data.id = cardId;
        }
    }
    
    // Extrair informações dos campos
    const infoItems = card.querySelectorAll('.info-item');
    infoItems.forEach(item => {
        const label = item.querySelector('.info-label');
        const value = item.querySelector('.info-value');
        
        if (label && value) {
            const labelText = label.textContent.toLowerCase();
            if (labelText.includes('solicitante')) {
                data.solicitante = value.textContent;
            } else if (labelText.includes('recebedor')) {
                data.recebedor = value.textContent;
            } else if (labelText.includes('valor')) {
                data.valor = value.textContent;
            } else if (labelText.includes('criação')) {
                data.dataCriacao = value.textContent;
            } else if (labelText.includes('pagamento')) {
                data.dataPagamento = value.textContent;
            }
        }
    });
    
    // Extrair prioridade
    const priority = card.querySelector('.priority');
    data.prioridade = priority ? priority.textContent : 'Média';
    
    // Extrair status
    const status = card.querySelector('.card-stage');
    data.status = status ? status.textContent : 'Pendente';
    
    return data;
}

// Função para preencher os dados do card no modal
function populateCardDetails(data) {
    // Preencher informações básicas
    const idElement = document.getElementById('modal-id');
    if (idElement) idElement.textContent = data.id || 'N/A';
    
    const titleElement = document.getElementById('modal-titulo');
    if (titleElement) titleElement.textContent = data.titulo || 'Sem título';
    
    const solicitanteElement = document.getElementById('modal-solicitante');
    if (solicitanteElement) solicitanteElement.textContent = data.solicitante || 'N/A';
    
    const recebedorElement = document.getElementById('modal-recebedor');
    if (recebedorElement) recebedorElement.textContent = data.recebedor || 'N/A';
    
    // Preencher valores e status
    const valorElement = document.getElementById('modal-valor');
    if (valorElement) valorElement.textContent = data.valor || 'R$ 0,00';
    
    const prioridadeElement = document.getElementById('modal-prioridade');
    if (prioridadeElement) {
        prioridadeElement.textContent = data.prioridade || 'Média';
        prioridadeElement.className = `detail-value status-${(data.prioridade?.toLowerCase() || 'media')}`;
    }
    
    const statusElement = document.getElementById('modal-status');
    if (statusElement) {
        statusElement.textContent = data.status || 'Pendente';
        statusElement.className = `detail-value status-${(data.status?.toLowerCase().replace(/\s+/g, '') || 'pendente')}`;
    }
    
    // Preencher datas
    const dataCriacaoElement = document.getElementById('modal-data-criacao');
    if (dataCriacaoElement) dataCriacaoElement.textContent = data.dataCriacao || 'N/A';
    
    const dataPagamentoElement = document.getElementById('modal-data-pagamento');
    if (dataPagamentoElement) dataPagamentoElement.textContent = data.dataPagamento || 'N/A';
}

// Função para configurar event listeners do modal
function setupModalEventListeners() {
    const modal = document.getElementById('cardDetailModal');
    const closeBtn = document.getElementById('closeCardModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const overlay = modal.querySelector('.modal-overlay');
    
    // Fechar modal com botão X
    closeBtn.addEventListener('click', closeCardDetailModal);
    
    // Fechar modal com botão Voltar
    closeModalBtn.addEventListener('click', closeCardDetailModal);
    
    // Fechar modal clicando no overlay
    overlay.addEventListener('click', closeCardDetailModal);
    
    // Fechar modal com ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.classList.contains('show')) {
            closeCardDetailModal();
        }
    });
    
    // Event listener para mover card entre filas
    const moverFilaBtn = document.getElementById('moverFilaBtn');
    if (moverFilaBtn) {
        moverFilaBtn.addEventListener('click', function() {
            const filaSelect = document.getElementById('filaSelect');
            const selectedFila = filaSelect.value;
            const currentCard = modal.getAttribute('data-card-id');
            
            if (currentCard && selectedFila) {
                moveCardToFila(currentCard, selectedFila);
            }
        });
    }
}

// Função para mover card entre filas
function moveCardToFila(cardId, targetFila) {
    const card = document.querySelector(`[data-card-id="${cardId}"]`);
    if (!card) return;
    
    // Encontrar a coluna de destino
    const targetColumn = document.querySelector(`[data-column="${targetFila}"] .column-content`);
    if (!targetColumn) return;
    
    // Mostrar loading
    showNotification('Salvando...', 'info');
    
    // Enviar requisição para o backend
    fetch('/solicitacoes/atualizar-status/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({
            card_id: cardId,
            status: targetFila
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Remover classes de status antigas
            card.classList.remove('card-status-pending', 'card-status-rejected', 'card-status-approved', 'card-status-completed');
            
            // Adicionar nova classe de status baseada na fila de destino
            const statusClasses = {
                'planning': 'card-status-pending',
                'test': 'card-status-rejected', 
                'launch': 'card-status-approved',
                'success': 'card-status-completed'
            };
            
            if (statusClasses[targetFila]) {
                card.classList.add(statusClasses[targetFila]);
            }
            
            // Remover card da coluna atual
            card.remove();
            
            // Adicionar card na nova coluna
            targetColumn.appendChild(card);
            
            // Atualizar contadores das colunas
            updateColumnCounters();
            
            // Fechar modal
            closeCardDetailModal();
            
            // Mostrar notificação de sucesso
            showNotification(`✅ Status atualizado para ${getFilaName(targetFila)}!`, 'success');
        } else {
            showNotification(`❌ Erro: ${data.message}`, 'error');
        }
    })
    .catch(error => {
        console.error('Erro ao atualizar status:', error);
        showNotification('❌ Erro ao salvar. Tente novamente.', 'error');
    });
}

// Função para pegar o CSRF token
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

// Função para obter nome da fila
function getFilaName(filaValue) {
    const filas = {
        'planning': 'Pendente',
        'test': 'Recusado',
        'launch': 'Aprovado',
        'success': 'Concluído'
    };
    return filas[filaValue] || filaValue;
}

// Função para atualizar contadores das colunas
function updateColumnCounters() {
    const columns = document.querySelectorAll('.kanban-column');
    columns.forEach(column => {
        const content = column.querySelector('.column-content');
        const counter = column.querySelector('.card-count');
        if (content && counter) {
            // Contar apenas elementos com classe 'card', ignorando 'empty-column' e outros
            const cards = content.querySelectorAll('.card:not(.empty-column)');
            const cardCount = cards.length;
            counter.textContent = cardCount;
            
            // Mostrar/ocultar mensagem de coluna vazia
            const emptyMessage = content.querySelector('.empty-column');
            if (cardCount === 0 && !emptyMessage) {
                // Adicionar mensagem se não tiver cards
                const empty = document.createElement('div');
                empty.className = 'empty-column';
                empty.innerHTML = `
                    <i class="fas fa-inbox"></i>
                    <p>Nenhuma solicitação</p>
                `;
                content.appendChild(empty);
            } else if (cardCount > 0 && emptyMessage) {
                // Remover mensagem se tiver cards
                emptyMessage.remove();
            }
        }
    });
}

// Função para mostrar notificação
function showNotification(message, type = 'info') {
    // Criar elemento de notificação
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Adicionar ao body
    document.body.appendChild(notification);
    
    // Mostrar notificação
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Remover após 3 segundos
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Função para fechar modal de detalhes
function closeCardDetailModal() {
    const modal = document.getElementById('cardDetailModal');
    modal.classList.remove('show');
    document.body.style.overflow = '';
}

// Inicialização quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    calculateQueueTime();
    
    // Atualizar a cada minuto
    setInterval(calculateQueueTime, 60000);
    
    // Inicializar expansão dos cards do Django
    initializeCardExpansion();
    
    // Inicializar filtros das colunas
    initializeColumnFilters();
});

// ========================================
// SISTEMA DE FILTROS DAS COLUNAS
// ========================================

// Função para inicializar filtros das colunas
function initializeColumnFilters() {
    const filterInputs = document.querySelectorAll('.filter-input');
    
    filterInputs.forEach(input => {
        const column = input.getAttribute('data-column');
        const clearBtn = input.parentElement.querySelector('.filter-clear-btn');
        
        // Event listener para digitação
        input.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase().trim();
            filterCardsInColumn(column, searchTerm);
            updateClearButton(clearBtn, searchTerm);
        });
        
        // Event listener para botão limpar
        clearBtn.addEventListener('click', function() {
            input.value = '';
            filterCardsInColumn(column, '');
            updateClearButton(clearBtn, '');
            input.focus();
        });
        
        // Event listener para Enter
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                this.value = '';
                filterCardsInColumn(column, '');
                updateClearButton(clearBtn, '');
            }
        });
    });
}

// Função para filtrar cards em uma coluna específica
function filterCardsInColumn(column, searchTerm) {
    const columnContent = document.querySelector(`[data-column="${column}"].column-content`);
    if (!columnContent) return;
    
    const cards = columnContent.querySelectorAll('.card');
    let visibleCount = 0;
    
    cards.forEach(card => {
        const cardText = getCardSearchableText(card).toLowerCase();
        const isMatch = searchTerm === '' || cardText.includes(searchTerm);
        
        if (isMatch) {
            card.classList.remove('filtered-out');
            card.classList.add('filtered-in');
            visibleCount++;
        } else {
            card.classList.remove('filtered-in');
            card.classList.add('filtered-out');
        }
    });
    
    // Atualizar contador da coluna
    updateColumnCounter(column, visibleCount);
}

// Função para extrair texto pesquisável do card
function getCardSearchableText(card) {
    const title = card.querySelector('.card-title')?.textContent || '';
    const id = card.querySelector('.info-value')?.textContent || '';
    const solicitante = card.querySelectorAll('.info-value')[1]?.textContent || '';
    const recebedor = card.querySelectorAll('.info-value')[2]?.textContent || '';
    const valor = card.querySelectorAll('.info-value')[3]?.textContent || '';
    const prioridade = card.querySelector('.priority')?.textContent || '';
    const status = card.querySelector('.card-stage')?.textContent || '';
    
    return `${title} ${id} ${solicitante} ${recebedor} ${valor} ${prioridade} ${status}`;
}

// Função para atualizar botão limpar
function updateClearButton(clearBtn, searchTerm) {
    if (searchTerm.length > 0) {
        clearBtn.classList.add('show');
    } else {
        clearBtn.classList.remove('show');
    }
}

// Função para atualizar contador da coluna
function updateColumnCounter(column, visibleCount) {
    const columnElement = document.querySelector(`[data-column="${column}"].kanban-column`);
    if (!columnElement) return;
    
    const counter = columnElement.querySelector('.card-count');
    if (counter) {
        counter.textContent = visibleCount;
    }
}

// Função para limpar todos os filtros
function clearAllFilters() {
    const filterInputs = document.querySelectorAll('.filter-input');
    filterInputs.forEach(input => {
        input.value = '';
        const column = input.getAttribute('data-column');
        const clearBtn = input.parentElement.querySelector('.filter-clear-btn');
        filterCardsInColumn(column, '');
        updateClearButton(clearBtn, '');
    });
}
