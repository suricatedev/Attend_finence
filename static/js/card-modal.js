// ========================================
// MODAL DE DETALHES DO CARD
// ========================================

// Flag para evitar registrar listeners duplicados
let modalListenersSetup = false;
// Função para calcular tempo na fila (a partir da entrada no status atual)
function calculateQueueTime() {
    // Buscar por data-entry-time (preferencial) ou data-creation-time (fallback)
    const timeElements = document.querySelectorAll('.card-time[data-entry-time], .card-time[data-creation-time]');
    
    timeElements.forEach(element => {
        // Priorizar data-entry-time (quando entrou no status atual)
        let entryTime = element.getAttribute('data-entry-time');
        if (!entryTime) {
            // Fallback para data-creation-time (compatibilidade)
            entryTime = element.getAttribute('data-creation-time');
        }
        
        if (entryTime) {
            // Converter para Date object
            const entryDate = new Date(entryTime);
            const now = new Date();
            let diffMs = now - entryDate;
            
            // ✅ GARANTIR QUE NUNCA SEJA NEGATIVO
            if (diffMs < 0) {
                diffMs = 0; // Se a data está no futuro, usar 0
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
async function openCardDetailModal(card) {    const modal = document.getElementById('cardDetailModal');
    const header = modal.querySelector('.modal-header');
    
    if (!modal) {
        console.error('Modal não encontrado!');
        return;
    }
    
    // Extrair dados do card (agora é async)
    const cardData = await extractCardData(card);    
    // Adicionar ID do card ao modal para referência
    const cardId = card.getAttribute('data-card-id') || Math.random().toString(36).substr(2, 9);
    modal.setAttribute('data-card-id', cardId);
    
    // Limpar seções anteriores antes de preencher
    const routeItemsSection = document.getElementById('modal-route-items');
    if (routeItemsSection) {
        routeItemsSection.remove();
    }
    const casualValoresSection = document.getElementById('modal-casual-valores');
    if (casualValoresSection) {
        casualValoresSection.remove();
    }
    
    // Restaurar campo "Valor" se estava oculto
    const valorElement = document.getElementById('modal-valor');
    const valorContainer = valorElement ? valorElement.closest('.detail-item') : null;
    if (valorContainer) {
        valorContainer.style.display = '';
    }
    
    // Restaurar título da seção se foi alterado
    const valoresStatusSection = document.querySelector('.detail-section.valores-status');
    if (valoresStatusSection) {
        const sectionTitle = valoresStatusSection.querySelector('.section-title');
        if (sectionTitle) {
            sectionTitle.innerHTML = '<i class="fas fa-dollar-sign"></i> Valores e Status';
        }
    }
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

// Função para extrair dados do card (agora é async para suportar AJAX)
async function extractCardData(card) {
    const data = {};
    
    // Extrair informações básicas primeiro
    const title = card.querySelector('.card-title');
    data.titulo = title ? title.textContent : 'Sem título';
    
    // Verificar se é uma solicitação "Em Rota" ou "Casual"
    const tipo = card.getAttribute('data-tipo');
    const tituloTexto = data.titulo ? data.titulo.toLowerCase() : '';
    // Detectar se é "Em Rota" pelo atributo data-tipo ou pelo título
    data.isEmRota = tipo === 'em_rota' || tituloTexto.includes('em rota') || tituloTexto.includes('em_rota');
    data.isCasual = tipo === 'casual' || tituloTexto.includes('casual');
    console.log('🔍 Verificando tipo de solicitação:', {
        tipo: tipo,
        titulo: tituloTexto,
        isEmRota: data.isEmRota,
        isCasual: data.isCasual
    });
    
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
            } else if (labelText.includes('valor total') || labelText.includes('valor')) {                data.valor = value.textContent;
            } else if (labelText.includes('criação')) {
                data.dataCriacao = value.textContent;
            } else if (labelText.includes('pagamento')) {
                data.dataPagamento = value.textContent;
            }
        }
    });
    
    // Se for "Em Rota", extrair os itens individuais da rota
    if (data.isEmRota) {
        console.log('🔍 Extraindo itens da rota...');
        data.itensRota = [];
        
        // Buscar itens da rota (mesmo que esteja oculto com display:none)
        const expandedSection = card.querySelector('.route-items-expanded');
        let routeItems = [];
        
        console.log('🔍 Seção expandida encontrada:', !!expandedSection);
        
        if (expandedSection) {
            // Buscar na seção expandida (mesmo que oculta)
            routeItems = expandedSection.querySelectorAll('.route-item');
            console.log(`🔍 Itens encontrados na seção expandida: ${routeItems.length}`);
        } else {
            // Fallback: buscar diretamente no card
            routeItems = card.querySelectorAll('.route-item');
            console.log(`🔍 Itens encontrados no card: ${routeItems.length}`);
        }
        
        // SEMPRE tentar buscar via AJAX para garantir que temos os dados mais atualizados
        // Tentar vários atributos para encontrar o ID
        const solicitacaoId = card.getAttribute('data-card-id') ||
                             card.getAttribute('data-solicitacao-id') ||
                             card.getAttribute('id')?.replace('card-', '') ||
                             card.closest('.card')?.getAttribute('data-card-id');
        
        console.log('🔍 ID da solicitação encontrado:', solicitacaoId);
        
        // Se não encontrou itens no HTML OU se encontrou mas quer garantir dados atualizados, buscar via AJAX
        if (routeItems.length === 0 || solicitacaoId) {
            console.log('🔍 Buscando itens via AJAX. ID da solicitação:', solicitacaoId);
            
            // Fazer requisição AJAX para obter os itens da rota
            if (solicitacaoId) {
                try {
                    // Buscar CSRF token
                    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value || 
                                     document.cookie.match(/csrftoken=([^;]+)/)?.[1] || '';
                    
                    console.log('📡 Fazendo requisição AJAX para:', `/solicitacoes/obter-itens-rota/${solicitacaoId}/`);
                    
                    const response = await fetch(`/solicitacoes/obter-itens-rota/${solicitacaoId}/`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRFToken': csrfToken
                        }
                    });
                    
                    if (response.ok) {
                        const result = await response.json();
                        console.log('📦 Resposta AJAX recebida:', result);
                        
                        if (result.success && result.itens && result.itens.length > 0) {
                            console.log('✅ Itens obtidos via AJAX:', result.itens);
                            data.itensRota = result.itens.map(item => ({
                                ordem: item.ordem,
                                id: item.id,
                                valor: item.valor,
                                servico: item.servico,
                                valor_km: item.valor_km || 'R$ 0,00',
                                valor_pedagio: item.valor_pedagio || 'R$ 0,00',
                                valor_hospedagem: item.valor_hospedagem || 'R$ 0,00',
                                valor_fluvial: item.valor_fluvial || 'R$ 0,00',
                                valor_outros: item.valor_outros || 'R$ 0,00',
                                valor_total_item: item.valor_total_item || item.valor
                            }));
                            console.log('✅ data.itensRota configurado com', data.itensRota.length, 'itens:', data.itensRota);
                            
                            // Atualizar valor total também
                            if (result.valor_total) {
                                data.valor = result.valor_total;
                            }
                            
                            // Adicionar valor EM ROTA e descrição se disponível
                            if (result.valor_em_rota) {
                                data.valorEmRota = result.valor_em_rota;
                                console.log('✅ Valor EM ROTA adicionado:', data.valorEmRota);
                            }
                            if (result.descricao_em_rota) {
                                data.descricaoEmRota = result.descricao_em_rota;
                                console.log('✅ Descrição EM ROTA adicionada:', data.descricaoEmRota);
                            }
                        } else {
                            console.warn('⚠️ Nenhum item retornado na resposta AJAX ou success=false');
                            if (!data.itensRota) data.itensRota = [];
                        }
                    } else {
                        const errorText = await response.text();
                        console.warn('⚠️ Erro ao buscar itens via AJAX:', response.status, errorText);
                        if (!data.itensRota) data.itensRota = [];
                    }
                } catch (error) {
                    console.error('❌ Erro na requisição AJAX:', error);
                    if (!data.itensRota) data.itensRota = [];
                }
            } else {
                console.warn('⚠️ ID da solicitação não encontrado, não é possível buscar itens via AJAX');
                if (!data.itensRota) data.itensRota = [];
            }
        } else {
            // Se não é Em Rota, garantir que itensRota está vazio
            data.itensRota = [];
        }
        
        // Se já temos dados via AJAX, não processar routeItems do DOM
        // Apenas processar routeItems se não tivermos dados via AJAX
        if (!data.itensRota || data.itensRota.length === 0) {
            routeItems.forEach((item, index) => {
            const itemNumber = item.querySelector('.route-item-number');
            const itemId = item.querySelector('.route-item-id');
            const itemValor = item.querySelector('.route-item-valor');
            const itemServico = item.querySelector('.route-item-servico');
            
            console.log(`🔍 Item ${index + 1}:`, {
                itemNumber: itemNumber?.textContent,
                itemId: itemId?.textContent,
                itemValor: itemValor?.textContent,
                itemServico: itemServico?.textContent
            });
            
            // Extrair número do item do texto (Item 1, Item 2, etc.)
            let ordem = index + 1;
            if (itemNumber) {
                const ordemMatch = itemNumber.textContent.match(/\d+/);
                if (ordemMatch) {
                    ordem = parseInt(ordemMatch[0]);
                }
            }
            
            // Extrair valor - pode estar em route-item-valor ou route-item-value
            let valorExtraido = 'R$ 0,00';
            if (itemValor) {
                valorExtraido = itemValor.textContent.trim();
            } else {
                // Tentar buscar todos os route-item-value
                const valores = item.querySelectorAll('.route-item-value');
                if (valores.length > 0) {
                    // O primeiro route-item-value geralmente é o valor
                    const primeiroValor = valores[0];
                    if (primeiroValor && primeiroValor.textContent.includes('R$')) {
                        valorExtraido = primeiroValor.textContent.trim();
                    }
                }
            }
            
            // Extrair serviço - pode estar em route-item-servico ou segundo route-item-value
            let servicoExtraido = 'N/A';
            if (itemServico) {
                servicoExtraido = itemServico.textContent.trim();
            } else {
                // Tentar buscar todos os route-item-value
                const valores = item.querySelectorAll('.route-item-value');
                if (valores.length > 1) {
                    // O segundo route-item-value geralmente é o serviço
                    servicoExtraido = valores[1].textContent.trim();
                } else if (valores.length === 1 && !valores[0].textContent.includes('R$')) {
                    // Se só tem um e não é valor, pode ser serviço
                    servicoExtraido = valores[0].textContent.trim();
                }
            }
            
            // Se pelo menos um dos campos existe, adicionar o item
            if (itemId || itemNumber || valorExtraido !== 'R$ 0,00' || servicoExtraido !== 'N/A') {
                // Garantir que data.itensRota existe
                if (!data.itensRota) {
                    data.itensRota = [];
                }
                data.itensRota.push({
                    ordem: ordem,
                    id: itemId ? itemId.textContent.replace(/^#/, '').trim() : '',
                    valor: valorExtraido,
                    servico: servicoExtraido
                });
            }
        });
        
        // Ordenar por ordem (apenas se tiver itens)
        if (data.itensRota && data.itensRota.length > 0) {
            data.itensRota.sort((a, b) => a.ordem - b.ordem);
        }
        
        console.log('✅ Itens extraídos (DOM):', data.itensRota);
        }
    } else if (data.isCasual) {
        // Se for "Casual", buscar valores detalhados via AJAX
        console.log('🔍 É solicitação Casual - buscando valores detalhados...');
        
        // Tentar vários atributos para encontrar o ID
        const solicitacaoId = card.getAttribute('data-card-id') ||
                             card.getAttribute('data-solicitacao-id') ||
                             card.getAttribute('id')?.replace('card-', '') ||
                             card.closest('.card')?.getAttribute('data-card-id');
        
        console.log('🔍 ID da solicitação Casual encontrado:', solicitacaoId);
        
        if (solicitacaoId) {
            try {
                // Buscar CSRF token
                const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value || 
                                 document.cookie.match(/csrftoken=([^;]+)/)?.[1] || '';
                
                console.log('📡 Fazendo requisição AJAX para valores Casual:', `/solicitacoes/obter-valores-casual/${solicitacaoId}/`);
                
                const response = await fetch(`/solicitacoes/obter-valores-casual/${solicitacaoId}/`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrfToken
                    }
                });
                
                if (response.ok) {
                    const result = await response.json();
                    console.log('📦 Valores Casual recebidos:', result);
                    
                    if (result.success && result.valores) {
                        console.log('✅ Valores detalhados Casual obtidos via AJAX');
                        data.valoresDetalhados = result.valores;
                        // Atualizar valor total também
                        if (result.valores.valor_total) {
                            data.valor = result.valores.valor_total;
                        }
                    } else {
                        console.warn('⚠️ Nenhum valor retornado na resposta AJAX');
                        data.valoresDetalhados = null;
                    }
                } else {
                    const errorText = await response.text();
                    console.warn('⚠️ Erro ao buscar valores Casual via AJAX:', response.status, errorText);
                    data.valoresDetalhados = null;
                }
            } catch (error) {
                console.error('❌ Erro na requisição AJAX para valores Casual:', error);
                data.valoresDetalhados = null;
            }
        } else {
            console.warn('⚠️ ID da solicitação Casual não encontrado, não é possível buscar valores via AJAX');
            data.valoresDetalhados = null;
        }
    } else {
        console.log('ℹ️ Tipo de solicitação não identificado');
    }
    
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
    const valoresStatusSection = document.querySelector('.detail-section.valores-status');
    const valorElement = document.getElementById('modal-valor');
    const valorContainer = valorElement ? valorElement.closest('.detail-item') : null;
    
    console.log('🔍 populateCardDetails - isEmRota:', data.isEmRota, 'itensRota:', data.itensRota?.length);
    
    if (data.isEmRota && data.itensRota && data.itensRota.length > 0) {
        console.log('✅ É Em Rota com itens. Exibindo detalhamento...');
        
        // Para solicitação "Em Rota", mostrar valor total E itens individuais
        
        // Mudar o título da seção para "Itens da Rota"
        if (valoresStatusSection) {
            const sectionTitle = valoresStatusSection.querySelector('.section-title');
            if (sectionTitle) {
                sectionTitle.innerHTML = '<i class="fas fa-route"></i> Itens da Rota';
                console.log('✅ Título da seção alterado para "Itens da Rota"');
            }
        }
        
        // ✅ MOSTRAR o campo "Valor Total" - não ocultar
        if (valorContainer && valorElement) {
            valorContainer.style.display = '';
            const valorLabel = valorContainer.querySelector('.detail-label');
            if (valorLabel) {
                valorLabel.textContent = 'Valor Total';
                valorLabel.style.display = '';
            }
            valorElement.textContent = data.valor || 'R$ 0,00';
            valorElement.style.display = '';
            console.log('✅ Campo Valor Total configurado:', data.valor);
        } else {
            console.warn('⚠️ valorContainer ou valorElement não encontrado');
        }
        
        // Remover seção anterior se existir
        let routeItemsSection = document.getElementById('modal-route-items');
        if (routeItemsSection) {
            routeItemsSection.remove();
        }
        
        // Criar nova seção de itens da rota dentro da seção "Valores e Status"
        // Inserir APÓS o campo Valor Total, mas antes de Prioridade
        routeItemsSection = document.createElement('div');
        routeItemsSection.id = 'modal-route-items';
        routeItemsSection.className = 'route-items-modal-section';
        
        if (valoresStatusSection) {
            // Inserir após o campo Valor Total (primeiro detail-item) mas antes de Prioridade
            const prioridadeItem = valoresStatusSection.querySelector('.detail-item:nth-of-type(2)'); // Prioridade é o segundo detail-item
            if (prioridadeItem) {
                valoresStatusSection.insertBefore(routeItemsSection, prioridadeItem);
            } else {
                // Fallback: adicionar após o valor total
                const valorTotalItem = valorContainer;
                if (valorTotalItem && valorTotalItem.nextSibling) {
                    valoresStatusSection.insertBefore(routeItemsSection, valorTotalItem.nextSibling);
                } else {
                    valoresStatusSection.appendChild(routeItemsSection);
                }
            }
        }
        
        // Criar header para os itens individuais
        const itemsHeader = document.createElement('div');
        itemsHeader.className = 'route-items-modal-header';
        itemsHeader.innerHTML = '<i class="fas fa-list-ul"></i> <span>Detalhamento por ID</span>';
        routeItemsSection.appendChild(itemsHeader);
        console.log('✅ Header de detalhamento criado');
        
        // Criar lista de itens
        const itemsList = document.createElement('div');
        itemsList.className = 'route-items-modal-list';
        
        console.log(`🔍 Criando ${data.itensRota.length} itens na lista...`);
        
        data.itensRota.forEach((item, index) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'route-item-modal';
            
            console.log(`🔍 Criando item ${index + 1}:`, item);
            
            // Construir HTML dos valores detalhados
            const valoresDetalhados = [];
            if (item.valor_km && item.valor_km !== 'R$ 0,00') {
                valoresDetalhados.push(`<div class="route-item-detail-value"><span class="detail-label-mini">KM:</span><span>${item.valor_km}</span></div>`);
            }
            if (item.valor_pedagio && item.valor_pedagio !== 'R$ 0,00') {
                valoresDetalhados.push(`<div class="route-item-detail-value"><span class="detail-label-mini">Pedágio:</span><span>${item.valor_pedagio}</span></div>`);
            }
            if (item.valor_hospedagem && item.valor_hospedagem !== 'R$ 0,00') {
                valoresDetalhados.push(`<div class="route-item-detail-value"><span class="detail-label-mini">Hospedagem:</span><span>${item.valor_hospedagem}</span></div>`);
            }
            if (item.valor_fluvial && item.valor_fluvial !== 'R$ 0,00') {
                valoresDetalhados.push(`<div class="route-item-detail-value"><span class="detail-label-mini">Fluvial:</span><span>${item.valor_fluvial}</span></div>`);
            }
            if (item.valor_outros && item.valor_outros !== 'R$ 0,00') {
                valoresDetalhados.push(`<div class="route-item-detail-value"><span class="detail-label-mini">Outros:</span><span>${item.valor_outros}</span></div>`);
            }
            
            const valoresDetalhadosHTML = valoresDetalhados.length > 0 
                ? `<div class="route-item-valores-detalhados">
                    <div class="valores-detalhados-title-mini"><i class="fas fa-list"></i> Valores Detalhados</div>
                    <div class="valores-detalhados-grid-mini">
                        ${valoresDetalhados.join('')}
                    </div>
                </div>` 
                : '';
            
            itemDiv.innerHTML = `
                <div class="route-item-modal-header">
                    <div class="route-item-header-left">
                        <span class="route-item-modal-number">ID ${item.ordem}</span>
                        <span class="route-item-modal-id">#${item.id || 'N/A'}</span>
                    </div>
                    <div class="route-item-header-right">
                        <span class="route-item-modal-total">${item.valor_total_item || item.valor || 'R$ 0,00'}</span>
                    </div>
                </div>
                <div class="route-item-modal-details">
                    <div class="route-item-modal-main-info">
                        <div class="route-item-modal-info">
                            <span class="route-item-modal-label"><i class="fas fa-cog"></i> Serviço:</span>
                            <span class="route-item-modal-service">${item.servico || 'N/A'}</span>
                        </div>
                    </div>
                    ${valoresDetalhadosHTML}
                </div>
            `;
            
            itemsList.appendChild(itemDiv);
        });
        
        // Adicionar item "EM ROTA" se houver valor_em_rota
        if (data.valorEmRota && data.valorEmRota !== 'R$ 0,00' && parseFloat(data.valorEmRota.replace(/[^\d,]/g, '').replace(',', '.')) > 0) {
            const emRotaItem = document.createElement('div');
            emRotaItem.className = 'route-item-modal';
            emRotaItem.style.borderLeft = '4px solid #FF6B6B';
            
            const descricaoHTML = data.descricaoEmRota && data.descricaoEmRota.trim() 
                ? `<div class="route-item-modal-info" style="margin-top: 0.5rem;">
                    <span class="route-item-modal-label"><i class="fas fa-comment"></i> Descrição:</span>
                    <span class="route-item-modal-service">${data.descricaoEmRota}</span>
                </div>`
                : '';
            
            emRotaItem.innerHTML = `
                <div class="route-item-modal-header">
                    <div class="route-item-header-left">
                        <span class="route-item-modal-number" style="background: linear-gradient(135deg, #FF6B6B 0%, #EE5A6F 100%);">EM ROTA</span>
                        <span class="route-item-modal-id" style="background: rgba(255, 107, 107, 0.1);">Forma de Pagamento</span>
                    </div>
                    <div class="route-item-header-right">
                        <span class="route-item-modal-total" style="background: linear-gradient(135deg, #FF6B6B 0%, #EE5A6F 100%);">${data.valorEmRota || 'R$ 0,00'}</span>
                    </div>
                </div>
                <div class="route-item-modal-details">
                    <div class="route-item-modal-main-info">
                        <div class="route-item-modal-info">
                            <span class="route-item-modal-label"><i class="fas fa-credit-card"></i> Tipo:</span>
                            <span class="route-item-modal-service">Pagamento EM ROTA</span>
                        </div>
                        ${descricaoHTML}
                    </div>
                </div>
            `;
            
            itemsList.appendChild(emRotaItem);
            console.log('✅ Item EM ROTA adicionado ao modal');
        }
        
        routeItemsSection.appendChild(itemsList);
        console.log('✅ Lista de itens adicionada ao modal');
        
    } else if (data.isCasual && data.valoresDetalhados) {
        // Para solicitação "Casual", exibir valores detalhados
        
        console.log('✅ É solicitação Casual com valores detalhados. Exibindo...');
        
        // Mudar o título da seção para "Valores Detalhados"
        if (valoresStatusSection) {
            const sectionTitle = valoresStatusSection.querySelector('.section-title');
            if (sectionTitle) {
                sectionTitle.innerHTML = '<i class="fas fa-list-alt"></i> Valores Detalhados';
                console.log('✅ Título da seção alterado para "Valores Detalhados"');
            }
        }
        
        // ✅ MOSTRAR o campo "Valor Total"
        if (valorContainer && valorElement) {
            valorContainer.style.display = '';
            const valorLabel = valorContainer.querySelector('.detail-label');
            if (valorLabel) {
                valorLabel.textContent = 'Valor Total';
                valorLabel.style.display = '';
            }
            valorElement.textContent = data.valoresDetalhados.valor_total || data.valor || 'R$ 0,00';
            valorElement.style.display = '';
            console.log('✅ Campo Valor Total configurado:', data.valoresDetalhados.valor_total);
        }
        
        // Remover seção anterior se existir
        let casualValoresSection = document.getElementById('modal-casual-valores');
        if (casualValoresSection) {
            casualValoresSection.remove();
        }
        
        // Criar nova seção de valores detalhados do Casual
        casualValoresSection = document.createElement('div');
        casualValoresSection.id = 'modal-casual-valores';
        casualValoresSection.className = 'route-items-modal-section';
        
        if (valoresStatusSection) {
            // Inserir após o campo Valor Total, mas antes de Prioridade
            const prioridadeItem = valoresStatusSection.querySelector('.detail-item:nth-of-type(2)');
            if (prioridadeItem) {
                valoresStatusSection.insertBefore(casualValoresSection, prioridadeItem);
            } else {
                const valorTotalItem = valorContainer;
                if (valorTotalItem && valorTotalItem.nextSibling) {
                    valoresStatusSection.insertBefore(casualValoresSection, valorTotalItem.nextSibling);
                } else {
                    valoresStatusSection.appendChild(casualValoresSection);
                }
            }
        }
        
        // Criar header para os valores detalhados
        const valoresHeader = document.createElement('div');
        valoresHeader.className = 'route-items-modal-header';
        valoresHeader.innerHTML = '<i class="fas fa-coins"></i> <span>Detalhamento de Valores</span>';
        casualValoresSection.appendChild(valoresHeader);
        
        // Criar grid de valores detalhados
        const valoresGrid = document.createElement('div');
        valoresGrid.className = 'valores-detalhados-grid-mini';
        
        const valores = data.valoresDetalhados;
        const valoresDetalhados = [];
        
        // Construir cards para cada valor detalhado (se diferente de R$ 0,00)
        if (valores.valor_km && valores.valor_km !== 'R$ 0,00') {
            valoresDetalhados.push(`<div class="route-item-detail-value"><span class="detail-label-mini">KM:</span><span>${valores.valor_km}</span></div>`);
        }
        if (valores.valor_pedagio && valores.valor_pedagio !== 'R$ 0,00') {
            valoresDetalhados.push(`<div class="route-item-detail-value"><span class="detail-label-mini">Pedágio:</span><span>${valores.valor_pedagio}</span></div>`);
        }
        if (valores.valor_hospedagem && valores.valor_hospedagem !== 'R$ 0,00') {
            valoresDetalhados.push(`<div class="route-item-detail-value"><span class="detail-label-mini">Hospedagem:</span><span>${valores.valor_hospedagem}</span></div>`);
        }
        if (valores.valor_fluvial && valores.valor_fluvial !== 'R$ 0,00') {
            valoresDetalhados.push(`<div class="route-item-detail-value"><span class="detail-label-mini">Fluvial:</span><span>${valores.valor_fluvial}</span></div>`);
        }
        if (valores.valor_outros && valores.valor_outros !== 'R$ 0,00') {
            valoresDetalhados.push(`<div class="route-item-detail-value"><span class="detail-label-mini">Outros:</span><span>${valores.valor_outros}</span></div>`);
        }
        if (valores.valor_receita && valores.valor_receita !== 'R$ 0,00') {
            valoresDetalhados.push(`<div class="route-item-detail-value"><span class="detail-label-mini">Receita:</span><span>${valores.valor_receita}</span></div>`);
        }
        
        if (valoresDetalhados.length > 0) {
            valoresGrid.innerHTML = valoresDetalhados.join('');
            casualValoresSection.appendChild(valoresGrid);
            console.log('✅ Grid de valores detalhados Casual criado com', valoresDetalhados.length, 'valores');
        } else {
            // Se não há valores detalhados, exibir mensagem
            const semValores = document.createElement('div');
            semValores.className = 'route-item-modal-info';
            semValores.style.padding = '12px';
            semValores.style.textAlign = 'center';
            semValores.style.color = '#999';
            semValores.innerHTML = '<i class="fas fa-info-circle"></i> Nenhum valor detalhado preenchido';
            casualValoresSection.appendChild(semValores);
        }
        
        // Exibir serviço se disponível
        if (valores.servico && valores.servico !== 'N/A') {
            const servicoInfo = document.createElement('div');
            servicoInfo.className = 'route-item-modal-info';
            servicoInfo.style.marginTop = '12px';
            servicoInfo.innerHTML = `
                <span class="route-item-modal-label"><i class="fas fa-cog"></i> Serviço:</span>
                <span class="route-item-modal-service">${valores.servico}</span>
            `;
            casualValoresSection.appendChild(servicoInfo);
        }
        
    } else {
        // Para outras solicitações, restaurar seção normal
        
        // Restaurar título da seção
        if (valoresStatusSection) {
            const sectionTitle = valoresStatusSection.querySelector('.section-title');
            if (sectionTitle) {
                sectionTitle.innerHTML = '<i class="fas fa-dollar-sign"></i> Valores e Status';
            }
        }
        
        // Mostrar campo "Valor" normalmente
        if (valorContainer) {
            valorContainer.style.display = '';
            const valorLabel = valorContainer.querySelector('.detail-label');
            if (valorLabel) valorLabel.style.display = '';
            if (valorElement) {
                valorElement.textContent = data.valor || 'R$ 0,00';
                valorElement.style.display = '';
            }
        }
        
        // Remover seções de valores detalhados se existirem
        const routeItemsSection = document.getElementById('modal-route-items');
        if (routeItemsSection) {
            routeItemsSection.remove();
        }
        const casualValoresSection = document.getElementById('modal-casual-valores');
        if (casualValoresSection) {
            casualValoresSection.remove();
        }
    }    
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
    if (!modal) {
        console.error('Modal não encontrado em setupModalEventListeners');
        return;
    }
    
    // Buscar botões toda vez que o modal é aberto
    const closeBtn = document.getElementById('closeCardModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const overlay = modal.querySelector('.modal-overlay');
    
    console.log('🔍 Configurando listeners do modal:', {
        closeBtn: !!closeBtn,
        closeModalBtn: !!closeModalBtn,
        overlay: !!overlay
    });
    
    // Fechar modal com botão X
    if (closeBtn) {
        // Remover listeners anteriores
        const newCloseBtn = closeBtn.cloneNode(true);
        closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
        newCloseBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('✅ Botão X clicado, fechando modal');
            closeCardDetailModal();
            return false;
        });
        console.log('✅ Listener do botão X adicionado');
    } else {
        console.warn('⚠️ Botão closeCardModal não encontrado');
    }
    
    // Fechar modal com botão Voltar
    if (closeModalBtn) {
        // Remover listeners anteriores
        const newCloseModalBtn = closeModalBtn.cloneNode(true);
        closeModalBtn.parentNode.replaceChild(newCloseModalBtn, closeModalBtn);
        newCloseModalBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('✅ Botão Voltar clicado, fechando modal');
            closeCardDetailModal();
            return false;
        });
        console.log('✅ Listener do botão Voltar adicionado');
    } else {
        console.warn('⚠️ Botão closeModalBtn não encontrado');
    }
    
    // Fechar modal clicando no overlay
    if (overlay) {
        // Remover listeners anteriores
        const newOverlay = overlay.cloneNode(true);
        overlay.parentNode.replaceChild(newOverlay, overlay);
        newOverlay.addEventListener('click', function(e) {
            if (e.target === newOverlay) {
                console.log('✅ Overlay clicado, fechando modal');
                closeCardDetailModal();
            }
        });
    }
    
    // Fechar modal com ESC (apenas uma vez no documento)
    if (!modalListenersSetup) {
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && modal && modal.classList.contains('show')) {
                console.log('✅ Tecla ESC pressionada, fechando modal');
                closeCardDetailModal();
            }
        });
        modalListenersSetup = true;
    }
    
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
            
            // ⚠️ IMPORTANTE: Atualizar data-entry-time para reiniciar o contador
            const cardTimeElement = card.querySelector('.card-time');
            if (cardTimeElement) {
                const now = new Date();
                const timeString = now.getFullYear() + '-' + 
                    String(now.getMonth() + 1).padStart(2, '0') + '-' + 
                    String(now.getDate()).padStart(2, '0') + ' ' + 
                    String(now.getHours()).padStart(2, '0') + ':' + 
                    String(now.getMinutes()).padStart(2, '0') + ':' + 
                    String(now.getSeconds()).padStart(2, '0');
                cardTimeElement.setAttribute('data-entry-time', timeString);
                cardTimeElement.removeAttribute('data-creation-time'); // Remover atributo antigo
                
                // Atualizar o tempo imediatamente para mostrar 0min
                const timeSpan = cardTimeElement.querySelector('.queue-time');
                if (timeSpan) {
                    timeSpan.textContent = '0min';
                }
            }
            
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
    console.log('🔴 Fechando modal de detalhes do card...');
    const modal = document.getElementById('cardDetailModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
        console.log('✅ Modal fechado com sucesso');
    } else {
        console.error('❌ Modal não encontrado ao tentar fechar');
    }
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
