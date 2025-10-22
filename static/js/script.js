// Sistema de Gestão Financeira - JavaScript
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
        this.setupScrollDetection();
    }

    setupEventListeners() {

        // Create campaign button
        const createCampaignBtn = document.getElementById('createCampaignBtn');
        const createCampaignModal = document.getElementById('createCampaignModal');
        
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
        const createCampaignForm = document.getElementById('createCampaignForm');
        createCampaignForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.createCampaign();
        });

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

        // Floating chat
        const floatingChat = document.getElementById('floatingChat');
        floatingChat?.addEventListener('click', () => {
            this.showChat();
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

        // Overlay click para fechar sidebar
        const overlay = document.getElementById('sidebarOverlay');
        overlay?.addEventListener('click', () => {
            const sidebar = document.getElementById('sidebar');
            sidebar.classList.add('collapsed');
            overlay.classList.remove('active');
        });

        // Resize listener para responsividade
        window.addEventListener('resize', () => {
            this.handleResize();
        });

        // Settings dropdown
        const settingsBtn = document.getElementById('settingsBtn');
        const settingsMenu = document.getElementById('settingsMenu');
        const settingsDropdown = document.querySelector('.settings-dropdown');
        
        settingsBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            settingsDropdown.classList.toggle('active');
        });

        // Fechar dropdown ao clicar fora
        document.addEventListener('click', (e) => {
            if (!settingsDropdown.contains(e.target)) {
                settingsDropdown.classList.remove('active');
            }
        });

        // Settings menu items
        const settingsItems = document.querySelectorAll('.settings-item');
        settingsItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const text = item.querySelector('span').textContent;
                this.handleSettingsAction(text);
                settingsDropdown.classList.remove('active');
            });
        });
    }

    loadInitialData() {
        // Dados iniciais dos cards
        this.cards = [
            {
                id: 'SF001',
                status: 'pending',
                title: 'Solicitação de reembolso de viagem',
                solicitante: 'Maria Silva',
                recebedor: 'Maria Silva',
                valor: 850.50,
                description: 'Reembolso de despesas de viagem a trabalho para São Paulo',
                dataPagamento: '2024-01-15',
                dataCriacao: '2024-01-10',
                anexos: [
                    { name: 'nota_fiscal.pdf', size: 245760, type: 'application/pdf' }
                ],
                tempoCriacao: '5 dias',
                tempoFila: '2 dias',
                priority: 'high',
                column: 'planning',
                stage: 'Solicitação pendente de análise',
                timeSpent: 0,
                // Campos legados para compatibilidade
                assignee: 'Maria Silva',
                email: 'maria@empresa.com'
            },
            {
                id: 'SF002',
                status: 'rejected',
                title: 'Compra de equipamentos de escritório',
                solicitante: 'João Santos',
                recebedor: 'João Santos',
                valor: 2500.00,
                description: 'Aquisição de computadores e impressoras para o departamento',
                dataPagamento: null,
                dataCriacao: '2024-01-08',
                anexos: [],
                tempoCriacao: '7 dias',
                tempoFila: '5 dias',
                priority: 'low',
                column: 'test',
                stage: 'Solicitação recusada - orçamento insuficiente',
                timeSpent: 0,
                // Campos legados para compatibilidade
                assignee: 'João Santos',
                email: 'joao@empresa.com'
            },
            {
                id: 'SF003',
                status: 'approved',
                title: 'Pagamento de fornecedor',
                solicitante: 'Ana Costa',
                recebedor: 'Fornecedor ABC Ltda',
                valor: 15000.00,
                description: 'Pagamento referente aos serviços de consultoria prestados no mês de dezembro, incluindo análise de processos e implementação de melhorias no sistema de gestão.',
                dataPagamento: '2024-01-20',
                dataCriacao: '2024-01-05',
                anexos: [
                    { name: 'contrato_consultoria.pdf', size: 1024000, type: 'application/pdf' },
                    { name: 'nota_fiscal.pdf', size: 512000, type: 'application/pdf' }
                ],
                tempoCriacao: '10 dias',
                tempoFila: '3 dias',
                priority: 'medium',
                column: 'launch',
                stage: 'Aprovado e em processamento',
                timeSpent: 0,
                dueDate: 'Abr, 4 • 2 anos atrás',
                overdue: true,
                // Campos legados para compatibilidade
                assignee: 'Ana Costa',
                email: 'ana@empresa.com'
            },
            {
                id: 5,
                title: 'Renovação de licenças de software',
                assignee: 'Paula Lima',
                email: 'paula@empresa.com',
                priority: 'medium',
                column: 'success',
                stage: 'Solicitação concluída com sucesso',
                timeSpent: 0,
                completed: true
            },
            {
                id: 6,
                title: 'Solicitação de compra de material',
                assignee: 'Carlos Oliveira',
                email: 'carlos@empresa.com',
                priority: 'medium',
                column: 'planning',
                stage: 'Aguardando aprovação do gestor',
                timeSpent: 0
            },
            {
                id: 7,
                title: 'Solicitação de investimento em tecnologia',
                assignee: 'Roberto Santos',
                email: 'roberto@empresa.com',
                priority: 'high',
                column: 'planning',
                stage: 'Análise de viabilidade em andamento',
                timeSpent: 0
            },
            {
                id: 8,
                title: 'Solicitação de treinamento',
                assignee: 'Fernanda Costa',
                email: 'fernanda@empresa.com',
                priority: 'low',
                column: 'planning',
                stage: 'Aguardando definição de orçamento',
                timeSpent: 0
            },
            {
                id: 9,
                title: 'Solicitação de manutenção de equipamentos',
                assignee: 'Pedro Lima',
                email: 'pedro@empresa.com',
                priority: 'medium',
                column: 'planning',
                stage: 'Aguardando orçamento do fornecedor',
                timeSpent: 0
            },
            {
                id: 10,
                title: 'Solicitação de atualização de software',
                assignee: 'Lucas Ferreira',
                email: 'lucas@empresa.com',
                priority: 'high',
                column: 'planning',
                stage: 'Aguardando aprovação técnica',
                timeSpent: 0
            },
            {
                id: 11,
                title: 'Solicitação de material de escritório',
                assignee: 'Carla Mendes',
                email: 'carla@empresa.com',
                priority: 'low',
                column: 'planning',
                stage: 'Aguardando definição de quantidade',
                timeSpent: 0
            },
            {
                id: 12,
                title: 'Solicitação de consultoria externa',
                assignee: 'Rafael Costa',
                email: 'rafael@empresa.com',
                priority: 'medium',
                column: 'planning',
                stage: 'Aguardando análise de viabilidade',
                timeSpent: 0
            }
        ];

        this.currentCardId = 3;
        this.updateCardCounts();
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

    moveCard(cardId, newColumn) {
        const card = this.cards.find(c => c.id == cardId);
        if (card) {
            card.column = newColumn;
            this.updateCardPosition(cardId, newColumn);
            this.updateCardCounts();
            this.checkAllScrollbars(); // Recalcular scrollbars
            this.showNotification(`Card movido para ${this.getColumnName(newColumn)}`, 'success');
        }
    }

    updateCardPosition(cardId, newColumn) {
        const card = document.querySelector(`[data-card-id="${cardId}"]`);
        const newColumnElement = document.querySelector(`[data-column="${newColumn}"]`);
        
        if (card && newColumnElement) {
            newColumnElement.appendChild(card);
        }
    }

    getColumnName(column) {
        const names = {
            'planning': 'Pendente',
            'test': 'Recusado',
            'launch': 'Aprovado',
            'success': 'Concluído'
        };
        return names[column] || column;
    }

    setupModal() {
        // Modal já configurado nos event listeners
    }

    toggleSidebarOverlay() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        
        if (window.innerWidth <= 768) {
            if (sidebar.classList.contains('collapsed')) {
                overlay?.classList.remove('active');
            } else {
                overlay?.classList.add('active');
            }
        }
    }

    handleResize() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        
        if (window.innerWidth > 768) {
            // Desktop: remover overlay e resetar sidebar
            sidebar.classList.remove('collapsed');
            overlay?.classList.remove('active');
        } else {
            // Mobile: garantir que sidebar esteja fechada por padrão
            if (!sidebar.classList.contains('collapsed')) {
                sidebar.classList.add('collapsed');
            }
            overlay?.classList.remove('active');
        }
        
        // Recalcular scrollbars após resize
        this.checkAllScrollbars();
    }

    handleSettingsAction(action) {
        switch(action) {
            case 'Gerenciar membros':
                // Abrir modal de gerenciamento de membros
                if (window.membersManager) {
                    window.membersManager.showManageMembersModal();
                } else {
                    this.showNotification('Sistema de membros não inicializado', 'error');
                }
                break;
            case 'Equipe':
                this.showNotification('Abrindo configurações de equipe...', 'info');
                break;
            case 'Permissões':
                this.showNotification('Abrindo configurações de permissões...', 'info');
                break;
            case 'Configurações gerais':
                this.showNotification('Abrindo configurações gerais...', 'info');
                break;
            default:
                this.showNotification(`Ação: ${action}`, 'info');
        }
    }

    setupScrollDetection() {
        this.checkAllScrollbars();
        
        // Observer para mudanças no conteúdo
        const observer = new MutationObserver(() => {
            this.checkAllScrollbars();
        });
        
        // Observar mudanças em todas as colunas
        document.querySelectorAll('.column-content').forEach(column => {
            observer.observe(column, { 
                childList: true, 
                subtree: true,
                attributes: true,
                attributeFilter: ['style', 'class']
            });
        });
    }

    checkAllScrollbars() {
        document.querySelectorAll('.column-content').forEach(column => {
            this.checkScrollbar(column);
        });
    }

    checkScrollbar(column) {
        const hasScroll = column.scrollHeight > column.clientHeight;
        column.setAttribute('data-scrollable', hasScroll);
        
        // Adicionar classe para animação suave
        if (hasScroll) {
            column.classList.add('has-scroll');
        } else {
            column.classList.remove('has-scroll');
        }
    }

    showModal() {
        const modal = document.getElementById('createCampaignModal');
        modal?.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        // Preencher campos automáticos
        this.populateAutoFields();
    }

    populateAutoFields() {
        const now = new Date();
        const currentDate = now.toISOString().split('T')[0];
        
        // Limpar campo ID para o usuário preencher
        document.getElementById('campaignId').value = '';
        
        // Definir data de criação
        document.getElementById('campaignDataCriacao').value = currentDate;
        
        // Calcular tempo de criação
        const tempoCriacao = this.calculateCreationTime(now);
        document.getElementById('campaignTempoCriacao').value = tempoCriacao;
        
        // Tempo na fila inicia em 0
        document.getElementById('campaignTempoFila').value = '0 dias';
    }

    hideModal() {
        const modal = document.getElementById('createCampaignModal');
        modal?.classList.remove('show');
        document.body.style.overflow = 'auto';
        this.clearForm();
    }

    clearForm() {
        const form = document.getElementById('createCampaignForm');
        form?.reset();
    }

    createCampaign() {
        const form = document.getElementById('createCampaignForm');
        const formData = new FormData(form);
        
        const cardId = formData.get('id');
        
        // Validar se o ID foi preenchido
        if (!cardId || cardId.trim() === '') {
            this.showNotification('Por favor, preencha o campo ID com o código do sistema externo.', 'error');
            return;
        }
        
        // Verificar se o ID já existe (apenas para novos cards)
        const isEditing = this.cards.find(c => c.id === cardId);
        if (!isEditing && this.cards.find(c => c.id === cardId)) {
            this.showNotification('Este ID já existe. Por favor, use um ID único.', 'error');
            return;
        }
        
        // Data atual
        const now = new Date();
        const currentDate = now.toISOString().split('T')[0];
        
        // Obter dados do serviço selecionado
        const serviceId = formData.get('service');
        const selectedService = window.servicesManager?.services.find(s => s.id == serviceId);
        
        const cardData = {
            id: cardId,
            status: formData.get('status'),
            title: formData.get('title'),
            solicitante: formData.get('solicitante'),
            recebedor: formData.get('recebedor'),
            valor: parseFloat(formData.get('valor')) || 0,
            description: formData.get('description'),
            service: selectedService ? selectedService.name : formData.get('service'),
            serviceId: serviceId,
            dataPagamento: formData.get('dataPagamento'),
            dataCriacao: isEditing ? isEditing.dataCriacao : currentDate,
            anexos: this.handleFileUpload(formData.getAll('anexos')),
            tempoCriacao: isEditing ? isEditing.tempoCriacao : this.calculateCreationTime(now),
            tempoFila: isEditing ? isEditing.tempoFila : '0 dias',
            priority: formData.get('priority'),
            column: formData.get('column'),
            stage: this.getStageDescription(formData.get('column')),
            timeSpent: isEditing ? isEditing.timeSpent : 0,
            // Campos legados para compatibilidade
            assignee: formData.get('solicitante'),
            email: `${formData.get('solicitante').toLowerCase().replace(/\s+/g, '.')}@empresa.com`
        };

        if (isEditing) {
            // Atualizar card existente
            const cardIndex = this.cards.findIndex(c => c.id === cardId);
            this.cards[cardIndex] = cardData;
            this.updateExistingCard(cardData);
            this.showNotification('Solicitação financeira atualizada com sucesso!', 'success');
        } else {
            // Criar novo card
            this.cards.push(cardData);
            this.addCardToColumn(cardData);
            this.showNotification('Solicitação financeira criada com sucesso!', 'success');
        }
        
        this.updateCardCounts();
        this.checkAllScrollbars(); // Recalcular scrollbars
        this.hideModal();
    }

    updateExistingCard(cardData) {
        // Remover card existente do DOM
        const existingCard = document.querySelector(`[data-card-id="${cardData.id}"]`);
        if (existingCard) {
            existingCard.remove();
        }
        
        // Adicionar card atualizado
        this.addCardToColumn(cardData);
    }

    generateUniqueId() {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000);
        return `SF${timestamp}${random}`;
    }

    handleFileUpload(files) {
        const fileList = [];
        files.forEach(file => {
            if (file && file.name) {
                fileList.push({
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    lastModified: file.lastModified
                });
            }
        });
        return fileList;
    }

    calculateCreationTime(date) {
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return `${diffDays} dias`;
    }

    getStatusText(status) {
        const statusTexts = {
            'pending': 'Pendente',
            'approved': 'Aprovado',
            'rejected': 'Recusado',
            'completed': 'Concluído'
        };
        return statusTexts[status] || 'Pendente';
    }

    getServiceText(service) {
        const serviceTexts = {
            'consultoria': 'Consultoria',
            'desenvolvimento': 'Desenvolvimento',
            'manutencao': 'Manutenção',
            'treinamento': 'Treinamento',
            'suporte': 'Suporte Técnico',
            'infraestrutura': 'Infraestrutura',
            'marketing': 'Marketing',
            'outros': 'Outros'
        };
        return serviceTexts[service] || 'Não especificado';
    }

    formatAttachmentsList(anexos) {
        if (!anexos || anexos.length === 0) return '';
        
        return anexos.map(anexo => `
            <div class="attachment-item">
                <i class="fas fa-file"></i>
                <span class="attachment-name">${anexo.name}</span>
                <span class="attachment-size">${this.formatFileSize(anexo.size)}</span>
            </div>
        `).join('');
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    getStageDescription(column) {
        const descriptions = {
            'planning': 'Solicitação pendente de análise',
            'test': 'Solicitação recusada - orçamento insuficiente',
            'launch': 'Aprovado e em processamento',
            'success': 'Solicitação concluída com sucesso'
        };
        return descriptions[column] || '';
    }

    addCardToColumn(card) {
        const column = document.querySelector(`[data-column="${card.column}"]`);
        if (column) {
            const cardElement = this.createCardElement(card);
            column.appendChild(cardElement);
            this.setupCardEventListeners(cardElement);
        }
    }

    createCardElement(card) {
        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        cardElement.draggable = true;
        cardElement.dataset.cardId = card.id;

        const priorityClass = card.priority === 'high' ? 'high' : 
                            card.priority === 'medium' ? 'medium' : 'low';
        
        const priorityText = card.priority === 'high' ? 'Alta' : 
                           card.priority === 'medium' ? 'Média' : 'Baixa';

        // Formatar valor monetário
        const valorFormatado = card.valor ? `R$ ${card.valor.toLocaleString('pt-BR', {minimumFractionDigits: 2})}` : 'R$ 0,00';
        
        // Formatar data
        const dataCriacaoFormatada = card.dataCriacao ? new Date(card.dataCriacao).toLocaleDateString('pt-BR') : 'N/A';
        
        // Contar anexos
        const anexosCount = card.anexos ? card.anexos.length : 0;

        cardElement.innerHTML = `
            <div class="card-header">
                <div class="card-header-top">
                    <span class="priority ${priorityClass}">${priorityText}</span>
                    <span class="card-id">#${card.id}</span>
                </div>
                <div class="card-status">
                    <span class="status-badge status-${card.status || 'pending'}">${this.getStatusText(card.status)}</span>
                </div>
            </div>
            <div class="card-body">
                <h3 class="card-title">${card.title || 'Sem título'}</h3>
                
                <!-- Informações Principais -->
                <div class="card-section">
                    <h4 class="section-title">Informações Principais</h4>
                    <div class="info-grid">
                        <div class="info-item">
                            <i class="fas fa-user"></i>
                            <div class="info-content">
                                <span class="info-label">Solicitante</span>
                                <span class="info-value">${card.solicitante || card.assignee || 'N/A'}</span>
                            </div>
                        </div>
                        
                        <div class="info-item">
                            <i class="fas fa-user-check"></i>
                            <div class="info-content">
                                <span class="info-label">Recebedor</span>
                                <span class="info-value">${card.recebedor || 'N/A'}</span>
                            </div>
                        </div>
                        
                        <div class="info-item valor-item">
                            <i class="fas fa-dollar-sign"></i>
                            <div class="info-content">
                                <span class="info-label">Valor</span>
                                <span class="info-value valor">${valorFormatado}</span>
                            </div>
                        </div>
                        
                        <div class="info-item">
                            <i class="fas fa-flag"></i>
                            <div class="info-content">
                                <span class="info-label">Status</span>
                                <span class="info-value status-${card.status || 'pending'}">${this.getStatusText(card.status)}</span>
                            </div>
                        </div>
                        
                        <div class="info-item">
                            <i class="fas fa-cogs"></i>
                            <div class="info-content">
                                <span class="info-label">Serviço</span>
                                <span class="info-value">${this.getServiceText(card.service)}</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Datas e Tempos -->
                <div class="card-section">
                    <h4 class="section-title">Datas e Tempos</h4>
                    <div class="info-grid">
                        <div class="info-item">
                            <i class="fas fa-calendar-alt"></i>
                            <div class="info-content">
                                <span class="info-label">Data Criação</span>
                                <span class="info-value">${dataCriacaoFormatada}</span>
                            </div>
                        </div>
                        
                        <div class="info-item">
                            <i class="fas fa-calendar-check"></i>
                            <div class="info-content">
                                <span class="info-label">Data Pagamento</span>
                                <span class="info-value">${card.dataPagamento ? new Date(card.dataPagamento).toLocaleDateString('pt-BR') : 'N/A'}</span>
                            </div>
                        </div>
                        
                        <div class="info-item">
                            <i class="fas fa-clock"></i>
                            <div class="info-content">
                                <span class="info-label">Tempo Criação</span>
                                <span class="info-value">${card.tempoCriacao || '0 dias'}</span>
                            </div>
                        </div>
                        
                        <div class="info-item">
                            <i class="fas fa-hourglass-half"></i>
                            <div class="info-content">
                                <span class="info-label">Tempo na Fila</span>
                                <span class="info-value">${card.tempoFila || '0 dias'}</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Anexos -->
                <div class="card-section">
                    <h4 class="section-title">Anexos</h4>
                    <div class="attachments-info">
                        <i class="fas fa-paperclip"></i>
                        <span class="attachments-count">${anexosCount} arquivo(s) anexado(s)</span>
                        ${anexosCount > 0 ? `<div class="attachments-list">${this.formatAttachmentsList(card.anexos)}</div>` : ''}
                    </div>
                </div>
                
                <!-- Descrição -->
                <div class="card-section">
                    <h4 class="section-title">Descrição</h4>
                    <div class="description-content">
                        <p class="description-text">${card.description || 'Sem descrição'}</p>
                    </div>
                </div>
            </div>
            <div class="card-footer">
                <span class="card-stage">${card.stage}</span>
            </div>
        `;

        return cardElement;
    }

    setupCardEventListeners(cardElement) {
        cardElement.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', cardElement.dataset.cardId);
            cardElement.classList.add('dragging');
        });

        cardElement.addEventListener('dragend', (e) => {
            cardElement.classList.remove('dragging');
        });

        // Double click to edit
        cardElement.addEventListener('dblclick', () => {
            this.editCard(cardElement.dataset.cardId);
        });
    }

    editCard(cardId) {
        const card = this.cards.find(c => c.id == cardId);
        if (card) {
            // Preencher o formulário com dados existentes
            document.getElementById('campaignId').value = card.id;
            document.getElementById('campaignTitle').value = card.title || '';
            document.getElementById('campaignSolicitante').value = card.solicitante || card.assignee || '';
            document.getElementById('campaignRecebedor').value = card.recebedor || '';
            document.getElementById('campaignValor').value = card.valor || 0;
            document.getElementById('campaignDescription').value = card.description || '';
            
            // Preencher campo de serviço
            if (card.serviceId) {
                document.getElementById('campaignService').value = card.serviceId;
            } else if (card.service) {
                // Fallback para compatibilidade com dados antigos
                const service = window.servicesManager?.services.find(s => s.name === card.service);
                if (service) {
                    document.getElementById('campaignService').value = service.id;
                }
            }
            
            document.getElementById('campaignDataPagamento').value = card.dataPagamento || '';
            document.getElementById('campaignDataCriacao').value = card.dataCriacao || '';
            document.getElementById('campaignTempoCriacao').value = card.tempoCriacao || '0 dias';
            document.getElementById('campaignTempoFila').value = card.tempoFila || '0 dias';
            document.getElementById('campaignPriority').value = card.priority || 'medium';
            document.getElementById('campaignColumn').value = card.column || 'planning';
            
            this.showModal();
        }
    }

    updateCardCounts() {
        const columns = ['planning', 'test', 'launch', 'analysis', 'success'];
        
        columns.forEach(column => {
            const count = this.cards.filter(card => card.column === column).length;
            const countElement = document.querySelector(`[data-column="${column}"] .card-count`);
            if (countElement) {
                countElement.textContent = count;
            }
        });
    }

    switchView(view) {
        // Remove active class from all tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Add active class to clicked tab
        document.querySelector(`[data-view="${view}"]`)?.classList.add('active');

        // Show/hide content based on view
        const kanbanBoard = document.getElementById('kanbanBoard');
        
        switch(view) {
            case 'kanban':
                kanbanBoard.style.display = 'flex';
                break;
            case 'reports':
                kanbanBoard.style.display = 'none';
                this.showReports();
                break;
            case 'dashboard':
                kanbanBoard.style.display = 'none';
                this.showDashboard();
                break;
        }
    }

    showReports() {
        // Implementar relatórios
        console.log('Mostrando relatórios...');
    }

    showDashboard() {
        // Implementar dashboard
        console.log('Mostrando dashboard...');
    }

    showAddCardModal(column) {
        // Pre-selecionar a coluna
        document.getElementById('campaignColumn').value = column;
        this.showModal();
    }

    showChat() {
        alert('Chat em desenvolvimento! Em breve você poderá conversar com nossa equipe de suporte financeiro.');
    }

    showNotification(message, type = 'info') {
        // Criar elemento de notificação
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Estilos da notificação
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#3498db'};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            z-index: 3000;
            animation: slideIn 0.3s ease;
        `;

        // Adicionar animação CSS
        const style = document.createElement('style');
        style.textContent = `
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

    // Métodos para funcionalidades avançadas
    searchCards(query) {
        const cards = document.querySelectorAll('.card');
        cards.forEach(card => {
            const title = card.querySelector('.card-title').textContent.toLowerCase();
            const assignee = card.querySelector('.assignee-name').textContent.toLowerCase();
            const email = card.querySelector('.assignee-email').textContent.toLowerCase();
            
            const matches = title.includes(query.toLowerCase()) || 
                          assignee.includes(query.toLowerCase()) || 
                          email.includes(query.toLowerCase());
            
            card.style.display = matches ? 'block' : 'none';
        });
    }

    filterByPriority(priority) {
        const cards = document.querySelectorAll('.card');
        cards.forEach(card => {
            const cardPriority = card.querySelector('.priority').textContent.toLowerCase();
            const matches = priority === 'all' || cardPriority === priority;
            card.style.display = matches ? 'block' : 'none';
        });
    }

    exportData() {
        const data = {
            cards: this.cards,
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `campanhas-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    importData(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (data.cards && Array.isArray(data.cards)) {
                    this.cards = data.cards;
                    this.reloadCards();
                    this.showNotification('Dados importados com sucesso!', 'success');
                } else {
                    this.showNotification('Formato de arquivo inválido!', 'error');
                }
            } catch (error) {
                this.showNotification('Erro ao importar dados!', 'error');
            }
        };
        reader.readAsText(file);
    }

    reloadCards() {
        // Limpar colunas
        document.querySelectorAll('.column-content').forEach(column => {
            column.innerHTML = '';
        });

        // Recriar cards
        this.cards.forEach(card => {
            this.addCardToColumn(card);
        });

        this.updateCardCounts();
    }
}

// Classe para gerenciamento de membros
class MembersManager {
    constructor() {
        this.members = {
            superuser: [
                { id: 1, name: 'Admin Principal', email: 'admin@empresa.com', role: 'Administrador', permissions: ['view', 'create', 'edit', 'delete', 'approve', 'admin'] }
            ],
            financeiro: [
                { id: 2, name: 'João Silva', email: 'joao.financeiro@empresa.com', role: 'Gerente Financeiro', permissions: ['view', 'create', 'edit', 'approve'] },
                { id: 3, name: 'Maria Santos', email: 'maria.financeiro@empresa.com', role: 'Analista Financeiro', permissions: ['view', 'create', 'edit'] }
            ],
            solicitantes: [
                { id: 4, name: 'Carlos Oliveira', email: 'carlos@empresa.com', role: 'Solicitante', permissions: ['view', 'create'] },
                { id: 5, name: 'Ana Costa', email: 'ana@empresa.com', role: 'Solicitante', permissions: ['view', 'create'] }
            ]
        };
        this.currentMemberId = 6;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderMembers();
    }

    setupEventListeners() {
        // Abrir modal de gerenciar membros
        const manageMembersLink = document.querySelector('a[href="#"] span');
        if (manageMembersLink && manageMembersLink.textContent.includes('Gerenciar membros')) {
            manageMembersLink.closest('a').addEventListener('click', (e) => {
                e.preventDefault();
                this.showManageMembersModal();
            });
        }

        // Botões de adicionar membro
        document.addEventListener('click', (e) => {
            if (e.target.closest('.btn-add-member')) {
                const sector = e.target.closest('.btn-add-member').dataset.sector;
                this.showAddMemberModal(sector);
            }
        });

        // Botões de editar membro
        document.addEventListener('click', (e) => {
            if (e.target.closest('.btn-edit')) {
                const memberItem = e.target.closest('.member-item');
                const memberId = parseInt(memberItem.dataset.memberId);
                this.editMember(memberId);
            }
        });

        // Botões de remover membro
        document.addEventListener('click', (e) => {
            if (e.target.closest('.btn-remove')) {
                const memberItem = e.target.closest('.member-item');
                const memberId = parseInt(memberItem.dataset.memberId);
                this.removeMember(memberId);
            }
        });

        // Fechar modais
        document.getElementById('closeMembersModal')?.addEventListener('click', () => {
            this.hideManageMembersModal();
        });

        document.getElementById('closeAddMemberModal')?.addEventListener('click', () => {
            this.hideAddMemberModal();
        });

        document.getElementById('cancelAddMember')?.addEventListener('click', () => {
            this.hideAddMemberModal();
        });

        // Formulário de adicionar membro
        document.getElementById('addMemberForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveMember();
        });
    }

    showManageMembersModal() {
        const modal = document.getElementById('manageMembersModal');
        if (modal) {
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
            this.renderMembers();
        }
    }

    hideManageMembersModal() {
        const modal = document.getElementById('manageMembersModal');
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = 'auto';
        }
    }

    showAddMemberModal(sector = null) {
        const modal = document.getElementById('addMemberModal');
        const form = document.getElementById('addMemberForm');
        const title = document.getElementById('addMemberTitle');
        
        if (modal && form) {
            // Limpar formulário
            form.reset();
            
            // Definir setor se fornecido
            if (sector) {
                document.getElementById('memberSector').value = sector;
            }
            
            // Configurar título
            title.textContent = 'Adicionar Membro';
            
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    }

    hideAddMemberModal() {
        const modal = document.getElementById('addMemberModal');
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = 'auto';
        }
    }

    renderMembers() {
        // Renderizar membros do SuperUser
        this.renderSectorMembers('superuser', this.members.superuser);
        
        // Renderizar membros do Financeiro
        this.renderSectorMembers('financeiro', this.members.financeiro);
        
        // Renderizar membros dos Solicitantes
        this.renderSectorMembers('solicitantes', this.members.solicitantes);
    }

    renderSectorMembers(sector, members) {
        const container = document.getElementById(`${sector}-members`);
        if (!container) return;

        container.innerHTML = '';
        
        members.forEach(member => {
            const memberElement = this.createMemberElement(member);
            container.appendChild(memberElement);
        });
    }

    createMemberElement(member) {
        const memberDiv = document.createElement('div');
        memberDiv.className = 'member-item';
        memberDiv.dataset.memberId = member.id;
        
        const sector = this.getMemberSector(member.id);
        const iconClass = this.getSectorIcon(sector);
        
        memberDiv.innerHTML = `
            <div class="member-info">
                <div class="member-avatar">
                    <i class="${iconClass}"></i>
                </div>
                <div class="member-details">
                    <span class="member-name">${member.name}</span>
                    <span class="member-email">${member.email}</span>
                </div>
            </div>
            <div class="member-actions">
                <button class="btn-edit" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-remove" title="Remover">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        return memberDiv;
    }

    getMemberSector(memberId) {
        for (const [sector, members] of Object.entries(this.members)) {
            if (members.find(m => m.id === memberId)) {
                return sector;
            }
        }
        return 'solicitantes';
    }

    getSectorIcon(sector) {
        const icons = {
            superuser: 'fas fa-user-shield',
            financeiro: 'fas fa-user-tie',
            solicitantes: 'fas fa-user'
        };
        return icons[sector] || 'fas fa-user';
    }

    saveMember() {
        const form = document.getElementById('addMemberForm');
        const formData = new FormData(form);
        
        const member = {
            id: this.currentMemberId++,
            name: formData.get('name'),
            email: formData.get('email'),
            role: formData.get('role') || '',
            permissions: formData.getAll('permissions')
        };
        
        const sector = formData.get('sector');
        this.members[sector].push(member);
        
        this.renderMembers();
        this.hideAddMemberModal();
        this.showNotification('Membro adicionado com sucesso!', 'success');
    }

    editMember(memberId) {
        const member = this.findMember(memberId);
        if (!member) return;
        
        const form = document.getElementById('addMemberForm');
        const title = document.getElementById('addMemberTitle');
        
        // Preencher formulário com dados do membro
        document.getElementById('memberName').value = member.name;
        document.getElementById('memberEmail').value = member.email;
        document.getElementById('memberRole').value = member.role || '';
        
        // Definir setor
        const sector = this.getMemberSector(memberId);
        document.getElementById('memberSector').value = sector;
        
        // Marcar permissões
        document.querySelectorAll('input[name="permissions"]').forEach(checkbox => {
            checkbox.checked = member.permissions.includes(checkbox.value);
        });
        
        // Configurar título
        title.textContent = 'Editar Membro';
        
        // Armazenar ID do membro para edição
        form.dataset.editingMemberId = memberId;
        
        this.showAddMemberModal();
    }

    removeMember(memberId) {
        if (confirm('Tem certeza que deseja remover este membro?')) {
            const sector = this.getMemberSector(memberId);
            this.members[sector] = this.members[sector].filter(m => m.id !== memberId);
            this.renderMembers();
            this.showNotification('Membro removido com sucesso!', 'success');
        }
    }

    findMember(memberId) {
        for (const members of Object.values(this.members)) {
            const member = members.find(m => m.id === memberId);
            if (member) return member;
        }
        return null;
    }

    showNotification(message, type = 'info') {
        // Implementar notificação (pode usar a mesma função do CampaignManager)
        console.log(`${type.toUpperCase()}: ${message}`);
    }
}

// Classe para gerenciamento de serviços
class ServicesManager {
    constructor() {
        this.services = [
            {
                id: 1,
                name: 'Consultoria em TI',
                description: 'Serviços de consultoria especializada em tecnologia da informação',
                category: 'consultoria',
                icon: 'fas fa-user-tie',
                active: true
            },
            {
                id: 2,
                name: 'Desenvolvimento de Software',
                description: 'Desenvolvimento de aplicações e sistemas personalizados',
                category: 'desenvolvimento',
                icon: 'fas fa-code',
                active: true
            },
            {
                id: 3,
                name: 'Manutenção de Equipamentos',
                description: 'Manutenção preventiva e corretiva de equipamentos',
                category: 'manutencao',
                icon: 'fas fa-tools',
                active: true
            },
            {
                id: 4,
                name: 'Treinamento Corporativo',
                description: 'Cursos e capacitação profissional para equipes',
                category: 'treinamento',
                icon: 'fas fa-graduation-cap',
                active: true
            }
        ];
        this.currentServiceId = 5;
        this.init();
    }

    init() {
        console.log('ServicesManager initializing...');
        this.setupEventListeners();
        this.renderServices();
        this.updateServiceDropdown();
        console.log('ServicesManager initialized successfully');
    }

    setupEventListeners() {
        // Abrir modal de gerenciar serviços
        const servicesLink = document.getElementById('servicesNavLink');
        if (servicesLink) {
            servicesLink.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Serviços link clicked!');
                this.showManageServicesModal();
            });
        } else {
            console.log('Services link not found!');
        }

        // Botão adicionar serviço
        document.getElementById('addServiceBtn')?.addEventListener('click', () => {
            this.showAddServiceModal();
        });

        // Fechar modais
        document.getElementById('closeServicesModal')?.addEventListener('click', () => {
            this.hideManageServicesModal();
        });

        document.getElementById('closeAddServiceModal')?.addEventListener('click', () => {
            this.hideAddServiceModal();
        });

        document.getElementById('cancelAddService')?.addEventListener('click', () => {
            this.hideAddServiceModal();
        });

        // Formulário de adicionar serviço
        document.getElementById('addServiceForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveService();
        });

        // Event listeners para ações dos serviços
        document.addEventListener('click', (e) => {
            if (e.target.closest('.btn-edit-service')) {
                const serviceItem = e.target.closest('.service-item');
                const serviceId = parseInt(serviceItem.dataset.serviceId);
                this.editService(serviceId);
            }
        });

        document.addEventListener('click', (e) => {
            if (e.target.closest('.btn-remove-service')) {
                const serviceItem = e.target.closest('.service-item');
                const serviceId = parseInt(serviceItem.dataset.serviceId);
                this.removeService(serviceId);
            }
        });
    }

    showManageServicesModal() {
        console.log('showManageServicesModal called');
        const modal = document.getElementById('manageServicesModal');
        if (modal) {
            console.log('Modal found, showing...');
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
            this.renderServices();
        } else {
            console.log('Modal not found!');
        }
    }

    hideManageServicesModal() {
        const modal = document.getElementById('manageServicesModal');
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = 'auto';
        }
    }

    showAddServiceModal() {
        const modal = document.getElementById('addServiceModal');
        const form = document.getElementById('addServiceForm');
        const title = document.getElementById('addServiceTitle');
        
        if (modal && form) {
            form.reset();
            title.textContent = 'Adicionar Serviço';
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    }

    hideAddServiceModal() {
        const modal = document.getElementById('addServiceModal');
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = 'auto';
        }
    }

    renderServices() {
        const container = document.getElementById('servicesList');
        if (!container) return;

        container.innerHTML = '';
        
        this.services.forEach(service => {
            const serviceElement = this.createServiceElement(service);
            container.appendChild(serviceElement);
        });
    }

    createServiceElement(service) {
        const serviceDiv = document.createElement('div');
        serviceDiv.className = 'service-item';
        serviceDiv.dataset.serviceId = service.id;
        
        serviceDiv.innerHTML = `
            <div class="service-info">
                <div class="service-icon">
                    <i class="${service.icon}"></i>
                </div>
                <div class="service-details">
                    <div class="service-name">${service.name}</div>
                    <div class="service-description">${service.description}</div>
                    <div class="service-category">${service.category}</div>
                </div>
            </div>
            <div class="service-status">
                <span class="status-badge ${service.active ? 'active' : 'inactive'}">
                    ${service.active ? 'Ativo' : 'Inativo'}
                </span>
            </div>
            <div class="service-actions">
                <button class="btn-edit-service" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-remove-service" title="Remover">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        return serviceDiv;
    }

    saveService() {
        const form = document.getElementById('addServiceForm');
        const formData = new FormData(form);
        
        const service = {
            id: this.currentServiceId++,
            name: formData.get('name'),
            description: formData.get('description'),
            category: formData.get('category'),
            icon: formData.get('icon'),
            active: formData.get('active') === 'true'
        };
        
        this.services.push(service);
        this.renderServices();
        this.updateServiceDropdown();
        this.hideAddServiceModal();
        this.showNotification('Serviço adicionado com sucesso!', 'success');
    }

    editService(serviceId) {
        const service = this.services.find(s => s.id === serviceId);
        if (!service) return;
        
        const form = document.getElementById('addServiceForm');
        const title = document.getElementById('addServiceTitle');
        
        // Preencher formulário
        document.getElementById('serviceName').value = service.name;
        document.getElementById('serviceDescription').value = service.description;
        document.getElementById('serviceCategory').value = service.category;
        document.getElementById('serviceIcon').value = service.icon;
        document.getElementById('serviceActive').value = service.active.toString();
        
        title.textContent = 'Editar Serviço';
        form.dataset.editingServiceId = serviceId;
        
        this.showAddServiceModal();
    }

    removeService(serviceId) {
        if (confirm('Tem certeza que deseja remover este serviço?')) {
            this.services = this.services.filter(s => s.id !== serviceId);
            this.renderServices();
            this.updateServiceDropdown();
            this.showNotification('Serviço removido com sucesso!', 'success');
        }
    }

    updateServiceDropdown() {
        const select = document.getElementById('campaignService');
        if (!select) return;

        // Limpar opções existentes (exceto a primeira)
        while (select.children.length > 1) {
            select.removeChild(select.lastChild);
        }

        // Adicionar serviços ativos
        this.services
            .filter(service => service.active)
            .forEach(service => {
                const option = document.createElement('option');
                option.value = service.id;
                option.textContent = service.name;
                select.appendChild(option);
            });
    }

    showNotification(message, type = 'info') {
        console.log(`${type.toUpperCase()}: ${message}`);
    }
}

// Classe para gerenciamento de relatórios
class ReportsManager {
    constructor() {
        this.currentFilter = 'all';
        this.sortColumn = null;
        this.sortDirection = 'asc';
        this.filteredData = [];
        this.init();
    }

    init() {
        console.log('ReportsManager initializing...');
        this.setupEventListeners();
        this.populateServiceFilter();
        this.loadReportsData();
        console.log('ReportsManager initialized successfully');
    }

    setupEventListeners() {
        // Abrir modal de relatórios
        const reportsLink = document.getElementById('reportsNavLink');
        if (reportsLink) {
            reportsLink.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Relatórios link clicked!');
                this.showReportsModal();
            });
        } else {
            console.log('Reports link not found!');
        }

        // Fechar modal
        document.getElementById('closeReportsModal')?.addEventListener('click', () => {
            this.hideReportsModal();
        });

        // Botão voltar
        document.getElementById('backToDashboard')?.addEventListener('click', () => {
            this.hideReportsModal();
        });

        // Fechar dropdowns ao clicar fora
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.action-buttons')) {
                document.querySelectorAll('.action-dropdown').forEach(dropdown => {
                    dropdown.classList.remove('show');
                });
            }
        });

        // Filtros de status
        document.querySelectorAll('.status-filter').forEach(button => {
            button.addEventListener('click', (e) => {
                this.setActiveFilter(e.target.closest('.status-filter'));
            });
        });

        // Filtros avançados
        document.getElementById('applyFilters')?.addEventListener('click', () => {
            this.applyFilters();
        });

        document.getElementById('clearFilters')?.addEventListener('click', () => {
            this.clearFilters();
        });

        // Busca em tempo real
        document.getElementById('searchInput')?.addEventListener('input', (e) => {
            this.searchReports(e.target.value);
        });

        // Ordenação de colunas
        document.querySelectorAll('.sortable').forEach(th => {
            th.addEventListener('click', (e) => {
                this.sortTable(e.target.closest('th').dataset.column);
            });
        });

        // Exportação
        document.getElementById('exportExcel')?.addEventListener('click', () => {
            this.exportToExcel();
        });

        document.getElementById('exportPDF')?.addEventListener('click', () => {
            this.exportToPDF();
        });
    }

    showReportsModal() {
        console.log('showReportsModal called');
        const modal = document.getElementById('reportsModal');
        if (modal) {
            console.log('Modal found, showing...');
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
            this.loadReportsData();
        } else {
            console.log('Modal not found!');
        }
    }

    hideReportsModal() {
        const modal = document.getElementById('reportsModal');
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = 'auto';
        }
    }

    populateServiceFilter() {
        const serviceFilter = document.getElementById('serviceFilter');
        if (!serviceFilter || !window.servicesManager) return;

        // Limpar opções existentes (exceto a primeira)
        while (serviceFilter.children.length > 1) {
            serviceFilter.removeChild(serviceFilter.lastChild);
        }

        // Adicionar serviços ativos
        window.servicesManager.services
            .filter(service => service.active)
            .forEach(service => {
                const option = document.createElement('option');
                option.value = service.name;
                option.textContent = service.name;
                serviceFilter.appendChild(option);
            });
    }

    loadReportsData() {
        if (!window.campaignManager) return;
        
        this.filteredData = [...window.campaignManager.cards];
        this.renderTable();
        this.updateTableInfo();
    }

    setActiveFilter(button) {
        // Remover classe active de todos os botões
        document.querySelectorAll('.status-filter').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Adicionar classe active ao botão clicado
        button.classList.add('active');
        
        // Aplicar filtro
        this.currentFilter = button.dataset.status;
        this.applyStatusFilter();
    }

    applyStatusFilter() {
        if (this.currentFilter === 'all') {
            this.filteredData = [...window.campaignManager.cards];
        } else {
            this.filteredData = window.campaignManager.cards.filter(card => 
                card.status === this.currentFilter
            );
        }
        
        this.renderTable();
        this.updateTableInfo();
    }

    applyFilters() {
        const dateFrom = document.getElementById('dateFrom').value;
        const dateTo = document.getElementById('dateTo').value;
        const serviceFilter = document.getElementById('serviceFilter').value;
        const searchTerm = document.getElementById('searchInput').value;

        let filtered = [...window.campaignManager.cards];

        // Filtro por status
        if (this.currentFilter !== 'all') {
            filtered = filtered.filter(card => card.status === this.currentFilter);
        }

        // Filtro por data
        if (dateFrom) {
            filtered = filtered.filter(card => card.dataCriacao >= dateFrom);
        }
        if (dateTo) {
            filtered = filtered.filter(card => card.dataCriacao <= dateTo);
        }

        // Filtro por serviço
        if (serviceFilter) {
            filtered = filtered.filter(card => card.service === serviceFilter);
        }

        // Filtro por busca
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(card => 
                card.id.toLowerCase().includes(term) ||
                card.title.toLowerCase().includes(term) ||
                card.solicitante.toLowerCase().includes(term) ||
                card.recebedor.toLowerCase().includes(term)
            );
        }

        this.filteredData = filtered;
        this.renderTable();
        this.updateTableInfo();
    }

    clearFilters() {
        document.getElementById('dateFrom').value = '';
        document.getElementById('dateTo').value = '';
        document.getElementById('serviceFilter').value = '';
        document.getElementById('searchInput').value = '';
        
        // Resetar filtro de status para "Todos"
        document.querySelectorAll('.status-filter').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector('.status-filter[data-status="all"]').classList.add('active');
        
        this.currentFilter = 'all';
        this.loadReportsData();
    }

    searchReports(term) {
        if (!term.trim()) {
            this.applyStatusFilter();
            return;
        }

        const searchTerm = term.toLowerCase();
        this.filteredData = this.filteredData.filter(card => 
            card.id.toLowerCase().includes(searchTerm) ||
            card.title.toLowerCase().includes(searchTerm) ||
            card.solicitante.toLowerCase().includes(searchTerm) ||
            card.recebedor.toLowerCase().includes(searchTerm)
        );

        this.renderTable();
        this.updateTableInfo();
    }

    sortTable(column) {
        if (this.sortColumn === column) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = column;
            this.sortDirection = 'asc';
        }

        this.filteredData.sort((a, b) => {
            let aVal = a[column];
            let bVal = b[column];

            if (column === 'valor') {
                aVal = parseFloat(aVal) || 0;
                bVal = parseFloat(bVal) || 0;
            }

            if (aVal < bVal) return this.sortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return this.sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        this.renderTable();
    }

    renderTable() {
        const tbody = document.getElementById('reportsTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        this.filteredData.forEach(card => {
            const row = this.createTableRow(card);
            tbody.appendChild(row);
        });
    }

    createTableRow(card) {
        const row = document.createElement('tr');
        
        const statusClass = card.status || 'pending';
        const statusText = this.getStatusText(card.status);
        const valorFormatado = new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(card.valor || 0);

        row.innerHTML = `
            <td><strong>${card.id}</strong></td>
            <td>${card.title}</td>
            <td>${card.solicitante}</td>
            <td>${card.recebedor}</td>
            <td>${card.service || 'Não especificado'}</td>
            <td><strong>${valorFormatado}</strong></td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td>${card.dataCriacao || 'N/A'}</td>
            <td>${card.dataPagamento || 'N/A'}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-menu-btn" onclick="window.reportsManager.toggleActionMenu(this)">
                        <i class="fas fa-ellipsis-v"></i>
                    </button>
                    <div class="action-dropdown">
                        <button class="action-dropdown-item details" onclick="window.reportsManager.viewDetails('${card.id}')">
                            <i class="fas fa-eye"></i>
                            Detalhes
                        </button>
                        <button class="action-dropdown-item edit" onclick="window.reportsManager.editCard('${card.id}')">
                            <i class="fas fa-edit"></i>
                            Editar
                        </button>
                        <button class="action-dropdown-item delete" onclick="window.reportsManager.deleteCard('${card.id}')">
                            <i class="fas fa-trash"></i>
                            Excluir
                        </button>
                    </div>
                </div>
            </td>
        `;

        return row;
    }

    getStatusText(status) {
        const statusTexts = {
            'completed': 'Concluído',
            'pending': 'Pendente',
            'approved': 'Aprovado',
            'rejected': 'Rejeitado'
        };
        return statusTexts[status] || 'Pendente';
    }

    toggleActionMenu(button) {
        // Fechar todos os outros menus
        document.querySelectorAll('.action-dropdown').forEach(dropdown => {
            if (dropdown !== button.nextElementSibling) {
                dropdown.classList.remove('show');
            }
        });

        // Toggle do menu atual
        const dropdown = button.nextElementSibling;
        dropdown.classList.toggle('show');
    }

    updateTableInfo() {
        const totalRecords = document.getElementById('totalRecords');
        const filteredRecords = document.getElementById('filteredRecords');
        
        if (totalRecords) {
            totalRecords.textContent = `Total: ${window.campaignManager.cards.length} registros`;
        }
        
        if (filteredRecords) {
            filteredRecords.textContent = `Filtrados: ${this.filteredData.length} registros`;
        }
    }

    viewDetails(cardId) {
        const card = window.campaignManager.cards.find(c => c.id === cardId);
        if (card) {
            alert(`Detalhes do Card ${cardId}:\n\nTítulo: ${card.title}\nSolicitante: ${card.solicitante}\nRecebedor: ${card.recebedor}\nValor: R$ ${card.valor}\nStatus: ${this.getStatusText(card.status)}`);
        }
    }

    editCard(cardId) {
        this.hideReportsModal();
        window.campaignManager.editCard(cardId);
    }

    deleteCard(cardId) {
        if (confirm('Tem certeza que deseja excluir este registro?')) {
            window.campaignManager.cards = window.campaignManager.cards.filter(c => c.id !== cardId);
            this.loadReportsData();
            window.campaignManager.updateCardCounts();
        }
    }

    exportToExcel() {
        // Implementar exportação para Excel
        console.log('Exportando para Excel...');
        alert('Funcionalidade de exportação para Excel será implementada em breve!');
    }

    exportToPDF() {
        // Implementar exportação para PDF
        console.log('Exportando para PDF...');
        alert('Funcionalidade de exportação para PDF será implementada em breve!');
    }
}

// Inicializar o sistema quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing managers...');
    window.campaignManager = new CampaignManager();
    window.membersManager = new MembersManager();
    window.servicesManager = new ServicesManager();
    window.reportsManager = new ReportsManager();
    
    // Adicionar funcionalidades extras
    console.log('Sistema de Gestão Financeira carregado com sucesso!');
    console.log('ReportsManager available:', !!window.reportsManager);
    
    // Expor métodos globais para debug
    window.searchCards = (query) => window.campaignManager.searchCards(query);
    window.filterByPriority = (priority) => window.campaignManager.filterByPriority(priority);
    window.exportData = () => window.campaignManager.exportData();
    window.importData = (file) => window.campaignManager.importData(file);
});
