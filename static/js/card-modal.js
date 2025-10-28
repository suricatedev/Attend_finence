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
            const diffMs = now - creationDate;
            
            // Converter para minutos
            const diffMinutes = Math.floor(diffMs / (1000 * 60));
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
    const content = document.getElementById('cardDetailContent');
    const header = modal.querySelector('.modal-header');
    
    // Extrair dados do card
    const cardData = extractCardData(card);
    
    // Preencher conteúdo do modal
    content.innerHTML = generateCardDetailHTML(cardData);
    
    // Ajustar cor do header conforme status da coluna
    header.classList.remove('status-pendente','status-aprovado','status-recusado','status-concluido');
    const columnEl = card.closest('.kanban-column');
    const columnLabel = columnEl ? columnEl.querySelector('.column-title span:nth-child(2)') : null;
    const statusText = columnLabel ? columnLabel.textContent.trim().toLowerCase() : '';
    if (statusText.includes('pendente')) header.classList.add('status-pendente');
    else if (statusText.includes('aprovado')) header.classList.add('status-aprovado');
    else if (statusText.includes('recusado')) header.classList.add('status-recusado');
    else if (statusText.includes('concluído') || statusText.includes('concluido')) header.classList.add('status-concluido');

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
    
    // Extrair informações dos campos
    const infoItems = card.querySelectorAll('.info-item');
    infoItems.forEach(item => {
        const label = item.querySelector('.info-label');
        const value = item.querySelector('.info-value');
        
        if (label && value) {
            const labelText = label.textContent.toLowerCase();
            if (labelText.includes('id')) {
                data.id = value.textContent;
            } else if (labelText.includes('solicitante')) {
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
    
    // Extrair tempo na fila
    const timeElement = card.querySelector('.queue-time');
    data.tempoFila = timeElement ? timeElement.textContent : '0min';
    
    return data;
}

// Função para gerar HTML dos detalhes do card
function generateCardDetailHTML(data) {
    return `
        <div class="card-detail-info">
            <div class="detail-section info-basicas">
                <div class="section-title">
                    <i class="fas fa-info-circle"></i>
                    Informações Básicas
                </div>
                <div class="detail-item">
                    <div class="detail-label">ID da Solicitação</div>
                    <div class="detail-value highlight">${data.id || 'N/A'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Título</div>
                    <div class="detail-value">${data.titulo}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Solicitante</div>
                    <div class="detail-value">${data.solicitante || 'N/A'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Recebedor</div>
                    <div class="detail-value">${data.recebedor || 'N/A'}</div>
                </div>
            </div>
            
            <div class="detail-section valores-status">
                <div class="section-title">
                    <i class="fas fa-dollar-sign"></i>
                    Valores e Status
                </div>
                <div class="detail-item">
                    <div class="detail-label">Valor</div>
                    <div class="detail-value highlight">${data.valor || 'R$ 0,00'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Prioridade</div>
                    <div class="detail-value status-${data.prioridade?.toLowerCase() || 'media'}">${data.prioridade || 'Média'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Status</div>
                    <div class="detail-value status-${data.status?.toLowerCase().replace(/\s+/g, '') || 'pendente'}">${data.status || 'Pendente'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Tempo na Fila</div>
                    <div class="detail-value">${data.tempoFila || '0min'}</div>
                </div>
            </div>
        </div>
        
        <div class="card-detail-info">
            <div class="detail-section datas">
                <div class="section-title">
                    <i class="fas fa-calendar"></i>
                    Datas
                </div>
                <div class="detail-item">
                    <div class="detail-label">Data de Criação</div>
                    <div class="detail-value">${data.dataCriacao || 'N/A'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Data de Pagamento</div>
                    <div class="detail-value">${data.dataPagamento || 'N/A'}</div>
                </div>
            </div>
            
            <div class="detail-section tempos">
                <div class="section-title">
                    <i class="fas fa-clock"></i>
                    Tempos
                </div>
                <div class="detail-item">
                    <div class="detail-label">Tempo de Criação</div>
                    <div class="detail-value">${data.tempoCriacao || 'N/A'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Tempo na Fila</div>
                    <div class="detail-value">${data.tempoFila || '0min'}</div>
                </div>
            </div>
        </div>
    `;
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
});
