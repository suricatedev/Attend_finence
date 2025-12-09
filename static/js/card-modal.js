// ========================================
// MODAL DE DETALHES DO CARD
// ========================================


// Flag para evitar registrar listeners duplicados
let modalListenersSetup = false;
let modalCloseDelegationSetup = false;
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
    // Buscar TODOS os cards (não apenas os não inicializados) para garantir
    const allCards = document.querySelectorAll('.card');
    const cards = Array.from(allCards).filter(card => !card.hasAttribute('data-modal-initialized'));
    
    // Apenas inicializar se houver cards novos para processar
    cards.forEach(card => {
        // Marcar card como inicializado para evitar duplicar listeners
        card.setAttribute('data-modal-initialized', 'true');
        
        // Remover listener anterior se existir (usando named function para poder remover)
        if (card._modalClickHandler) {
            card.removeEventListener('click', card._modalClickHandler);
        }
        
        // Clique simples com prioridade máxima
        card._modalClickHandler = function(e) {
            if (e.target.closest('.card-actions') || 
                e.target.closest('.card-action-btn') ||
                e.target.closest('.card-count') ||
                e.target.closest('.selected-date-display') ||
                e.target.closest('.date-filter-btn') ||
                e.target.closest('.btn-delete-card')) {
                return;
            }

            if (card.classList.contains('dragging')) {
                return;
            }

            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            openCardDetailModal(card);
            return false;
        };

        card.addEventListener('click', card._modalClickHandler, true);
        
        // Adicionar indicador visual de que o card é clicável
        let indicator = card.querySelector('.expand-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = 'expand-indicator';
            indicator.innerHTML = '<i class="fas fa-external-link-alt"></i>';
            indicator.style.cursor = 'pointer';
            indicator.title = 'Clique para ver detalhes';
            card.appendChild(indicator);
        }
        
        // Tornar o indicador clicável diretamente
        indicator.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            openCardDetailModal(card);
        }, true);
        
        // Adicionar cursor pointer para indicar que é clicável
        if (!card.style.cursor) {
            card.style.cursor = 'pointer';
        }
    });
}

// Função para abrir modal de detalhes do card
async function openCardDetailModal(card) {
    console.log('🔍 Tentando abrir modal para o card:', card);
    console.log('🔍 Card ID:', card.getAttribute('data-card-id'));
    
    const modal = document.getElementById('cardDetailModal');
    const header = modal ? modal.querySelector('.modal-header') : null;
    
    if (!modal) {
        console.error('❌ Modal não encontrado!');
        alert('Erro: Modal de detalhes não encontrado. Por favor, recarregue a página.');
        return;
    }
    
    console.log('✅ Modal encontrado:', modal);
    
    // Verificar se o modal já está aberto
    if (modal.classList.contains('show')) {
        console.log('⚠️ Modal já está aberto, fechando primeiro...');
        closeCardDetailModal();
        await new Promise(resolve => setTimeout(resolve, 300)); // Aguardar animação
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
    const columnType = columnEl ? columnEl.getAttribute('data-column') || '' : '';
    modal.setAttribute('data-card-column', columnType);
    const isEditable = columnType === 'planning';
    modal.setAttribute('data-editable', isEditable ? 'true' : 'false');
    const editButton = modal.querySelector('#editCardBtn');
    if (editButton) {
        editButton.classList.toggle('is-disabled', !isEditable);
        editButton.setAttribute('aria-disabled', (!isEditable).toString());
        if (isEditable) {
            editButton.removeAttribute('title');
        } else {
            editButton.setAttribute('title', 'Somente solicitações pendentes podem ser editadas.');
        }
    }
    if (statusText.includes('pendente')) header.classList.add('status-pendente');
    else if (statusText.includes('aprovado')) header.classList.add('status-aprovado');
    else if (statusText.includes('recusado')) header.classList.add('status-recusado');
    else if (statusText.includes('concluído') || statusText.includes('concluido')) header.classList.add('status-concluido');

    // A seção "Mover para Fila" já está controlada pelo template Django (permissões)
    // Se o usuário não tem permissão, a seção não será renderizada
    
    // Mostrar modal - SIMPLIFICADO E DIRETO
    console.log('🎬 Mostrando modal...');
    
    // Primeiro remover qualquer estilo inline que possa estar bloqueando
    modal.style.display = '';
    modal.style.visibility = '';
    modal.style.opacity = '';
    
    // Adicionar a classe 'show' que o CSS precisa
    modal.classList.add('show');
    
    // Bloquear scroll do body
    document.body.style.overflow = 'hidden';
    
    // Forçar reflow para garantir que o CSS seja aplicado
    void modal.offsetHeight;
    
    // Verificar se apareceu
    setTimeout(() => {
        const computedStyle = window.getComputedStyle(modal);
        console.log('🎬 Estado do modal após exibição:', {
            display: computedStyle.display,
            visibility: computedStyle.visibility,
            opacity: computedStyle.opacity,
            hasShowClass: modal.classList.contains('show'),
            zIndex: computedStyle.zIndex
        });
        
        // Se ainda não estiver visível, forçar
        if (computedStyle.display === 'none' || computedStyle.visibility === 'hidden') {
            console.warn('⚠️ Modal ainda não visível, forçando exibição...');
            modal.style.display = 'flex';
            modal.style.visibility = 'visible';
            modal.style.opacity = '1';
        }
    }, 50);
    
    console.log('✅ Modal deve estar visível agora');
    
    // BLOQUEAR fechamento ao clicar fora - ADICIONAR IMEDIATAMENTE E REPETIDAMENTE
    function blockAllCloseAttempts() {
        const overlay = modal.querySelector('.modal-overlay');
        if (overlay) {
            // Remover todos os listeners anteriores clonando
            const newOverlay = overlay.cloneNode(true);
            overlay.parentNode.replaceChild(newOverlay, overlay);
            
            // Bloquear completamente com múltiplas camadas
            newOverlay.addEventListener('click', function(e) {
                e.stopPropagation();
                e.stopImmediatePropagation();
                e.preventDefault();
                console.log('🚫🚫🚫 BLOQUEIO PERMANENTE: Overlay clicado - FECHAMENTO IMPEDIDO');
                return false;
            }, true);
            
            newOverlay.addEventListener('mousedown', function(e) {
                e.stopPropagation();
                e.stopImmediatePropagation();
                e.preventDefault();
                return false;
            }, true);
        }
        
        // Bloquear cliques no modal fora do conteúdo
        modal.addEventListener('click', function(e) {
            const modalContent = modal.querySelector('.modal-content');
            if (modalContent && !modalContent.contains(e.target)) {
                e.stopPropagation();
                e.stopImmediatePropagation();
                e.preventDefault();
                console.log('🚫🚫🚫 BLOQUEIO PERMANENTE: Clique no modal (fora do conteúdo) - FECHAMENTO IMPEDIDO');
                return false;
            }
        }, true);
        
        // Bloquear também mousedown
        modal.addEventListener('mousedown', function(e) {
            const modalContent = modal.querySelector('.modal-content');
            if (modalContent && !modalContent.contains(e.target)) {
                e.stopPropagation();
                e.stopImmediatePropagation();
                e.preventDefault();
                return false;
            }
        }, true);
    }
    
    // Executar imediatamente e repetidamente para garantir
    blockAllCloseAttempts();
    setTimeout(blockAllCloseAttempts, 10);
    setTimeout(blockAllCloseAttempts, 50);
    setTimeout(blockAllCloseAttempts, 100);
    setTimeout(blockAllCloseAttempts, 200);
    
    // Adicionar event listeners para fechar modal
    setupModalEventListeners();
}

// Função para extrair dados do card (agora é async para suportar AJAX)
async function extractCardData(card) {
    const data = {};
    
    // Extrair informações básicas primeiro
    const title = card.querySelector('.card-title');
    data.titulo = title ? title.textContent : 'Sem título';
    
    // Verificar se é uma solicitação "Em Rota", "Casual" ou "Técnico"
    const tipo = card.getAttribute('data-tipo');
    const isTecnico = card.getAttribute('data-is-tecnico') === 'true';
    const tituloTexto = data.titulo ? data.titulo.toLowerCase() : '';
    // Detectar se é "Em Rota" pelo atributo data-tipo ou pelo título
    data.isEmRota = tipo === 'em_rota' || tituloTexto.includes('em rota') || tituloTexto.includes('em_rota');
    data.isCasual = tipo === 'casual' || tituloTexto.includes('casual');
    data.isTecnico = isTecnico || tituloTexto.includes('técnico') || tituloTexto.includes('tecnico');
    console.log('🔍 Verificando tipo de solicitação:', {
        tipo: tipo,
        titulo: tituloTexto,
        isEmRota: data.isEmRota,
        isCasual: data.isCasual,
        isTecnico: data.isTecnico
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
    
    // Se for "Técnico", extrair os itens de técnico
    if (data.isTecnico) {
        console.log('🔍 Extraindo itens de técnico...');
        data.itensTecnico = [];
        
        // Buscar ID da solicitação
        const solicitacaoId = card.getAttribute('data-card-id') ||
                             card.getAttribute('data-solicitacao-id') ||
                             card.getAttribute('id')?.replace('card-', '') ||
                             card.closest('.card')?.getAttribute('data-card-id');
        
        console.log('🔍 ID da solicitação de técnico encontrado:', solicitacaoId);
        
        // Buscar itens via AJAX
        if (solicitacaoId) {
            try {
                const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value || 
                                 document.cookie.match(/csrftoken=([^;]+)/)?.[1] || '';
                
                console.log('📡 Fazendo requisição AJAX para itens de técnico:', `/solicitacoes/obter-itens-tecnico/${solicitacaoId}/`);
                
                const response = await fetch(`/solicitacoes/obter-itens-tecnico/${solicitacaoId}/`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrfToken
                    }
                });
                
                if (response.ok) {
                    const result = await response.json();
                    console.log('📦 Resposta AJAX itens de técnico recebida:', result);
                    
                    if (result.success && result.itens && result.itens.length > 0) {
                        console.log('✅ Itens de técnico obtidos via AJAX:', result.itens);
                        data.itensTecnico = result.itens;
                        data.valorTotalTecnico = result.valor_total;
                    }
                }
            } catch (error) {
                console.error('❌ Erro ao buscar itens de técnico:', error);
            }
        }
    }
    
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
                            // Função auxiliar para parsear valor monetário
                            const parseValorMonetario = (valorStr) => {
                                if (!valorStr || valorStr === 'R$ 0,00' || valorStr === '0,00' || valorStr === 'R$ 0.00' || valorStr === '0.00') return 0;
                                // Remove R$, espaços e trata tanto vírgula quanto ponto como separador decimal
                                let valorLimpo = valorStr.replace(/[R$\s]/g, '');
                                // Se tem vírgula, assume formato brasileiro (1.234,56)
                                if (valorLimpo.includes(',')) {
                                    // Remove pontos (separadores de milhares) e substitui vírgula por ponto
                                    valorLimpo = valorLimpo.replace(/\./g, '').replace(',', '.');
                                } else if (valorLimpo.includes('.')) {
                                    // Se tem ponto mas não vírgula, verifica se é formato americano (1234.56) ou brasileiro (1.234)
                                    // Se tem mais de um ponto, assume formato brasileiro (1.234.567)
                                    const pontos = (valorLimpo.match(/\./g) || []).length;
                                    if (pontos > 1) {
                                        // Formato brasileiro com pontos como separadores de milhares - remove todos os pontos
                                        valorLimpo = valorLimpo.replace(/\./g, '');
                                    }
                                    // Se tem apenas um ponto, assume formato americano (1234.56) - mantém o ponto
                                }
                                const resultado = parseFloat(valorLimpo) || 0;
                                console.log(`🔍 parseValorMonetario: "${valorStr}" -> "${valorLimpo}" -> ${resultado}`);
                                return resultado;
                            };
                            
                            // Função auxiliar para formatar valor monetário
                            const formatarValorMonetario = (valor) => {
                                return `R$ ${valor.toFixed(2).replace('.', ',')}`;
                            };
                            
                            let somaAtividades = 0;
                            
                            data.itensRota = result.itens.map(item => {
                                // Calcular valores detalhados
                                const valorKm = parseValorMonetario(item.valor_km || 'R$ 0,00');
                                const valorPedagio = parseValorMonetario(item.valor_pedagio || 'R$ 0,00');
                                const valorHospedagem = parseValorMonetario(item.valor_hospedagem || 'R$ 0,00');
                                const valorFluvial = parseValorMonetario(item.valor_fluvial || 'R$ 0,00');
                                const valorOutros = parseValorMonetario(item.valor_outros || 'R$ 0,00');
                                
                                // Calcular soma dos valores detalhados
                                const somaDetalhados = valorKm + valorPedagio + valorHospedagem + valorFluvial + valorOutros;
                                
                                // Calcular valor da atividade
                                // IMPORTANTE: item.valor já é o valor da atividade (não o valor total)
                                // PRIORIDADE: Se o backend retornou valor_atividade, usar ele diretamente (mais confiável)
                                let valorAtividade = 0;
                                if (item.valor_atividade) {
                                    // Usar valor_atividade do backend (já calculado corretamente)
                                    valorAtividade = parseValorMonetario(item.valor_atividade);
                                    console.log(`🔍 Item ${item.ordem || 'N/A'}: usando valor_atividade do backend = ${valorAtividade}`);
                                } else {
                                    // Fallback: item.valor já é a atividade, não precisa subtrair nada
                                    valorAtividade = parseValorMonetario(item.valor || 'R$ 0,00');
                                    console.log(`🔍 Item ${item.ordem || 'N/A'}: usando item.valor como atividade = ${valorAtividade}`);
                                }
                                
                                // Somar ao total de atividades (valor da receita é a soma de todas as atividades)
                                somaAtividades += valorAtividade;
                                
                                return {
                                    ordem: item.ordem,
                                    id: item.id,
                                    valor: item.valor,
                                    servico: item.servico,
                                    recebedor: item.recebedor || '',
                                    chave_pix: item.chave_pix || '',
                                    cliente_empresa: item.cliente_empresa || '',
                                    cnpj: item.cnpj || '',
                                    valor_km: item.valor_km || 'R$ 0,00',
                                    valor_pedagio: item.valor_pedagio || 'R$ 0,00',
                                    valor_hospedagem: item.valor_hospedagem || 'R$ 0,00',
                                    valor_fluvial: item.valor_fluvial || 'R$ 0,00',
                                    valor_outros: item.valor_outros || 'R$ 0,00',
                                    valor_total_item: item.valor_total_item || formatarValorMonetario(valorAtividade + somaDetalhados),
                                    valor_atividade: formatarValorMonetario(valorAtividade)
                                };
                            });
                            console.log('✅ data.itensRota configurado com', data.itensRota.length, 'itens:', data.itensRota);
                            
                            // Atualizar valor total também
                            if (result.valor_total) {
                                data.valor = result.valor_total;
                            }
                            
                            // Calcular valor da receita como soma das atividades de todos os itens
                            // SEMPRE usar o valor_receita do backend (mais confiável e já calculado corretamente)
                            if (result.valor_receita) {
                                data.valorReceita = result.valor_receita;
                                console.log('✅ Valor da Receita obtido do backend:', data.valorReceita);
                                console.log('🔍 Debug - somaAtividades calculada no frontend:', somaAtividades, '(usado apenas para validação)');
                            } else {
                                // Fallback: usar cálculo do frontend apenas se backend não retornar
                                data.valorReceita = formatarValorMonetario(somaAtividades);
                                console.warn('⚠️ Backend não retornou valor_receita, usando cálculo do frontend:', data.valorReceita, 'Total atividades:', somaAtividades);
                            }
                            console.log('🔍 Debug - Número de itens processados:', result.itens.length);
                            
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
                            // Garantir que valorReceita seja definido mesmo sem itens
                            if (!data.valorReceita) {
                                data.valorReceita = 'R$ 0,00';
                            }
                        }
                    } else {
                        const errorText = await response.text();
                        console.warn('⚠️ Erro ao buscar itens via AJAX:', response.status, errorText);
                        if (!data.itensRota) data.itensRota = [];
                        // Garantir que valorReceita seja definido mesmo com erro
                        if (!data.valorReceita) {
                            data.valorReceita = 'R$ 0,00';
                        }
                    }
                } catch (error) {
                    console.error('❌ Erro na requisição AJAX:', error);
                    if (!data.itensRota) data.itensRota = [];
                    // Garantir que valorReceita seja definido mesmo com erro
                    if (!data.valorReceita) {
                        data.valorReceita = 'R$ 0,00';
                    }
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
            
            // Se não temos valorReceita calculado via AJAX, calcular a partir dos itens do DOM
            // Nota: itens do DOM podem não ter todos os valores detalhados, então tentamos calcular se possível
            if (!data.valorReceita && data.itensRota.length > 0) {
                // Função auxiliar para parsear valor monetário
                const parseValorMonetario = (valorStr) => {
                    if (!valorStr || valorStr === 'R$ 0,00' || valorStr === '0,00' || valorStr === 'R$ 0.00' || valorStr === '0.00') return 0;
                    // Remove R$, espaços e trata tanto vírgula quanto ponto como separador decimal
                    let valorLimpo = valorStr.replace(/[R$\s]/g, '');
                    // Se tem vírgula, assume formato brasileiro (1.234,56)
                    if (valorLimpo.includes(',')) {
                        // Remove pontos (separadores de milhares) e substitui vírgula por ponto
                        valorLimpo = valorLimpo.replace(/\./g, '').replace(',', '.');
                    } else if (valorLimpo.includes('.')) {
                        // Se tem ponto mas não vírgula, verifica se é formato americano (1234.56) ou brasileiro (1.234)
                        // Se tem mais de um ponto, assume formato brasileiro (1.234.567)
                        const pontos = (valorLimpo.match(/\./g) || []).length;
                        if (pontos > 1) {
                            // Formato brasileiro com pontos como separadores de milhares - remove todos os pontos
                            valorLimpo = valorLimpo.replace(/\./g, '');
                        }
                        // Se tem apenas um ponto, assume formato americano (1234.56) - mantém o ponto
                    }
                    const resultado = parseFloat(valorLimpo) || 0;
                    console.log(`🔍 parseValorMonetario: "${valorStr}" -> "${valorLimpo}" -> ${resultado}`);
                    return resultado;
                };
                
                // Função auxiliar para formatar valor monetário
                const formatarValorMonetario = (valor) => {
                    return `R$ ${valor.toFixed(2).replace('.', ',')}`;
                };
                
                let somaAtividades = 0;
                
                // Tentar calcular a partir dos itens que temos
                // IMPORTANTE: item.valor já é o valor da atividade (não o valor total)
                data.itensRota.forEach(item => {
                    // Se o item já tem valor_atividade calculado, usar ele diretamente
                    if (item.valor_atividade) {
                        const valorAtividade = parseValorMonetario(item.valor_atividade);
                        somaAtividades += valorAtividade;
                        console.log(`🔍 Item ${item.ordem || 'N/A'}: usando valor_atividade direto = ${valorAtividade}`);
                    } else {
                        // IMPORTANTE: item.valor já é o valor da atividade, não precisa subtrair nada
                        const valorAtividade = parseValorMonetario(item.valor || 'R$ 0,00');
                        somaAtividades += valorAtividade;
                        console.log(`🔍 Item ${item.ordem || 'N/A'}: usando item.valor como atividade = ${valorAtividade}`);
                    }
                });
                
                data.valorReceita = formatarValorMonetario(somaAtividades);
                console.log('✅ Valor da Receita calculado a partir do DOM (soma das atividades):', data.valorReceita, 'Total atividades:', somaAtividades);
            }
        }
        
        // Garantir que valorReceita sempre tenha um valor
        if (!data.valorReceita) {
            data.valorReceita = 'R$ 0,00';
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
                        // No Casual, o valor_receita já é o valor da atividade
                        // Usar valor_receita como valor da receita (que é a soma das atividades)
                        if (result.valores.valor_receita) {
                            data.valorReceita = result.valores.valor_receita;
                            console.log('✅ Valor da Receita Casual (valor atividade):', data.valorReceita);
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
    
    // Adicionar campos adicionais (Chave PIX, Cliente/Empresa, CNPJ) nas informações básicas para solicitações Casual
    const infoBasicasSection = document.querySelector('.detail-section.info-basicas');
    if (infoBasicasSection) {
        // Remover campos adicionais anteriores se existirem
        const existingChavePix = document.getElementById('modal-chave-pix-item');
        const existingClienteEmpresa = document.getElementById('modal-cliente-empresa-item');
        const existingCnpj = document.getElementById('modal-cnpj-item');
        
        if (existingChavePix) existingChavePix.remove();
        if (existingClienteEmpresa) existingClienteEmpresa.remove();
        if (existingCnpj) existingCnpj.remove();
        
        // Adicionar campos adicionais se existirem nos dados (para solicitações Casual)
        if (data.isCasual && data.valoresDetalhados) {
            if (data.valoresDetalhados.chave_pix) {
                const chavePixItem = document.createElement('div');
                chavePixItem.className = 'detail-item';
                chavePixItem.id = 'modal-chave-pix-item';
                chavePixItem.innerHTML = `
                    <div class="detail-label">Chave PIX</div>
                    <div class="detail-value" id="modal-chave-pix">${data.valoresDetalhados.chave_pix}</div>
                `;
                infoBasicasSection.appendChild(chavePixItem);
            }
            
            if (data.valoresDetalhados.cliente_empresa) {
                const clienteEmpresaItem = document.createElement('div');
                clienteEmpresaItem.className = 'detail-item';
                clienteEmpresaItem.id = 'modal-cliente-empresa-item';
                clienteEmpresaItem.innerHTML = `
                    <div class="detail-label">Cliente/Empresa</div>
                    <div class="detail-value" id="modal-cliente-empresa">${data.valoresDetalhados.cliente_empresa}</div>
                `;
                infoBasicasSection.appendChild(clienteEmpresaItem);
            }
            
            if (data.valoresDetalhados.cnpj) {
                const cnpjItem = document.createElement('div');
                cnpjItem.className = 'detail-item';
                cnpjItem.id = 'modal-cnpj-item';
                cnpjItem.innerHTML = `
                    <div class="detail-label">CNPJ</div>
                    <div class="detail-value" id="modal-cnpj">${data.valoresDetalhados.cnpj}</div>
                `;
                infoBasicasSection.appendChild(cnpjItem);
            }
        }
    }
    
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
        
        // Preencher campo de Valor da Receita
        const valorReceitaElement = document.getElementById('modal-valor-receita');
        if (valorReceitaElement) {
            const valorReceitaFinal = data.valorReceita || 'R$ 0,00';
            valorReceitaElement.textContent = valorReceitaFinal;
            console.log('✅ Campo Valor da Receita configurado:', valorReceitaFinal);
            console.log('🔍 Debug - data.valorReceita:', data.valorReceita);
            console.log('🔍 Debug - data.itensRota length:', data.itensRota?.length);
        } else {
            console.error('❌ Campo modal-valor-receita não encontrado no DOM!');
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
            
            // Construir informações de recebedor, PIX, cliente/empresa e CNPJ
            const infoAdicional = [];
            if (item.recebedor) {
                infoAdicional.push(`<div class="route-item-modal-info"><span class="route-item-modal-label"><i class="fas fa-user-check"></i> Recebedor:</span><span class="route-item-modal-value">${item.recebedor}</span></div>`);
            }
            if (item.chave_pix) {
                infoAdicional.push(`<div class="route-item-modal-info"><span class="route-item-modal-label"><i class="fas fa-qrcode"></i> Chave PIX:</span><span class="route-item-modal-value">${item.chave_pix}</span></div>`);
            }
            if (item.cliente_empresa) {
                infoAdicional.push(`<div class="route-item-modal-info"><span class="route-item-modal-label"><i class="fas fa-building"></i> Cliente/Empresa:</span><span class="route-item-modal-value">${item.cliente_empresa}</span></div>`);
            }
            if (item.cnpj) {
                infoAdicional.push(`<div class="route-item-modal-info"><span class="route-item-modal-label"><i class="fas fa-id-card"></i> CNPJ:</span><span class="route-item-modal-value">${item.cnpj}</span></div>`);
            }
            
            const infoAdicionalHTML = infoAdicional.length > 0 
                ? `<div class="route-item-info-adicional">
                    <div class="route-item-info-title"><i class="fas fa-info-circle"></i> Informações Adicionais</div>
                    <div class="route-item-info-grid">
                        ${infoAdicional.join('')}
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
                    ${infoAdicionalHTML}
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
        
    } else if (data.isTecnico && data.itensTecnico && data.itensTecnico.length > 0) {
        console.log('✅ É solicitação de Técnico com itens. Exibindo detalhamento...');
        
        // Para solicitação "Técnico", mostrar itens individuais no mesmo formato de "Em Rota"
        
        // Mudar o título da seção para "Itens da Solicitação de Técnico"
        if (valoresStatusSection) {
            const sectionTitle = valoresStatusSection.querySelector('.section-title');
            if (sectionTitle) {
                sectionTitle.innerHTML = '<i class="fas fa-user-tie"></i> Itens da Solicitação de Técnico';
                console.log('✅ Título da seção alterado para "Itens da Solicitação de Técnico"');
            }
        }
        
        // MOSTRAR o campo "Valor Total"
        if (valorContainer && valorElement) {
            valorContainer.style.display = '';
            const valorLabel = valorContainer.querySelector('.detail-label');
            if (valorLabel) {
                valorLabel.textContent = 'Valor Total';
                valorLabel.style.display = '';
            }
            valorElement.textContent = data.valorTotalTecnico || data.valor || 'R$ 0,00';
            valorElement.style.display = '';
            console.log('✅ Campo Valor Total configurado:', data.valorTotalTecnico);
        }
        
        // Remover seção anterior se existir
        let tecnicoItemsSection = document.getElementById('modal-tecnico-items');
        if (tecnicoItemsSection) {
            tecnicoItemsSection.remove();
        }
        
        // Criar nova seção de itens de técnico dentro da seção "Valores e Status"
        tecnicoItemsSection = document.createElement('div');
        tecnicoItemsSection.id = 'modal-tecnico-items';
        tecnicoItemsSection.className = 'route-items-modal-section'; // Usar mesma classe para manter estilo
        
        if (valoresStatusSection) {
            const prioridadeItem = valoresStatusSection.querySelector('.detail-item:nth-of-type(2)');
            if (prioridadeItem) {
                valoresStatusSection.insertBefore(tecnicoItemsSection, prioridadeItem);
            } else {
                const valorTotalItem = valorContainer;
                if (valorTotalItem && valorTotalItem.nextSibling) {
                    valoresStatusSection.insertBefore(tecnicoItemsSection, valorTotalItem.nextSibling);
                } else {
                    valoresStatusSection.appendChild(tecnicoItemsSection);
                }
            }
        }
        
        // Criar header para os itens individuais
        const itemsHeader = document.createElement('div');
        itemsHeader.className = 'route-items-modal-header';
        itemsHeader.innerHTML = '<i class="fas fa-list-ul"></i> <span>Detalhamento por ID</span>';
        tecnicoItemsSection.appendChild(itemsHeader);
        console.log('✅ Header de detalhamento de técnico criado');
        
        // Criar lista de itens
        const itemsList = document.createElement('div');
        itemsList.className = 'route-items-modal-list';
        
        console.log(`🔍 Criando ${data.itensTecnico.length} itens de técnico na lista...`);
        
        data.itensTecnico.forEach((item, index) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'route-item-modal';
            
            console.log(`🔍 Criando item de técnico ${index + 1}:`, item);
            
            // Construir HTML dos valores detalhados
            const valoresDetalhados = [];
            if (item.valor_pagamento_tecnico && item.valor_pagamento_tecnico !== 'R$ 0,00') {
                valoresDetalhados.push(`<div class="route-item-detail-value"><span class="detail-label-mini">Valor Pagamento:</span><span>${item.valor_pagamento_tecnico}</span></div>`);
            }
            if (item.valor_extra && item.valor_extra !== 'R$ 0,00') {
                valoresDetalhados.push(`<div class="route-item-detail-value"><span class="detail-label-mini">Valor Extra:</span><span>${item.valor_extra}</span></div>`);
            }
            
            const valoresDetalhadosHTML = valoresDetalhados.length > 0 
                ? `<div class="route-item-valores-detalhados">
                    <div class="valores-detalhados-title-mini"><i class="fas fa-list"></i> Valores Detalhados</div>
                    <div class="valores-detalhados-grid-mini">
                        ${valoresDetalhados.join('')}
                    </div>
                </div>` 
                : '';
            
            // Construir informações adicionais
            const infoAdicional = [];
            if (item.recebedor) {
                infoAdicional.push(`<div class="route-item-modal-info"><span class="route-item-modal-label"><i class="fas fa-user-check"></i> Recebedor:</span><span class="route-item-modal-value">${item.recebedor}</span></div>`);
            }
            if (item.chave_pix) {
                infoAdicional.push(`<div class="route-item-modal-info"><span class="route-item-modal-label"><i class="fas fa-qrcode"></i> Chave PIX:</span><span class="route-item-modal-value">${item.chave_pix}</span></div>`);
            }
            if (item.data_realizacao && item.data_realizacao !== 'N/A') {
                infoAdicional.push(`<div class="route-item-modal-info"><span class="route-item-modal-label"><i class="fas fa-calendar"></i> Data Realização:</span><span class="route-item-modal-value">${item.data_realizacao}</span></div>`);
            }
            if (item.data_pagamento && item.data_pagamento !== 'N/A') {
                infoAdicional.push(`<div class="route-item-modal-info"><span class="route-item-modal-label"><i class="fas fa-calendar-check"></i> Data Pagamento:</span><span class="route-item-modal-value">${item.data_pagamento}</span></div>`);
            }
            if (item.atividade_produtiva) {
                const badgeColor = item.atividade_produtiva_bool ? '#28a745' : '#dc3545';
                const badgeText = item.atividade_produtiva;
                infoAdicional.push(`<div class="route-item-modal-info"><span class="route-item-modal-label"><i class="fas fa-check-circle"></i> Atividade:</span><span class="route-item-modal-value" style="color: ${badgeColor}; font-weight: bold;">${badgeText}</span></div>`);
            }
            if (item.descricao) {
                infoAdicional.push(`<div class="route-item-modal-info"><span class="route-item-modal-label"><i class="fas fa-comment"></i> Descrição:</span><span class="route-item-modal-value">${item.descricao}</span></div>`);
            }
            
            const infoAdicionalHTML = infoAdicional.length > 0 
                ? `<div class="route-item-info-adicional">
                    <div class="route-item-info-title"><i class="fas fa-info-circle"></i> Informações Adicionais</div>
                    <div class="route-item-info-grid">
                        ${infoAdicional.join('')}
                    </div>
                </div>` 
                : '';
            
            itemDiv.innerHTML = `
                <div class="route-item-modal-header">
                    <div class="route-item-header-left">
                        <span class="route-item-modal-number">ID ${item.ordem}</span>
                        <span class="route-item-modal-id">#${item.ticket_tecnico || item.id || 'N/A'}</span>
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
                    ${infoAdicionalHTML}
                    ${valoresDetalhadosHTML}
                </div>
            `;
            
            itemsList.appendChild(itemDiv);
        });
        
        tecnicoItemsSection.appendChild(itemsList);
        console.log('✅ Lista de itens de técnico adicionada ao modal');
        
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
        
        // Preencher campo de Valor da Receita
        const valorReceitaElement = document.getElementById('modal-valor-receita');
        if (valorReceitaElement) {
            const receitaValue = data.valoresDetalhados.valor_receita || data.valorReceita || 'R$ 0,00';
            valorReceitaElement.textContent = receitaValue;
            console.log('✅ Campo Valor da Receita Casual configurado:', receitaValue);
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
        
        // Adicionar seção de Informações Adicionais (Chave PIX, Cliente/Empresa, CNPJ)
        const infoAdicional = [];
        if (valores.chave_pix) {
            infoAdicional.push(`<div class="route-item-modal-info"><span class="route-item-modal-label"><i class="fas fa-qrcode"></i> Chave PIX:</span><span class="route-item-modal-value">${valores.chave_pix}</span></div>`);
        }
        if (valores.cliente_empresa) {
            infoAdicional.push(`<div class="route-item-modal-info"><span class="route-item-modal-label"><i class="fas fa-building"></i> Cliente/Empresa:</span><span class="route-item-modal-value">${valores.cliente_empresa}</span></div>`);
        }
        if (valores.cnpj) {
            infoAdicional.push(`<div class="route-item-modal-info"><span class="route-item-modal-label"><i class="fas fa-id-card"></i> CNPJ:</span><span class="route-item-modal-value">${valores.cnpj}</span></div>`);
        }
        
        if (infoAdicional.length > 0) {
            const infoAdicionalHTML = document.createElement('div');
            infoAdicionalHTML.className = 'route-item-info-adicional';
            infoAdicionalHTML.style.marginTop = '16px';
            infoAdicionalHTML.innerHTML = `
                <div class="route-item-info-title"><i class="fas fa-info-circle"></i> Informações Adicionais</div>
                <div class="route-item-info-grid">
                    ${infoAdicional.join('')}
                </div>
            `;
            casualValoresSection.appendChild(infoAdicionalHTML);
            console.log('✅ Seção de Informações Adicionais adicionada para solicitação Casual');
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
        
        // Preencher campo de Valor da Receita no caso padrão
        const valorReceitaElement = document.getElementById('modal-valor-receita');
        if (valorReceitaElement) {
            valorReceitaElement.textContent = data.valorReceita || 'R$ 0,00';
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
    const overlay = modal.querySelector('.modal-overlay');
    
    console.log('🔍 Configurando listeners do modal:', {
        closeBtn: !!closeBtn,
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
    
    // BLOQUEAR COMPLETAMENTE o fechamento ao clicar fora do modal
    // Remover qualquer listener anterior do overlay
    if (overlay) {
        // Clonar overlay para remover todos os listeners
        const newOverlay = overlay.cloneNode(true);
        overlay.parentNode.replaceChild(newOverlay, overlay);
        
        // Adicionar listener que BLOQUEIA o fechamento
        newOverlay.addEventListener('click', function(e) {
            e.stopPropagation();
            e.stopImmediatePropagation();
            e.preventDefault();
            console.log('🚫 Overlay clicado - fechamento BLOQUEADO');
            return false;
        }, true); // Capture phase - intercepta ANTES de outros listeners
    }
    
    // Bloquear cliques no próprio modal (fora do conteúdo)
    if (modal) {
        // Remover listeners anteriores
        const modalClone = modal.cloneNode(true);
        modal.parentNode.replaceChild(modalClone, modal);
        
        // Re-obter referências após clonar
        const modalRef = document.getElementById('cardDetailModal');
        const overlayRef = modalRef ? modalRef.querySelector('.modal-overlay') : null;
        
        // Bloquear cliques no modal (mas não no conteúdo)
        if (modalRef) {
            modalRef.addEventListener('click', function(e) {
                const modalContent = modalRef.querySelector('.modal-content');
                // Se clicou fora do conteúdo (no overlay ou no fundo do modal)
                if (modalContent && !modalContent.contains(e.target)) {
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    e.preventDefault();
                    console.log('🚫 Clique no modal (fora do conteúdo) - BLOQUEADO');
                    return false;
                }
            }, true); // Capture phase - executa ANTES de outros listeners
        }
        
        // Bloquear também no overlay novamente (garantir)
        if (overlayRef) {
            overlayRef.addEventListener('click', function(e) {
                e.stopPropagation();
                e.stopImmediatePropagation();
                e.preventDefault();
                console.log('🚫 Overlay clicado (segunda camada) - BLOQUEADO');
                return false;
            }, true);
        }
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

    // Delegar fechamento para qualquer elemento com data-close-modal
    if (!modalCloseDelegationSetup) {
        document.addEventListener('click', function(e) {
            const closeTrigger = e.target.closest('[data-close-modal]');
            if (!closeTrigger) return;

            const modal = document.getElementById('cardDetailModal');
            if (!modal) return;

            const isInsideModal = modal.contains(closeTrigger);
            if (!isInsideModal) return;

            e.preventDefault();
            e.stopPropagation();
            console.log('✅ data-close-modal detectado (delegação única)');
            closeCardDetailModal();
        });
        modalCloseDelegationSetup = true;
    }
    
    // Event listener para botão de detalhamento
    const exportCardBtn = document.getElementById('exportCardBtn');
    console.log('🔍 Procurando botão exportCardBtn:', !!exportCardBtn);
    if (exportCardBtn) {
        // Remover listeners anteriores clonando o botão
        const newExportBtn = exportCardBtn.cloneNode(true);
        exportCardBtn.parentNode.replaceChild(newExportBtn, exportCardBtn);
        
        // Adicionar listener ao novo botão
        newExportBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('📄 Botão Detalhamento clicado');
            
            const currentModal = document.getElementById('cardDetailModal');
            if (!currentModal) {
                console.error('❌ Modal de detalhes não encontrado');
                showNotification('Não foi possível localizar o modal de detalhes.', 'error');
                return false;
            }
            
            const solicitacaoId = currentModal.getAttribute('data-card-id');
            console.log('🔍 ID da solicitação encontrado:', solicitacaoId);
            
            if (!solicitacaoId) {
                console.error('❌ card-id não encontrado no modal');
                showNotification('Não foi possível identificar a solicitação para visualizar detalhamento.', 'error');
                return false;
            }
            
            // Abrir relatório em nova guia
            const url = `/solicitacoes/exportar-relatorio-card/${solicitacaoId}/`;
            console.log('🌐 Abrindo URL:', url);
            
            try {
                const newWindow = window.open(url, '_blank');
                if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
                    // Popup bloqueado - tentar abrir na mesma janela
                    console.warn('⚠️ Popup bloqueado, tentando abrir na mesma janela');
                    window.location.href = url;
                } else {
                    console.log('✅ Detalhamento aberto em nova guia:', url);
                }
            } catch (error) {
                console.error('❌ Erro ao abrir nova guia:', error);
                // Fallback: abrir na mesma janela
                window.location.href = url;
            }
            
            return false;
        });
        console.log('✅ Listener do botão Detalhamento adicionado com sucesso');
    } else {
        console.warn('⚠️ Botão exportCardBtn não encontrado no DOM');
    }

    const editCardBtn = document.getElementById('editCardBtn');
    if (editCardBtn) {
        const newEditBtn = editCardBtn.cloneNode(true);
        const isEditable = modal.getAttribute('data-editable') === 'true';
        newEditBtn.classList.toggle('is-disabled', !isEditable);
        newEditBtn.setAttribute('aria-disabled', (!isEditable).toString());
        if (!isEditable) {
            newEditBtn.setAttribute('title', 'Somente solicitações pendentes podem ser editadas.');
        }
        editCardBtn.parentNode.replaceChild(newEditBtn, editCardBtn);
        newEditBtn.addEventListener('click', function(e) {
            console.log('🟠 Botão Editar clicado');
            e.preventDefault();
            e.stopPropagation();
            const currentModal = document.getElementById('cardDetailModal');
            if (!currentModal) {
                console.error('❌ Modal de detalhes não encontrado ao iniciar edição');
                showNotification('Não foi possível localizar o modal de detalhes.', 'error');
                return false;
            }
            const isEditable = currentModal.getAttribute('data-editable') === 'true';
            if (!isEditable) {
                console.warn('⚠️ Tentativa de editar solicitação fora da coluna pendente');
                showNotification('Somente solicitações pendentes podem ser editadas.', 'warning');
                return false;
            }
            const solicitacaoId = currentModal.getAttribute('data-card-id');
            if (!solicitacaoId) {
                console.error('❌ card-id não encontrado no modal');
                showNotification('Não foi possível identificar a solicitação para edição.', 'error');
                return false;
            }
            iniciarEdicaoSolicitacao(solicitacaoId);
            return false;
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
            
            // Atualizar contadores - SEMPRE contar apenas cards visíveis (não usar valores do backend que são totais)
            if (typeof window.updateCardCountersAfterFilter === 'function') {
                window.updateCardCountersAfterFilter();
            } else if (typeof updateColumnCounters === 'function') {
                // Fallback: usar função local
                updateColumnCounters();
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
            
            // Fechar modal
            closeCardDetailModal();
            
            // Mostrar notificação de sucesso
            showNotification(`✅ Status atualizado para ${getFilaName(targetFila)}!`, 'success');
            
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
            showNotification(`❌ Erro: ${data.message}`, 'error');
        }
    })
    .catch(error => {
        console.error('Erro ao atualizar status:', error);
        
        // Verificar se é erro de conexão
        let errorMessage = '❌ Erro ao salvar. Tente novamente.';
        if (error.message && error.message.includes('Failed to fetch')) {
            errorMessage = '❌ Servidor não disponível. Verifique se o servidor Django está rodando.';
        } else if (error.message && error.message.includes('ERR_CONNECTION_REFUSED')) {
            errorMessage = '❌ Não foi possível conectar ao servidor. Inicie o servidor Django.';
        }
        
        showNotification(errorMessage, 'error');
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
            // Contar apenas cards que são solicitações válidas (têm data-card-id) E estão visíveis
            // Isso garante que estamos contando apenas solicitações da tabela que estão realmente visíveis
            const allCards = content.querySelectorAll('.card[data-card-id]:not(.empty-column)');
            let visibleCount = 0;
            
            allCards.forEach(card => {
                // Verificar se o card está realmente visível
                const style = window.getComputedStyle(card);
                const isVisible = style.display !== 'none' && 
                                 style.visibility !== 'hidden' && 
                                 !card.classList.contains('filtered-out') &&
                                 card.offsetParent !== null; // offsetParent é null se o elemento está oculto
                
                if (isVisible) {
                    visibleCount++;
                }
            });
            
            counter.textContent = visibleCount;
            
            // Mostrar/ocultar mensagem de coluna vazia
            const emptyMessage = content.querySelector('.empty-column');
            if (visibleCount === 0 && !emptyMessage) {
                // Adicionar mensagem se não tiver cards
                const empty = document.createElement('div');
                empty.className = 'empty-column';
                empty.innerHTML = `
                    <i class="fas fa-inbox"></i>
                    <p>Nenhuma solicitação</p>
                `;
                content.appendChild(empty);
            } else if (visibleCount > 0 && emptyMessage) {
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

async function iniciarEdicaoSolicitacao(solicitacaoId) {
    console.log('🟡 Iniciando edição da solicitação', solicitacaoId);
    try {
        const response = await fetch(`/solicitacoes/obter-detalhes-completos/${solicitacaoId}/`);
        if (!response.ok) {
            throw new Error(`Erro ${response.status}`);
        }
        const resultado = await response.json();
        if (!resultado.success || !resultado.dados) {
            showNotification(resultado.message || 'Erro ao carregar dados da solicitação.', 'error');
            return;
        }
        
        if (typeof window.preencherFormularioEdicao === 'function') {
            window.preencherFormularioEdicao(resultado.dados);
        } else {
            console.error('⚠️ Função window.preencherFormularioEdicao não encontrada.');
            showNotification('Não foi possível preparar o formulário de edição.', 'error');
            return;
        }
        
        closeCardDetailModal();
        abrirModalEdicaoSolicitacao();
    } catch (error) {
        console.error('❌ Erro ao iniciar edição da solicitação:', error);
        showNotification('Erro ao carregar dados para edição.', 'error');
    }
}

function abrirModalEdicaoSolicitacao() {
    const modalCriacao = document.getElementById('createCampaignModal');
    if (modalCriacao) {
        modalCriacao.style.display = 'flex';
        modalCriacao.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        const primeiroCampo = modalCriacao.querySelector('input[required]:not([disabled])');
        if (primeiroCampo) {
            setTimeout(() => primeiroCampo.focus(), 100);
        }
    } else {
        console.error('⚠️ Modal de criação não encontrado ao tentar abrir para edição.');
    }
}

// Função para fechar modal de detalhes
function closeCardDetailModal() {
    console.log('🔴 Fechando modal de detalhes do card...');
    const modal = document.getElementById('cardDetailModal');
    if (modal) {
        modal.classList.remove('show');
        modal.style.display = 'none';
        document.body.style.overflow = '';
        console.log('✅ Modal fechado com sucesso');
    } else {
        console.error('❌ Modal não encontrado ao tentar fechar');
    }
}

// Função para BLOQUEAR fechamento ao clicar fora - executar imediatamente
(function() {
    'use strict';
    // Aguardar DOM estar pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', blockModalClose);
    } else {
        blockModalClose();
    }
    
    function blockModalClose() {
        const modal = document.getElementById('cardDetailModal');
        if (!modal) {
            // Tentar novamente após um delay se o modal ainda não existir
            setTimeout(blockModalClose, 100);
            return;
        }
        
        // Observar quando o modal é exibido e bloquear fechamento
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    if (modal.classList.contains('show')) {
                        // Modal foi aberto, bloquear fechamento
                        setTimeout(function() {
                            const overlay = modal.querySelector('.modal-overlay');
                            if (overlay) {
                                // Remover todos os listeners
                                const newOverlay = overlay.cloneNode(true);
                                overlay.parentNode.replaceChild(newOverlay, overlay);
                                
                                // Bloquear completamente
                                newOverlay.addEventListener('click', function(e) {
                                    e.stopPropagation();
                                    e.stopImmediatePropagation();
                                    e.preventDefault();
                                    console.log('🚫🚫🚫 BLOQUEIO ATIVO: Overlay clicado - FECHAMENTO IMPEDIDO');
                                    return false;
                                }, true);
                            }
                            
                            // Bloquear cliques no modal
                            modal.addEventListener('click', function(e) {
                                const modalContent = modal.querySelector('.modal-content');
                                if (modalContent && !modalContent.contains(e.target)) {
                                    e.stopPropagation();
                                    e.stopImmediatePropagation();
                                    e.preventDefault();
                                    console.log('🚫🚫🚫 BLOQUEIO ATIVO: Clique no modal (fora do conteúdo) - FECHAMENTO IMPEDIDO');
                                    return false;
                                }
                            }, true);
                        }, 50);
                    }
                }
            });
        });
        
        // Observar mudanças no atributo class do modal
        observer.observe(modal, {
            attributes: true,
            attributeFilter: ['class']
        });
        
        console.log('🛡️ Sistema de bloqueio de fechamento do modal ativado');
    }
})();

// Inicialização quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    calculateQueueTime();
    
    // Atualizar a cada minuto
    setInterval(calculateQueueTime, 60000);
    
    // Inicializar expansão dos cards do Django
    initializeCardExpansion();
    
    // Re-inicializar após um delay para garantir que todos os scripts carregaram
    setTimeout(() => {
        initializeCardExpansion();
    }, 1000);
    
    // Inicializar filtros das colunas
    initializeColumnFilters();
    
    // Expor função globalmente para debug
    window.initializeCardExpansion = initializeCardExpansion;
    window.openCardDetailModal = openCardDetailModal;
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
            const searchTerm = this.value.trim();
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

// Função para normalizar texto removendo acentos
function normalizeText(text) {
    if (!text) return '';
    
    // Converter para string se não for
    text = String(text);
    
    // Usar método mais robusto com String.normalize() - remove todos os acentos Unicode
    try {
        return text
            .normalize('NFD')  // Decompõe caracteres acentuados (ex: é -> e + ́)
            .replace(/[\u0300-\u036f]/g, '')  // Remove todos os diacríticos (acentos)
            .toLowerCase();  // Converte para minúsculo
    } catch (e) {
        // Fallback se normalize não estiver disponível
        const accents = 'ÀÁÂÃÄÅàáâãäåÈÉÊËèéêëÌÍÎÏìíîïÒÓÔÕÖòóôõöÙÚÛÜùúûüÇçÑñÝý';
        const noAccents = 'AAAAAAaaaaaaEEEEeeeeIIIIiiiiOOOOOOooooooUUUUuuuuCcNnYy';
        
        return text.split('').map(char => {
            const index = accents.indexOf(char);
            return index !== -1 ? noAccents[index] : char;
        }).join('').toLowerCase();
    }
}

// Função para filtrar cards em uma coluna específica
function filterCardsInColumn(column, searchTerm) {
    const columnContent = document.querySelector(`[data-column="${column}"].column-content`);
    if (!columnContent) return;
    
    const cards = columnContent.querySelectorAll('.card');
    let visibleCount = 0;
    
    // Normalizar o termo de busca (remover acentos e converter para minúsculo)
    // normalizeText já faz toLowerCase, então não precisa fazer duas vezes
    const normalizedSearchTerm = normalizeText(searchTerm.trim());
    
    cards.forEach(card => {
        const cardText = getCardSearchableText(card);
        // Normalizar o texto do card também (remover acentos e converter para minúsculo)
        const normalizedCardText = normalizeText(cardText);
        
        // Debug apenas para o primeiro card quando há busca (remover depois)
        if (normalizedSearchTerm && normalizedSearchTerm.length > 0 && visibleCount === 0 && cards.length > 0) {
            console.log('🔍 Buscando termo original:', searchTerm);
            console.log('🔍 Termo normalizado:', normalizedSearchTerm);
            console.log('📄 Texto original do card:', cardText);
            console.log('📄 Texto normalizado do card:', normalizedCardText);
            console.log('📋 Solicitante capturado:', getCardSearchableText(card).split(' ').find(w => w.toLowerCase().includes('gean')));
            console.log('✅ Match encontrado?', normalizedCardText.includes(normalizedSearchTerm));
        }
        
        const isMatch = normalizedSearchTerm === '' || normalizedCardText.includes(normalizedSearchTerm);
        
        if (isMatch) {
            card.style.display = '';
            card.style.visibility = 'visible';
            card.style.opacity = '1';
            card.classList.remove('filtered-out');
            card.classList.add('filtered-in');
            visibleCount++;
        } else {
            card.style.display = 'none';
            card.style.visibility = 'hidden';
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
    
    // Buscar todos os valores de info-value
    const allInfoValues = card.querySelectorAll('.info-value');
    const id = allInfoValues[0]?.textContent || '';
    
    // Buscar solicitante e recebedor de forma mais robusta
    const infoItems = card.querySelectorAll('.info-item');
    let solicitante = '';
    let recebedor = '';
    let valor = '';
    
    infoItems.forEach(item => {
        const labelElement = item.querySelector('.info-label');
        const valueElement = item.querySelector('.info-value');
        
        if (labelElement && valueElement) {
            const label = labelElement.textContent.trim().toUpperCase();
            const value = valueElement.textContent.trim();
            
            if (label.includes('SOLICITANTE')) {
                solicitante = value;
            } else if (label.includes('RECEBEDOR')) {
                recebedor = value;
            } else if (label.includes('VALOR')) {
                valor = value;
            }
        }
    });
    
    // Fallback: tentar pelos índices se não encontrou pelo label
    if (!solicitante && allInfoValues.length > 1) {
        solicitante = allInfoValues[1]?.textContent || '';
    }
    if (!recebedor && allInfoValues.length > 2) {
        recebedor = allInfoValues[2]?.textContent || '';
    }
    if (!valor && allInfoValues.length > 3) {
        valor = allInfoValues[3]?.textContent || '';
    }
    
    const prioridade = card.querySelector('.priority')?.textContent || '';
    const status = card.querySelector('.card-stage')?.textContent || '';
    
    // Combinar todos os textos pesquisáveis
    const searchableText = `${title} ${id} ${solicitante} ${recebedor} ${valor} ${prioridade} ${status}`.trim();
    
    return searchableText;
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

// Função para atualizar contadores das colunas
function updateColumnCounters() {
    const columns = document.querySelectorAll('.kanban-column');
    columns.forEach(column => {
        const content = column.querySelector('.column-content');
        const counter = column.querySelector('.card-count');
        if (content && counter) {
            // Contar apenas cards que são solicitações válidas (têm data-card-id) E estão visíveis
            // Isso garante que estamos contando apenas solicitações da tabela que estão realmente visíveis
            const allCards = content.querySelectorAll('.card[data-card-id]:not(.empty-column)');
            let visibleCount = 0;
            
            allCards.forEach(card => {
                // Verificar se o card está realmente visível
                const style = window.getComputedStyle(card);
                const isVisible = style.display !== 'none' && 
                                 style.visibility !== 'hidden' && 
                                 !card.classList.contains('filtered-out') &&
                                 card.offsetParent !== null; // offsetParent é null se o elemento está oculto
                
                if (isVisible) {
                    visibleCount++;
                }
            });
            
            counter.textContent = visibleCount;
            
            // Mostrar/ocultar mensagem de coluna vazia
            const emptyMessage = content.querySelector('.empty-column');
            if (visibleCount === 0 && !emptyMessage) {
                // Adicionar mensagem se não tiver cards
                const empty = document.createElement('div');
                empty.className = 'empty-column';
                empty.innerHTML = `
                    <i class="fas fa-inbox"></i>
                    <p>Nenhuma solicitação</p>
                `;
                content.appendChild(empty);
            } else if (visibleCount > 0 && emptyMessage) {
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

async function iniciarEdicaoSolicitacao(solicitacaoId) {
    console.log('🟡 Iniciando edição da solicitação', solicitacaoId);
    try {
        const response = await fetch(`/solicitacoes/obter-detalhes-completos/${solicitacaoId}/`);
        if (!response.ok) {
            throw new Error(`Erro ${response.status}`);
        }
        const resultado = await response.json();
        if (!resultado.success || !resultado.dados) {
            showNotification(resultado.message || 'Erro ao carregar dados da solicitação.', 'error');
            return;
        }
        
        if (typeof window.preencherFormularioEdicao === 'function') {
            window.preencherFormularioEdicao(resultado.dados);
        } else {
            console.error('⚠️ Função window.preencherFormularioEdicao não encontrada.');
            showNotification('Não foi possível preparar o formulário de edição.', 'error');
            return;
        }
        
        closeCardDetailModal();
        abrirModalEdicaoSolicitacao();
    } catch (error) {
        console.error('❌ Erro ao iniciar edição da solicitação:', error);
        showNotification('Erro ao carregar dados para edição.', 'error');
    }
}

function abrirModalEdicaoSolicitacao() {
    const modalCriacao = document.getElementById('createCampaignModal');
    if (modalCriacao) {
        modalCriacao.style.display = 'flex';
        modalCriacao.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        const primeiroCampo = modalCriacao.querySelector('input[required]:not([disabled])');
        if (primeiroCampo) {
            setTimeout(() => primeiroCampo.focus(), 100);
        }
    } else {
        console.error('⚠️ Modal de criação não encontrado ao tentar abrir para edição.');
    }
}

// Função para fechar modal de detalhes
function closeCardDetailModal() {
    console.log('🔴 Fechando modal de detalhes do card...');
    const modal = document.getElementById('cardDetailModal');
    if (modal) {
        modal.classList.remove('show');
        modal.style.display = 'none';
        document.body.style.overflow = '';
        console.log('✅ Modal fechado com sucesso');
    } else {
        console.error('❌ Modal não encontrado ao tentar fechar');
    }
}

// Função para BLOQUEAR fechamento ao clicar fora - executar imediatamente
(function() {
    'use strict';
    // Aguardar DOM estar pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', blockModalClose);
    } else {
        blockModalClose();
    }
    
    function blockModalClose() {
        const modal = document.getElementById('cardDetailModal');
        if (!modal) {
            // Tentar novamente após um delay se o modal ainda não existir
            setTimeout(blockModalClose, 100);
            return;
        }
        
        // Observar quando o modal é exibido e bloquear fechamento
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    if (modal.classList.contains('show')) {
                        // Modal foi aberto, bloquear fechamento
                        setTimeout(function() {
                            const overlay = modal.querySelector('.modal-overlay');
                            if (overlay) {
                                // Remover todos os listeners
                                const newOverlay = overlay.cloneNode(true);
                                overlay.parentNode.replaceChild(newOverlay, overlay);
                                
                                // Bloquear completamente
                                newOverlay.addEventListener('click', function(e) {
                                    e.stopPropagation();
                                    e.stopImmediatePropagation();
                                    e.preventDefault();
                                    console.log('🚫🚫🚫 BLOQUEIO ATIVO: Overlay clicado - FECHAMENTO IMPEDIDO');
                                    return false;
                                }, true);
                            }
                            
                            // Bloquear cliques no modal
                            modal.addEventListener('click', function(e) {
                                const modalContent = modal.querySelector('.modal-content');
                                if (modalContent && !modalContent.contains(e.target)) {
                                    e.stopPropagation();
                                    e.stopImmediatePropagation();
                                    e.preventDefault();
                                    console.log('🚫🚫🚫 BLOQUEIO ATIVO: Clique no modal (fora do conteúdo) - FECHAMENTO IMPEDIDO');
                                    return false;
                                }
                            }, true);
                        }, 50);
                    }
                }
            });
        });
        
        // Observar mudanças no atributo class do modal
        observer.observe(modal, {
            attributes: true,
            attributeFilter: ['class']
        });
        
        console.log('🛡️ Sistema de bloqueio de fechamento do modal ativado');
    }
})();


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
            const searchTerm = this.value.trim();
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

// Função para normalizar texto removendo acentos
function normalizeText(text) {
    if (!text) return '';
    
    // Converter para string se não for
    text = String(text);
    
    // Usar método mais robusto com String.normalize() - remove todos os acentos Unicode
    try {
        return text
            .normalize('NFD')  // Decompõe caracteres acentuados (ex: é -> e + ́)
            .replace(/[\u0300-\u036f]/g, '')  // Remove todos os diacríticos (acentos)
            .toLowerCase();  // Converte para minúsculo
    } catch (e) {
        // Fallback se normalize não estiver disponível
        const accents = 'ÀÁÂÃÄÅàáâãäåÈÉÊËèéêëÌÍÎÏìíîïÒÓÔÕÖòóôõöÙÚÛÜùúûüÇçÑñÝý';
        const noAccents = 'AAAAAAaaaaaaEEEEeeeeIIIIiiiiOOOOOOooooooUUUUuuuuCcNnYy';
        
        return text.split('').map(char => {
            const index = accents.indexOf(char);
            return index !== -1 ? noAccents[index] : char;
        }).join('').toLowerCase();
    }
}

// Função para filtrar cards em uma coluna específica
function filterCardsInColumn(column, searchTerm) {
    const columnContent = document.querySelector(`[data-column="${column}"].column-content`);
    if (!columnContent) return;
    
    const cards = columnContent.querySelectorAll('.card');
    let visibleCount = 0;
    
    // Normalizar o termo de busca (remover acentos e converter para minúsculo)
    // normalizeText já faz toLowerCase, então não precisa fazer duas vezes
    const normalizedSearchTerm = normalizeText(searchTerm.trim());
    
    cards.forEach(card => {
        const cardText = getCardSearchableText(card);
        // Normalizar o texto do card também (remover acentos e converter para minúsculo)
        const normalizedCardText = normalizeText(cardText);
        
        // Debug apenas para o primeiro card quando há busca (remover depois)
        if (normalizedSearchTerm && normalizedSearchTerm.length > 0 && visibleCount === 0 && cards.length > 0) {
            console.log('🔍 Buscando termo original:', searchTerm);
            console.log('🔍 Termo normalizado:', normalizedSearchTerm);
            console.log('📄 Texto original do card:', cardText);
            console.log('📄 Texto normalizado do card:', normalizedCardText);
            console.log('📋 Solicitante capturado:', getCardSearchableText(card).split(' ').find(w => w.toLowerCase().includes('gean')));
            console.log('✅ Match encontrado?', normalizedCardText.includes(normalizedSearchTerm));
        }
        
        const isMatch = normalizedSearchTerm === '' || normalizedCardText.includes(normalizedSearchTerm);
        
        if (isMatch) {
            card.style.display = '';
            card.style.visibility = 'visible';
            card.style.opacity = '1';
            card.classList.remove('filtered-out');
            card.classList.add('filtered-in');
            visibleCount++;
        } else {
            card.style.display = 'none';
            card.style.visibility = 'hidden';
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
    
    // Buscar todos os valores de info-value
    const allInfoValues = card.querySelectorAll('.info-value');
    const id = allInfoValues[0]?.textContent || '';
    
    // Buscar solicitante e recebedor de forma mais robusta
    const infoItems = card.querySelectorAll('.info-item');
    let solicitante = '';
    let recebedor = '';
    let valor = '';
    
    infoItems.forEach(item => {
        const labelElement = item.querySelector('.info-label');
        const valueElement = item.querySelector('.info-value');
        
        if (labelElement && valueElement) {
            const label = labelElement.textContent.trim().toUpperCase();
            const value = valueElement.textContent.trim();
            
            if (label.includes('SOLICITANTE')) {
                solicitante = value;
            } else if (label.includes('RECEBEDOR')) {
                recebedor = value;
            } else if (label.includes('VALOR')) {
                valor = value;
            }
        }
    });
    
    // Fallback: tentar pelos índices se não encontrou pelo label
    if (!solicitante && allInfoValues.length > 1) {
        solicitante = allInfoValues[1]?.textContent || '';
    }
    if (!recebedor && allInfoValues.length > 2) {
        recebedor = allInfoValues[2]?.textContent || '';
    }
    if (!valor && allInfoValues.length > 3) {
        valor = allInfoValues[3]?.textContent || '';
    }
    
    const prioridade = card.querySelector('.priority')?.textContent || '';
    const status = card.querySelector('.card-stage')?.textContent || '';
    
    // Combinar todos os textos pesquisáveis
    const searchableText = `${title} ${id} ${solicitante} ${recebedor} ${valor} ${prioridade} ${status}`.trim();
    
    return searchableText;
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
