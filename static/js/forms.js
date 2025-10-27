// JavaScript específico para formulários

class FormHandler {
    constructor() {
        this.init();
    }

    init() {
        this.setupFormEventListeners();
        this.setupValidation();
        this.setupFileUpload();
    }

    setupFormEventListeners() {
        // Formulário de solicitação
        this.setupSolicitacaoForm();
        
        // Formulário de usuário
        this.setupUsuarioForm();
        
        // Formulário de serviço
        this.setupServicoForm();
    }

    setupSolicitacaoForm() {
        const form = document.getElementById('createCampaignForm');
        if (!form) return;

        // Validação específica para valores monetários
        const valorInput = form.querySelector('#campaignValor');
        if (valorInput) {
            valorInput.addEventListener('input', (e) => {
                this.formatCurrencyInput(e.target);
            });
        }

        // Validação de datas
        const dataPagamento = form.querySelector('#campaignDataPagamento');
        const dataCriacao = form.querySelector('#campaignDataCriacao');
        
        if (dataPagamento && dataCriacao) {
            dataCriacao.addEventListener('change', () => {
                this.validateDateRange(dataCriacao, dataPagamento);
            });
            
            dataPagamento.addEventListener('change', () => {
                this.validateDateRange(dataCriacao, dataPagamento);
            });
        }

        // Upload de arquivos
        const fileInput = form.querySelector('#campaignAnexos');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                this.validateFileUpload(e.target);
            });
        }
    }

    setupUsuarioForm() {
        const form = document.getElementById('userRegistrationForm');
        if (!form) return;

        // Validação de senha
        const passwordInput = form.querySelector('#password');
        if (passwordInput) {
            passwordInput.addEventListener('input', (e) => {
                this.validatePassword(e.target);
            });
        }

        // Validação de email único
        const emailInput = form.querySelector('#email');
        if (emailInput) {
            emailInput.addEventListener('blur', (e) => {
                this.checkEmailAvailability(e.target);
            });
        }

        // Validação de username único
        const usernameInput = form.querySelector('#username');
        if (usernameInput) {
            usernameInput.addEventListener('blur', (e) => {
                this.checkUsernameAvailability(e.target);
            });
        }
    }

    setupServicoForm() {
        const form = document.getElementById('addServiceForm');
        if (!form) return;

        // Validação de nome único
        const nameInput = form.querySelector('#serviceName');
        if (nameInput) {
            nameInput.addEventListener('blur', (e) => {
                this.checkServiceNameAvailability(e.target);
            });
        }

        // Preview do ícone
        const iconSelect = form.querySelector('#serviceIcon');
        if (iconSelect) {
            iconSelect.addEventListener('change', (e) => {
                this.previewIcon(e.target);
            });
        }
    }

    setupValidation() {
        // Validação em tempo real para todos os formulários
        document.addEventListener('input', (e) => {
            if (e.target.matches('input[required], select[required], textarea[required]')) {
                this.validateField(e.target);
            }
        });
    }

    setupFileUpload() {
        // Drag and drop para upload de arquivos
        document.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        document.addEventListener('drop', (e) => {
            e.preventDefault();
            const files = e.dataTransfer.files;
            const fileInput = e.target.closest('.form-group')?.querySelector('input[type="file"]');
            if (fileInput && files.length > 0) {
                fileInput.files = files;
                this.validateFileUpload(fileInput);
            }
        });
    }

    formatCurrencyInput(input) {
        let value = input.value.replace(/\D/g, '');
        value = (value / 100).toFixed(2);
        value = value.replace('.', ',');
        value = value.replace(/(\d)(\d{3})(\d{3}),/g, '$1.$2.$3,');
        value = value.replace(/(\d)(\d{3}),/g, '$1.$2,');
        input.value = value ? 'R$ ' + value : '';
    }

    validateDateRange(startDate, endDate) {
        const start = new Date(startDate.value);
        const end = new Date(endDate.value);
        
        if (start > end) {
            this.showFieldError(endDate.closest('.form-group'), 'Data de pagamento deve ser posterior à data de criação');
            return false;
        }
        return true;
    }

    validateFileUpload(input) {
        const files = input.files;
        const maxSize = 5 * 1024 * 1024; // 5MB
        const allowedTypes = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.jpg', '.jpeg', '.png'];
        
        for (let file of files) {
            // Verificar tamanho
            if (file.size > maxSize) {
                this.showFieldError(input.closest('.form-group'), `Arquivo ${file.name} excede o limite de 5MB`);
                input.value = '';
                return false;
            }
            
            // Verificar tipo
            const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
            if (!allowedTypes.includes(fileExtension)) {
                this.showFieldError(input.closest('.form-group'), `Tipo de arquivo ${fileExtension} não é permitido`);
                input.value = '';
                return false;
            }
        }
        
        this.showFieldSuccess(input.closest('.form-group'), `${files.length} arquivo(s) selecionado(s)`);
        return true;
    }

    validatePassword(input) {
        const password = input.value;
        const formGroup = input.closest('.form-group');
        
        // Remover mensagens anteriores
        this.clearFieldMessages(formGroup);
        
        const requirements = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /\d/.test(password),
            special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        };
        
        const metRequirements = Object.values(requirements).filter(Boolean).length;
        
        if (metRequirements < 3) {
            this.showFieldError(formGroup, 'Senha deve ter pelo menos 8 caracteres com maiúscula, minúscula e número');
            return false;
        }
        
        this.showFieldSuccess(formGroup, 'Senha válida');
        return true;
    }

    async checkEmailAvailability(input) {
        const email = input.value;
        if (!email || !Utils.validateEmail(email)) return;
        
        try {
            const response = await fetch('/api/check-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email })
            });
            
            const result = await response.json();
            const formGroup = input.closest('.form-group');
            
            if (result.available) {
                this.showFieldSuccess(formGroup, 'Email disponível');
            } else {
                this.showFieldError(formGroup, 'Email já está em uso');
            }
        } catch (error) {
            console.error('Erro ao verificar email:', error);
        }
    }

    async checkUsernameAvailability(input) {
        const username = input.value;
        if (!username || username.length < 3) return;
        
        try {
            const response = await fetch('/api/check-username', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username })
            });
            
            const result = await response.json();
            const formGroup = input.closest('.form-group');
            
            if (result.available) {
                this.showFieldSuccess(formGroup, 'Nome de usuário disponível');
            } else {
                this.showFieldError(formGroup, 'Nome de usuário já está em uso');
            }
        } catch (error) {
            console.error('Erro ao verificar username:', error);
        }
    }

    async checkServiceNameAvailability(input) {
        const name = input.value;
        if (!name || name.length < 3) return;
        
        try {
            const response = await fetch('/api/check-service-name', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name })
            });
            
            const result = await response.json();
            const formGroup = input.closest('.form-group');
            
            if (result.available) {
                this.showFieldSuccess(formGroup, 'Nome do serviço disponível');
            } else {
                this.showFieldError(formGroup, 'Nome do serviço já existe');
            }
        } catch (error) {
            console.error('Erro ao verificar nome do serviço:', error);
        }
    }

    previewIcon(select) {
        const iconClass = select.value;
        const preview = document.getElementById('iconPreview');
        
        if (preview) {
            preview.className = `fas ${iconClass}`;
        } else {
            // Criar preview se não existir
            const previewDiv = document.createElement('div');
            previewDiv.id = 'iconPreview';
            previewDiv.className = `fas ${iconClass}`;
            previewDiv.style.cssText = `
                font-size: 2rem;
                color: #007bff;
                text-align: center;
                margin: 1rem 0;
                padding: 1rem;
                background: #f8f9fa;
                border-radius: 8px;
            `;
            select.parentNode.appendChild(previewDiv);
        }
    }

    validateField(field) {
        const formGroup = field.closest('.form-group');
        const value = field.value.trim();
        
        // Limpar mensagens anteriores
        this.clearFieldMessages(formGroup);
        
        // Validações básicas
        if (field.hasAttribute('required') && !value) {
            this.showFieldError(formGroup, 'Este campo é obrigatório');
            return false;
        }
        
        // Validações específicas por tipo
        switch (field.type) {
            case 'email':
                if (value && !Utils.validateEmail(value)) {
                    this.showFieldError(formGroup, 'Email inválido');
                    return false;
                }
                break;
            case 'tel':
                if (value && value.length < 10) {
                    this.showFieldError(formGroup, 'Telefone deve ter pelo menos 10 dígitos');
                    return false;
                }
                break;
            case 'url':
                if (value && !this.isValidUrl(value)) {
                    this.showFieldError(formGroup, 'URL inválida');
                    return false;
                }
                break;
        }
        
        // Validações específicas por ID
        switch (field.id) {
            case 'campaignValor':
                if (value && parseFloat(value.replace(/[^\d,]/g, '').replace(',', '.')) <= 0) {
                    this.showFieldError(formGroup, 'Valor deve ser maior que zero');
                    return false;
                }
                break;
        }
        
        if (value) {
            this.showFieldSuccess(formGroup, 'Campo válido');
        }
        
        return true;
    }

    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    showFieldError(formGroup, message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
        formGroup.appendChild(errorDiv);
        formGroup.classList.add('error');
    }

    showFieldSuccess(formGroup, message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
        formGroup.appendChild(successDiv);
        formGroup.classList.add('success');
    }

    clearFieldMessages(formGroup) {
        formGroup.classList.remove('error', 'success');
        const existingMessages = formGroup.querySelectorAll('.error-message, .success-message');
        existingMessages.forEach(msg => msg.remove());
    }
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    window.formHandler = new FormHandler();
});
