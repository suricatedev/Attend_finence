// JavaScript específico para página de serviços

class ServicesManager {
    constructor() {
        this.services = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadServices();
    }

    setupEventListeners() {
        // Botão adicionar serviço
        const addServiceBtn = document.getElementById('addServiceBtn');
        if (addServiceBtn) {
            addServiceBtn.addEventListener('click', () => {
                this.showAddServiceModal();
            });
        }

        // Modal de adicionar serviço
        this.setupAddServiceModal();
        
        // Eventos dos cards de serviço
        this.setupServiceCards();
    }

    setupAddServiceModal() {
        const modal = document.getElementById('addServiceModal');
        const closeBtn = document.getElementById('closeAddServiceModal');
        const cancelBtn = document.getElementById('cancelAddService');
        const form = document.getElementById('addServiceForm');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.hideAddServiceModal();
            });
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.hideAddServiceModal();
            });
        }

        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveService();
            });
        }
    }

    setupServiceCards() {
        // Eventos delegados para os cards de serviço
        document.addEventListener('click', (e) => {
            if (e.target.closest('.btn-edit')) {
                const card = e.target.closest('.service-card');
                const serviceId = card.dataset.serviceId;
                this.editService(serviceId);
            }
            
            if (e.target.closest('.btn-delete')) {
                const card = e.target.closest('.service-card');
                const serviceId = card.dataset.serviceId;
                this.deleteService(serviceId);
            }
        });
    }

    async loadServices() {
        try {
            this.showLoading();
            
            // Em uma implementação real, isso seria uma chamada para a API
            const response = await fetch('/api/services');
            if (response.ok) {
                this.services = await response.json();
            } else {
                // Dados de exemplo para demonstração
                this.services = this.generateSampleServices();
            }
            
            this.renderServices();
            
        } catch (error) {
            console.error('Erro ao carregar serviços:', error);
            Utils.showNotification('Erro ao carregar serviços', 'error');
            // Usar dados de exemplo em caso de erro
            this.services = this.generateSampleServices();
            this.renderServices();
        } finally {
            this.hideLoading();
        }
    }

    generateSampleServices() {
        return [
            {
                id: 1,
                name: 'Consultoria em TI',
                category: 'consultoria',
                description: 'Serviços de consultoria especializada em tecnologia da informação',
                icon: 'fas fa-user-tie',
                active: true,
                createdAt: new Date('2024-01-15'),
                updatedAt: new Date('2024-01-15')
            },
            {
                id: 2,
                name: 'Desenvolvimento de Software',
                category: 'desenvolvimento',
                description: 'Criação e manutenção de aplicações e sistemas',
                icon: 'fas fa-code',
                active: true,
                createdAt: new Date('2024-01-10'),
                updatedAt: new Date('2024-01-20')
            },
            {
                id: 3,
                name: 'Manutenção de Equipamentos',
                category: 'manutencao',
                description: 'Serviços de manutenção preventiva e corretiva',
                icon: 'fas fa-tools',
                active: true,
                createdAt: new Date('2024-01-05'),
                updatedAt: new Date('2024-01-18')
            },
            {
                id: 4,
                name: 'Treinamento Corporativo',
                category: 'treinamento',
                description: 'Programas de capacitação e desenvolvimento profissional',
                icon: 'fas fa-graduation-cap',
                active: true,
                createdAt: new Date('2024-01-12'),
                updatedAt: new Date('2024-01-22')
            }
        ];
    }

    renderServices() {
        const grid = document.getElementById('servicesGrid');
        if (!grid) return;

        if (this.services.length === 0) {
            grid.innerHTML = this.createEmptyState();
            return;
        }

        grid.innerHTML = '';
        this.services.forEach(service => {
            const card = this.createServiceCard(service);
            grid.appendChild(card);
        });
    }

    createServiceCard(service) {
        const card = document.createElement('div');
        card.className = 'service-card';
        card.dataset.serviceId = service.id;

        card.innerHTML = `
            <div class="service-card-header">
                <div class="service-icon">
                    <i class="${service.icon}"></i>
                </div>
                <div class="service-info">
                    <h3>${service.name}</h3>
                    <p>${service.description}</p>
                    <div class="service-meta">
                        <span class="service-category">${this.getCategoryLabel(service.category)}</span>
                        <span class="service-status ${service.active ? 'active' : 'inactive'}">
                            ${service.active ? 'Ativo' : 'Inativo'}
                        </span>
                    </div>
                </div>
            </div>
            <div class="service-actions">
                <button class="btn-edit" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-delete" title="Excluir">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

        return card;
    }

    createEmptyState() {
        return `
            <div class="empty-state">
                <i class="fas fa-cogs"></i>
                <h3>Nenhum serviço cadastrado</h3>
                <p>Comece adicionando o primeiro serviço da sua empresa</p>
                <button class="btn-primary" onclick="servicesManager.showAddServiceModal()">
                    <i class="fas fa-plus"></i>
                    Adicionar Primeiro Serviço
                </button>
            </div>
        `;
    }

    getCategoryLabel(category) {
        const labels = {
            consultoria: 'Consultoria',
            desenvolvimento: 'Desenvolvimento',
            manutencao: 'Manutenção',
            treinamento: 'Treinamento',
            suporte: 'Suporte',
            infraestrutura: 'Infraestrutura',
            marketing: 'Marketing',
            outros: 'Outros'
        };
        return labels[category] || category;
    }

    showAddServiceModal() {
        const modal = document.getElementById('addServiceModal');
        const title = document.getElementById('addServiceTitle');
        const form = document.getElementById('addServiceForm');

        if (title) {
            title.textContent = 'Adicionar Serviço';
        }

        if (form) {
            form.reset();
            // Limpar estados de validação
            form.querySelectorAll('.form-group').forEach(group => {
                group.classList.remove('error', 'success');
                const messages = group.querySelectorAll('.error-message, .success-message');
                messages.forEach(msg => msg.remove());
            });
        }

        if (modal) {
            modal.classList.add('active');
        }
    }

    hideAddServiceModal() {
        const modal = document.getElementById('addServiceModal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    async saveService() {
        const form = document.getElementById('addServiceForm');
        if (!form) return;

        const formData = new FormData(form);
        const serviceData = {
            name: formData.get('name'),
            category: formData.get('category'),
            description: formData.get('description'),
            icon: formData.get('icon'),
            active: formData.get('active') === 'true'
        };

        // Validação básica
        if (!serviceData.name || !serviceData.category || !serviceData.icon) {
            Utils.showNotification('Por favor, preencha todos os campos obrigatórios', 'error');
            return;
        }

        try {
            // Simular salvamento
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';

            // Em uma implementação real, isso seria uma chamada para a API
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simular delay

            // Adicionar novo serviço
            const newService = {
                id: Date.now(), // ID temporário
                ...serviceData,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            this.services.push(newService);
            this.renderServices();
            this.hideAddServiceModal();
            Utils.showNotification('Serviço adicionado com sucesso!', 'success');

        } catch (error) {
            console.error('Erro ao salvar serviço:', error);
            Utils.showNotification('Erro ao salvar serviço', 'error');
        } finally {
            const submitBtn = form.querySelector('button[type="submit"]');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Salvar';
        }
    }

    editService(serviceId) {
        const service = this.services.find(s => s.id == serviceId);
        if (!service) return;

        const modal = document.getElementById('addServiceModal');
        const title = document.getElementById('addServiceTitle');
        const form = document.getElementById('addServiceForm');

        if (title) {
            title.textContent = 'Editar Serviço';
        }

        if (form) {
            // Preencher formulário com dados do serviço
            form.querySelector('#serviceName').value = service.name;
            form.querySelector('#serviceCategory').value = service.category;
            form.querySelector('#serviceDescription').value = service.description;
            form.querySelector('#serviceIcon').value = service.icon;
            form.querySelector('#serviceActive').value = service.active.toString();
        }

        if (modal) {
            modal.classList.add('active');
        }

        // Armazenar ID do serviço sendo editado
        form.dataset.editingId = serviceId;
    }

    async deleteService(serviceId) {
        const service = this.services.find(s => s.id == serviceId);
        if (!service) return;

        if (!confirm(`Tem certeza que deseja excluir o serviço "${service.name}"?`)) {
            return;
        }

        try {
            // Em uma implementação real, isso seria uma chamada para a API
            await new Promise(resolve => setTimeout(resolve, 500)); // Simular delay

            // Remover serviço da lista
            this.services = this.services.filter(s => s.id != serviceId);
            this.renderServices();
            Utils.showNotification('Serviço excluído com sucesso!', 'success');

        } catch (error) {
            console.error('Erro ao excluir serviço:', error);
            Utils.showNotification('Erro ao excluir serviço', 'error');
        }
    }

    showLoading() {
        const grid = document.getElementById('servicesGrid');
        if (grid) {
            grid.innerHTML = `
                <div class="services-loading">
                    <div class="loading-spinner"></div>
                    <p>Carregando serviços...</p>
                </div>
            `;
        }
    }

    hideLoading() {
        // O loading será removido quando renderServices() for chamado
    }

    // Métodos utilitários
    getServiceById(id) {
        return this.services.find(s => s.id == id);
    }

    getServicesByCategory(category) {
        return this.services.filter(s => s.category === category);
    }

    getActiveServices() {
        return this.services.filter(s => s.active);
    }

    toggleServiceStatus(serviceId) {
        const service = this.getServiceById(serviceId);
        if (service) {
            service.active = !service.active;
            service.updatedAt = new Date();
            this.renderServices();
            Utils.showNotification(
                `Serviço ${service.active ? 'ativado' : 'desativado'} com sucesso!`, 
                'success'
            );
        }
    }
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    window.servicesManager = new ServicesManager();
});
