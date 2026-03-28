// JavaScript Base - Sistema de Gestão Financeira

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

    // Throttle para limitar execuções
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    // Formatar moeda
    formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    },

    // Formatar data
    formatDate(date) {
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
    },

    // Validar CPF
    validateCPF(cpf) {
        cpf = cpf.replace(/[^\d]/g, '');
        if (cpf.length !== 11) return false;
        
        // Verificar se todos os dígitos são iguais
        if (/^(\d)\1{10}$/.test(cpf)) return false;
        
        // Validar dígitos verificadores
        let sum = 0;
        for (let i = 0; i < 9; i++) {
            sum += parseInt(cpf.charAt(i)) * (10 - i);
        }
        let remainder = (sum * 10) % 11;
        if (remainder === 10 || remainder === 11) remainder = 0;
        if (remainder !== parseInt(cpf.charAt(9))) return false;
        
        sum = 0;
        for (let i = 0; i < 10; i++) {
            sum += parseInt(cpf.charAt(i)) * (11 - i);
        }
        remainder = (sum * 10) % 11;
        if (remainder === 10 || remainder === 11) remainder = 0;
        if (remainder !== parseInt(cpf.charAt(10))) return false;
        
        return true;
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
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    closeModal() {
        if (this.activeModal) {
            this.activeModal.classList.remove('active');
            document.body.style.overflow = '';
            this.activeModal = null;
        }
    }
}

// Gerenciador de sidebar
class SidebarManager {
    constructor() {
        this.isOpen = false;
        this.init();
    }

    init() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        const toggleBtn = document.getElementById('sidebarToggle');

        // Toggle sidebar
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggle());
        }

        // Fechar ao clicar no overlay
        if (overlay) {
            overlay.addEventListener('click', () => this.close());
        }

        // Responsividade
        window.addEventListener('resize', Utils.debounce(() => {
            if (window.innerWidth > 768) {
                this.close();
            }
        }, 250));
    }

    toggle() {
        this.isOpen ? this.close() : this.open();
    }

    open() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        
        if (sidebar && overlay) {
            sidebar.classList.add('active');
            overlay.classList.add('active');
            this.isOpen = true;
        }
    }

    close() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        
        if (sidebar && overlay) {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
            this.isOpen = false;
        }
    }
}

// Gerenciador de formulários
class FormManager {
    constructor() {
        this.forms = new Map();
        this.init();
    }

    init() {
        // Validação em tempo real
        document.addEventListener('input', (e) => {
            if (e.target.matches('input, select, textarea')) {
                this.validateField(e.target);
            }
        });

        // Submit de formulários
        document.addEventListener('submit', (e) => {
            if (e.target.tagName === 'FORM') {
                this.handleSubmit(e);
            }
        });
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
        } else if (field.type === 'tel' && value && value.length < 10) {
            isValid = false;
            errorMessage = 'Telefone deve ter pelo menos 10 dígitos';
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
        const icon = document.createElement('i');
        icon.className = 'fas fa-exclamation-circle';
        errorDiv.appendChild(icon);
        errorDiv.appendChild(document.createTextNode(' ' + message));
        formGroup.appendChild(errorDiv);
    }

    handleSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        
        // Validar todos os campos
        const fields = form.querySelectorAll('input, select, textarea');
        let isValid = true;

        fields.forEach(field => {
            this.validateField(field);
            if (field.closest('.form-group').classList.contains('error')) {
                isValid = false;
            }
        });

        if (isValid) {
            this.submitForm(form, formData);
        } else {
            Utils.showNotification('Por favor, corrija os erros no formulário', 'error');
        }
    }

    async submitForm(form, formData) {
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        
        // Estado de carregamento
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
        form.classList.add('form-loading');

        try {
            const response = await fetch(form.action || window.location.href, {
                method: form.method || 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            if (response.ok) {
                const result = await response.json();
                Utils.showNotification('Formulário enviado com sucesso!', 'success');
                form.reset();
                modalManager.closeModal();
            } else {
                throw new Error('Erro no servidor');
            }
        } catch (error) {
            Utils.showNotification('Erro ao enviar formulário', 'error');
            console.error('Erro:', error);
        } finally {
            // Restaurar estado
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            form.classList.remove('form-loading');
        }
    }
}

// Gerenciador de navegação
class NavigationManager {
    constructor() {
        this.currentView = 'kanban';
        this.init();
    }

    init() {
        // Event listeners para tabs
        document.addEventListener('click', (e) => {
            if (e.target.closest('.tab-btn')) {
                const tab = e.target.closest('.tab-btn');
                const view = tab.dataset.view;
                if (view) {
                    this.switchView(view);
                }
            }
        });

        // Event listeners para links da sidebar
        document.addEventListener('click', (e) => {
            if (e.target.closest('.nav-link')) {
                const link = e.target.closest('.nav-link');
                const href = link.getAttribute('href');
                if (href && href !== '#') {
                    e.preventDefault();
                    this.navigateTo(href);
                }
            }
        });
    }

    switchView(view) {
        // Remover active de todos os tabs
        document.querySelectorAll('.tab-btn').forEach(tab => {
            tab.classList.remove('active');
        });

        // Adicionar active ao tab clicado
        const activeTab = document.querySelector(`[data-view="${view}"]`);
        if (activeTab) {
            activeTab.classList.add('active');
        }

        this.currentView = view;
        this.loadView(view);
    }

    navigateTo(url) {
        window.location.href = url;
    }

    loadView(view) {
        // Implementar carregamento específico de cada view
        switch(view) {
            case 'kanban':
                this.loadKanbanView();
                break;
            case 'dashboard':
                this.loadDashboardView();
                break;
            case 'reports':
                this.loadReportsView();
                break;
        }
    }

    loadKanbanView() {
        // Carregar view do kanban
        console.log('Carregando view do kanban');
    }

    loadDashboardView() {
        // Carregar view do dashboard
        console.log('Carregando view do dashboard');
    }

    loadReportsView() {
        // Carregar view dos relatórios
        console.log('Carregando view dos relatórios');
    }
}

// Inicialização global
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar gerenciadores
    window.modalManager = new ModalManager();
    window.sidebarManager = new SidebarManager();
    window.formManager = new FormManager();
    window.navigationManager = new NavigationManager();

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

    console.log('Sistema de Gestão Financeira inicializado');
});
