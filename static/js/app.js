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
        console.log('MODALMANAGER: showModal chamado, modalId:', modalId, 'modal encontrado:', !!modal);
        if (modal) {
            this.activeModal = modal;
            
            console.log('MODALMANAGER: Antes de exibir - display:', window.getComputedStyle(modal).display, 'classes:', modal.className);
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
            console.log('MODALMANAGER: Depois de exibir - display:', window.getComputedStyle(modal).display, 'classes:', modal.className);
            
            // Verificar se o modal ainda está visível após 100ms
            setTimeout(() => {
                console.log('MODALMANAGER: Verificação após 100ms - display:', window.getComputedStyle(modal).display, 'classes:', modal.className);
            }, 100);
            
            console.log('MODALMANAGER: Modal exibido com sucesso');
        } else {
            console.error('MODALMANAGER: Modal não encontrado:', modalId);
        }
    }
    
    clearCreateCampaignForm() {
        // Não fazer nada aqui - deixar o script inline do formulário gerenciar
        // Evitar conflitos com toggleForms() que pode causar problemas visuais
    }

    closeModal() {
        if (this.activeModal) {
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
        // ⚠️ CRÍTICO: Usar CAPTURE PHASE (true) para executar ANTES da validação nativa do navegador
        // ⚠️ CRÍTICO: Usar CAPTURE PHASE (true) para executar ANTES da validação nativa do navegador
        // Isso permite remover 'required' e desabilitar campos do formulário inativo
        document.addEventListener('submit', (e) => {
            if (e.target.tagName === 'FORM' && e.target.id === 'createCampaignForm') {
                console.log('🔍 FormManager interceptando submit (CAPTURE PHASE) - ANTES DE TUDO');
                
                const form = e.target;
                const formEmRota = form.querySelector('#formEmRota');
                const formCasual = form.querySelector('#formCasual');
                const routeEmRota = form.querySelector('#routeEmRota');
                const routeCasual = form.querySelector('#routeCasual');
                
                // Determinar qual formulário está ativo baseado no radio button
                const isEmRotaActive = routeEmRota && routeEmRota.checked;
                const isCasualActive = routeCasual && routeCasual.checked;
                
                console.log('📋 CAPTURE PHASE - Estado dos formulários:', {
                    isEmRotaActive,
                    isCasualActive,
                    formEmRotaExists: !!formEmRota,
                    formCasualExists: !!formCasual
                });
                
                if (formEmRota && formCasual) {
                    // ⚠️ ESTRATÉGIA DEFINITIVA: 
                    // 1. DESABILITAR TODOS os campos do formulário inativo
                    // 2. REMOVER 'required' de TODOS os campos do formulário inativo
                    // 3. Campos desabilitados NÃO são validados pelo navegador
                    
                    if (isEmRotaActive) {
                        // Em Rota está ativo
                        console.log('🔍 CAPTURE: Em Rota está ativo - Desabilitando TODOS os campos Casual');
                        
                        // DESABILITAR TODOS os campos Casual
                        const casualFields = formCasual.querySelectorAll('input, select, textarea, button');
                        casualFields.forEach(field => {
                            if (field.type !== 'file' && field.type !== 'hidden' && field.type !== 'radio') {
                                field.disabled = true;
                                field.removeAttribute('required');
                                // Também remover do dataset para garantir
                                if (field.dataset) {
                                    delete field.dataset.required;
                                }
                            }
                        });
                        
                        // Garantir que campos Em Rota estão HABILITADOS
                        const emRotaFields = formEmRota.querySelectorAll('input, select, textarea');
                        emRotaFields.forEach(field => {
                            if (field.type !== 'file' && !field.readOnly && field.type !== 'radio') {
                                field.disabled = false;
                            }
                        });
                        
                        console.log(`✅ CAPTURE: ${casualFields.length} campos Casual desabilitados, campos Em Rota habilitados`);
                    } else {
                        // Casual está ativo
                        console.log('🔍 CAPTURE: Casual está ativo - Desabilitando TODOS os campos Em Rota');
                        
                        // DESABILITAR TODOS os campos Em Rota
                        const emRotaFields = formEmRota.querySelectorAll('input, select, textarea, button');
                        emRotaFields.forEach(field => {
                            if (field.type !== 'file' && field.type !== 'hidden' && field.type !== 'radio') {
                                field.disabled = true;
                                field.removeAttribute('required');
                                // Também remover do dataset para garantir
                                if (field.dataset) {
                                    delete field.dataset.required;
                                }
                            }
                        });
                        
                        // Garantir que campos Casual estão HABILITADOS
                        const casualFields = formCasual.querySelectorAll('input, select, textarea');
                        casualFields.forEach(field => {
                            if (field.type !== 'file' && !field.readOnly && field.type !== 'radio') {
                                field.disabled = false;
                            }
                        });
                        
                        console.log(`✅ CAPTURE: ${emRotaFields.length} campos Em Rota desabilitados, campos Casual habilitados`);
                    }
                    
                    // Verificação final: garantir que NENHUM campo desabilitado tenha 'required'
                    const allDisabledFields = form.querySelectorAll('input[disabled], select[disabled], textarea[disabled]');
                    allDisabledFields.forEach(field => {
                        if (field.hasAttribute('required')) {
                            field.removeAttribute('required');
                            console.log(`✅ CAPTURE (final): Removido 'required' de campo desabilitado: ${field.name || field.id}`);
                        }
                    });
                }
            }
        }, true); // CAPTURE PHASE - executa ANTES da validação nativa do navegador
        
        // Submit de formulários (BUBBLE PHASE) - para validação e processamento
        document.addEventListener('submit', (e) => {
            // IMPORTANTE: Verificar se o evento já foi cancelado por outro listener
            if (e.defaultPrevented) {
                console.warn('⚠️ Submit já foi cancelado por outro listener');
                return;
            }
            
            if (e.target.tagName === 'FORM') {
                // Verificar se é o formulário de criação
                if (e.target.id === 'createCampaignForm') {
                    console.log('🔍 FormManager interceptando submit de createCampaignForm');
                    console.log('📋 Form action:', e.target.action);
                    console.log('📋 Form method:', e.target.method);
                    
                    // Chamar handleSubmit mas não bloquear se retornar undefined
                    const result = this.handleSubmit(e);
                    console.log('📋 Resultado do handleSubmit:', result, 'tipo:', typeof result);
                    
                    // Se handleSubmit retornar false explicitamente, a validação falhou
                    if (result === false) {
                        // Validação falhou - já foi bloqueado dentro do handleSubmit
                        console.log('❌ Validação falhou - bloqueando submit');
                        // Não precisa fazer preventDefault aqui, já foi feito no handleSubmit
                        return false;
                    }
                    
                    // Se chegou aqui, a validação passou (result é undefined ou qualquer outro valor)
                    // NÃO fazer preventDefault - deixar o submit continuar para Django
                    console.log('✅ Validação passou - Permitindo submit do formulário para Django');
                    console.log('📤 Formulário será submetido normalmente para:', e.target.action);
                    console.log('📤 O evento submit continuará normalmente (sem preventDefault)');
                    
                    // IMPORTANTE: Não retornar false e não fazer preventDefault
                    // Deixar o evento continuar normalmente para o Django processar
                    return;
                } else {
                    // Para outros formulários, também processar
                this.handleSubmit(e);
            }
            }
        }, false); // BUBBLE PHASE - para validação e processamento
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
        
        // Preparar formulário para submissão
        this.prepareFormForSubmission(form);
        
        // ⚠️ VERIFICAÇÃO CRÍTICA: Determinar qual formulário está ativo e DESABILITAR o outro
        const routeEmRota = form.querySelector('#routeEmRota');
        const routeCasual = form.querySelector('#routeCasual');
        const formEmRota = form.querySelector('#formEmRota');
        const formCasual = form.querySelector('#formCasual');
        
        let isEmRotaActive = routeEmRota && routeEmRota.checked;
        const isCasualActive = routeCasual && routeCasual.checked;
        
        console.log('🔍 handleSubmit - Estado inicial:', {
            isEmRotaActive,
            isCasualActive,
            formEmRotaExists: !!formEmRota,
            formCasualExists: !!formCasual
        });
        
        // ⚠️ DESABILITAR completamente o formulário que NÃO está ativo
        if (isEmRotaActive) {
            // Em Rota ativo - DESABILITAR TODOS os campos Casual
            if (formCasual) {
                const casualFields = formCasual.querySelectorAll('input, select, textarea');
                console.log(`🔍 Desabilitando ${casualFields.length} campos Casual`);
                casualFields.forEach(field => {
                    if (field.type !== 'file' && field.type !== 'hidden') {
                        field.disabled = true;
                        field.removeAttribute('required');
                        // Limpar valor também
                        if (!field.readOnly) {
                            field.value = '';
                        }
                    }
                });
            }
        } else {
            // Casual ativo - HABILITAR todos os campos Casual
            if (formCasual) {
                const casualFields = formCasual.querySelectorAll('input, select, textarea');
                console.log(`🔍 Habilitando ${casualFields.length} campos Casual`);
                casualFields.forEach(field => {
                    if (field.type !== 'file' && field.type !== 'hidden') {
                        // ⚠️ CRÍTICO: Garantir que o campo está habilitado
                        field.disabled = false;
                        // Garantir que o campo está visível
                        const parentGroup = field.closest('.form-group');
                        if (parentGroup) {
                            parentGroup.style.display = '';
                            parentGroup.style.visibility = '';
                        }
                        // Garantir que campos obrigatórios mantenham o required
                        // Não remover required aqui, apenas garantir que está habilitado
                        console.log(`  ✅ Habilitado: ${field.name || field.id}, disabled: ${field.disabled}, required: ${field.hasAttribute('required')}, value length: ${(field.value || '').length}`);
                    }
                });
                
                // ⚠️ VERIFICAÇÃO ESPECIAL para o campo description
                const descriptionField = formCasual.querySelector('#campaignDescription');
                if (descriptionField) {
                    descriptionField.disabled = false;
                    descriptionField.removeAttribute('readonly');
                    console.log(`🔍 Campo description verificado: disabled=${descriptionField.disabled}, value="${(descriptionField.value || '').substring(0, 30)}...", required=${descriptionField.hasAttribute('required')}`);
                } else {
                    console.error('❌ Campo #campaignDescription não encontrado no formulário Casual!');
                }
            }
            
            // DESABILITAR TODOS os campos Em Rota
            if (formEmRota) {
                const emRotaFields = formEmRota.querySelectorAll('input, select, textarea');
                console.log(`🔍 Desabilitando ${emRotaFields.length} campos Em Rota`);
                emRotaFields.forEach(field => {
                    if (field.type !== 'file' && field.type !== 'hidden') {
                        field.disabled = true;
                        field.removeAttribute('required');
                        // Limpar valor também
                        if (!field.readOnly) {
                            field.value = '';
                        }
                    }
                });
            }
        }
                // Limpar erros anteriores
        form.querySelectorAll('.error-message').forEach(error => error.remove());
        form.querySelectorAll('.form-group').forEach(group => group.classList.remove('error'));
        
        // Função auxiliar para verificar se um elemento está visível
        const isElementVisible = (element) => {
            if (!element) return false;
            
            // Verificar estilo computado
            const style = window.getComputedStyle(element);
            if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
                return false;
            }
            
            // Verificar atributo style inline
            if (element.hasAttribute('style')) {
                const inlineStyle = element.style.display;
                if (inlineStyle === 'none') {
                    return false;
                }
            }
            
            return true;
        };
        
        // Função auxiliar para verificar se um campo está dentro de um container oculto
        const isFieldInHiddenContainer = (field) => {
            let parent = field.parentElement;
            while (parent && parent !== form && parent !== document.body) {
                if (!isElementVisible(parent)) {
                    return true;
                }
                parent = parent.parentElement;
            }
            return false;
        };
        
        // Verificar qual tipo de formulário está ativo
        const formEmRotaElement = form.querySelector('#formEmRota');
        const formCasualElement = form.querySelector('#formCasual');
        const routeEmRotaRadio = form.querySelector('#routeEmRota');
        const routeCasualRadio = form.querySelector('#routeCasual');
        
        // Determinar qual formulário está ativo baseado no radio button (já foi declarado acima, apenas reatribuir)
        isEmRotaActive = false;
        if (routeEmRotaRadio && routeEmRotaRadio.checked) {
            isEmRotaActive = true;
        } else if (routeCasualRadio && routeCasualRadio.checked) {
            isEmRotaActive = false;
        } else {
            // Fallback: verificar display style
            if (formEmRotaElement) {
                const formEmRotaStyle = window.getComputedStyle(formEmRotaElement);
                isEmRotaActive = formEmRotaStyle.display !== 'none';
            }
        }
        
        // ⚠️ CRUCIAL: Remover 'required' de TODOS os campos do formulário OCULTO
        // Isso evita o erro "not focusable" do navegador
        if (isEmRotaActive) {
            // Em Rota está ativo - remover required de todos os campos Casual
            if (formCasualElement) {
                formCasualElement.querySelectorAll('[required]').forEach(field => {
                    field.removeAttribute('required');
                    console.log(`✅ Removido 'required' de campo Casual: ${field.name || field.id}`);
                });
            }
        } else {
            // Casual está ativo - remover required de todos os campos Em Rota
            if (formEmRotaElement) {
                formEmRotaElement.querySelectorAll('[required]').forEach(field => {
                    // Exceto campos obrigatórios do Em Rota (IDs 1 e 2 sempre obrigatórios)
                    const fieldName = field.name || '';
                    if (!fieldName.includes('route_id_1') && !fieldName.includes('route_valor_1') && 
                        !fieldName.includes('route_servico_1') && !fieldName.includes('route_id_2') && 
                        !fieldName.includes('route_valor_2') && !fieldName.includes('route_servico_2') &&
                        !fieldName.includes('route_solicitante') && !fieldName.includes('route_recebedor') &&
                        !fieldName.includes('route_description') && !fieldName.includes('route_dataPagamento') &&
                        !fieldName.includes('route_priority')) {
                        field.removeAttribute('required');
                        console.log(`✅ Removido 'required' de campo Em Rota: ${field.name || field.id}`);
                    }
                });
            }
        }
        
        console.log('🔍 Debug Validação:', {
            routeEmRotaChecked: routeEmRotaRadio?.checked,
            routeCasualChecked: routeCasualRadio?.checked,
            formEmRotaDisplay: formEmRotaElement ? window.getComputedStyle(formEmRotaElement).display : 'não encontrado',
            formCasualDisplay: formCasualElement ? window.getComputedStyle(formCasualElement).display : 'não encontrado',
            isEmRotaActive
        });
        
        // ⚠️ BUSCAR APENAS CAMPOS DO FORMULÁRIO ATIVO QUE ESTÃO HABILITADOS E NÃO DESABILITADOS
        // Campos desabilitados não devem ser validados e não causam erro "not focusable"
        const activeForm = isEmRotaActive ? formEmRotaElement : formCasualElement;
        const inactiveForm = isEmRotaActive ? formCasualElement : formEmRotaElement;
        
        // Garantir que campos do formulário inativo estão desabilitados
        if (inactiveForm) {
            const inactiveFields = inactiveForm.querySelectorAll('input, select, textarea');
            inactiveFields.forEach(field => {
                if (field.type !== 'file' && field.type !== 'hidden' && field.type !== 'radio') {
                    field.disabled = true;
                    field.removeAttribute('required');
                }
            });
        }
        
        // ⚠️ CRÍTICO: Garantir que TODOS os campos do formulário ativo estão habilitados ANTES de buscar campos required
        if (activeForm) {
            const activeFields = activeForm.querySelectorAll('input, select, textarea');
            console.log(`🔍 Garantindo que ${activeFields.length} campos do formulário ativo estão habilitados`);
            activeFields.forEach(field => {
                if (field.type !== 'file' && field.type !== 'hidden' && field.type !== 'radio') {
                    if (field.disabled) {
                        console.warn(`⚠️ Campo ${field.name || field.id} estava desabilitado - habilitando agora`);
                        field.disabled = false;
                    }
                    // Garantir que o campo está visível
                    if (!isElementVisible(field)) {
                        console.warn(`⚠️ Campo ${field.name || field.id} não está visível - verificando parent`);
                        const parent = field.closest('.form-group');
                        if (parent) {
                            parent.style.display = 'block';
                            parent.style.visibility = 'visible';
                        }
                    }
                }
            });
        }
        
        // Buscar apenas campos do formulário ativo que estão habilitados
        const requiredFields = activeForm ? 
            Array.from(activeForm.querySelectorAll('[required]')).filter(field => {
                // Garantir que o campo está habilitado antes de incluir na validação
                if (field.disabled) {
                    console.warn(`⚠️ Campo required ${field.name || field.id} está desabilitado - habilitando`);
                    field.disabled = false;
                }
                return !field.disabled && 
                    field.type !== 'hidden' &&
                    field.type !== 'radio' &&
                    isElementVisible(field) && 
                    !isFieldInHiddenContainer(field) &&
                    field.offsetParent !== null; // Verificação adicional de visibilidade
            }) : [];
        
        let isValid = true;
        let errorCount = 0;
        const errors = [];
        const errorFields = []; // Armazenar referências dos campos com erro
        
        console.log(`🔍 Formulário ativo: ${isEmRotaActive ? 'Em Rota' : 'Casual'}`);
        console.log(`🔍 Total de campos required no formulário ativo (habilitados): ${requiredFields.length}`);
        console.log(`🔍 Campos required encontrados:`, requiredFields.map(f => ({
            name: f.name || f.id,
            disabled: f.disabled,
            visible: isElementVisible(f)
        })));

        requiredFields.forEach(field => {
            // ⚠️ GARANTIR que o campo está habilitado antes de validar
            if (field.disabled) {
                console.warn(`⚠️ Campo ${field.name || field.id} está desabilitado no loop de validação - habilitando`);
                field.disabled = false;
            }
            
            // Verificar se o campo está realmente visível
            if (!isElementVisible(field)) {
                console.warn(`⚠️ Campo ${field.name || field.id} não está visível - pulando validação`);
                return; // Campo não visível, pular
            }
            
            // Verificar se está em container oculto
            if (isFieldInHiddenContainer(field)) {
                console.warn(`⚠️ Campo ${field.name || field.id} está em container oculto - pulando validação`);
                return; // Campo em container oculto, pular
            }
            
            const fieldName = field.name || field.id || '';
            const formGroup = field.closest('.form-group');
            
            // Log detalhado para campos TEXTAREA
            if (field.tagName === 'TEXTAREA') {
                console.log(`🔍 Validando TEXTAREA: ${fieldName}, disabled: ${field.disabled}, value: "${(field.value || '').substring(0, 50)}", length: ${(field.value || '').length}, visible: ${isElementVisible(field)}`);
            }
            
            // ===== VALIDAÇÃO ESPECÍFICA PARA "EM ROTA" =====
            if (isEmRotaActive) {
                // Ignorar TODOS os campos do formulário Casual (têm prefixo 'casual_')
                if (fieldName.startsWith('casual_')) {
                    return;
                }
                
                // Ignorar campos específicos do Casual por ID
                if (field.id === 'campaignId' || field.id === 'campaignSolicitante' || 
                    field.id === 'campaignRecebedor' || field.id === 'campaignValor' || 
                    field.id === 'campaignService' || field.id === 'campaignDescription' ||
                    field.id === 'campaignDataPagamento' || field.id === 'campaignDataCriacao' ||
                    field.id === 'campaignAnexos' || field.id === 'campaignPriority') {
                    field.removeAttribute('required');
                    return;
                }
                
                // Para campos opcionais (IDs 3 e 4), verificar se o grupo inteiro está vazio
                if (fieldName.includes('route_id_3') || fieldName.includes('route_valor_3') || fieldName.includes('route_servico_3') ||
                    fieldName.includes('route_id_4') || fieldName.includes('route_valor_4') || fieldName.includes('route_servico_4')) {
                    
                    // Extrair número do grupo
                    const match = fieldName.match(/route_(id|valor|servico)_(\d)/);
                    if (match) {
                        const groupNum = match[2];
                        const routeId = form.querySelector(`[name="route_id_${groupNum}"]`);
                        const routeValor = form.querySelector(`[name="route_valor_${groupNum}"]`);
                        const routeServico = form.querySelector(`[name="route_servico_${groupNum}"]`);
                        
                        // Se TODOS os 3 campos do grupo opcional estão vazios, não validar
                        const idEmpty = !routeId || !routeId.value.trim();
                        const valorEmpty = !routeValor || !routeValor.value.trim();
                        const servicoEmpty = !routeServico || !routeServico.value || routeServico.value === '';
                        
                        if (idEmpty && valorEmpty && servicoEmpty) {
                            // Grupo opcional completamente vazio, remover required e pular
                            field.removeAttribute('required');
                            return;
                        }
                    }
                }
            } 
            // ===== VALIDAÇÃO ESPECÍFICA PARA "CASUAL" =====
            else {
                // Ignorar TODOS os campos do formulário Em Rota (têm prefixo 'route_')
                if (fieldName.startsWith('route_')) {
                    return;
                }
                
                // Ignorar campos específicos do Em Rota por ID
                if (field.id && (field.id.startsWith('route') || field.id === 'routeSolicitante' ||
                    field.id === 'routeRecebedor' || field.id === 'routeDescription' ||
                    field.id === 'routeDataPagamento' || field.id === 'routeDataCriacao' ||
                    field.id === 'routeAnexos' || field.id === 'routePriority')) {
                    return;
                }
                
                // Em Casual, ID não é obrigatório (pode não ter)
                if (fieldName === 'casual_id' || field.id === 'campaignId') {
                    // Remover required se tiver
                    field.removeAttribute('required');
                    return;
                }
                
                // ⚠️ IMPORTANTE: Campo hidden casual_valor não deve ser validado como obrigatório
                // O valor será calculado automaticamente antes do submit
                if (fieldName === 'casual_valor' || field.id === 'casual_valor_hidden') {
                    // Garantir que o valor foi calculado antes de validar
                    const formCasual = form.querySelector('#formCasual');
                    if (formCasual && window.getComputedStyle(formCasual).display !== 'none') {
                        // Chamar função de cálculo se existir globalmente
                        if (typeof window.calcularValorTotalCasual === 'function') {
                            window.calcularValorTotalCasual();
                        }
                        // Verificar se o valor foi calculado (não pode ser 0 ou vazio)
                        const valorCalculado = parseFloat((field.value || '0').toString().replace(',', '.')) || 0;
                        if (valorCalculado > 0) {
                            // Valor válido, remover required e não validar
                            field.removeAttribute('required');
                            return; // Pular validação deste campo
                        }
                    }
                    // Se não foi calculado ainda ou é zero, remover required para não bloquear
                    field.removeAttribute('required');
                    return; // Pular validação deste campo (será validado no submit handler)
                }
                
                // ⚠️ GARANTIR que campos do formulário Casual estão habilitados antes de validar
                if (fieldName.startsWith('casual_') || field.id === 'campaignDescription' || 
                    field.id === 'campaignRecebedor' || field.id === 'campaignService' ||
                    field.id === 'campaignDataPagamento' || field.id === 'campaignPriority') {
                    // Se o campo está desabilitado, habilitar antes de validar
                    if (field.disabled) {
                        console.warn(`⚠️ Campo ${fieldName || field.id} está desabilitado - habilitando para validação`);
                        field.disabled = false;
                    }
                }
            }
            
            // ===== VALIDAÇÃO DO VALOR DO CAMPO =====
            let value = '';
            if (field.tagName === 'SELECT') {
                value = field.value || '';
                // Para SELECT, verificar se tem uma opção selecionada (não pode ser vazio)
                if (field.selectedIndex === 0 && field.options[0] && !field.options[0].value) {
                    value = ''; // Primeira opção vazia e selecionada = campo vazio
                }
            } else if (field.type === 'file') {
                value = field.files && field.files.length > 0 ? 'has-file' : '';
            } else if (field.tagName === 'TEXTAREA') {
                // Para TEXTAREA, fazer trim mas manter espaços em branco se necessário
                value = (field.value || '').trim();
                // Log para debug de textarea
                console.log(`🔍 TEXTAREA - campo: ${fieldName || field.id}, valor length: ${value.length}, valor: "${value.substring(0, 50)}${value.length > 50 ? '...' : ''}"`);
            } else {
                value = (field.value || '').trim();
            }
            
            // Log apenas para campos SELECT para debug detalhado
            if (field.tagName === 'SELECT') {
                console.log(`🔍 SELECT - campo: ${fieldName || field.id}, selectedIndex: ${field.selectedIndex}, value: '${value}', option[0].value: '${field.options[0]?.value || 'N/A'}'`);
            }
            
            // Verificar se campo está vazio
            if (!value || value === '' || value === '0') {
                // ⚠️ Para campos TEXTAREA, verificar se realmente está vazio ou se foi limpo acidentalmente
                if (field.tagName === 'TEXTAREA') {
                    // Tentar recuperar valor do campo novamente
                    const currentValue = field.value || '';
                    if (currentValue.trim().length === 0) {
                        console.log(`❌ Campo TEXTAREA vazio detectado: ${fieldName || field.id}, valor: '${currentValue}', disabled: ${field.disabled}, readonly: ${field.readOnly}`);
                        
                        // Verificar se o campo está desabilitado ou readonly
                        if (field.disabled) {
                            console.error(`❌ ERRO CRÍTICO: Campo ${fieldName || field.id} está DESABILITADO! Habilitando agora...`);
                            field.disabled = false;
                            // Tentar novamente após habilitar
                            const retryValue = field.value || '';
                            if (retryValue.trim().length > 0) {
                                console.log(`✅ Campo foi habilitado e tem valor: ${retryValue.substring(0, 30)}...`);
                                value = retryValue.trim();
                            } else {
                                // Campo realmente está vazio - mostrar erro
                                if (formGroup) {
                                    formGroup.classList.add('error');
                                    this.showFieldError(formGroup, 'O campo "Descrição" é obrigatório. Por favor, preencha a descrição da solicitação.');
                                }
                                isValid = false;
                                errorCount++;
                                errors.push(fieldName || 'Campo sem nome');
                                errorFields.push(field); // Armazenar referência do campo
                            }
                        } else {
                            // Campo está habilitado mas vazio - mostrar erro
                            if (formGroup) {
                                formGroup.classList.add('error');
                                this.showFieldError(formGroup, 'O campo "Descrição" é obrigatório. Por favor, preencha a descrição da solicitação.');
                            }
                            isValid = false;
                            errorCount++;
                            errors.push(fieldName || 'Campo sem nome');
                            errorFields.push(field); // Armazenar referência do campo
                        }
                    } else {
                        // Valor encontrado após verificação
                        value = currentValue.trim();
                    }
                } else {
                    // Para outros campos, comportamento normal
                    console.log(`❌ Campo vazio detectado: ${fieldName || field.id}, valor: '${value}', tipo: ${field.type || field.tagName}`);
                    if (formGroup) {
                        formGroup.classList.add('error');
                        this.showFieldError(formGroup, 'Este campo é obrigatório');
                    }
                    isValid = false;
                    errorCount++;
                    errors.push(fieldName || 'Campo sem nome');
                    errorFields.push(field); // Armazenar referência do campo
                }
            } else {
                // Validação específica para campos de tempo
                if (field.type === 'time' && value) {
                    const timePattern = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
                    if (!timePattern.test(value)) {
                        if (formGroup) {
                        formGroup.classList.add('error');
                        this.showFieldError(formGroup, 'Formato de tempo inválido. Use HH:MM (ex: 14:30)');
                        }                        isValid = false;
                        errorCount++;
                        return;
                    }
                }
                
                if (formGroup) {
                formGroup.classList.remove('error');
                }            }
        });

        console.log(`Validação: ${isValid ? 'Válido' : 'Inválido'} (${errorCount} erros)`);
        console.log(`Tipo de formulário ativo: ${isEmRotaActive ? 'Em Rota' : 'Casual'}`);
        if (errors.length > 0) {
            console.log('Campos com erro:', errors);
            console.log('Todos os campos required encontrados:', Array.from(requiredFields).map(f => ({
                name: f.name,
                id: f.id,
                value: f.value,
                visible: isElementVisible(f),
                inHiddenContainer: isFieldInHiddenContainer(f)
            })));
        }

        // Se o formulário tem action para Django
        if (form.action && (form.action.includes('/solicitacoes/') || form.action.includes('/Solicitacoes/') || form.action.includes('/home/'))) {
            if (!isValid) {
                e.preventDefault();
                e.stopPropagation(); // Evitar que o evento se propague e feche o modal
                
                // Log detalhado para debug
                console.error('❌ VALIDAÇÃO FALHOU:', {
                    errorCount,
                    errors,
                    formType: isEmRotaActive ? 'Em Rota' : 'Casual',
                    allRequiredFields: Array.from(requiredFields).map(f => ({
                        name: f.name || f.id,
                        value: f.value || f.selectedIndex,
                        visible: isElementVisible(f),
                        inHidden: isFieldInHiddenContainer(f),
                        display: window.getComputedStyle(f).display
                    }))
                });
                
                // Listar todos os campos que falharam
                const failedFields = errors.map(err => {
                    const field = Array.from(requiredFields).find(f => (f.name || f.id) === err);
                    if (field) {
                        return {
                            name: field.name || field.id || 'sem nome',
                            label: field.closest('.form-group')?.querySelector('label')?.textContent || field.placeholder || 'Campo',
                            value: field.value || '(vazio)',
                            visible: isElementVisible(field),
                            display: window.getComputedStyle(field).display
                        };
                    }
                    return { name: err };
                });
                
                console.error('❌ Campos que falharam na validação:', failedFields);
                
                // Fazer scroll até o primeiro campo com erro
                if (errorFields.length > 0) {
                    const firstErrorField = errorFields[0];
                    const formGroup = firstErrorField.closest('.form-group');
                    
                    // Tentar fazer scroll até o campo ou o grupo do formulário
                    const scrollTarget = formGroup || firstErrorField;
                    
                    setTimeout(() => {
                        try {
                            scrollTarget.scrollIntoView({ 
                                behavior: 'smooth', 
                                block: 'center',
                                inline: 'nearest'
                            });
                            
                            // Focar no campo após o scroll
                            setTimeout(() => {
                                if (firstErrorField && !firstErrorField.disabled) {
                                    firstErrorField.focus();
                                }
                            }, 300);
                        } catch (scrollError) {
                            console.warn('⚠️ Erro ao fazer scroll:', scrollError);
                        }
                    }, 100);
                }
                
                const message = errorCount === 1 
                    ? 'Por favor, preencha o campo obrigatório' 
                    : `Por favor, preencha todos os campos obrigatórios (${errorCount} campos faltando)`;
                
                // Mostrar notificação usando Utils (não usar alert para não bloquear)
                if (typeof Utils !== 'undefined' && Utils.showNotification) {
                    Utils.showNotification(message, 'error');
                } else {
                    // Fallback apenas se Utils não existir
                    console.error('⚠️ Utils.showNotification não está disponível, usando alert como fallback');
                    alert(message);
                }
                
                return false;
            }
            
            // Se válido, garantir que o formulário pode ser submetido
            console.log('✅ VALIDAÇÃO PASSOU - Permitindo submit para Django');
            console.log('═══════════════════════════════════════════════════');
            
            // ⚠️ VERIFICAÇÃO FINAL: Garantir que campos desabilitados não interferem
            const allDisabledFields = form.querySelectorAll('input[disabled], select[disabled], textarea[disabled]');
            allDisabledFields.forEach(field => {
                // Remover required de campos desabilitados como segurança extra
                if (field.hasAttribute('required')) {
                    field.removeAttribute('required');
                    console.log(`✅ Removido 'required' final de campo desabilitado: ${field.name || field.id}`);
                }
            });
            
            const routeRadioChecked = form.querySelector('[name="route"]:checked');
            const routeValue = routeRadioChecked ? routeRadioChecked.value : 'não encontrado';
            
            // Verificar se está em modo de edição
            const solicitacaoIdField = form.querySelector('#solicitacaoId');
            const formModeField = form.querySelector('#formMode');
            const isEditMode = solicitacaoIdField && solicitacaoIdField.value && solicitacaoIdField.value.trim() !== '';
            
            console.log('📋 Dados do formulário antes do submit:', {
                action: form.action,
                method: form.method,
                route: routeValue,
                tipo: isEmRotaActive ? 'Em Rota' : 'Casual',
                routeRadioFound: !!routeRadioChecked,
                formId: form.id,
                formName: form.name,
                isEditMode: isEditMode,
                solicitacaoId: solicitacaoIdField ? solicitacaoIdField.value : 'não encontrado',
                formMode: formModeField ? formModeField.value : 'não encontrado'
            });
            
            // Garantir que o campo 'route' está presente no formulário antes de submeter
            if (!routeRadioChecked) {
                console.warn('⚠️ Campo "route" (radio button) não encontrado - criando dinamicamente');
                // Criar input hidden se não existir
                const hiddenRoute = document.createElement('input');
                hiddenRoute.type = 'hidden';
                hiddenRoute.name = 'route';
                hiddenRoute.value = isEmRotaActive ? 'Em Rota' : 'Casual';
                form.appendChild(hiddenRoute);
                console.log('✅ Campo "route" criado dinamicamente:', hiddenRoute.value);
            }
            
            // Garantir que o campo solicitacao_id está presente e com valor se estiver em modo de edição
            if (isEditMode && solicitacaoIdField) {
                const solicitacaoIdValue = solicitacaoIdField.value.trim();
                if (!solicitacaoIdValue) {
                    console.error('❌ ERRO: Modo de edição ativado mas solicitacao_id está vazio!');
                    e.preventDefault();
                    e.stopPropagation();
                    Utils.showNotification('Erro: ID da solicitação não encontrado. Recarregue a página e tente novamente.', 'error');
                    return false;
                }
                console.log('✅ Campo solicitacao_id verificado e presente:', solicitacaoIdValue);
            }
            
            // ⚠️ ÚLTIMA VERIFICAÇÃO: Garantir que campos ocultos não têm 'required'
            // Fazer isso ANTES de permitir o submit para evitar erro "not focusable"
            // Usar as variáveis definidas anteriormente no escopo
            const formCasualCheck = form.querySelector('#formCasual');
            const formEmRotaCheck = form.querySelector('#formEmRota');
            
            if (formCasualCheck && formEmRotaCheck) {
                const casualStyle = window.getComputedStyle(formCasualCheck);
                const rotaStyle = window.getComputedStyle(formEmRotaCheck);
                
                if (casualStyle.display === 'none') {
                    // Casual oculto - remover required de TODOS os campos
                    formCasualCheck.querySelectorAll('[required]').forEach(field => {
                        field.removeAttribute('required');
                        console.log(`✅ Última verificação: Removido 'required' de campo Casual oculto: ${field.name || field.id}`);
                    });
                }
                
                if (rotaStyle.display === 'none') {
                    // Em Rota oculto - remover required de TODOS os campos
                    // Se Em Rota está oculto, significa que Casual está ativo, então remover tudo
                    formEmRotaCheck.querySelectorAll('[required]').forEach(field => {
                        field.removeAttribute('required');
                        console.log(`✅ Última verificação: Removido 'required' de campo Em Rota oculto: ${field.name || field.id}`);
                    });
                }
            }
            
            // Log final antes de permitir o submit
            console.log('✅ NÃO fazendo preventDefault() - formulário será submetido normalmente');
            console.log('📤 O navegador submeterá o formulário para:', form.action);
            console.log('═══════════════════════════════════════════════════');
            
            // IMPORTANTE: NÃO fazer preventDefault aqui
            // Deixar o navegador submeter normalmente para Django
            // O Django processará e fará redirect, recarregando a página com o novo card
            // Retornar undefined permite o submit continuar normalmente
            // Não retornar false aqui!
            return undefined;
        }
        
        // Para outros formulários (não Django), usar submitForm personalizado
        if (isValid) {
            e.preventDefault();
            const formData = new FormData(form);
            this.submitForm(form, formData);
        } else {
            e.preventDefault();
            const message = errorCount === 1 
                ? 'Por favor, preencha o campo obrigatório' 
                : `Por favor, preencha os ${errorCount} campos obrigatórios`;
            Utils.showNotification(message, 'error');
        }
    }

    prepareFormForSubmission(form) {
        // Preparação adicional do formulário antes do submit (se necessário)
        // O título será gerado automaticamente no backend
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
            if (window.modalManager) {
                window.modalManager.closeModal();
            }            
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
        console.log('KANBANMANAGER: setupEventListeners chamado');
        // Create campaign button
        const createCampaignBtn = document.getElementById('createCampaignBtn');
        console.log('KANBANMANAGER: Botão encontrado:', !!createCampaignBtn);
        if (createCampaignBtn) {
            console.log('KANBANMANAGER: Adicionando listener ao botão');
            createCampaignBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('KANBANMANAGER: Botão clicado!');
                this.showCreateModal();
            });
        }
        
        // Close modal buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('close-btn') || e.target.closest('.close-btn')) {
                console.log('KANBANMANAGER: Botão fechar clicado');
                if (window.modalManager) {
                    window.modalManager.closeModal();
                }            }
            
            // Cancel button
            if (e.target.id === 'cancelCreate') {
                console.log('KANBANMANAGER: Botão cancelar clicado');
                if (window.modalManager) {
                    window.modalManager.closeModal();
                }
            }
        });

        // REMOVIDO: O FormManager já gerencia o submit do formulário
        // Não precisa adicionar outro listener aqui que bloqueia o submit
        // O formulário será processado pelo handleSubmit do FormManager
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
        console.log('KANBANMANAGER: window.modalManager existe?', !!window.modalManager);
        if (window.modalManager) {
            window.modalManager.showModal('createCampaignModal');
        } else {
            console.error('KANBANMANAGER: modalManager não está disponível!');
        }    }

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

        // Carregar estado de expansão salvo
        const expandedCards = JSON.parse(localStorage.getItem('expandedCards') || '[]');

        // Renderizar cards
        this.cards.forEach(card => {
            const cardElement = this.createCardElement(card);
            
            // Restaurar estado de expansão se estava expandido
            if (expandedCards.includes(card.id.toString())) {
                cardElement.classList.add('expanded');
                cardElement.style.maxHeight = '500px';
            }
            
            this.addCardToColumn(card.status, cardElement);
        });
    }

    addCardToColumn(column, cardData = null) {
        const columnElement = document.querySelector(`[data-column="${column}"]`);
        if (!columnElement) return;

        const cardsContainer = columnElement.querySelector('.cards-container');
        if (!cardsContainer) return;

        let cardElement;
        
        if (cardData && cardData.nodeType) {
            // Se é um elemento DOM já criado
            cardElement = cardData;
        } else {
            // Se são dados de card, criar elemento
            const card = cardData || this.createDefaultCard();
            cardElement = this.createCardElement(card);
        }
        
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
                <div class="card-id">${card.ticket || 'INC' + card.id}</div>
                <div class="card-priority ${card.priority}">${card.priority}</div>
            </div>
            <div class="card-content">
                <div class="card-basic-info">
                    <div class="card-description">${card.description || card.title}</div>
                    <div class="card-solicitante">
                        <i class="fas fa-user"></i>
                        ${card.solicitante || 'Usuário'}
                    </div>
                    <div class="card-valor">
                        <i class="fas fa-dollar-sign"></i>
                        ${card.valor || 'R$ 0,00'}
                    </div>
                    <div class="card-tempo-fila">
                        <i class="fas fa-clock"></i>
                        ${card.tempoFila || '00:00'}
                    </div>
                </div>
                
                <div class="card-expanded-info">
                    <div class="info-section">
                        <div class="section-title">
                            <i class="fas fa-info-circle"></i>
                            Informações Básicas
                        </div>
                        <div class="info-grid">
                            <div class="info-item">
                                <div class="info-label">Recebedor</div>
                                <div class="info-value">${card.recebedor || 'Financeiro'}</div>
                            </div>
                            <div class="info-item">
                                <div class="info-label">Serviço</div>
                                <div class="info-value">${card.service || 'Consultoria'}</div>
                            </div>
                            <div class="info-item">
                                <div class="info-label">Data Criação</div>
                                <div class="info-value">${Utils.formatDate(card.dataCriacao)}</div>
                            </div>
                            <div class="info-item">
                                <div class="info-label">Data Pagamento</div>
                                <div class="info-value">${Utils.formatDate(card.dataPagamento)}</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="info-section">
                        <div class="section-title">
                            <i class="fas fa-clock"></i>
                            Tempos
                        </div>
                        <div class="info-grid">
                            <div class="info-item">
                                <div class="info-label">Tempo Criação</div>
                                <div class="info-value">${card.tempoCriacao || '00:00'}</div>
                            </div>
                            <div class="info-item">
                                <div class="info-label">Tempo Fila</div>
                                <div class="info-value">${card.tempoFila || '00:00'}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="card-footer">
                <div class="card-actions">
                    <button class="card-action-btn edit" onclick="kanbanManager.editCard(${card.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="card-action-btn delete" onclick="kanbanManager.deleteCard(${card.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="card-status ${card.status}">${card.status}</div>
            </div>
            <div class="expand-indicator">
                <i class="fas fa-chevron-down"></i>
            </div>
        `;

        // Adicionar evento de clique para expandir/contrair
        cardElement.addEventListener('click', (e) => {
            // Não expandir se clicar nos botões de ação
            if (e.target.closest('.card-action-btn')) {
                return;
            }
            this.toggleCardExpansion(cardElement);
        });

        return cardElement;
    }

    toggleCardExpansion(cardElement) {
        const isExpanded = cardElement.classList.contains('expanded');
        
        if (isExpanded) {
            // Contrair o card
            cardElement.classList.remove('expanded');
            cardElement.style.maxHeight = '120px';
        } else {
            // Expandir o card
            cardElement.classList.add('expanded');
            cardElement.style.maxHeight = '500px';
        }
        
        // Salvar estado de expansão no localStorage
        const cardId = cardElement.dataset.cardId;
        const expandedCards = JSON.parse(localStorage.getItem('expandedCards') || '[]');
        
        if (isExpanded) {
            // Remover da lista de expandidos
            const index = expandedCards.indexOf(cardId);
            if (index > -1) {
                expandedCards.splice(index, 1);
            }
        } else {
            // Adicionar à lista de expandidos
            if (!expandedCards.includes(cardId)) {
                expandedCards.push(cardId);
            }
        }
        
        localStorage.setItem('expandedCards', JSON.stringify(expandedCards));
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
    console.log('APP.JS: DOMContentLoaded disparado. Inicializando sistema...');
    
    try {
        // Inicializar gerenciadores
        window.modalManager = new ModalManager();
        console.log('APP.JS: ModalManager inicializado');
        
        window.sidebarManager = new SidebarManager();
        console.log('APP.JS: SidebarManager inicializado');
        
        window.formManager = new FormManager();
        console.log('APP.JS: FormManager inicializado');
        
        // NÃO inicializar NavigationManager aqui - ele interfere na navegação normal
        // window.navigationManager = new NavigationManager();
        console.log('APP.JS: NavigationManager desabilitado (usa navegação normal)');
        
        window.settingsManager = new SettingsManager();
        console.log('APP.JS: SettingsManager inicializado');
        
        // Inicializar KanbanManager apenas se estivermos na página do Kanban
        const kanbanBoard = document.querySelector('.kanban-board');
        console.log('APP.JS: Kanban board encontrado:', !!kanbanBoard);
        if (kanbanBoard) {
            console.log('APP.JS: Inicializando KanbanManager...');
            window.kanbanManager = new KanbanManager();
            console.log('APP.JS: KanbanManager inicializado:', !!window.kanbanManager);
        } else {
            console.log('APP.JS: Kanban board não encontrado');
        }
    } catch (error) {
        console.error('APP.JS: Erro ao inicializar sistema:', error);    }

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
