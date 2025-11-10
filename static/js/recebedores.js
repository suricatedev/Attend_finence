// ============================================
// GERENCIAMENTO DE RECEBEDORES
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Elementos do DOM
    const addRecebedorBtn = document.getElementById('addRecebedorBtn');
    const addRecebedorModal = document.getElementById('addRecebedorModal');
    const closeAddRecebedorModal = document.getElementById('closeAddRecebedorModal');
    const cancelAddRecebedor = document.getElementById('cancelAddRecebedor');
    const addRecebedorForm = document.getElementById('addRecebedorForm');
    
    const editRecebedorModal = document.getElementById('editRecebedorModal');
    const closeEditRecebedorModal = document.getElementById('closeEditRecebedorModal');
    const cancelEditRecebedor = document.getElementById('cancelEditRecebedor');
    const editRecebedorForm = document.getElementById('editRecebedorForm');
    const toggleRecebedorStatus = document.getElementById('toggleRecebedorStatus');
    
    const recebedorListViewBtn = document.getElementById('recebedorListViewBtn');
    const recebedorGridViewBtn = document.getElementById('recebedorGridViewBtn');
    const recebedoresListView = document.getElementById('recebedoresListView');
    const recebedoresGridView = document.getElementById('recebedoresGridView');
    
    // Filtros
    const recebedorStatusFilter = document.getElementById('recebedorStatusFilter');
    const recebedorSearchFilter = document.getElementById('recebedorSearchFilter');
    const applyRecebedorFilters = document.getElementById('applyRecebedorFilters');
    const clearRecebedorFilters = document.getElementById('clearRecebedorFilters');
    const refreshRecebedoresBtn = document.getElementById('refreshRecebedoresBtn');
    
    // ============================================
    // FUNÇÕES AUXILIARES
    // ============================================
    
    function getCsrfToken() {
        return document.querySelector('[name=csrfmiddlewaretoken]')?.value || '';
    }
    
    function showMessage(message, type = 'success') {
        // Criar elemento de mensagem
        const messageDiv = document.createElement('div');
        messageDiv.className = `alert alert-${type}`;
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            background: ${type === 'success' ? '#d4edda' : '#f8d7da'};
            color: ${type === 'success' ? '#155724' : '#721c24'};
            border: 1px solid ${type === 'success' ? '#c3e6cb' : '#f5c6cb'};
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10001;
            animation: slideInRight 0.3s ease-out;
        `;
        messageDiv.textContent = message;
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => messageDiv.remove(), 300);
        }, 3000);
    }
    
    function filterRecebedores() {
        const statusFilter = recebedorStatusFilter.value;
        const searchFilter = recebedorSearchFilter.value.toLowerCase();
        const recebedorItems = document.querySelectorAll('.recebedor-item, .recebedor-card');
        
        recebedorItems.forEach(item => {
            const nome = item.querySelector('.service-name')?.textContent.toLowerCase() || '';
            const chavePix = item.querySelector('.service-description')?.textContent.toLowerCase() || '';
            const status = item.querySelector('.service-status')?.textContent.toLowerCase() || '';
            
            const matchesStatus = statusFilter === 'all' || 
                (statusFilter === 'active' && status.includes('ativo')) ||
                (statusFilter === 'inactive' && status.includes('inativo'));
            
            const matchesSearch = !searchFilter || 
                nome.includes(searchFilter) || 
                chavePix.includes(searchFilter);
            
            if (matchesStatus && matchesSearch) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });
        
        // NÃO atualizar estatísticas aqui - elas devem mostrar o total real, não os filtrados
        // As estatísticas devem sempre mostrar todos os itens do banco de dados
    }
    
    // ============================================
    // MODAL ADICIONAR RECEBEDOR
    // ============================================
    
    if (addRecebedorBtn) {
        addRecebedorBtn.addEventListener('click', function() {
            if (addRecebedorModal) {
                addRecebedorModal.classList.add('show');
                addRecebedorForm.reset();
            }
        });
    }
    
    if (closeAddRecebedorModal) {
        closeAddRecebedorModal.addEventListener('click', function() {
            if (addRecebedorModal) {
                addRecebedorModal.classList.remove('show');
            }
        });
    }
    
    if (cancelAddRecebedor) {
        cancelAddRecebedor.addEventListener('click', function() {
            if (addRecebedorModal) {
                addRecebedorModal.classList.remove('show');
            }
        });
    }
    
    // Submeter formulário de adicionar recebedor
    if (addRecebedorForm) {
        addRecebedorForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(addRecebedorForm);
            const data = {
                nome: formData.get('nome'),
                chave_pix: formData.get('chave_pix'),
                ativo: formData.get('ativo')
            };
            
            fetch('/servicos/recebedores/criar/', {
                method: 'POST',
                headers: {
                    'X-CSRFToken': getCsrfToken(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            })
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    showMessage(result.message, 'success');
                    addRecebedorModal.classList.remove('show');
                    // Atualizar estatísticas antes de recarregar
                    if (typeof updateRecebedoresStats === 'function') {
                        updateRecebedoresStats();
                    }
                    setTimeout(() => location.reload(), 1000);
                } else {
                    showMessage(result.error || 'Erro ao criar recebedor', 'error');
                }
            })
            .catch(error => {
                console.error('Erro:', error);
                showMessage('Erro ao criar recebedor', 'error');
            });
        });
    }
    
    // ============================================
    // MODAL EDITAR RECEBEDOR
    // ============================================
    
    // Event delegation para botões de editar
    document.addEventListener('click', function(e) {
        const editBtn = e.target.closest('.btn-edit[data-recebedor-id]');
        if (editBtn) {
            const recebedorId = editBtn.getAttribute('data-recebedor-id');
            editarRecebedor(recebedorId);
        }
        
        const deleteBtn = e.target.closest('.btn-delete[data-recebedor-id]');
        if (deleteBtn) {
            const recebedorId = deleteBtn.getAttribute('data-recebedor-id');
            deletarRecebedor(recebedorId);
        }
    });
    
    function editarRecebedor(recebedorId) {
        // Buscar dados do recebedor via AJAX usando ID específico
        fetch(`/solicitacoes/buscar-recebedores/?id=${recebedorId}`)
            .then(response => response.json())
            .then(data => {
                if (data.success && data.recebedores && data.recebedores.length > 0) {
                    const recebedor = data.recebedores[0];
                    
                    // Preencher formulário
                    document.getElementById('editRecebedorId').value = recebedorId;
                    document.getElementById('editRecebedorNome').value = recebedor.nome;
                    document.getElementById('editRecebedorChavePix').value = recebedor.chave_pix;
                    document.getElementById('editRecebedorAtivo').value = recebedor.ativo ? 'true' : 'false';
                    document.getElementById('editRecebedorIdDisplay').textContent = recebedorId;
                    
                    // Abrir modal
                    if (editRecebedorModal) {
                        editRecebedorModal.classList.add('show');
                    }
                } else {
                    showMessage('Recebedor não encontrado', 'error');
                }
            })
            .catch(error => {
                console.error('Erro ao buscar recebedor:', error);
                // Fallback: tentar buscar do DOM
                const recebedorItem = document.querySelector(`[data-recebedor-id="${recebedorId}"]`);
                if (recebedorItem) {
                    const nome = recebedorItem.querySelector('.service-name')?.textContent.trim() || '';
                    const descricaoElement = recebedorItem.querySelector('.service-description');
                    let chavePix = '';
                    if (descricaoElement) {
                        // Clonar elemento para não modificar o original
                        const clone = descricaoElement.cloneNode(true);
                        const iconElement = clone.querySelector('i');
                        if (iconElement) {
                            iconElement.remove();
                        }
                        chavePix = clone.textContent.trim();
                    }
                    const status = recebedorItem.querySelector('.service-status')?.textContent.trim() || '';
                    const ativo = status.toLowerCase().includes('ativo');
                    
                    document.getElementById('editRecebedorId').value = recebedorId;
                    document.getElementById('editRecebedorNome').value = nome;
                    document.getElementById('editRecebedorChavePix').value = chavePix;
                    document.getElementById('editRecebedorAtivo').value = ativo ? 'true' : 'false';
                    document.getElementById('editRecebedorIdDisplay').textContent = recebedorId;
                    
                    if (editRecebedorModal) {
                        editRecebedorModal.classList.add('show');
                    }
                }
            });
    }
    
    if (closeEditRecebedorModal) {
        closeEditRecebedorModal.addEventListener('click', function() {
            if (editRecebedorModal) {
                editRecebedorModal.classList.remove('show');
            }
        });
    }
    
    if (cancelEditRecebedor) {
        cancelEditRecebedor.addEventListener('click', function() {
            if (editRecebedorModal) {
                editRecebedorModal.classList.remove('show');
            }
        });
    }
    
    // Submeter formulário de editar recebedor
    if (editRecebedorForm) {
        editRecebedorForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const recebedorId = document.getElementById('editRecebedorId').value;
            const data = {
                nome: document.getElementById('editRecebedorNome').value,
                chave_pix: document.getElementById('editRecebedorChavePix').value,
                ativo: document.getElementById('editRecebedorAtivo').value
            };
            
            fetch(`/servicos/recebedores/editar/${recebedorId}/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': getCsrfToken(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            })
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    showMessage(result.message, 'success');
                    editRecebedorModal.classList.remove('show');
                    // Atualizar estatísticas antes de recarregar
                    if (typeof updateRecebedoresStats === 'function') {
                        updateRecebedoresStats();
                    }
                    setTimeout(() => location.reload(), 1000);
                } else {
                    showMessage(result.error || 'Erro ao atualizar recebedor', 'error');
                }
            })
            .catch(error => {
                console.error('Erro:', error);
                showMessage('Erro ao atualizar recebedor', 'error');
            });
        });
    }
    
    // Toggle status do recebedor
    if (toggleRecebedorStatus) {
        toggleRecebedorStatus.addEventListener('click', function() {
            const ativoSelect = document.getElementById('editRecebedorAtivo');
            const currentValue = ativoSelect.value;
            ativoSelect.value = currentValue === 'true' ? 'false' : 'true';
        });
    }
    
    // ============================================
    // DELETAR RECEBEDOR
    // ============================================
    
    function deletarRecebedor(recebedorId) {
        const recebedorItem = document.querySelector(`[data-recebedor-id="${recebedorId}"]`);
        const nome = recebedorItem?.querySelector('.service-name')?.textContent.trim() || 'este recebedor';
        
        if (!confirm(`Tem certeza que deseja deletar o recebedor "${nome}"?`)) {
            return;
        }
        
        fetch(`/servicos/recebedores/deletar/${recebedorId}/`, {
            method: 'DELETE',
            headers: {
                'X-CSRFToken': getCsrfToken(),
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                showMessage(result.message, 'success');
                // Atualizar estatísticas antes de recarregar
                if (typeof updateRecebedoresStats === 'function') {
                    updateRecebedoresStats();
                }
                setTimeout(() => location.reload(), 1000);
            } else {
                showMessage(result.error || 'Erro ao deletar recebedor', 'error');
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            showMessage('Erro ao deletar recebedor', 'error');
        });
    }
    
    // ============================================
    // VISUALIZAÇÃO (LISTA/GRID)
    // ============================================
    
    if (recebedorListViewBtn) {
        recebedorListViewBtn.addEventListener('click', function() {
            recebedorListViewBtn.classList.add('active');
            recebedorGridViewBtn.classList.remove('active');
            recebedoresListView.style.display = '';
            recebedoresGridView.style.display = 'none';
        });
    }
    
    if (recebedorGridViewBtn) {
        recebedorGridViewBtn.addEventListener('click', function() {
            recebedorGridViewBtn.classList.add('active');
            recebedorListViewBtn.classList.remove('active');
            recebedoresListView.style.display = 'none';
            recebedoresGridView.style.display = '';
        });
    }
    
    // ============================================
    // FILTROS
    // ============================================
    
    if (applyRecebedorFilters) {
        applyRecebedorFilters.addEventListener('click', filterRecebedores);
    }
    
    if (clearRecebedorFilters) {
        clearRecebedorFilters.addEventListener('click', function() {
            recebedorStatusFilter.value = 'all';
            recebedorSearchFilter.value = '';
            filterRecebedores();
        });
    }
    
    if (recebedorSearchFilter) {
        recebedorSearchFilter.addEventListener('input', filterRecebedores);
    }
    
    if (recebedorStatusFilter) {
        recebedorStatusFilter.addEventListener('change', filterRecebedores);
    }
    
    if (refreshRecebedoresBtn) {
        refreshRecebedoresBtn.addEventListener('click', function() {
            location.reload();
        });
    }
    
    // Função para atualizar estatísticas de recebedores
    function updateRecebedoresStats() {
        const totalRecebedoresEl = document.getElementById('totalRecebedores');
        const activeRecebedoresEl = document.getElementById('activeRecebedores');
        
        // Contar TODOS os recebedores do HTML (independente de filtros)
        const allRecebedorItems = document.querySelectorAll('.recebedor-item, .recebedor-card');
        
        // Contar todos os recebedores (total)
        const totalCount = allRecebedorItems.length;
        
        // Contar todos os ativos (independente de visibilidade)
        const activeCount = Array.from(allRecebedorItems).filter(item => {
            const statusEl = item.querySelector('.service-status');
            return statusEl && statusEl.classList.contains('active');
        }).length;
        
        if (totalRecebedoresEl) {
            totalRecebedoresEl.textContent = totalCount;
        }
        
        if (activeRecebedoresEl) {
            activeRecebedoresEl.textContent = activeCount;
        }
    }
    
    // Atualizar estatísticas ao carregar a página
    updateRecebedoresStats();
    
    // Atualizar estatísticas após operações CRUD
    // Usar event delegation para detectar mudanças na lista
    const observer = new MutationObserver(function(mutations) {
        updateRecebedoresStats();
    });
    
    const recebedoresList = document.getElementById('recebedoresList');
    if (recebedoresList) {
        observer.observe(recebedoresList, {
            childList: true,
            subtree: true
        });
    }
    
    // Fechar modais ao clicar fora
    if (addRecebedorModal) {
        addRecebedorModal.addEventListener('click', function(e) {
            if (e.target === addRecebedorModal) {
                addRecebedorModal.classList.remove('show');
            }
        });
    }
    
    if (editRecebedorModal) {
        editRecebedorModal.addEventListener('click', function(e) {
            if (e.target === editRecebedorModal) {
                editRecebedorModal.classList.remove('show');
            }
        });
    }
});

