// ========================================
// PÁGINA DE SERVIÇOS - FUNCIONALIDADES
// ========================================

// Estado da visualização
let currentView = 'list'; // 'list' ou 'grid'

// Dados dos serviços (simulados)
let services = [
            {
                id: 1,
        name: "Consultoria em TI",
        description: "Serviços de consultoria especializada em tecnologia da informação, incluindo análise de sistemas, otimização de processos e implementação de soluções tecnológicas.",
        category: "consultoria",
        icon: "fas fa-user-tie",
                active: true,
                createdAt: new Date('2024-01-15'),
                updatedAt: new Date('2024-01-15')
            },
            {
                id: 2,
        name: "Desenvolvimento de Software",
        description: "Criação e manutenção de aplicações e sistemas personalizados, desenvolvimento web, mobile e desktop com as melhores práticas de programação.",
        category: "desenvolvimento",
        icon: "fas fa-code",
                active: true,
                createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-10')
            },
            {
                id: 3,
        name: "Manutenção de Equipamentos",
        description: "Serviços de manutenção preventiva e corretiva para equipamentos de informática, garantindo o funcionamento otimizado e prolongando a vida útil dos dispositivos.",
        category: "manutencao",
        icon: "fas fa-tools",
                active: true,
        createdAt: new Date('2024-01-20'),
        updatedAt: new Date('2024-01-20')
            },
            {
                id: 4,
        name: "Treinamento Corporativo",
        description: "Programas de capacitação e desenvolvimento profissional, treinamentos técnicos e soft skills para equipes e colaboradores da empresa.",
        category: "treinamento",
        icon: "fas fa-graduation-cap",
                active: true,
        createdAt: new Date('2024-01-25'),
        updatedAt: new Date('2024-01-25')
    }
];

// Categorias disponíveis
const categories = {
    'consultoria': 'Consultoria',
    'desenvolvimento': 'Desenvolvimento',
    'manutencao': 'Manutenção',
    'treinamento': 'Treinamento',
    'suporte': 'Suporte',
    'infraestrutura': 'Infraestrutura',
    'marketing': 'Marketing',
    'outros': 'Outros'
};

// Inicialização quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    initializeServicesPage();
});

// Função principal de inicialização
function initializeServicesPage() {
    // Carregar preferência de visualização
    const savedView = localStorage.getItem('servicesView');
    if (savedView && (savedView === 'list' || savedView === 'grid')) {
        currentView = savedView;
    }
    
    renderServices();
    updateStats();
    setupEventListeners();
    setupModal();
    setupFilters();
    
    // Aplicar visualização salva
    switchView(currentView);
}

// Função para renderizar os serviços
function renderServices() {
    if (currentView === 'list') {
        renderListView();
    } else {
        renderGridView();
    }
}

// Função para renderizar em lista
function renderListView() {
    const servicesList = document.getElementById('servicesList');
    const listColumnsHeader = document.getElementById('listColumnsHeader');
    if (!servicesList) return;
    
    // Mostrar cabeçalho das colunas
    if (listColumnsHeader) {
        listColumnsHeader.style.display = 'grid';
    }
    
    // Limpar apenas os itens, mantendo o cabeçalho
    const existingItems = servicesList.querySelectorAll('.service-item');
    existingItems.forEach(item => item.remove());
    
    services.forEach(service => {
        const serviceItem = createServiceListItem(service);
        servicesList.appendChild(serviceItem);
    });
}

// Função para renderizar em grid
function renderGridView() {
    const servicesList = document.getElementById('servicesList');
    const listColumnsHeader = document.getElementById('listColumnsHeader');
    if (!servicesList) return;
    
    // Ocultar cabeçalho das colunas
    if (listColumnsHeader) {
        listColumnsHeader.style.display = 'none';
    }
    
    servicesList.innerHTML = '';
    servicesList.className = 'services-grid';
    
    services.forEach(service => {
        const serviceCard = createServiceCard(service);
        servicesList.appendChild(serviceCard);
    });
}

// Função para criar um item da lista fino e funcional
function createServiceListItem(service) {
    const item = document.createElement('div');
    item.className = 'service-item';
    item.setAttribute('data-service-id', service.id);
    
    // Truncar descrição para caber em uma linha
    const shortDescription = service.description.length > 60 
        ? service.description.substring(0, 60) + '...' 
        : service.description;
    
    item.innerHTML = `
        <div class="service-icon">
            <i class="${service.icon}"></i>
        </div>
        <div class="service-info">
            <div class="service-main-info">
                <div class="service-name" title="${service.name}">${service.name}</div>
                <div class="service-description" title="${service.description}">${shortDescription}</div>
            </div>
            <div class="service-category" title="${categories[service.category] || 'Outros'}">${categories[service.category] || 'Outros'}</div>
            <div class="service-status ${service.active ? 'active' : 'inactive'}" title="${service.active ? 'Serviço ativo' : 'Serviço inativo'}">
                ${service.active ? 'Ativo' : 'Inativo'}
            </div>
            <div class="service-actions">
                <button class="btn-edit" onclick="editService(${service.id})" title="Editar serviço">
                    <i class="fas fa-edit"></i>
                    Editar
                </button>
                <button class="btn-delete" onclick="deleteService(${service.id})" title="Excluir serviço">
                    <i class="fas fa-trash"></i>
                    Excluir
                </button>
            </div>
        </div>
    `;
    
    return item;
}

// Função para criar um card de serviço
function createServiceCard(service) {
        const card = document.createElement('div');
        card.className = 'service-card';
    card.setAttribute('data-service-id', service.id);

        card.innerHTML = `
                <div class="service-icon">
                    <i class="${service.icon}"></i>
                </div>
                <div class="service-info">
                    <h3>${service.name}</h3>
                    <p>${service.description}</p>
                    <div class="service-meta">
                <span class="service-category">${categories[service.category] || 'Outros'}</span>
                        <span class="service-status ${service.active ? 'active' : 'inactive'}">
                            ${service.active ? 'Ativo' : 'Inativo'}
                        </span>
                </div>
            </div>
            <div class="service-actions">
            <button class="btn-edit" onclick="editService(${service.id})" title="Editar serviço">
                    <i class="fas fa-edit"></i>
                Editar
                </button>
            <button class="btn-delete" onclick="deleteService(${service.id})" title="Excluir serviço">
                    <i class="fas fa-trash"></i>
                Excluir
                </button>
            </div>
        `;

        return card;
    }

// Função para configurar event listeners
function setupEventListeners() {
    // Botão adicionar serviço
    const addServiceBtn = document.getElementById('addServiceBtn');
    if (addServiceBtn) {
        addServiceBtn.addEventListener('click', openAddServiceModal);
    }
    
    // Botões de fechar modal
    const closeModalBtn = document.getElementById('closeAddServiceModal');
    const cancelBtn = document.getElementById('cancelAddService');
    
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeServiceModal);
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeServiceModal);
    }
    
    // Fechar modal clicando no overlay
    const modal = document.getElementById('addServiceModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeServiceModal();
            }
        });
    }
    
    // Fechar modal com ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeServiceModal();
        }
    });
    
    // Botões de visualização
    const listViewBtn = document.getElementById('listViewBtn');
    const gridViewBtn = document.getElementById('gridViewBtn');
    
    if (listViewBtn) {
        listViewBtn.addEventListener('click', () => switchView('list'));
    }
    
    if (gridViewBtn) {
        gridViewBtn.addEventListener('click', () => switchView('grid'));
    }
    
    // Botões de ação da lista
    const exportBtn = document.getElementById('exportBtn');
    const refreshBtn = document.getElementById('refreshBtn');
    
    if (exportBtn) {
        exportBtn.addEventListener('click', exportServices);
    }
    
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            renderServices();
            updateStats();
            showNotification('Lista atualizada!', 'success');
        });
    }
}

// Função para configurar o modal
function setupModal() {
    const form = document.getElementById('addServiceForm');
    if (form) {
        form.addEventListener('submit', handleServiceSubmit);
    }
}

// Função para abrir modal de adicionar serviço
function openAddServiceModal() {
    const modal = document.getElementById('addServiceModal');
    const title = document.getElementById('addServiceTitle');
        const form = document.getElementById('addServiceForm');
    
    if (modal && title && form) {
        title.textContent = 'Adicionar Serviço';
        form.reset();
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        // Focar no primeiro campo
        const firstInput = form.querySelector('input');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    }
}

// Função para fechar modal
function closeServiceModal() {
    const modal = document.getElementById('addServiceModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
}

// Função para editar serviço
function editService(serviceId) {
    const service = services.find(s => s.id === serviceId);
        if (!service) return;

        const modal = document.getElementById('addServiceModal');
        const title = document.getElementById('addServiceTitle');
        const form = document.getElementById('addServiceForm');

    if (modal && title && form) {
            title.textContent = 'Editar Serviço';

            // Preencher formulário com dados do serviço
            form.querySelector('#serviceName').value = service.name;
        form.querySelector('#serviceDescription').value = service.description;
            form.querySelector('#serviceCategory').value = service.category;
            form.querySelector('#serviceIcon').value = service.icon;
            form.querySelector('#serviceActive').value = service.active.toString();
        
        // Adicionar ID do serviço ao formulário
        form.setAttribute('data-service-id', serviceId);
        
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

// Função para excluir serviço
function deleteService(serviceId) {
    const service = services.find(s => s.id === serviceId);
    if (!service) return;
    
    if (confirm(`Tem certeza que deseja excluir o serviço "${service.name}"?`)) {
        services = services.filter(s => s.id !== serviceId);
        renderServices();
        updateStats();
        showNotification('Serviço excluído com sucesso!', 'success');
    }
}

// Função para lidar com envio do formulário
function handleServiceSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const serviceId = form.getAttribute('data-service-id');
    
    const serviceData = {
        name: formData.get('name'),
        description: formData.get('description'),
        category: formData.get('category'),
        icon: formData.get('icon'),
        active: formData.get('active') === 'true',
        updatedAt: new Date()
    };
    
    // Validação básica
    if (!serviceData.name || !serviceData.description || !serviceData.category || !serviceData.icon) {
        showNotification('Por favor, preencha todos os campos obrigatórios.', 'error');
            return;
        }

    if (serviceId) {
        // Editar serviço existente
        const index = services.findIndex(s => s.id === parseInt(serviceId));
        if (index !== -1) {
            services[index] = { ...services[index], ...serviceData };
            showNotification('Serviço atualizado com sucesso!', 'success');
        }
    } else {
        // Adicionar novo serviço
        const newService = {
            id: Date.now(), // ID simples baseado em timestamp
            ...serviceData,
            createdAt: new Date()
        };
        services.push(newService);
        showNotification('Serviço adicionado com sucesso!', 'success');
    }
    
    // Atualizar interface e fechar modal
    renderServices();
    updateStats();
    closeServiceModal();
    form.removeAttribute('data-service-id');
}

// Função para mostrar notificação
function showNotification(message, type = 'info') {
    // Remover notificação existente
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Criar nova notificação
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Adicionar estilos
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#4ade80' : type === 'error' ? '#f87171' : '#3b82f6'};
        color: white;
        padding: 16px 20px;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        display: flex;
        align-items: center;
        gap: 12px;
        font-weight: 600;
        z-index: 10000;
        transform: translateX(400px);
        opacity: 0;
        transition: all 0.3s ease;
        max-width: 400px;
    `;
    
    // Adicionar ao body
    document.body.appendChild(notification);
    
    // Mostrar notificação
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
        notification.style.opacity = '1';
    }, 100);
    
    // Remover após 4 segundos
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// Função para filtrar serviços (para implementação futura)
function filterServices(category, status, searchTerm) {
    let filteredServices = services;
    
    if (category && category !== 'all') {
        filteredServices = filteredServices.filter(s => s.category === category);
    }
    
    if (status && status !== 'all') {
        const isActive = status === 'active';
        filteredServices = filteredServices.filter(s => s.active === isActive);
    }
    
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filteredServices = filteredServices.filter(s => 
            s.name.toLowerCase().includes(term) || 
            s.description.toLowerCase().includes(term)
        );
    }
    
    return filteredServices;
}

// Função para alternar entre visualizações
function switchView(view) {
    currentView = view;
    
    // Atualizar botões ativos
    const listViewBtn = document.getElementById('listViewBtn');
    const gridViewBtn = document.getElementById('gridViewBtn');
    
    if (listViewBtn && gridViewBtn) {
        listViewBtn.classList.toggle('active', view === 'list');
        gridViewBtn.classList.toggle('active', view === 'grid');
    }
    
    // Renderizar com a nova visualização
    renderServices();
    
    // Salvar preferência no localStorage
    localStorage.setItem('servicesView', view);
}

// Função para exportar serviços
function exportServices() {
    const dataStr = JSON.stringify(services, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `servicos_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    showNotification('Serviços exportados com sucesso!', 'success');
}

// Função para alternar status do serviço
function toggleServiceStatus(serviceId) {
    const service = services.find(s => s.id === serviceId);
        if (service) {
            service.active = !service.active;
            service.updatedAt = new Date();
        renderServices();
        showNotification(
                `Serviço ${service.active ? 'ativado' : 'desativado'} com sucesso!`, 
                'success'
            );
        }
    }

// Função para duplicar serviço
function duplicateService(serviceId) {
    const service = services.find(s => s.id === serviceId);
    if (service) {
        const duplicatedService = {
            ...service,
            id: Date.now(),
            name: `${service.name} (Cópia)`,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        services.push(duplicatedService);
        renderServices();
        updateStats();
        showNotification('Serviço duplicado com sucesso!', 'success');
    }
}

// Função para atualizar estatísticas
function updateStats() {
    const totalServicesEl = document.getElementById('totalServices');
    const activeServicesEl = document.getElementById('activeServices');
    
    if (totalServicesEl) {
        totalServicesEl.textContent = services.length;
    }
    
    if (activeServicesEl) {
        const activeCount = services.filter(s => s.active).length;
        activeServicesEl.textContent = activeCount;
    }
}

// Função para configurar filtros
function setupFilters() {
    const applyFiltersBtn = document.getElementById('applyFilters');
    const clearFiltersBtn = document.getElementById('clearFilters');
    const searchInput = document.getElementById('searchFilter');
    
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', applyFilters);
    }
    
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', clearFilters);
    }
    
    if (searchInput) {
        searchInput.addEventListener('input', debounce(applyFilters, 300));
    }
    
    // Aplicar filtros automaticamente quando mudar os selects
    const categoryFilter = document.getElementById('categoryFilter');
    const statusFilter = document.getElementById('statusFilter');
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', applyFilters);
    }
    
    if (statusFilter) {
        statusFilter.addEventListener('change', applyFilters);
    }
}

// Função para aplicar filtros
function applyFilters() {
    const categoryFilter = document.getElementById('categoryFilter');
    const statusFilter = document.getElementById('statusFilter');
    const searchInput = document.getElementById('searchFilter');
    
    const category = categoryFilter ? categoryFilter.value : 'all';
    const status = statusFilter ? statusFilter.value : 'all';
    const searchTerm = searchInput ? searchInput.value : '';
    
    const filteredServices = filterServices(category, status, searchTerm);
    renderFilteredServices(filteredServices);
}

// Função para renderizar serviços filtrados
function renderFilteredServices(filteredServices) {
    const servicesList = document.getElementById('servicesList');
    const listColumnsHeader = document.getElementById('listColumnsHeader');
    if (!servicesList) return;
    
    // Limpar apenas os itens existentes
    const existingItems = servicesList.querySelectorAll('.service-item, .service-card, .no-results');
    existingItems.forEach(item => item.remove());
    
    if (filteredServices.length === 0) {
        const noResults = document.createElement('div');
        noResults.className = 'no-results';
        noResults.innerHTML = `
            <i class="fas fa-search"></i>
            <h3>Nenhum serviço encontrado</h3>
            <p>Tente ajustar os filtros ou adicionar um novo serviço.</p>
        `;
        servicesList.appendChild(noResults);
        return;
    }
    
    if (currentView === 'list') {
        // Mostrar cabeçalho das colunas
        if (listColumnsHeader) {
            listColumnsHeader.style.display = 'grid';
        }
        
        filteredServices.forEach(service => {
            const serviceItem = createServiceListItem(service);
            servicesList.appendChild(serviceItem);
        });
    } else {
        // Ocultar cabeçalho das colunas
        if (listColumnsHeader) {
            listColumnsHeader.style.display = 'none';
        }
        
        servicesList.className = 'services-grid';
        filteredServices.forEach(service => {
            const serviceCard = createServiceCard(service);
            servicesList.appendChild(serviceCard);
        });
    }
}

// Função para limpar filtros
function clearFilters() {
    const categoryFilter = document.getElementById('categoryFilter');
    const statusFilter = document.getElementById('statusFilter');
    const searchInput = document.getElementById('searchFilter');
    
    if (categoryFilter) categoryFilter.value = 'all';
    if (statusFilter) statusFilter.value = 'all';
    if (searchInput) searchInput.value = '';
    
    renderServices();
}

// Função debounce para otimizar busca
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Função para adicionar estilos para "nenhum resultado"
function addNoResultsStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .no-results {
            grid-column: 1 / -1;
            text-align: center;
            padding: 60px 20px;
            color: #544350;
        }
        
        .no-results i {
            font-size: 4rem;
            color: #FFCB57;
            margin-bottom: 20px;
            opacity: 0.7;
        }
        
        .no-results h3 {
            font-size: 1.5rem;
            margin: 0 0 10px 0;
            color: #1C1C1C;
        }
        
        .no-results p {
            font-size: 1rem;
            margin: 0;
            opacity: 0.8;
        }
    `;
    document.head.appendChild(style);
}

// Adicionar estilos quando a página carregar
document.addEventListener('DOMContentLoaded', addNoResultsStyles);