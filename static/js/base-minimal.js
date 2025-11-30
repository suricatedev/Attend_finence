// JavaScript SUPER SIMPLES - Apenas abrir e fechar modal

// Esperar a página carregar
window.addEventListener('DOMContentLoaded', function() {
    
    // Pegar o botão e o modal
    const botao = document.getElementById('createCampaignBtn');
    const modal = document.getElementById('createCampaignModal');
    const btnFechar = document.getElementById('closeModal');
    const btnCancelar = document.getElementById('cancelCreate');
    const modalContent = modal ? modal.querySelector('.modal-content') : null;
    
    // Quando clicar no botão amarelo, ABRIR o modal
    if (botao && modal) {
        botao.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation(); // IMPORTANTE: Evitar propagação
            console.log('✅ Abrindo modal...');
            // Limpar formulário antes de abrir
            const form = document.getElementById('createCampaignForm');
            if (form) {
                form.reset();
                
                // Resetar o tipo de rota para "Casual" (padrão)
                const routeCasual = document.getElementById('routeCasual');
                const routeEmRota = document.getElementById('routeEmRota');
                const formEmRota = document.getElementById('formEmRota');
                const formCasual = document.getElementById('formCasual');
                
                if (routeCasual) {
                    routeCasual.checked = true;
                }
                if (routeEmRota) {
                    routeEmRota.checked = false;
                }
                
                // Garantir que o formulário Casual esteja visível
                if (formCasual) {
                    formCasual.style.display = 'block';
                }
                if (formEmRota) {
                    formEmRota.style.display = 'none';
                }
                
                // Limpar classes de erro e mensagens de aviso de ID duplicado
                const form = document.getElementById('createCampaignForm');
                if (form) {
                    // Limpar mensagens de erro de ID duplicado
                    form.querySelectorAll('.error-message.id-duplicado-message').forEach(msg => msg.remove());
                    
                    // Limpar classes de erro dos campos de ID
                    document.querySelectorAll('.id-duplicado').forEach(input => {
                        input.classList.remove('id-duplicado');
                        const formGroup = input.closest('.form-group');
                        if (formGroup) {
                            // Só remover classe error se não houver outros erros
                            const outrosErros = formGroup.querySelectorAll('.error-message:not(.id-duplicado-message)');
                            if (outrosErros.length === 0) {
                                formGroup.classList.remove('error');
                            }
                        }
                    });
                }
                
                console.log('✅ Formulário limpo e resetado para padrão (Casual)');
            }
            modal.style.display = 'flex';
            modal.classList.add('show');
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

            // Remover mensagens de erro de ID duplicado especificamente
            form.querySelectorAll('.error-message.id-duplicado-message').forEach(error => error.remove());
            
            // Limpar classes de erro, mas preservar se houver outros erros
            form.querySelectorAll('.form-group.error').forEach(group => {
                const outrosErros = group.querySelectorAll('.error-message:not(.id-duplicado-message)');
                if (outrosErros.length === 0) {
                    group.classList.remove('error');
                }
            });
            
            // Remover todas as outras mensagens de erro
            form.querySelectorAll('.error-message:not(.id-duplicado-message)').forEach(error => error.remove());
            
            // Limpar classes de erro dos campos de ID
            document.querySelectorAll('.id-duplicado').forEach(input => {
                input.classList.remove('id-duplicado');
            });

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
            // Limpar aviso de ID duplicado
            if (typeof window.fecharAvisoIdDuplicado === 'function') {
                window.fecharAvisoIdDuplicado();
            } else {
                const containerAviso = document.getElementById('avisoIdDuplicadoContainer');
                if (containerAviso) {
                    containerAviso.style.display = 'none';
                    containerAviso.innerHTML = '';
                }
            }
            
            // Limpar classes de erro dos campos de ID
            document.querySelectorAll('.id-duplicado').forEach(input => {
                input.classList.remove('id-duplicado');
                const formGroup = input.closest('.form-group');
                if (formGroup) {
                    formGroup.classList.remove('has-error');
                }
            });
            
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
