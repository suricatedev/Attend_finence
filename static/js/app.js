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
        // DESABILITADO: Não fechar modal ao clicar no overlay
        // O modal não deve fechar ao clicar fora, especialmente quando há erros
        // document.addEventListener('click', (e) => {
        //     if (e.target.classList.contains('modal')) {
        //         this.closeModal();
        //     }
        // });
        
        // Fechar modal com ESC (mantido para UX)
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.activeModal) {
                // Verificar se há erros no formulário antes de fechar
                const form = document.getElementById('createCampaignForm');
                if (form && form.querySelectorAll('.form-group.error, .error-message').length > 0) {
                    console.log('🛡️ Modal não fechado com ESC - há erros no formulário');
                    return; // Não fechar se houver erros
                }
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
                    
                    // Se chegou aqui, a validação passou - enviar via AJAX para controlar erros
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('✅ Validação passou - Enviando via AJAX para manter modal aberto em caso de erro');
                    this.submitFormViaAjax(e.target);
                    return false;
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
        if (!formGroup) return; // Se não encontrar form-group, não validar
        
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
        // Remover mensagens de erro anteriores
        const existingError = formGroup.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        // Adicionar nova mensagem de erro
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
        formGroup.appendChild(errorDiv);
        
        // Garantir que o grupo tem a classe error
        formGroup.classList.add('error');
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
                // BLOQUEAR COMPLETAMENTE o submit para não fechar o modal
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation(); // Bloquear outros listeners também
                
                // GARANTIR que o modal não fecha
                const modal = document.getElementById('createCampaignModal');
                if (modal) {
                    // Forçar modal a permanecer aberto
                    modal.style.display = 'flex';
                    modal.classList.add('show');
                    document.body.style.overflow = 'hidden';
                }
                
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
                
                // GARANTIR que o modal permanece aberto
                setTimeout(() => {
                    const modal = document.getElementById('createCampaignModal');
                    if (modal) {
                        modal.style.display = 'flex';
                        modal.classList.add('show');
                        document.body.style.overflow = 'hidden';
                        console.log('🛡️ Modal mantido aberto após erro de validação');
                    }
                }, 100);
                
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
    
    async submitFormViaAjax(form) {
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn ? submitBtn.textContent : '';
        const originalHtml = submitBtn ? submitBtn.innerHTML : '';
        
        // Estado de carregamento
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
        }
        form.classList.add('form-loading');
        
        try {
            // Criar FormData do formulário
            const formData = new FormData(form);
            
            // Enviar via AJAX
            const response = await fetch(form.action, {
                method: form.method || 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            
            // Verificar se a resposta é HTML (redirect com erro) ou JSON
            const contentType = response.headers.get('content-type');
            
            if (contentType && contentType.includes('application/json')) {
                // Resposta JSON
                const data = await response.json();
                if (data.success) {
                    // Sucesso - fechar modal e recarregar
                    if (typeof Utils !== 'undefined' && Utils.showNotification) {
                        Utils.showNotification(data.message || 'Solicitação criada com sucesso!', 'success');
                    }
                    if (window.modalManager) {
                        window.modalManager.closeModal();
                    }
                    // Recarregar página após um pequeno delay
                    setTimeout(() => {
                        window.location.reload();
                    }, 500);
                    return;
                } else {
                    // Erro - não fechar modal, focar no campo com erro
                    const errorMessage = data.message || 'Erro ao processar solicitação';
                    let errorField = null;
                    
                    // Tentar encontrar o campo pelo nome retornado pelo backend
                    if (data.field) {
                        errorField = form.querySelector(`[name="${data.field}"], #${data.field}`);
                    }
                    
                    // Se não encontrou pelo nome, tentar pelo texto da mensagem
                    if (!errorField) {
                        if (errorMessage.includes('Descrição')) {
                            errorField = form.querySelector('#campaignDescription, [name="casual_description"], [name="route_description"]');
                        } else if (errorMessage.includes('Recebedor')) {
                            errorField = form.querySelector('#campaignRecebedor, [name="casual_recebedor"]');
                        } else if (errorMessage.includes('Data de Pagamento') || errorMessage.includes('Pagamento')) {
                            errorField = form.querySelector('#campaignDataPagamento, [name="casual_dataPagamento"], [name="route_dataPagamento"]');
                        }
                    }
                    
                    // Focar no campo com erro
                    if (errorField) {
                        setTimeout(() => {
                            errorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            setTimeout(() => {
                                if (!errorField.disabled) {
                                    errorField.focus();
                                }
                            }, 300);
                        }, 100);
                        
                        // Mostrar erro no campo
                        const formGroup = errorField.closest('.form-group');
                        if (formGroup) {
                            formGroup.classList.add('error');
                            this.showFieldError(formGroup, errorMessage);
                        }
                    }
                    
                    // Mostrar notificação
                    if (typeof Utils !== 'undefined' && Utils.showNotification) {
                        Utils.showNotification(errorMessage, 'error');
                    }
                    
                    // GARANTIR que o modal permanece aberto após erro
                    setTimeout(() => {
                        const modal = document.getElementById('createCampaignModal');
                        if (modal) {
                            modal.style.display = 'flex';
                            modal.classList.add('show');
                            document.body.style.overflow = 'hidden';
                            console.log('🛡️ Modal mantido aberto após erro HTML do backend');
                        }
                    }, 100);
                    
                    return; // Não fechar modal
                }
            } else {
                // Resposta HTML (pode ser redirect ou página de erro)
                const html = await response.text();
                
                // Verificar se há mensagens de erro do Django
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const errorMessages = doc.querySelectorAll('.alert-error, .error, [class*="error"]');
                
                if (errorMessages.length > 0 || !response.ok) {
                    // Extrair mensagem de erro
                    let errorMessage = '';
                    let errorField = null;
                    
                    errorMessages.forEach(msg => {
                        const text = msg.textContent.trim();
                        if (text) {
                            errorMessage = text;
                            
                            // Tentar identificar o campo pelo texto da mensagem
                            if (text.includes('Descrição')) {
                                errorField = form.querySelector('#campaignDescription, [name="casual_description"], [name="route_description"]');
                            } else if (text.includes('Recebedor')) {
                                errorField = form.querySelector('#campaignRecebedor, [name="casual_recebedor"]');
                            } else if (text.includes('Data de Pagamento') || text.includes('Pagamento')) {
                                errorField = form.querySelector('#campaignDataPagamento, [name="casual_dataPagamento"], [name="route_dataPagamento"]');
                            }
                        }
                    });
                    
                    if (!errorMessage) {
                        errorMessage = 'Erro ao processar solicitação. Verifique os campos obrigatórios.';
                    }
                    
                    // Focar no campo com erro se encontrado
                    if (errorField) {
                        setTimeout(() => {
                            errorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            setTimeout(() => {
                                if (!errorField.disabled) {
                                    errorField.focus();
                                }
                            }, 300);
                        }, 100);
                        
                        // Mostrar erro no campo
                        const formGroup = errorField.closest('.form-group');
                        if (formGroup) {
                            formGroup.classList.add('error');
                            this.showFieldError(formGroup, errorMessage);
                        }
                    }
                    
                    // Mostrar notificação
                    if (typeof Utils !== 'undefined' && Utils.showNotification) {
                        Utils.showNotification(errorMessage, 'error');
                    }
                    
                    // GARANTIR que o modal permanece aberto após erro HTML
                    setTimeout(() => {
                        const modal = document.getElementById('createCampaignModal');
                        if (modal) {
                            modal.style.display = 'flex';
                            modal.classList.add('show');
                            document.body.style.overflow = 'hidden';
                            console.log('🛡️ Modal mantido aberto após erro HTML do backend');
                        }
                    }, 100);
                    
                    return; // Não fechar modal
                } else {
                    // Sucesso - redirecionar ou recarregar
                    if (typeof Utils !== 'undefined' && Utils.showNotification) {
                        Utils.showNotification('Solicitação criada com sucesso!', 'success');
                    }
                    if (window.modalManager) {
                        window.modalManager.closeModal();
                    }
                    setTimeout(() => {
                        window.location.reload();
                    }, 500);
                    return;
                }
            }
        } catch (error) {
            console.error('Erro ao enviar formulário:', error);
            if (typeof Utils !== 'undefined' && Utils.showNotification) {
                Utils.showNotification('Erro ao enviar solicitação: ' + error.message, 'error');
            }
            
            // GARANTIR que o modal permanece aberto em caso de erro de rede/exceção
            setTimeout(() => {
                const modal = document.getElementById('createCampaignModal');
                if (modal) {
                    modal.style.display = 'flex';
                    modal.classList.add('show');
                    document.body.style.overflow = 'hidden';
                    console.log('🛡️ Modal mantido aberto após erro de exceção');
                }
            }, 100);
        } finally {
            // Restaurar estado do botão
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
                submitBtn.innerHTML = originalHtml;
            }
            form.classList.remove('form-loading');
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

// Gerenciador específico para Kanban - REMOVIDO: agora está em kanban.js
// Todo o código da classe KanbanManager foi movido para kanban.js

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
                        <div class="column-content" data-column="pendente">
                            <div class="empty-column">
                                <i class="fas fa-inbox"></i>
                                <p>Nenhuma solicitação pendente</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="kanban-column" data-column="aprovado">
                        <div class="column-header">
                            <h3>Aprovado</h3>
                            <span class="card-count">0</span>
                        </div>
                        <div class="column-content" data-column="aprovado">
                            <div class="empty-column">
                                <i class="fas fa-inbox"></i>
                                <p>Nenhuma solicitação aprovada</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="kanban-column" data-column="recusado">
                        <div class="column-header">
                            <h3>Recusado</h3>
                            <span class="card-count">0</span>
                        </div>
                        <div class="column-content" data-column="recusado">
                            <div class="empty-column">
                                <i class="fas fa-inbox"></i>
                                <p>Nenhuma solicitação recusada</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="kanban-column" data-column="concluido">
                        <div class="column-header">
                            <h3>Concluído</h3>
                            <span class="card-count">0</span>
                        </div>
                        <div class="column-content" data-column="concluido">
                            <div class="empty-column">
                                <i class="fas fa-inbox"></i>
                                <p>Nenhuma solicitação concluída</p>
                            </div>
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
        
        // KanbanManager agora é inicializado pelo kanban.js
        // Não inicializar aqui para evitar conflito com a declaração em kanban.js
        console.log('APP.JS: KanbanManager será inicializado pelo kanban.js se necessário');
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
