// ============================================
// GERENCIAMENTO DE CLIENTES/EMPRESAS
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Elementos do DOM
    const addClienteEmpresaBtn = document.getElementById('addClienteEmpresaBtn');
    const addClienteEmpresaModal = document.getElementById('addClienteEmpresaModal');
    const closeAddClienteEmpresaModal = document.getElementById('closeAddClienteEmpresaModal');
    const cancelAddClienteEmpresa = document.getElementById('cancelAddClienteEmpresa');
    const addClienteEmpresaForm = document.getElementById('addClienteEmpresaForm');
    
    const editClienteEmpresaModal = document.getElementById('editClienteEmpresaModal');
    const closeEditClienteEmpresaModal = document.getElementById('closeEditClienteEmpresaModal');
    const cancelEditClienteEmpresa = document.getElementById('cancelEditClienteEmpresa');
    const editClienteEmpresaForm = document.getElementById('editClienteEmpresaForm');
    
    const clienteEmpresaListViewBtn = document.getElementById('clienteEmpresaListViewBtn');
    const clienteEmpresaGridViewBtn = document.getElementById('clienteEmpresaGridViewBtn');
    const clientesEmpresasListView = document.getElementById('clientesEmpresasListView');
    const clientesEmpresasGridView = document.getElementById('clientesEmpresasGridView');
    
    // Filtros
    const clienteEmpresaStatusFilter = document.getElementById('clienteEmpresaStatusFilter');
    const clienteEmpresaSearchFilter = document.getElementById('clienteEmpresaSearchFilter');
    const applyClienteEmpresaFilters = document.getElementById('applyClienteEmpresaFilters');
    const clearClienteEmpresaFilters = document.getElementById('clearClienteEmpresaFilters');
    const refreshClientesEmpresasBtn = document.getElementById('refreshClientesEmpresasBtn');
    
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
    
    function filterClientesEmpresas() {
        const statusFilter = clienteEmpresaStatusFilter.value;
        const searchFilter = clienteEmpresaSearchFilter.value.toLowerCase();
        const clienteEmpresaItems = document.querySelectorAll('.cliente-empresa-item, .cliente-empresa-card');
        
        clienteEmpresaItems.forEach(item => {
            const nome = item.querySelector('.service-name')?.textContent.toLowerCase() || '';
            const cnpj = item.querySelector('.service-description')?.textContent.toLowerCase() || '';
            const status = item.querySelector('.service-status')?.textContent.toLowerCase() || '';
            
            const matchesStatus = statusFilter === 'all' || 
                (statusFilter === 'active' && status.includes('ativo')) ||
                (statusFilter === 'inactive' && status.includes('inativo'));
            
            const matchesSearch = !searchFilter || 
                nome.includes(searchFilter) || 
                cnpj.includes(searchFilter);
            
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
    // MODAL ADICIONAR CLIENTE/EMPRESA
    // ============================================
    
    if (addClienteEmpresaBtn) {
        addClienteEmpresaBtn.addEventListener('click', function() {
            if (addClienteEmpresaModal) {
                addClienteEmpresaModal.classList.add('show');
                addClienteEmpresaForm.reset();
            }
        });
    }
    
    if (closeAddClienteEmpresaModal) {
        closeAddClienteEmpresaModal.addEventListener('click', function() {
            if (addClienteEmpresaModal) {
                addClienteEmpresaModal.classList.remove('show');
            }
        });
    }
    
    if (cancelAddClienteEmpresa) {
        cancelAddClienteEmpresa.addEventListener('click', function() {
            if (addClienteEmpresaModal) {
                addClienteEmpresaModal.classList.remove('show');
            }
        });
    }
    
    // Submeter formulário de adicionar cliente/empresa
    if (addClienteEmpresaForm) {
        addClienteEmpresaForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(addClienteEmpresaForm);
            const data = {
                nome: formData.get('nome'),
                cnpj: formData.get('cnpj') || '',
                ativo: formData.get('ativo')
            };
            
            fetch('/servicos/clientes-empresas/criar/', {
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
                    addClienteEmpresaModal.classList.remove('show');
                    // Atualizar estatísticas antes de recarregar
                    if (typeof updateClientesEmpresasStats === 'function') {
                        updateClientesEmpresasStats();
                    }
                    setTimeout(() => location.reload(), 1000);
                } else {
                    showMessage(result.error || 'Erro ao criar cliente/empresa', 'error');
                }
            })
            .catch(error => {
                console.error('Erro:', error);
                showMessage('Erro ao criar cliente/empresa', 'error');
            });
        });
    }
    
    // ============================================
    // MODAL EDITAR CLIENTE/EMPRESA
    // ============================================
    
    // Event delegation para botões de editar
    document.addEventListener('click', function(e) {
        const editBtn = e.target.closest('.btn-edit[data-cliente-empresa-id]');
        if (editBtn) {
            const clienteEmpresaId = editBtn.getAttribute('data-cliente-empresa-id');
            editarClienteEmpresa(clienteEmpresaId);
        }
        
        const deleteBtn = e.target.closest('.btn-delete[data-cliente-empresa-id]');
        if (deleteBtn) {
            const clienteEmpresaId = deleteBtn.getAttribute('data-cliente-empresa-id');
            deletarClienteEmpresa(clienteEmpresaId);
        }
    });
    
    function editarClienteEmpresa(clienteEmpresaId) {
        // Buscar dados do cliente/empresa via AJAX usando ID específico
        fetch(`/solicitacoes/buscar-clientes-empresas/?id=${clienteEmpresaId}`)
            .then(response => response.json())
            .then(data => {
                if (data.success && data.clientes_empresas && data.clientes_empresas.length > 0) {
                    const clienteEmpresa = data.clientes_empresas[0];
                    
                    // Preencher formulário
                    document.getElementById('editClienteEmpresaId').value = clienteEmpresaId;
                    document.getElementById('editClienteEmpresaNome').value = clienteEmpresa.nome;
                    document.getElementById('editClienteEmpresaCnpj').value = clienteEmpresa.cnpj || '';
                    document.getElementById('editClienteEmpresaAtivo').value = clienteEmpresa.ativo ? 'true' : 'false';
                    document.getElementById('editClienteEmpresaIdDisplay').textContent = clienteEmpresaId;
                    
                    // Abrir modal
                    if (editClienteEmpresaModal) {
                        editClienteEmpresaModal.classList.add('show');
                    }
                } else {
                    showMessage('Cliente/Empresa não encontrado', 'error');
                }
            })
            .catch(error => {
                console.error('Erro ao buscar cliente/empresa:', error);
                // Fallback: tentar buscar do DOM
                const clienteEmpresaItem = document.querySelector(`[data-cliente-empresa-id="${clienteEmpresaId}"]`);
                if (clienteEmpresaItem) {
                    const nome = clienteEmpresaItem.querySelector('.service-name')?.textContent.trim() || '';
                    const descricaoElement = clienteEmpresaItem.querySelector('.service-description');
                    let cnpj = '';
                    if (descricaoElement) {
                        // Clonar elemento para não modificar o original
                        const clone = descricaoElement.cloneNode(true);
                        const iconElement = clone.querySelector('i');
                        if (iconElement) {
                            iconElement.remove();
                        }
                        cnpj = clone.textContent.trim();
                    }
                    const status = clienteEmpresaItem.querySelector('.service-status')?.textContent.trim() || '';
                    const ativo = status.toLowerCase().includes('ativo');
                    
                    document.getElementById('editClienteEmpresaId').value = clienteEmpresaId;
                    document.getElementById('editClienteEmpresaNome').value = nome;
                    document.getElementById('editClienteEmpresaCnpj').value = cnpj;
                    document.getElementById('editClienteEmpresaAtivo').value = ativo ? 'true' : 'false';
                    document.getElementById('editClienteEmpresaIdDisplay').textContent = clienteEmpresaId;
                    
                    if (editClienteEmpresaModal) {
                        editClienteEmpresaModal.classList.add('show');
                    }
                }
            });
    }
    
    if (closeEditClienteEmpresaModal) {
        closeEditClienteEmpresaModal.addEventListener('click', function() {
            if (editClienteEmpresaModal) {
                editClienteEmpresaModal.classList.remove('show');
            }
        });
    }
    
    if (cancelEditClienteEmpresa) {
        cancelEditClienteEmpresa.addEventListener('click', function() {
            if (editClienteEmpresaModal) {
                editClienteEmpresaModal.classList.remove('show');
            }
        });
    }
    
    // Submeter formulário de editar cliente/empresa
    if (editClienteEmpresaForm) {
        editClienteEmpresaForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const clienteEmpresaId = document.getElementById('editClienteEmpresaId').value;
            const data = {
                nome: document.getElementById('editClienteEmpresaNome').value,
                cnpj: document.getElementById('editClienteEmpresaCnpj').value || '',
                ativo: document.getElementById('editClienteEmpresaAtivo').value
            };
            
            fetch(`/servicos/clientes-empresas/editar/${clienteEmpresaId}/`, {
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
                    editClienteEmpresaModal.classList.remove('show');
                    // Atualizar estatísticas antes de recarregar
                    if (typeof updateClientesEmpresasStats === 'function') {
                        updateClientesEmpresasStats();
                    }
                    setTimeout(() => location.reload(), 1000);
                } else {
                    showMessage(result.error || 'Erro ao atualizar cliente/empresa', 'error');
                }
            })
            .catch(error => {
                console.error('Erro:', error);
                showMessage('Erro ao atualizar cliente/empresa', 'error');
            });
        });
    }
    
    // ============================================
    // DELETAR CLIENTE/EMPRESA
    // ============================================
    
    function deletarClienteEmpresa(clienteEmpresaId) {
        const clienteEmpresaItem = document.querySelector(`[data-cliente-empresa-id="${clienteEmpresaId}"]`);
        const nome = clienteEmpresaItem?.querySelector('.service-name')?.textContent.trim() || 'este cliente/empresa';
        
        if (!confirm(`Tem certeza que deseja deletar o cliente/empresa "${nome}"?`)) {
            return;
        }
        
        fetch(`/servicos/clientes-empresas/deletar/${clienteEmpresaId}/`, {
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
                if (typeof updateClientesEmpresasStats === 'function') {
                    updateClientesEmpresasStats();
                }
                setTimeout(() => location.reload(), 1000);
            } else {
                showMessage(result.error || 'Erro ao deletar cliente/empresa', 'error');
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            showMessage('Erro ao deletar cliente/empresa', 'error');
        });
    }
    
    // ============================================
    // VISUALIZAÇÃO (LISTA/GRID)
    // ============================================
    
    if (clienteEmpresaListViewBtn) {
        clienteEmpresaListViewBtn.addEventListener('click', function() {
            clienteEmpresaListViewBtn.classList.add('active');
            clienteEmpresaGridViewBtn.classList.remove('active');
            clientesEmpresasListView.style.display = '';
            clientesEmpresasGridView.style.display = 'none';
        });
    }
    
    if (clienteEmpresaGridViewBtn) {
        clienteEmpresaGridViewBtn.addEventListener('click', function() {
            clienteEmpresaGridViewBtn.classList.add('active');
            clienteEmpresaListViewBtn.classList.remove('active');
            clientesEmpresasListView.style.display = 'none';
            clientesEmpresasGridView.style.display = '';
        });
    }
    
    // ============================================
    // FILTROS
    // ============================================
    
    if (applyClienteEmpresaFilters) {
        applyClienteEmpresaFilters.addEventListener('click', filterClientesEmpresas);
    }
    
    if (clearClienteEmpresaFilters) {
        clearClienteEmpresaFilters.addEventListener('click', function() {
            clienteEmpresaStatusFilter.value = 'all';
            clienteEmpresaSearchFilter.value = '';
            filterClientesEmpresas();
        });
    }
    
    if (clienteEmpresaSearchFilter) {
        clienteEmpresaSearchFilter.addEventListener('input', filterClientesEmpresas);
    }
    
    if (clienteEmpresaStatusFilter) {
        clienteEmpresaStatusFilter.addEventListener('change', filterClientesEmpresas);
    }
    
    if (refreshClientesEmpresasBtn) {
        refreshClientesEmpresasBtn.addEventListener('click', function() {
            location.reload();
        });
    }
    
    // Função para atualizar estatísticas de clientes/empresas
    function updateClientesEmpresasStats() {
        const totalClientesEmpresasEl = document.getElementById('totalClientesEmpresas');
        const activeClientesEmpresasEl = document.getElementById('activeClientesEmpresas');
        
        // Contar TODOS os clientes/empresas do HTML (independente de filtros)
        const allClienteEmpresaItems = document.querySelectorAll('.cliente-empresa-item, .cliente-empresa-card');
        
        // Contar todos os clientes/empresas (total)
        const totalCount = allClienteEmpresaItems.length;
        
        // Contar todos os ativos (independente de visibilidade)
        const activeCount = Array.from(allClienteEmpresaItems).filter(item => {
            const statusEl = item.querySelector('.service-status');
            return statusEl && statusEl.classList.contains('active');
        }).length;
        
        if (totalClientesEmpresasEl) {
            totalClientesEmpresasEl.textContent = totalCount;
        }
        
        if (activeClientesEmpresasEl) {
            activeClientesEmpresasEl.textContent = activeCount;
        }
    }
    
    // Atualizar estatísticas ao carregar a página
    updateClientesEmpresasStats();
    
    // Atualizar estatísticas após operações CRUD
    // Usar event delegation para detectar mudanças na lista
    const observer = new MutationObserver(function(mutations) {
        updateClientesEmpresasStats();
    });
    
    const clientesEmpresasList = document.getElementById('clientesEmpresasList');
    if (clientesEmpresasList) {
        observer.observe(clientesEmpresasList, {
            childList: true,
            subtree: true
        });
    }
    
    // Fechar modais ao clicar fora
    if (addClienteEmpresaModal) {
        addClienteEmpresaModal.addEventListener('click', function(e) {
            if (e.target === addClienteEmpresaModal) {
                addClienteEmpresaModal.classList.remove('show');
            }
        });
    }
    
    if (editClienteEmpresaModal) {
        editClienteEmpresaModal.addEventListener('click', function(e) {
            if (e.target === editClienteEmpresaModal) {
                editClienteEmpresaModal.classList.remove('show');
            }
        });
    }
});

