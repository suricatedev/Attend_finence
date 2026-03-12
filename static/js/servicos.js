// ========================================
// PÁGINA DE SERVIÇOS - FUNCIONALIDADES
// ========================================

// Estado da visualização
let currentView = 'list'; // 'list' ou 'grid'

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
    
    setupEventListeners();
    setupModal();
    setupFilters();
    updateStats();
    
    // Aplicar visualização salva
    switchView(currentView);
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
    
    // Mostrar/ocultar as visualizações apropriadas
    const listView = document.getElementById('servicesListView');
    const gridView = document.getElementById('servicesGridView');
    
    if (listView && gridView) {
        if (view === 'list') {
            listView.style.display = 'block';
            gridView.style.display = 'none';
        } else {
            listView.style.display = 'none';
            gridView.style.display = 'grid';
        }
    }
    
    // Reaplicar filtros quando mudar de visualização
    // Isso garante que os filtros sejam mantidos ao alternar entre lista e grid
    setTimeout(() => {
        if (typeof applyServiceFilters === 'function') {
            const statusFilter = document.getElementById('statusFilter');
            const searchInput = document.getElementById('searchFilter');
            // Reaplicar filtros se houver algum ativo
            if ((statusFilter && statusFilter.value !== 'all') || 
                (searchInput && searchInput.value.trim() !== '')) {
                applyServiceFilters();
            }
        }
    }, 100);    
    // Salvar preferência no localStorage
    localStorage.setItem('servicesView', view);
}


// Função para configurar event listeners
function setupEventListeners() {
    // Botão adicionar serviço
    const addServiceBtn = document.getElementById('addServiceBtn');
    if (addServiceBtn) {
        addServiceBtn.addEventListener('click', openAddServiceModal);
    }
    
    // Botões de fechar modal de adicionar
    const closeModalBtn = document.getElementById('closeAddServiceModal');
    const cancelBtn = document.getElementById('cancelAddService');
    
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeServiceModal);
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeServiceModal);
    }
    
    // Botões de fechar modal de editar
    const closeEditModalBtn = document.getElementById('closeEditServiceModal');
    const cancelEditBtn = document.getElementById('cancelEditService');
    
    if (closeEditModalBtn) {
        closeEditModalBtn.addEventListener('click', closeEditServiceModal);
    }
    
    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', closeEditServiceModal);
    }
    
    // Fechar modais clicando no overlay
    const addModal = document.getElementById('addServiceModal');
    const editModal = document.getElementById('editServiceModal');
    
    if (addModal) {
        addModal.addEventListener('click', function(e) {
            if (e.target === addModal) {
                closeServiceModal();
            }
        });
    }
    
    if (editModal) {
        editModal.addEventListener('click', function(e) {
            if (e.target === editModal) {
                closeEditServiceModal();
            }
        });
    }
    
    // Fechar modais com ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeServiceModal();
            closeEditServiceModal();
        }
    });
    
    // Botão de alternar status no modal de edição
    const toggleStatusBtn = document.getElementById('toggleServiceStatus');
    if (toggleStatusBtn) {
        toggleStatusBtn.addEventListener('click', toggleServiceStatusFromModal);
    }
    
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
    // Event delegation para botões de editar e excluir
    const servicesList = document.getElementById('servicesList');
    if (servicesList) {
        servicesList.addEventListener('click', function(e) {
            const editBtn = e.target.closest('.btn-edit');
            const deleteBtn = e.target.closest('.btn-delete');
            
            if (editBtn) {
                const serviceId = parseInt(editBtn.getAttribute('data-service-id') || 
                                           editBtn.closest('[data-service-id]')?.getAttribute('data-service-id'));
                if (serviceId) {
                    editService(serviceId);
                }
            }
            
            if (deleteBtn) {
                const serviceId = parseInt(deleteBtn.getAttribute('data-service-id') || 
                                         deleteBtn.closest('[data-service-id]')?.getAttribute('data-service-id'));
                if (serviceId) {
                    deleteService(serviceId);
                }
            }
        });
    }}

// Função para configurar o modal
function setupModal() {
    const addForm = document.getElementById('addServiceForm');
    const editForm = document.getElementById('editServiceForm');
    
    if (addForm) {
        addForm.addEventListener('submit', handleServiceSubmit);
    }
    
    if (editForm) {
        editForm.addEventListener('submit', handleServiceUpdate);
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

// Função para fechar modal de adicionar
function closeServiceModal() {
    const modal = document.getElementById('addServiceModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
}

// Função para fechar modal de editar
function closeEditServiceModal() {
    const modal = document.getElementById('editServiceModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
}

// Função para editar serviço
function editService(serviceId) {
    // Encontrar o card do serviço no HTML
    const serviceCard = document.querySelector(`[data-service-id="${serviceId}"]`);
    if (!serviceCard) return;

    const modal = document.getElementById('editServiceModal');
    const form = document.getElementById('editServiceForm');
    
    if (modal && form) {
        // Extrair dados do card HTML
        const name = serviceCard.querySelector('.service-name, h3')?.textContent || '';
        const description = serviceCard.querySelector('.service-description, p')?.textContent || '';
        const isActive = serviceCard.querySelector('.service-status')?.classList.contains('active') || false;
        
        // Preencher formulário com dados do serviço
        form.querySelector('#editServiceId').value = serviceId;
        form.querySelector('#editServiceName').value = name;
        form.querySelector('#editServiceDescription').value = description.trim();
        form.querySelector('#editServiceActive').value = isActive.toString();
        
        // Preencher informações adicionais
        document.getElementById('editServiceIdDisplay').textContent = serviceId;
        document.getElementById('editServiceCreatedAt').textContent = 'N/A';
        document.getElementById('editServiceUpdatedAt').textContent = new Date().toLocaleDateString('pt-BR');
        
        // Atualizar texto do botão de status
        if (typeof updateToggleStatusButton === 'function') {
            updateToggleStatusButton(isActive);
        }
        
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        // Focar no primeiro campo
        const firstInput = form.querySelector('input[type="text"]');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    }
}

// Função para excluir serviço
function deleteService(serviceId) {
    const serviceCard = document.querySelector(`[data-service-id="${serviceId}"]`);
    if (!serviceCard) return;
    
    const serviceName = serviceCard.querySelector('.service-name, h3')?.textContent || 'este serviço';
    
    if (confirm(`Tem certeza que deseja excluir o serviço "${serviceName}"?`)) {
        // Enviar requisição para o backend
        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value || 
                          document.cookie.match(/csrftoken=([^;]+)/)?.[1];
        
        fetch(`/servicos/deletar/${serviceId}/`, {
            method: 'DELETE',
            headers: {
                'X-CSRFToken': csrfToken,
                'Content-Type': 'application/json',
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification(data.message || 'Serviço excluído com sucesso!', 'success');
                // Recarregar a página para atualizar a lista
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } else {
                showNotification(data.error || 'Erro ao excluir serviço!', 'error');
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            showNotification('Erro de conexão. Tente novamente.', 'error');
        });
    }
}

// Função para lidar com envio do formulário (criar)
function handleServiceSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    
    // Validação básica
    const name = formData.get('name');
    if (!name || !name.trim()) {
        showNotification('O nome do serviço é obrigatório!', 'error');
        return;
    }
    
    // Obter CSRF token
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value ||
                     document.cookie.match(/csrftoken=([^;]+)/)?.[1] ||
                     '';
    
    if (!csrfToken) {
        showNotification('Erro: Token CSRF não encontrado. Recarregue a página.', 'error');
        return;
    }
    
    // Enviar para o backend
    fetch('/servicos/criar/', {
        method: 'POST',
        body: formData,
        headers: {
            'X-CSRFToken': csrfToken,
        }
    })
    .then(response => {
        // Verificar se a resposta é JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            return response.text().then(text => {
                console.error('Resposta não JSON:', text);
                throw new Error('Resposta inválida do servidor');
            });
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            showNotification(data.message || 'Serviço criado com sucesso!', 'success');
            closeServiceModal();
            // Atualizar estatísticas antes de recarregar
            updateStats();
            // Recarregar a página para mostrar o novo serviço
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            showNotification(data.error || 'Erro ao criar serviço!', 'error');
        }
    })
    .catch(error => {
        console.error('Erro completo:', error);
        showNotification('Erro ao criar serviço: ' + (error.message || 'Erro de conexão. Tente novamente.'), 'error');
    });
}

// Função para lidar com atualização do serviço
function handleServiceUpdate(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const serviceId = parseInt(form.querySelector('#editServiceId').value);
    
    // Validação básica
    const name = formData.get('name');
    if (!name || !name.trim()) {
        showNotification('O nome do serviço é obrigatório!', 'error');
        return;
    }

    // Obter CSRF token
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value ||
                     document.cookie.match(/csrftoken=([^;]+)/)?.[1] ||
                     '';
    
    if (!csrfToken) {
        showNotification('Erro: Token CSRF não encontrado. Recarregue a página.', 'error');
        return;
    }
    
    // Enviar dados para o backend Django
    fetch(`/servicos/editar/${serviceId}/`, {
        method: 'POST',
        body: formData,
        headers: {
            'X-CSRFToken': csrfToken,
        }
    })
    .then(response => {
        // Verificar se a resposta é JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            return response.text().then(text => {
                console.error('Resposta não JSON:', text);
                throw new Error('Resposta inválida do servidor');
            });
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            showNotification(data.message || 'Serviço atualizado com sucesso!', 'success');
            closeEditServiceModal();
            // Atualizar estatísticas antes de recarregar
            updateStats();
            // Recarregar a página para mostrar as alterações
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            showNotification(data.error || 'Erro ao atualizar serviço!', 'error');
        }
    })
    .catch(error => {
        console.error('Erro completo:', error);
        showNotification('Erro ao atualizar serviço: ' + (error.message || 'Erro de conexão. Tente novamente.'), 'error');
    });
}

// Função para alternar status do serviço no modal
function toggleServiceStatusFromModal() {
    const form = document.getElementById('editServiceForm');
    const serviceId = parseInt(form.querySelector('#editServiceId').value);
    const statusSelect = form.querySelector('#editServiceActive');
    
    if (statusSelect) {
        const currentStatus = statusSelect.value === 'true';
        const newStatus = !currentStatus;
        
        // Enviar requisição para o backend
        const formData = new FormData();
        formData.append('id', serviceId);
        formData.append('active', newStatus.toString());
        formData.append('csrfmiddlewaretoken', document.querySelector('[name=csrfmiddlewaretoken]').value);
        
        fetch('/servicos/toggle-status/', {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                statusSelect.value = newStatus.toString();
                updateToggleStatusButton(newStatus);
                
                // Atualizar card no HTML
                const serviceCard = document.querySelector(`[data-service-id="${serviceId}"]`);
                if (serviceCard) {
                    const statusEl = serviceCard.querySelector('.service-status');
                    if (statusEl) {
                        statusEl.className = `service-status ${newStatus ? 'active' : 'inactive'}`;
                        statusEl.textContent = newStatus ? 'Ativo' : 'Inativo';
                    }
                }
                
                // Atualizar informações no modal
                document.getElementById('editServiceUpdatedAt').textContent = 
                    new Date().toLocaleDateString('pt-BR');
                
                // Atualizar estatísticas após mudança de status
                updateStats();
                
                showNotification(
                    `Serviço ${newStatus ? 'ativado' : 'desativado'} com sucesso!`, 
                    'success'
                );
            } else {
                showNotification(data.message || 'Erro ao alterar status!', 'error');
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            showNotification('Erro de conexão. Tente novamente.', 'error');
        });
    }
}

// Função para atualizar o texto do botão de status
function updateToggleStatusButton(isActive) {
    const toggleBtn = document.getElementById('toggleServiceStatus');
    const toggleText = document.getElementById('toggleStatusText');
    
    if (toggleBtn && toggleText) {
        if (isActive) {
            toggleBtn.className = 'btn-warning';
            toggleBtn.innerHTML = '<i class="fas fa-toggle-off"></i><span>Desativar Serviço</span>';
        } else {
            toggleBtn.className = 'btn-success';
            toggleBtn.innerHTML = '<i class="fas fa-toggle-on"></i><span>Ativar Serviço</span>';
        }
    }
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



// Função para exportar serviços (apenas serviços cadastrados, sem duplicatas)
function exportServices() {
    try {
        // Coletar apenas da lista visível para evitar duplicata (lista e grid têm os mesmos serviços)
        const listView = document.getElementById('servicesListView');
        const gridView = document.getElementById('servicesGridView');
        const listVisible = listView && listView.style.display !== 'none';
        const selector = listVisible ? '.service-item' : '.service-card';
        const container = listVisible ? listView : gridView;
        const serviceItems = container ? container.querySelectorAll(selector) : [];
        
        if (serviceItems.length === 0) {
            showNotification('Nenhum serviço para exportar!', 'info');
            return;
        }
        
        let csvContent = '\uFEFF'; // UTF-8 BOM para Excel
        const delimiter = ';'; // Usar ponto e vírgula para Excel brasileiro
        
        // Cabeçalhos
        const headers = ['ID', 'Nome', 'Descrição', 'Status'];
        csvContent += headers.join(delimiter) + '\n';
        
        // Dados dos serviços (cada serviço cadastrado uma única vez)
        serviceItems.forEach(item => {
            const id = item.getAttribute('data-service-id') || '';
            const name = (item.querySelector('.service-name, h3')?.textContent || '').trim();
            const description = (item.querySelector('.service-description, p')?.textContent || '').trim();
            const statusEl = item.querySelector('.service-status');
            const isActive = statusEl?.classList.contains('active') || false;
            const status = isActive ? 'Ativo' : 'Inativo';
            
            // Função para escapar valores que contêm delimitador, vírgula ou aspas
            const escapeValue = (value) => {
                if (!value) return '';
                const str = String(value);
                if (str.includes(delimiter) || str.includes(',') || str.includes('"') || str.includes('\n')) {
                    return '"' + str.replace(/"/g, '""') + '"';
                }
                return str;
            };
            
            const row = [
                escapeValue(id),
                escapeValue(name),
                escapeValue(description),
                escapeValue(status)
            ];
            
            csvContent += row.join(delimiter) + '\n';
        });
        
        // Criar blob e download
        const blob = new Blob([csvContent], { 
            type: 'text/csv;charset=utf-8;' 
        });
        const link = document.createElement('a');
        const dateStr = new Date().toISOString().split('T')[0];
        const fileName = `servicos_${dateStr}.csv`;
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        
        // Limpar após um tempo
        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
        }, 100);
        
        showNotification('Serviços exportados com sucesso!', 'success');
        
    } catch (error) {
        console.error('Erro ao exportar serviços:', error);
        showNotification('Erro ao exportar serviços: ' + error.message, 'error');
    }
}

// Função para atualizar estatísticas
function updateStats() {
    const totalServicesEl = document.getElementById('totalServices');
    const activeServicesEl = document.getElementById('activeServices');
    
    // Contar TODOS os serviços do HTML (independente de filtros)
    const allServiceItems = document.querySelectorAll('.service-item, .service-card');
    
    // Contar todos os serviços (total)
    const totalCount = allServiceItems.length;
    
    // Contar todos os ativos (independente de visibilidade)
    const activeCount = Array.from(allServiceItems).filter(item => {
        const statusEl = item.querySelector('.service-status');
        return statusEl && statusEl.classList.contains('active');
    }).length;
    
    if (totalServicesEl) {
        totalServicesEl.textContent = totalCount;
    }
    
    if (activeServicesEl) {
        activeServicesEl.textContent = activeCount;
    }
}

// Variável global para a função de aplicar filtros
let applyFiltersFunction = null;

// Função para aplicar filtros (tornada global para ser chamada de outros lugares)
function applyServiceFilters() {
    const statusFilter = document.getElementById('statusFilter');
    const searchInput = document.getElementById('searchFilter');
    const statusValue = statusFilter ? statusFilter.value : 'all';
    const searchValue = searchInput ? searchInput.value.toLowerCase().trim() : '';
    
    // Buscar todos os itens de serviço (tanto em modo lista quanto grid)
    const listItems = document.querySelectorAll('#servicesListView .service-item');
    const gridItems = document.querySelectorAll('#servicesGridView .service-card');
    const allItems = [...listItems, ...gridItems];
    
    let visibleCount = 0;
    
    allItems.forEach(item => {
        let shouldShow = true;
        
        // Filtro por status
        if (statusValue !== 'all') {
            const statusEl = item.querySelector('.service-status');
            const isActive = statusEl ? statusEl.classList.contains('active') : false;
            
            if (statusValue === 'active' && !isActive) {
                shouldShow = false;
            } else if (statusValue === 'inactive' && isActive) {
                shouldShow = false;
            }
        }
        
        // Filtro por busca (nome ou descrição)
        if (shouldShow && searchValue) {
            const nameEl = item.querySelector('.service-name, h3');
            const descEl = item.querySelector('.service-description, p');
            
            const name = nameEl ? nameEl.textContent.toLowerCase() : '';
            const description = descEl ? descEl.textContent.toLowerCase() : '';
            
            if (!name.includes(searchValue) && !description.includes(searchValue)) {
                shouldShow = false;
            }
        }
        
        // Mostrar ou ocultar item baseado na visualização atual
        if (shouldShow) {
            // Verificar se o item pertence à visualização atual
            const isInListView = item.closest('#servicesListView');
            const isInGridView = item.closest('#servicesGridView');
            
            if (currentView === 'list' && isInListView) {
                item.style.display = '';
                visibleCount++;
            } else if (currentView === 'grid' && isInGridView) {
                item.style.display = '';
                visibleCount++;
            } else {
                // Se não está na visualização atual, ocultar
                item.style.display = 'none';
            }
        } else {
            item.style.display = 'none';
        }
    });
    
    // Mostrar mensagem se não houver resultados
    showFilterResults(visibleCount, allItems.length);
    
    // NÃO atualizar estatísticas aqui - elas devem mostrar o total real, não os filtrados
    // updateStats(); // Removido - estatísticas devem sempre mostrar todos os itens
}

// Função para mostrar resultado dos filtros
function showFilterResults(visible, total) {
    // Remover mensagem anterior se existir
    const existingMessage = document.getElementById('filterResultsMessage');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // Se houver itens filtrados, mostrar mensagem
    if (visible === 0 && total > 0) {
        const message = document.createElement('div');
        message.id = 'filterResultsMessage';
        message.className = 'no-results';
        message.innerHTML = `
            <i class="fas fa-search"></i>
            <h3>Nenhum serviço encontrado</h3>
            <p>Nenhum serviço corresponde aos filtros aplicados. Tente ajustar os critérios de busca.</p>
        `;
        
        // Adicionar mensagem ao container apropriado
        const listView = document.getElementById('servicesListView');
        const gridView = document.getElementById('servicesGridView');
        
        if (currentView === 'list' && listView) {
            listView.appendChild(message);
        } else if (currentView === 'grid' && gridView) {
            gridView.appendChild(message);
        }    }
}

// Função para configurar filtros
function setupFilters() {
    const applyFiltersBtn = document.getElementById('applyFilters');
    const clearFiltersBtn = document.getElementById('clearFilters');
    const searchInput = document.getElementById('searchFilter');
    const statusFilter = document.getElementById('statusFilter');
    
    // Salvar referência da função globalmente
    applyFiltersFunction = applyServiceFilters;
    
    // Função para aplicar filtros
    function applyFilters() {
        applyServiceFilters();
    }
    
    // Função para limpar filtros
    function clearFilters() {
        if (statusFilter) {
            statusFilter.value = 'all';
        }
        if (searchInput) {
            searchInput.value = '';
        }
        
        // Mostrar todos os itens novamente
        const listItems = document.querySelectorAll('#servicesListView .service-item');
        const gridItems = document.querySelectorAll('#servicesGridView .service-card');
        const allItems = [...listItems, ...gridItems];
        
        allItems.forEach(item => {
            item.style.display = '';
        });
        
        // Remover mensagem de resultados
        const existingMessage = document.getElementById('filterResultsMessage');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        // Remover mensagem de "nenhum resultado" se existir
        const noResults = document.querySelectorAll('.no-results');
        noResults.forEach(el => {
            // Não remover se for o no-results original da lista vazia
            if (el.id !== 'filterResultsMessage' && !el.closest('.services-list-view, .services-grid-view')) {
                // Este é o no-results original, manter
            } else if (el.id === 'filterResultsMessage') {
                el.remove();
            }
        });
        
        // Atualizar estatísticas (sempre mostra todos os itens, não apenas os visíveis)
        updateStats();
        
        showNotification('Filtros limpos!', 'success');
    }
    
    // Event listeners
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', applyFilters);
    }
    
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', clearFilters);
    }
    
    // Busca em tempo real com debounce
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                applyFilters();
            }, 300); // Aguardar 300ms após parar de digitar
        });
        
        // Aplicar filtro ao pressionar Enter
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                applyFilters();
            }
        });
    }
    
    // Aplicar filtro quando o status mudar
    if (statusFilter) {
        statusFilter.addEventListener('change', applyFilters);    }
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