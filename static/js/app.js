// JavaScript Unificado - Sistema de Gestão Financeira

// Utilitários globais
const Utils = {
    // Debounce para otimizar eventos
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Formatar moeda
    formatCurrency(value) {
        if (!value) return 'R$ 0,00';
        const numValue = parseFloat(value.toString().replace(/[^\d,]/g, '').replace(',', '.'));
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(numValue);
    },

    // Formatar data
    formatDate(date) {
        if (!date) return '';
        return new Intl.DateTimeFormat('pt-BR').format(new Date(date));
    },

    // Mostrar notificação
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            background: ${type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : '#d1ecf1'};
            color: ${type === 'success' ? '#155724' : type === 'error' ? '#721c24' : '#0c5460'};
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    },

    // Validar email
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
};

// Gerenciador de modais
class ModalManager {
    constructor() {
        this.activeModal = null;
        this.init();
    }

    init() {
        // Fechar modal ao clicar no overlay
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal();
            }
        });

        // Fechar modal com ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.activeModal) {
                this.closeModal();
            }
        });
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            this.activeModal = modal;
            modal.style.display = 'flex';
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
            
            // Limpar campos de tempo com valores inválidos
            this.clearInvalidTimeFields();
            
            // Preencher datas padrão quando abrir o modal
            this.setDefaultDates();
        }
    }

    closeModal() {
        if (this.activeModal) {
            this.activeModal.style.display = 'none';
            this.activeModal.classList.remove('show');
            document.body.style.overflow = '';
            this.activeModal = null;
        }
    }

    clearInvalidTimeFields() {
        // Limpar campos de tempo que possam ter valores inválidos
        const timeFields = document.querySelectorAll('input[type="time"]');
        timeFields.forEach(field => {
            const value = field.value;
            // Se o valor contém segundos (formato HH:MM:SS), limpar
            if (value && value.includes(':') && value.split(':').length > 2) {
                field.value = '';
            }
        });
    }

    setDefaultDates() {
        const today = new Date().toISOString().split('T')[0];
        const now = new Date();
        const timeString = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
        
        // Definir data de criação como hoje
        const dataCriacaoField = document.getElementById('campaignDataCriacao');
        if (dataCriacaoField && !dataCriacaoField.value) {
            dataCriacaoField.value = today;
        }
        
        // Definir tempo de criação como agora (apenas HH:MM)
        const tempoCriacaoField = document.getElementById('campaignTempoCriacao');
        if (tempoCriacaoField && !tempoCriacaoField.value) {
            tempoCriacaoField.value = timeString;
        }
        
        // Definir tempo na fila como 00:00
        const tempoFilaField = document.getElementById('campaignTempoFila');
        if (tempoFilaField && !tempoFilaField.value) {
            tempoFilaField.value = '00:00';
        }
    }
}

// Gerenciador de sidebar
class SidebarManager {
    constructor() {
        this.init();
    }

    init() {
        const sidebarToggle = document.getElementById('sidebarToggle');
        const sidebar = document.getElementById('sidebar');
        const sidebarOverlay = document.getElementById('sidebarOverlay');

        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => {
                sidebar.classList.toggle('active');
                sidebarOverlay.classList.toggle('active');
            });
        }

        if (sidebarOverlay) {
            sidebarOverlay.addEventListener('click', () => {
                sidebar.classList.remove('active');
                sidebarOverlay.classList.remove('active');
            });
        }
    }
}

// Gerenciador de formulários
class FormManager {
    constructor() {
        this.init();
    }

    init() {
        // Validação em tempo real
        document.addEventListener('input', (e) => {
            if (e.target.matches('input, select, textarea')) {
                this.validateField(e.target);
                
                // Formatação automática para campo de valor
                if (e.target.name === 'valor') {
                    this.formatCurrencyField(e.target);
                }
            }
        });

        // Submit de formulários
        document.addEventListener('submit', (e) => {
            if (e.target.tagName === 'FORM') {
                this.handleSubmit(e);
            }
        });
    }
    
    formatCurrencyField(field) {
        let value = field.value.replace(/[^\d]/g, '');
        if (value) {
            const numValue = parseFloat(value) / 100;
            field.value = Utils.formatCurrency(numValue);
        }
    }

    validateField(field) {
        const formGroup = field.closest('.form-group');
        const value = field.value.trim();
        
        // Remover estados anteriores
        formGroup.classList.remove('error', 'success');
        const existingError = formGroup.querySelector('.error-message');
        if (existingError) existingError.remove();

        // Validações específicas
        let isValid = true;
        let errorMessage = '';

        if (field.hasAttribute('required') && !value) {
            isValid = false;
            errorMessage = 'Este campo é obrigatório';
        } else if (field.type === 'email' && value && !Utils.validateEmail(value)) {
            isValid = false;
            errorMessage = 'Email inválido';
        }

        // Aplicar estado
        if (isValid && value) {
            formGroup.classList.add('success');
        } else if (!isValid) {
            formGroup.classList.add('error');
            this.showFieldError(formGroup, errorMessage);
        }
    }

    showFieldError(formGroup, message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
        formGroup.appendChild(errorDiv);
    }

    handleSubmit(e) {
        const form = e.target;
        
        // Se o formulário tem action para Django, não interceptar
        if (form.action && form.action.includes('/Solicitacoes/')) {
            console.log('Formulário sendo enviado para Django:', form.action);
            return; // Deixar o Django processar
        }
        
        e.preventDefault();
        const formData = new FormData(form);
        
        console.log('Formulário submetido:', form.id);
        
        // Limpar erros anteriores
        form.querySelectorAll('.error-message').forEach(error => error.remove());
        form.querySelectorAll('.form-group').forEach(group => group.classList.remove('error'));
        
        // Validar todos os campos obrigatórios
        const requiredFields = form.querySelectorAll('[required]');
        let isValid = true;
        let errorCount = 0;

        requiredFields.forEach(field => {
            const value = field.value.trim();
            const formGroup = field.closest('.form-group');
            
            if (!value) {
                formGroup.classList.add('error');
                this.showFieldError(formGroup, 'Este campo é obrigatório');
                isValid = false;
                errorCount++;
            } else {
                // Validação específica para campos de tempo
                if (field.type === 'time') {
                    // Verificar se o formato está correto (HH:MM)
                    const timePattern = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
                    if (!timePattern.test(value)) {
                        formGroup.classList.add('error');
                        this.showFieldError(formGroup, 'Formato de tempo inválido. Use HH:MM (ex: 14:30)');
                        isValid = false;
                        errorCount++;
                        return;
                    }
                }
                
                formGroup.classList.remove('error');
            }
        });

        console.log(`Validação: ${isValid ? 'Válido' : 'Inválido'} (${errorCount} erros)`);

        if (isValid) {
            this.submitForm(form, formData);
        } else {
            Utils.showNotification(`Por favor, preencha os ${errorCount} campo(s) obrigatório(s)`, 'error');
        }
    }

    async submitForm(form, formData) {
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        
        console.log('Iniciando submissão do formulário...');
        
        // Estado de carregamento
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
        form.classList.add('form-loading');

        try {
            // Validar dados do formulário
            const data = Object.fromEntries(formData);
            console.log('Dados do formulário:', data);
            
            // Verificar se todos os campos obrigatórios estão preenchidos
            const requiredFields = ['title', 'solicitante', 'recebedor', 'valor', 'service', 'description', 'dataPagamento', 'dataCriacao', 'tempoCriacao', 'tempoFila', 'priority'];
            const missingFields = requiredFields.filter(field => !data[field] || data[field].trim() === '');
            
            if (missingFields.length > 0) {
                throw new Error(`Campos obrigatórios não preenchidos: ${missingFields.join(', ')}`);
            }
            
            // Simular envio (sem backend)
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            console.log('Formulário validado com sucesso!');
            
            // Se for formulário de solicitação, adicionar ao Kanban
            if (form.id === 'createCampaignForm') {
                if (window.kanbanManager) {
                    window.kanbanManager.createCampaignFromForm(data);
                } else {
                    console.error('KanbanManager não está disponível');
                    throw new Error('Sistema de Kanban não está disponível');
                }
            }
            
            Utils.showNotification('Solicitação criada com sucesso!', 'success');
            form.reset();
            modalManager.closeModal();
            
        } catch (error) {
            console.error('Erro ao criar solicitação:', error);
            Utils.showNotification('Erro ao criar solicitação: ' + error.message, 'error');
        } finally {
            // Restaurar estado
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            form.classList.remove('form-loading');
        }
    }
}

// Gerenciador específico para Kanban
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
    }

    setupEventListeners() {
        // Create campaign button
        const createCampaignBtn = document.getElementById('createCampaignBtn');
        if (createCampaignBtn) {
            createCampaignBtn.addEventListener('click', () => {
                console.log('Botão Nova Solicitação clicado!');
                this.showCreateModal();
            });
        }

        // Close modal buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('close-btn') || e.target.closest('.close-btn')) {
                modalManager.closeModal();
            }
            
            // Cancel button
            if (e.target.id === 'cancelCreate') {
                modalManager.closeModal();
            }
        });

        // Create campaign form
        const createCampaignForm = document.getElementById('createCampaignForm');
        if (createCampaignForm) {
            createCampaignForm.addEventListener('submit', (e) => {
                e.preventDefault();
                console.log('Formulário de criação submetido!');
                this.createCampaign();
            });
        }

        // Add card buttons
        document.querySelectorAll('.add-card-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const column = e.target.closest('.kanban-column');
                this.addCardToColumn(column.dataset.column);
            });
        });
    }

    showCreateModal() {
        console.log('Abrindo modal de criação...');
        modalManager.showModal('createCampaignModal');
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
        // Configurar drag and drop para os cards
        document.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('card')) {
                e.target.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/html', e.target.outerHTML);
            }
        });

        document.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('card')) {
                e.target.classList.remove('dragging');
            }
        });

        document.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
        });

        document.addEventListener('drop', (e) => {
            e.preventDefault();
            const card = e.target.closest('.kanban-column');
            if (card) {
                const cardId = e.dataTransfer.getData('text/html');
                const cardElement = document.createElement('div');
                cardElement.innerHTML = cardId;
                card.querySelector('.cards-container').appendChild(cardElement.firstElementChild);
                this.updateCardStatus(cardElement.firstElementChild, card.dataset.column);
            }
        });
    }

    renderCards() {
        // Limpar cards existentes
        document.querySelectorAll('.card').forEach(card => card.remove());

        // Renderizar cards
        this.cards.forEach(card => {
            this.addCardToColumn(card.status, card);
        });
    }

    addCardToColumn(column, cardData = null) {
        const columnElement = document.querySelector(`[data-column="${column}"]`);
        if (!columnElement) return;

        const cardsContainer = columnElement.querySelector('.cards-container');
        if (!cardsContainer) return;

        const card = cardData || this.createDefaultCard();
        const cardElement = this.createCardElement(card);
        cardsContainer.appendChild(cardElement);
    }

    createDefaultCard() {
        return {
            id: this.currentCardId++,
            title: 'Nova Solicitação',
            solicitante: 'Usuário',
            recebedor: 'Financeiro',
            valor: 'R$ 0,00',
            status: 'pendente',
            priority: 'media',
            dataCriacao: new Date().toISOString().split('T')[0],
            dataPagamento: new Date().toISOString().split('T')[0]
        };
    }

    createCardElement(card) {
        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        cardElement.draggable = true;
        cardElement.dataset.cardId = card.id;
        cardElement.dataset.status = card.status;

        cardElement.innerHTML = `
            <div class="card-header">
                <h3>${card.title}</h3>
                <span class="priority ${card.priority}">${card.priority}</span>
            </div>
            <div class="card-body">
                <p><strong>Solicitante:</strong> ${card.solicitante}</p>
                <p><strong>Recebedor:</strong> ${card.recebedor}</p>
                <p><strong>Valor:</strong> ${card.valor}</p>
                <p><strong>Data:</strong> ${Utils.formatDate(card.dataCriacao)}</p>
            </div>
            <div class="card-footer">
                <button class="btn-edit" onclick="kanbanManager.editCard(${card.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-delete" onclick="kanbanManager.deleteCard(${card.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

        return cardElement;
    }

    updateCardStatus(cardElement, newStatus) {
        const cardId = parseInt(cardElement.dataset.cardId);
        const card = this.cards.find(c => c.id === cardId);
        if (card) {
            card.status = newStatus;
            cardElement.dataset.status = newStatus;
            this.saveCards();
        }
    }

    editCard(cardId) {
        const card = this.cards.find(c => c.id === cardId);
        if (card) {
            // Preencher formulário com dados do card
            document.getElementById('campaignId').value = card.id;
            document.getElementById('campaignTitle').value = card.title;
            document.getElementById('campaignSolicitante').value = card.solicitante;
            document.getElementById('campaignRecebedor').value = card.recebedor;
            document.getElementById('campaignValor').value = card.valor;
            document.getElementById('campaignStatus').value = card.status;
            document.getElementById('campaignPriority').value = card.priority;
            
            // Abrir modal
            modalManager.showModal('createCampaignModal');
        }
    }

    deleteCard(cardId) {
        if (confirm('Tem certeza que deseja excluir esta solicitação?')) {
            this.cards = this.cards.filter(c => c.id !== cardId);
            this.renderCards();
            this.saveCards();
            Utils.showNotification('Solicitação excluída com sucesso!', 'success');
        }
    }

    saveCards() {
        localStorage.setItem('kanbanCards', JSON.stringify(this.cards));
    }

    createCampaignFromForm(data) {
        const campaignData = {
            id: this.currentCardId++,
            title: data.title || 'Nova Solicitação',
            solicitante: data.solicitante || 'Usuário',
            recebedor: data.recebedor || 'Financeiro',
            valor: data.valor || 'R$ 0,00',
            status: data.status || 'pendente',
            priority: data.priority || 'media',
            service: data.service || 'consultoria_TI',
            description: data.description || 'Descrição não informada',
            dataCriacao: data.dataCriacao || new Date().toISOString().split('T')[0],
            dataPagamento: data.dataPagamento || new Date().toISOString().split('T')[0],
            tempoCriacao: data.tempoCriacao || new Date().toTimeString().split(' ')[0],
            tempoFila: data.tempoFila || '00:00',
            anexos: data.anexos || null
        };

        this.cards.push(campaignData);
        this.renderCards();
        this.saveCards();
        
        // Mostrar notificação de sucesso
        Utils.showNotification(`Solicitação "${campaignData.title}" criada com sucesso!`, 'success');
        
        // Log para debug
        console.log('Nova solicitação criada:', campaignData);
    }
}

// Gerenciador de navegação
class NavigationManager {
    constructor() {
        this.init();
    }

    init() {
        // Navegação por links
        document.addEventListener('click', (e) => {
            if (e.target.matches('a[href]')) {
                const href = e.target.getAttribute('href');
                if (href.startsWith('/') && !href.startsWith('//')) {
                    e.preventDefault();
                    this.navigateToPage(href);
                }
            }
        });
    }

    navigateToPage(path) {
        console.log('Navegando para:', path);
        
        // Atualizar URL sem recarregar a página
        history.pushState({}, '', path);
        
        // Atualizar navegação ativa
        this.updateActiveNavigation(path);
        
        // Carregar conteúdo da página
        this.loadPageContent(path);
    }

    updateActiveNavigation(path) {
        // Remover classe active de todos os links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        // Adicionar classe active ao link correspondente
        const activeLink = document.querySelector(`a[href="${path}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }

    loadPageContent(path) {
        const contentArea = document.getElementById('content-area');
        if (!contentArea) return;

        switch (path) {
            case '/':
                this.loadKanbanContent();
                break;
            case '/dashboard':
                this.loadDashboardContent();
                break;
            case '/relatorios':
                this.loadRelatoriosContent();
                break;
            case '/servicos':
                this.loadServicosContent();
                break;
            default:
                this.loadKanbanContent();
        }
    }

    loadKanbanContent() {
        const contentArea = document.getElementById('content-area');
        contentArea.innerHTML = `
            <div class="kanban-board">
                <div class="kanban-header">
                    <h1>Solicitações Financeiras</h1>
                    <button class="btn-primary" id="createCampaignBtn">
                        <i class="fas fa-plus"></i> Nova Solicitação
                    </button>
                </div>
                
                <div class="kanban-columns">
                    <div class="kanban-column" data-column="pendente">
                        <div class="column-header">
                            <h3>Pendente</h3>
                            <span class="card-count">0</span>
                        </div>
                        <div class="cards-container">
                            <button class="add-card-btn">+ Adicionar Card</button>
                        </div>
                    </div>
                    
                    <div class="kanban-column" data-column="aprovado">
                        <div class="column-header">
                            <h3>Aprovado</h3>
                            <span class="card-count">0</span>
                        </div>
                        <div class="cards-container">
                            <button class="add-card-btn">+ Adicionar Card</button>
                        </div>
                    </div>
                    
                    <div class="kanban-column" data-column="recusado">
                        <div class="column-header">
                            <h3>Recusado</h3>
                            <span class="card-count">0</span>
                        </div>
                        <div class="cards-container">
                            <button class="add-card-btn">+ Adicionar Card</button>
                        </div>
                    </div>
                    
                    <div class="kanban-column" data-column="concluido">
                        <div class="column-header">
                            <h3>Concluído</h3>
                            <span class="card-count">0</span>
                        </div>
                        <div class="cards-container">
                            <button class="add-card-btn">+ Adicionar Card</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Reinicializar KanbanManager se necessário
        if (window.kanbanManager) {
            window.kanbanManager.setupEventListeners();
        }
    }

    loadDashboardContent() {
        const contentArea = document.getElementById('content-area');
        contentArea.innerHTML = `
            <div class="dashboard">
                <h1>Dashboard</h1>
                <div class="dashboard-stats">
                    <div class="stat-card">
                        <h3>Total de Solicitações</h3>
                        <span class="stat-number">0</span>
                    </div>
                    <div class="stat-card">
                        <h3>Pendentes</h3>
                        <span class="stat-number">0</span>
                    </div>
                    <div class="stat-card">
                        <h3>Aprovadas</h3>
                        <span class="stat-number">0</span>
                    </div>
                    <div class="stat-card">
                        <h3>Valor Total</h3>
                        <span class="stat-number">R$ 0,00</span>
                    </div>
                </div>
            </div>
        `;
    }

    loadRelatoriosContent() {
        const contentArea = document.getElementById('content-area');
        contentArea.innerHTML = `
            <div class="relatorios">
                <h1>Relatórios</h1>
                <div class="relatorios-content">
                    <p>Conteúdo dos relatórios será carregado aqui.</p>
                </div>
            </div>
        `;
    }

    loadServicosContent() {
        const contentArea = document.getElementById('content-area');
        contentArea.innerHTML = `
            <div class="servicos">
                <h1>Serviços</h1>
                <div class="servicos-content">
                    <p>Conteúdo dos serviços será carregado aqui.</p>
                </div>
            </div>
        `;
    }
}

// Gerenciador de configurações
class SettingsManager {
    constructor() {
        this.init();
    }

    init() {
        // Settings dropdown
        const settingsBtn = document.getElementById('settingsBtn');
        const settingsMenu = document.getElementById('settingsMenu');
        
        if (settingsBtn && settingsMenu) {
            settingsBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                settingsMenu.classList.toggle('active');
            });

            // Fechar ao clicar fora
            document.addEventListener('click', (e) => {
                if (!settingsBtn.contains(e.target) && !settingsMenu.contains(e.target)) {
                    settingsMenu.classList.remove('active');
                }
            });
        }

        // Settings menu items
        document.addEventListener('click', (e) => {
            if (e.target.closest('.settings-item')) {
                const item = e.target.closest('.settings-item');
                const action = item.textContent.trim();

                switch (action) {
                    case 'Configurações':
                        Utils.showNotification('Abrindo configurações...', 'info');
                        break;
                    case 'Perfil':
                        Utils.showNotification('Abrindo perfil...', 'info');
                        break;
                    case 'Sair':
                        if (confirm('Tem certeza que deseja sair?')) {
                            Utils.showNotification('Saindo do sistema...', 'info');
                        }
                        break;
                }

                settingsMenu.classList.remove('active');
            }
        });
    }
}

// Inicialização quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando sistema...');
    
    // Inicializar gerenciadores
    window.modalManager = new ModalManager();
    window.sidebarManager = new SidebarManager();
    window.formManager = new FormManager();
    window.navigationManager = new NavigationManager();
    window.settingsManager = new SettingsManager();
    
    // Inicializar KanbanManager apenas se estivermos na página do Kanban
    if (document.querySelector('.kanban-board')) {
        window.kanbanManager = new KanbanManager();
    }

    // Adicionar estilos para animações
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    
    console.log('Sistema inicializado com sucesso!');
});
