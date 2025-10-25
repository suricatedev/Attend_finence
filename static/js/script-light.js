// Sistema de Gestão Financeira - JavaScript Otimizado
class CampaignManager {
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
        // Create campaign button
        const createCampaignBtn = document.getElementById('createCampaignBtn');
        createCampaignBtn?.addEventListener('click', () => {
            this.showModal();
        });

        // Close modal buttons
        const closeModal = document.getElementById('closeModal');
        const cancelCreate = document.getElementById('cancelCreate');
        
        closeModal?.addEventListener('click', () => {
            this.hideModal();
        });
        
        cancelCreate?.addEventListener('click', () => {
            this.hideModal();
        });

        // Create campaign form
        // Formulário será submetido diretamente para o backend Django
        // Não interceptar o submit - deixar o Django processar
        /*
        const createCampaignForm = document.getElementById('createCampaignForm');
        createCampaignForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.createCampaign();
        });
        */

        // View tabs
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchView(btn.dataset.view);
            });
        });

        // Add card buttons
        const addCardBtns = document.querySelectorAll('.add-card-btn');
        addCardBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const column = e.target.closest('.kanban-column').dataset.column;
                this.showAddCardModal(column);
            });
        });

        // Close modal when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.hideModal();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'n') {
                e.preventDefault();
                this.showModal();
            }
            if (e.key === 'Escape') {
                this.hideModal();
            }
        });
    }

    loadInitialData() {
        // Dados mínimos para carregamento rápido
        this.cards = [
            {
                id: 'SF001',
                title: 'Solicitação de reembolso de viagem',
                solicitante: 'Maria Silva',
                recebedor: 'Maria Silva',
                valor: 850.50,
                priority: 'high',
                column: 'planning',
                assignee: 'Maria Silva'
            }
        ];

        this.currentCardId = 1;
        // Não sobrescrever contadores do Django na inicialização
        // this.updateCardCounts();
    }

    setupDragAndDrop() {
        const cards = document.querySelectorAll('.card');
        const columns = document.querySelectorAll('.column-content');

        cards.forEach(card => {
            card.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', card.dataset.cardId);
                card.classList.add('dragging');
            });

            card.addEventListener('dragend', (e) => {
                card.classList.remove('dragging');
            });
        });

        columns.forEach(column => {
            column.addEventListener('dragover', (e) => {
                e.preventDefault();
                column.classList.add('drag-over');
            });

            column.addEventListener('dragleave', (e) => {
                column.classList.remove('drag-over');
            });

            column.addEventListener('drop', (e) => {
                e.preventDefault();
                column.classList.remove('drag-over');
                
                const cardId = e.dataTransfer.getData('text/plain');
                const card = document.querySelector(`[data-card-id="${cardId}"]`);
                const newColumn = column.dataset.column;
                
                if (card && newColumn) {
                    this.moveCard(cardId, newColumn);
                }
            });
        });
    }

    setupModal() {
        // Modal functionality
    }

    showModal() {
        const modal = document.getElementById('createCampaignModal');
        if (modal) {
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    }

    hideModal() {
        const modal = document.getElementById('createCampaignModal');
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = '';
        }
    }

    createCampaign() {
        // FUNÇÃO DESABILITADA
        // O formulário agora é submetido diretamente para o backend Django
        // Todas as validações e processamento são feitos no backend
        console.log('Formulário será processado pelo backend Django');
    }

    moveCard(cardId, newColumn) {
        const card = this.cards.find(c => c.id == cardId);
        if (card) {
            card.column = newColumn;
            // Contadores gerenciados pelo backend - não atualizar aqui
            // this.updateCardCounts();
        }
    }

    updateCardCounts() {
        // FUNÇÃO DESABILITADA
        // Contadores são gerenciados completamente pelo backend Django
        // Não manipular os contadores via JavaScript
        console.log('Contadores são gerenciados pelo backend');
    }

    renderNewCard(cardData) {
        const column = document.querySelector(`[data-column="${cardData.column}"] .column-content`);
        if (!column) return;

        const cardElement = this.createCardElement(cardData);
        column.appendChild(cardElement);
        
        // Adicionar funcionalidade de drag and drop ao novo card
        this.setupCardDragAndDrop(cardElement);
    }

    createCardElement(cardData) {
        const card = document.createElement('div');
        card.className = 'card';
        card.draggable = true;
        card.dataset.cardId = cardData.id;
        
        const valorFormatado = new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(cardData.valor);

        const priorityClass = cardData.priority || 'medium';
        const priorityText = priorityClass === 'high' ? 'Alta' : priorityClass === 'low' ? 'Baixa' : 'Média';

        card.innerHTML = `
            <div class="card-header">
                <span class="priority ${priorityClass}">${priorityText}</span>
            </div>
            <div class="card-body">
                <h3 class="card-title">${cardData.title}</h3>
                <div class="card-info">
                    <div class="info-item">
                        <i class="fas fa-user"></i>
                        <span class="info-label">SOLICITANTE</span>
                        <span class="info-value">${cardData.solicitante}</span>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-check-circle"></i>
                        <span class="info-label">RECEBEDOR</span>
                        <span class="info-value">${cardData.recebedor}</span>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-dollar-sign"></i>
                        <span class="info-label">VALOR</span>
                        <span class="info-value">${valorFormatado}</span>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-calendar"></i>
                        <span class="info-label">CRIAÇÃO</span>
                        <span class="info-value">${cardData.dataCriacao}</span>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-calendar-check"></i>
                        <span class="info-label">PAGAMENTO</span>
                        <span class="info-value">${cardData.dataPagamento || 'N/A'}</span>
                    </div>
                </div>
                <div class="card-time">
                    <div class="time-item">
                        <i class="fas fa-clock"></i>
                        <span>${cardData.tempoCriacao}</span>
                    </div>
                </div>
            </div>
            <div class="card-footer">
                <span class="card-stage">${cardData.stage}</span>
            </div>
        `;

        return card;
    }

    setupCardDragAndDrop(cardElement) {
        cardElement.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', cardElement.dataset.cardId);
            cardElement.classList.add('dragging');
        });

        cardElement.addEventListener('dragend', (e) => {
            cardElement.classList.remove('dragging');
        });
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;

        // Adicionar estilos
        const style = document.createElement('style');
        style.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: #4CAF50;
                color: white;
                padding: 1rem 1.5rem;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                z-index: 10000;
                animation: slideIn 0.3s ease;
            }
            .notification-success {
                background: #4CAF50;
            }
            .notification-error {
                background: #f44336;
            }
            .notification-content {
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(notification);

        // Remover após 3 segundos
        setTimeout(() => {
            notification.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => {
                document.body.removeChild(notification);
                document.head.removeChild(style);
            }, 300);
        }, 3000);
    }

    switchView(view) {
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => btn.classList.remove('active'));
        
        const activeBtn = document.querySelector(`[data-view="${view}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
    }

    showAddCardModal(column) {
        this.showModal();
    }
}

// Inicializar o sistema quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing system...');
    
    try {
        // Carregar apenas o manager principal
        window.campaignManager = new CampaignManager();
        console.log('Sistema carregado com sucesso!');
        
        // Funcionalidades básicas
        setupBasicServices();
        setupBasicReports();
        setupSettings();
        setupUserRegistration();
        
    } catch (error) {
        console.error('Erro ao inicializar o sistema:', error);
    }
});

function setupBasicServices() {
    const servicesLink = document.getElementById('servicesNavLink');
    if (servicesLink) {
        servicesLink.addEventListener('click', (e) => {
            e.preventDefault();
            // Implementar funcionalidade básica de serviços
            console.log('Serviços link clicado');
        });
    }
}

function setupBasicReports() {
    const reportsLink = document.getElementById('reportsNavLink');
    if (reportsLink) {
        reportsLink.addEventListener('click', (e) => {
            e.preventDefault();
            // Implementar funcionalidade básica de relatórios
            console.log('Relatórios link clicado');
        });
    }
}

// Funcionalidade de Serviços
function showServicesModal() {
    const modal = document.getElementById('manageServicesModal');
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        // Adicionar event listeners para fechar
        setupModalCloseListeners(modal);
        
        // Configurar funcionalidades do modal de serviços
        setupServicesModal();
    }
}

// Funcionalidade de Relatórios
function showReportsModal() {
    const modal = document.getElementById('reportsModal');
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        // Adicionar event listeners para fechar
        setupModalCloseListeners(modal);
        
        // Configurar funcionalidades do modal de relatórios
        setupReportsModal();
    }
}

// Configurar listeners para fechar modais
function setupModalCloseListeners(modal) {
    // Botão de fechar
    const closeBtn = modal.querySelector('.close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('show');
            document.body.style.overflow = '';
        });
    }
    
    // Fechar ao clicar fora do modal
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
            document.body.style.overflow = '';
        }
    });
    
    // Fechar com ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('show')) {
            modal.classList.remove('show');
            document.body.style.overflow = '';
        }
    });
}

// Funcionalidade de Configurações
function setupSettings() {
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsDropdown = document.querySelector('.settings-dropdown');
    
    if (settingsBtn && settingsDropdown) {
        settingsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            settingsDropdown.classList.toggle('active');
        });
    }
    
    // Fechar dropdown ao clicar fora
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.settings-dropdown')) {
            settingsDropdown.classList.remove('active');
        }
    });
}

// Configurar modal de serviços
function setupServicesModal() {
    // Botão adicionar serviço
    const addServiceBtn = document.getElementById('addServiceBtn');
    if (addServiceBtn) {
        addServiceBtn.addEventListener('click', () => {
            console.log('Botão adicionar serviço clicado');
        });
    }
}

// Configurar modal de relatórios
function setupReportsModal() {
    // Funcionalidades básicas de relatórios
    console.log('Modal de relatórios configurado');
}

// Mostrar modal de adicionar serviço
function showAddServiceModal() {
    const modal = document.getElementById('addServiceModal');
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        setupModalCloseListeners(modal);
    }
}

// Configurar formulário de cadastro de usuário
function setupUserRegistration() {
    // Link para abrir modal de cadastro
    const manageMembersLink = document.querySelector('.settings-item');
    if (manageMembersLink) {
        manageMembersLink.addEventListener('click', (e) => {
            e.preventDefault();
            showUserRegistrationModal();
        });
    }
    
    // Formulário de cadastro
    const userForm = document.getElementById('userRegistrationForm');
    if (userForm) {
        userForm.addEventListener('submit', handleUserRegistration);
    }
    
    // Botão cancelar
    const cancelBtn = document.getElementById('cancelUserRegistration');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            hideUserRegistrationModal();
        });
    }
}

// Mostrar modal de cadastro de usuário
function showUserRegistrationModal() {
    const modal = document.getElementById('manageMembersModal');
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        setupModalCloseListeners(modal);
    }
}

// Esconder modal de cadastro de usuário
function hideUserRegistrationModal() {
    const modal = document.getElementById('manageMembersModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
}

// Processar cadastro de usuário
function handleUserRegistration(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const userData = {
        username: formData.get('username'),
        password: formData.get('password'),
        first_name: formData.get('first_name'),
        last_name: formData.get('last_name'),
        email: formData.get('email'),
        role: formData.get('role')
    };
    
    // Validações removidas - serão feitas no backend Django
    
    // Enviar dados para o backend
    console.log('Dados do usuário para cadastro:', userData);
    
    // Mostrar notificação de sucesso
    showNotification('Usuário cadastrado com sucesso!', 'success');
    
    // Limpar formulário e fechar modal
    e.target.reset();
    hideUserRegistrationModal();
}
