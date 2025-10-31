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
    
    // Quando clicar no X, FECHAR o modal
    if (btnFechar && modal) {
        btnFechar.addEventListener('click', function(e) {
            e.stopPropagation();
            console.log('❌ Fechando modal...');
            modal.style.display = 'none';
            modal.classList.remove('show');
        });
    }
    
    // Quando clicar em Cancelar, FECHAR o modal
    if (btnCancelar && modal) {
        btnCancelar.addEventListener('click', function(e) {
            e.stopPropagation();
            console.log('❌ Cancelando...');
            modal.style.display = 'none';
            modal.classList.remove('show');
        });
    }
    
    // Quando clicar FORA do modal (no overlay escuro), FECHAR
    if (modal) {
        modal.addEventListener('click', function(e) {
            // Só fechar se clicar diretamente no modal (não no conteúdo)
            if (e.target === modal) {
                console.log('❌ Clicou fora - fechando...');
                modal.style.display = 'none';
                modal.classList.remove('show');
            }
        });
    }
    
    // Quando apertar ESC, FECHAR o modal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal && modal.style.display === 'flex') {
            console.log('❌ ESC pressionado...');
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
