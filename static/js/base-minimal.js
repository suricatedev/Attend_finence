// JavaScript SUPER SIMPLES - Apenas abrir e fechar modal

// Esperar a página carregar
window.addEventListener('DOMContentLoaded', function() {
    
    // Pegar o select e o modal
    const requestTypeSelect = document.getElementById('requestTypeSelect');
    const modal = document.getElementById('createCampaignModal');
    const btnFechar = document.getElementById('closeModal');
    const btnCancelar = document.getElementById('cancelCreate');
    const modalContent = modal ? modal.querySelector('.modal-content') : null;
    
    // Função para abrir o modal
    function openModal() {
        if (!modal) return;
        
        console.log('✅ Abrindo modal...');
        // Limpar formulário antes de abrir
        const form = document.getElementById('createCampaignForm');
        if (form) {
            form.reset();
            
            // Verificar se está em modo técnico
            const filterType = localStorage.getItem('filterType');
            const modoTecnico = filterType === 'tecnico';
            const modoTecnicoInput = document.getElementById('modoTecnico');
            
            if (modoTecnicoInput) {
                modoTecnicoInput.value = modoTecnico ? 'true' : 'false';
            }
            
            const routeCasual = document.getElementById('routeCasual');
            const routeEmRota = document.getElementById('routeEmRota');
            const formEmRota = document.getElementById('formEmRota');
            const formCasual = document.getElementById('formCasual');
            const formTecnico = document.getElementById('formTecnico');
            const routeClassic = document.getElementById('routeClassicSelector') || document.querySelector('.route-classic');
            const modalTitulo = document.getElementById('modalSolicitacaoTitulo');
            
            if (modoTecnico) {
                // Modo técnico ativo - mostrar formulário de técnico
                if (modalTitulo) {
                    modalTitulo.textContent = 'Nova Solicitação de Técnico';
                }
                // Ocultar seletor de tipo de solicitação (Agrupados/Individual)
                if (routeClassic) {
                    routeClassic.style.display = 'none';
                    routeClassic.style.visibility = 'hidden';
                }
                if (formCasual) {
                    formCasual.style.display = 'none';
                }
                if (formEmRota) {
                    formEmRota.style.display = 'none';
                }
                if (formTecnico) {
                    formTecnico.style.display = 'block';
                    formTecnico.style.visibility = 'visible';
                    
                    // Garantir que TODOS os campos do formulário de técnico estejam habilitados
                    formTecnico.querySelectorAll('input, select, textarea').forEach(field => {
                        if (field.type !== 'file' && field.type !== 'hidden' && field.type !== 'button' && field.type !== 'submit') {
                            field.disabled = false;
                            field.removeAttribute('readonly');
                        }
                    });
                    
                    // Garantir que o botão de adicionar ID esteja visível
                    const btnAddTecnicoId = document.getElementById('btnAddTecnicoId');
                    const addContainerTecnico = btnAddTecnicoId ? btnAddTecnicoId.closest('.add-id-container') : null;
                    if (addContainerTecnico) {
                        addContainerTecnico.style.display = 'flex';
                        addContainerTecnico.style.visibility = 'visible';
                    }
                    
                    // Carregar clientes/empresas no select quando o modal abrir
                    if (typeof window.carregarClientesEmpresasTecnico === 'function') {
                        // Pequeno delay para garantir que o DOM está pronto
                        setTimeout(function() {
                            window.carregarClientesEmpresasTecnico();
                        }, 100);
                    } else {
                        // Tentar carregar diretamente se a função não estiver disponível ainda
                        const clienteEmpresaSelect1 = document.getElementById('tecnicoClienteEmpresa1');
                        if (clienteEmpresaSelect1 && clienteEmpresaSelect1.options.length <= 1) {
                            fetch('/solicitacoes/buscar-clientes-empresas/?q=')
                                .then(response => response.json())
                                .then(data => {
                                    if (data.success && data.clientes_empresas) {
                                        clienteEmpresaSelect1.innerHTML = '<option value="">Selecione o cliente/empresa</option>';
                                        data.clientes_empresas.forEach(cliente => {
                                            const option = document.createElement('option');
                                            option.value = cliente.id;
                                            option.textContent = cliente.nome;
                                            clienteEmpresaSelect1.appendChild(option);
                                        });
                                        console.log(`✅ ${data.clientes_empresas.length} clientes/empresas carregados`);
                                    }
                                })
                                .catch(error => {
                                    console.error('❌ Erro ao carregar clientes/empresas:', error);
                                });
                        }
                    }
                }
                console.log('✅ Formulário de técnico ativado');
            } else {
                // Modo normal - mostrar formulário Casual
                if (modalTitulo) {
                    modalTitulo.textContent = 'Nova Solicitação Financeira';
                }
                // Mostrar seletor de tipo de solicitação (Agrupados/Individual)
                if (routeClassic) {
                    routeClassic.style.display = '';
                    routeClassic.style.visibility = 'visible';
                }
                if (routeCasual) {
                    routeCasual.checked = true;
                }
                if (routeEmRota) {
                    routeEmRota.checked = false;
                }
                if (formCasual) {
                    formCasual.style.display = 'block';
                }
                if (formEmRota) {
                    formEmRota.style.display = 'none';
                }
                if (formTecnico) {
                    formTecnico.style.display = 'none';
                }
                console.log('✅ Formulário limpo e resetado para padrão (Casual)');
            }
        }
        modal.style.display = 'flex';
        modal.classList.add('show');
    }
    
    // Botão para abrir modal de criação
    const createCampaignBtn = document.getElementById('createCampaignBtn');
    if (createCampaignBtn && modal) {
        createCampaignBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            openModal();
        });
    }
    
    // Quando selecionar uma opção no select (apenas filtrar, não abrir modal)
    if (requestTypeSelect) {
        requestTypeSelect.addEventListener('change', function(e) {
            const selectedValue = e.target.value;
            const appTitle = document.querySelector('.app-title');
            
            if (selectedValue && selectedValue !== '') {
                // Se selecionou "técnico", mudar o título e filtrar
                if (selectedValue === 'tecnico') {
                    if (appTitle) {
                        appTitle.textContent = 'Solicitação financeira por tecnico';
                    }
                    localStorage.setItem('filterType', 'tecnico');
                    setTimeout(() => {
                        if (typeof filterCardsByType === 'function') filterCardsByType('tecnico');
                        if (typeof window.initializeTodayFilter === 'function') window.initializeTodayFilter();
                    }, 100);
                } else if (selectedValue === 'deslocamento') {
                    if (appTitle) {
                        appTitle.textContent = 'Solicitação de deslocamento';
                    }
                    localStorage.setItem('filterType', 'deslocamento');
                    setTimeout(() => {
                        if (typeof filterCardsByType === 'function') filterCardsByType('deslocamento');
                        if (typeof window.initializeTodayFilter === 'function') window.initializeTodayFilter();
                        if (typeof window.updateCardCountersAfterFilter === 'function') {
                            window.updateCardCountersAfterFilter();
                        }
                    }, 100);
                }
            }
        });
    }
    
    // Aplicar filtro salvo ao carregar a página
    window.addEventListener('DOMContentLoaded', function() {
        const appTitle = document.querySelector('.app-title');
        const requestTypeSelect = document.getElementById('requestTypeSelect');
        const savedFilter = localStorage.getItem('filterType');
        
        // Prioridade: 1) localStorage (preserva seleção após reload), 2) Valor do select, 3) Padrão (deslocamento)
        let filterToApply = 'deslocamento'; // Padrão
        
        // Se houver filtro salvo no localStorage, usar ele (preserva seleção após reload/movimentação)
        if (savedFilter) {
            filterToApply = savedFilter;
            // Atualizar o select com o valor do localStorage para garantir consistência visual
            if (requestTypeSelect) {
                requestTypeSelect.value = filterToApply;
            }
        } else if (requestTypeSelect && requestTypeSelect.value) {
            // Se não houver localStorage, usar o valor do select
            filterToApply = requestTypeSelect.value;
        }
        
        // Garantir que o filtro seja salvo e o select tenha o valor correto
        localStorage.setItem('filterType', filterToApply);
        if (requestTypeSelect) {
            requestTypeSelect.value = filterToApply;
        }
        
        if (filterToApply === 'tecnico') {
            if (appTitle) {
                appTitle.textContent = 'Solicitação financeira por tecnico';
            }
            // Aplicar filtro de técnico imediatamente (antes do filtro de data)
            // Usar função rápida se disponível, senão usar função normal
            if (typeof window.applyFilterFast === 'function') {
                window.applyFilterFast();
            }
            filterCardsByType('tecnico');
        } else if (filterToApply === 'deslocamento') {
            if (appTitle) {
                appTitle.textContent = 'Solicitação de deslocamento';
            }
            // Aplicar filtro de deslocamento imediatamente (antes do filtro de data)
            // Usar função rápida se disponível, senão usar função normal
            if (typeof window.applyFilterFast === 'function') {
                window.applyFilterFast();
            }
            filterCardsByType('deslocamento');
            // Restaurar contadores originais do backend quando for deslocamento
            setTimeout(() => {
                if (typeof window.updateCardCountersAfterFilter === 'function') {
                    window.updateCardCountersAfterFilter();
                }
            }, 150);
        }
    });
    
    // Também aplicar filtro quando a página terminar de carregar completamente
    window.addEventListener('load', function() {
        const requestTypeSelect = document.getElementById('requestTypeSelect');
        const savedFilter = localStorage.getItem('filterType');
        
        // Prioridade: 1) localStorage (filtro preservado), 2) Valor do select, 3) Padrão (deslocamento)
        let filterToApply = 'deslocamento'; // Padrão mudado para deslocamento
        if (savedFilter) {
            // Se houver filtro salvo no localStorage, usar ele (preserva seleção do usuário)
            filterToApply = savedFilter;
            // Atualizar o select com o valor do localStorage para garantir consistência
            if (requestTypeSelect) {
                requestTypeSelect.value = filterToApply;
                // Atualizar título da página
                const appTitle = document.querySelector('.app-title');
                if (appTitle) {
                    if (filterToApply === 'tecnico') {
                        appTitle.textContent = 'Solicitação financeira por tecnico';
                    } else {
                        appTitle.textContent = 'Solicitação de deslocamento';
                    }
                }
            }
        } else if (requestTypeSelect && requestTypeSelect.value) {
            // Se não houver localStorage, usar o valor do select
            filterToApply = requestTypeSelect.value;
        }
        
        // Garantir que o filtro seja salvo
        localStorage.setItem('filterType', filterToApply);
        
        // Aplicar o filtro imediatamente. Para deslocamento, NÃO chamar filterCardsByType no load:
        // a página home já aplicou tipo + filtro "Hoje" no DOMContentLoaded; chamar aqui mostraria TODOS de novo.
        if (filterToApply === 'tecnico') {
            filterCardsByType('tecnico');
            setTimeout(() => filterCardsByType('tecnico'), 10);
            setTimeout(() => filterCardsByType('tecnico'), 100);
            setTimeout(() => filterCardsByType('tecnico'), 500);
        }
        // Para deslocamento: não chamar filterCardsByType — manter o estado "Hoje" aplicado pela home.
        
        // Atualizar contadores após aplicar filtro no load
        setTimeout(() => {
            updateCardCounts();
            if (typeof window.updateCardCountersAfterFilter === 'function') {
                window.updateCardCountersAfterFilter();
            }
        }, 600);
    });
    
    // Função para filtrar cards por tipo
    function filterCardsByType(tipo) {
        const allCards = document.querySelectorAll('.card');
        
        allCards.forEach(card => {
            if (tipo === 'tecnico') {
                // Verificar se o card é de técnico
                const isTecnico = card.getAttribute('data-is-tecnico') === 'true';
                
                if (isTecnico) {
                    card.style.display = '';
                } else {
                    card.style.display = 'none';
                }
            } else if (tipo === 'deslocamento') {
                const isTecnico = card.getAttribute('data-is-tecnico') === 'true';
                
                if (isTecnico) {
                    card.style.display = 'none';
                } else {
                    card.style.display = '';
                }
            } else {
                // Mostrar todos os cards
                card.style.display = '';
            }
        });
        
        // Atualizar contadores de cards
        updateCardCounts();
        
        // Garantir que a função global também seja chamada
        if (typeof window.updateCardCountersAfterFilter === 'function') {
            window.updateCardCountersAfterFilter();
        }
    }
    
    // Função para atualizar contadores de cards
    function updateCardCounts() {
        const filterType = localStorage.getItem('filterType') || 'deslocamento';
        const columns = ['planning', 'test', 'launch', 'success'];
        
        columns.forEach(column => {
            const columnElement = document.querySelector(`[data-column="${column}"]`);
            if (columnElement) {
                const columnContent = columnElement.querySelector('.column-content');
                const counter = columnElement.querySelector('.card-count');
                
                if (columnContent && counter) {
                    // SEMPRE contar apenas cards visíveis, independente do tipo de filtro
                    // Isso garante que filtros de data, busca ou outros filtros sejam respeitados
                    const allCards = columnContent.querySelectorAll('.card[data-card-id]:not(.empty-column)');
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
                }
            }
        });
    }
    
    // Evitar que clique DENTRO do modal feche ele
    if (modalContent) {
        modalContent.addEventListener('click', function(e) {
            e.stopPropagation(); // Bloquear propagação
            console.log('🛡️ Clique dentro do modal (não fecha)');
        });
    }
    
    // Função para limpar e resetar o formulário do modal
    function clearFormCompletely() {
        const form = document.getElementById('createCampaignForm');
        if (form) {
            form.reset();
            form.dataset.mode = 'create';

            const solicitacaoIdField = document.getElementById('solicitacaoId');
            if (solicitacaoIdField) {
                solicitacaoIdField.value = '';
            }
            const formModeField = document.getElementById('formMode');
            if (formModeField) {
                formModeField.value = 'create';
            }

            const dinamicos = document.getElementById('route-ids-dinamicos');
            if (dinamicos) {
                dinamicos.innerHTML = '';
            }
            window.routeIdCounter = 3;
            window.isEditingSolicitacao = false;

            // Remover classes e mensagens de erro
            form.querySelectorAll('.form-group.error').forEach(group => group.classList.remove('error'));
            form.querySelectorAll('.error-message').forEach(error => error.remove());

            // Resetar a seleção de tipo para "Casual" e ajustar a visibilidade
            const routeCasual = document.getElementById('routeCasual');
            const routeEmRota = document.getElementById('routeEmRota');
            const formEmRota = document.getElementById('formEmRota');
            const formCasual = document.getElementById('formCasual');

            if (routeCasual && routeEmRota && formCasual && formEmRota) {
                // Marcar "Casual" como padrão
                routeCasual.checked = true;
                routeEmRota.checked = false;

                // Exibir formulário "Casual" e ocultar "Em Rota"
                formCasual.style.display = 'block';
                formEmRota.style.display = 'none';

                // Habilitar campos do formulário Casual
                formCasual.querySelectorAll('input, select, textarea').forEach(field => {
                    if (field.type !== 'file' && !field.readOnly) field.disabled = false;
                });

                // Desabilitar campos do formulário Em Rota
                formEmRota.querySelectorAll('input, select, textarea').forEach(field => {
                    if (field.type !== 'file') {
                        field.disabled = true;
                        field.removeAttribute('required');
                    }
                });
            }

            const tituloModal = document.getElementById('modalSolicitacaoTitulo');
            if (tituloModal) {
                tituloModal.textContent = 'Nova Solicitação Financeira';
            }
            const submitBtn = document.getElementById('submitSolicitacaoBtn');
            if (submitBtn) {
                submitBtn.textContent = 'Criar Solicitação';
            }
            const receitaField = document.getElementById('routeValorReceita');
            if (receitaField) {
                receitaField.dataset.manual = '0';
                receitaField.dataset.auto = '0';
                receitaField.value = 'R$ 0,00';
            }
            console.log('✅ Formulário limpo e resetado para o estado padrão (Casual).');
        }
    }
    // Quando clicar no X, FECHAR o modal
    if (btnFechar && modal) {
        btnFechar.addEventListener('click', function(e) {
            e.stopPropagation();
            console.log('❌ Fechando modal...');
            clearFormCompletely();
            modal.style.display = 'none';
            modal.classList.remove('show');
        });
    }
    
    // Quando clicar em Cancelar, FECHAR o modal
    if (btnCancelar && modal) {
        btnCancelar.addEventListener('click', function(e) {
            e.stopPropagation();
            console.log('❌ Cancelando...');
            clearFormCompletely();
            modal.style.display = 'none';
            modal.classList.remove('show');
        });
    }
    
    // BLOQUEAR fechamento ao clicar fora (overlay escuro)
    // O modal só fecha via botão X, Cancelar ou ESC
    if (modal) {
        modal.addEventListener('click', function(e) {
            // Se clicar diretamente no overlay/modal (não no conteúdo), BLOQUEAR o fechamento
            if (e.target === modal) {
                e.stopPropagation();
                e.stopImmediatePropagation();
                console.log('🛡️ Clique no overlay bloqueado - modal não fecha');
            }
        }, true); // Usar capture phase para interceptar antes de outros listeners
    }
    
    // Quando apertar ESC, FECHAR o modal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal && modal.style.display === 'flex') {
            console.log('❌ ESC pressionado...');
            clearFormCompletely();
            modal.style.display = 'none';
            modal.classList.remove('show');
        }
    });
    
    console.log('✅ Modal pronto!');
    
    // ✅ Menu do Avatar do Usuário
    const userAvatarBtn = document.getElementById('userAvatarBtn');
    const userMenu = document.getElementById('userMenu');
    
    if (userAvatarBtn && userMenu) {
        // Abrir/fechar menu ao clicar no avatar
        userAvatarBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            userMenu.classList.toggle('show');
        });
        
        // Fechar menu ao clicar fora
        document.addEventListener('click', function(e) {
            if (!userAvatarBtn.contains(e.target) && !userMenu.contains(e.target)) {
                userMenu.classList.remove('show');
            }
        });
        
        // Fechar menu ao clicar em um item (para navegação)
        const menuItems = userMenu.querySelectorAll('.user-menu-item');
        menuItems.forEach(item => {
            item.addEventListener('click', function() {
                // Se não for link de sair, fechar menu imediatamente
                if (!this.href.includes('logout')) {
                    userMenu.classList.remove('show');
                }
            });
        });
    }
    
    // ✅ Menu de Configurações (ícone de engrenagem)
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsMenu = document.getElementById('settingsMenu');
    
    if (settingsBtn && settingsMenu) {
        // Abrir/fechar menu ao clicar no botão de configurações
        settingsBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            settingsMenu.classList.toggle('show');
        });
        
        // Fechar menu ao clicar fora
        document.addEventListener('click', function(e) {
            if (!settingsBtn.contains(e.target) && !settingsMenu.contains(e.target)) {
                settingsMenu.classList.remove('show');
            }
        });
    }
});
