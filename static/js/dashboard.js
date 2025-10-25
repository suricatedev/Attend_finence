// Dashboard JavaScript - Sistema Financeiro

document.addEventListener('DOMContentLoaded', function() {
    // Elementos da interface
    const kanbanBoard = document.getElementById('kanbanBoard');
    const dashboardView = document.getElementById('dashboardView');
    const reportsModal = document.getElementById('reportsModal');
    
    // Botões de navegação
    const cardsTab = document.querySelector('[data-view="kanban"]');
    const dashboardTab = document.querySelector('[data-view="dashboard"]');
    const reportsTab = document.querySelector('[data-view="reports"]');
    
    // Função para alternar entre views
    function switchView(view) {
        // Esconder todas as views
        kanbanBoard.style.display = 'none';
        dashboardView.style.display = 'none';
        
        // Remover classe active de todos os tabs
        document.querySelectorAll('.tab-btn').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Mostrar view selecionada
        switch(view) {
            case 'kanban':
                kanbanBoard.style.display = 'block';
                cardsTab.classList.add('active');
                break;
            case 'dashboard':
                dashboardView.style.display = 'block';
                dashboardTab.classList.add('active');
                initializeDashboard();
                break;
            case 'reports':
                reportsModal.style.display = 'flex';
                reportsTab.classList.add('active');
                break;
        }
    }
    
    // Event listeners para os tabs
    if (cardsTab) {
        cardsTab.addEventListener('click', () => switchView('kanban'));
    }
    
    if (dashboardTab) {
        dashboardTab.addEventListener('click', () => switchView('dashboard'));
    }
    
    if (reportsTab) {
        reportsTab.addEventListener('click', () => switchView('reports'));
    }
    
    // Inicializar dashboard
    function initializeDashboard() {
        // Animar métricas
        animateMetrics();
        
        // Inicializar gráficos
        initializeCharts();
        
        // Inicializar interatividade
        initializeDonutInteractivity();
        initializeBarInteractivity();
        
        // Inicializar rolagem
        initializeScrollBehavior();
        
        // Inicializar seletor de período
        initializePeriodSelector();
        
        // Atualizar dados em tempo real
        updateDashboardData();
        
        // Adicionar efeitos de entrada
        addEntranceEffects();
    }
    
    // Inicializar comportamento de rolagem
    function initializeScrollBehavior() {
        const dashboardView = document.getElementById('dashboardView');
        
        if (dashboardView) {
            // Adicionar listener para rolagem suave
            dashboardView.addEventListener('scroll', function() {
                // Adicionar efeito de parallax sutil
                const scrolled = dashboardView.scrollTop;
                const parallaxElements = document.querySelectorAll('.metric-card, .chart-card');
                
                parallaxElements.forEach((element, index) => {
                    const speed = 0.1 + (index * 0.05);
                    element.style.transform = `translateY(${scrolled * speed}px)`;
                });
            });
            
            // Adicionar botão de voltar ao topo
            addScrollToTopButton();
        }
    }
    
    // Adicionar botão de voltar ao topo
    function addScrollToTopButton() {
        const dashboardView = document.getElementById('dashboardView');
        
        // Criar botão
        const scrollButton = document.createElement('div');
        scrollButton.className = 'scroll-to-top';
        scrollButton.innerHTML = '<i class="fas fa-arrow-up"></i>';
        scrollButton.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 50px;
            height: 50px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            cursor: pointer;
            opacity: 0;
            transform: translateY(20px);
            transition: all 0.3s ease;
            z-index: 1000;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
        `;
        
        // Adicionar ao dashboard
        dashboardView.appendChild(scrollButton);
        
        // Mostrar/esconder botão baseado na rolagem
        dashboardView.addEventListener('scroll', function() {
            if (dashboardView.scrollTop > 300) {
                scrollButton.style.opacity = '1';
                scrollButton.style.transform = 'translateY(0)';
            } else {
                scrollButton.style.opacity = '0';
                scrollButton.style.transform = 'translateY(20px)';
            }
        });
        
        // Funcionalidade do botão
        scrollButton.addEventListener('click', function() {
            dashboardView.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
        
        // Hover effect
        scrollButton.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(0) scale(1.1)';
            this.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)';
        });
        
        scrollButton.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
            this.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)';
        });
    }
    
    // Inicializar seletor de período
    function initializePeriodSelector() {
        const periodSelect = document.getElementById('periodSelect');
        
        if (periodSelect) {
            periodSelect.addEventListener('change', function() {
                const selectedPeriod = this.value;
                updateChartForPeriod(selectedPeriod);
            });
        }
    }
    
    // Atualizar gráfico baseado no período selecionado
    function updateChartForPeriod(period) {
        const mainChart = document.getElementById('mainChart');
        if (mainChart) {
            // Aqui você pode implementar lógica para diferentes períodos
            // Por enquanto, vamos apenas redesenhar o gráfico
            drawMainChart(mainChart);
            
            // Atualizar estatísticas baseadas no período
            updateStatsForPeriod(period);
        }
    }
    
    // Atualizar estatísticas baseadas no período
    function updateStatsForPeriod(period) {
        const stats = {
            yearly: { created: 1240, approved: 1080, rate: '87.1%' },
            monthly: { created: 342, approved: 298, rate: '87.1%' },
            weekly: { created: 85, approved: 74, rate: '87.1%' }
        };
        
        const currentStats = stats[period] || stats.monthly;
        
        document.getElementById('totalCreated').textContent = currentStats.created;
        document.getElementById('totalApproved').textContent = currentStats.approved;
        document.getElementById('approvalRate').textContent = currentStats.rate;
    }
    
    // Adicionar efeitos de entrada
    function addEntranceEffects() {
        const elements = document.querySelectorAll('.metric-card, .chart-card, .chart-section');
        elements.forEach((element, index) => {
            element.style.opacity = '0';
            element.style.transform = 'translateY(30px)';
            
            setTimeout(() => {
                element.style.transition = 'all 0.6s ease';
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }
    
    // Animar métricas
    function animateMetrics() {
        const metricValues = document.querySelectorAll('.metric-value');
        metricValues.forEach(metric => {
            const finalValue = metric.textContent;
            const isNumber = !isNaN(parseFloat(finalValue.replace(/[^\d.-]/g, '')));
            
            if (isNumber) {
                const numericValue = parseFloat(finalValue.replace(/[^\d.-]/g, ''));
                animateNumber(metric, 0, numericValue, 2000);
            }
        });
    }
    
    // Animação de números
    function animateNumber(element, start, end, duration) {
        const startTime = performance.now();
        const isCurrency = element.textContent.includes('R$');
        const isTime = element.textContent.includes('d') || element.textContent.includes('h');
        
        function updateNumber(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const current = start + (end - start) * easeOutCubic(progress);
            
            if (isCurrency) {
                element.textContent = `R$ ${(current / 1000000).toFixed(1)}M`;
            } else if (isTime) {
                const days = Math.floor(current / 24);
                const hours = Math.floor(current % 24);
                element.textContent = `${days}d ${hours}h`;
            } else {
                element.textContent = Math.floor(current).toString();
            }
            
            if (progress < 1) {
                requestAnimationFrame(updateNumber);
            }
        }
        
        requestAnimationFrame(updateNumber);
    }
    
    // Easing function
    function easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }
    
    // Inicializar gráficos
    function initializeCharts() {
        // Gráfico principal (simulado)
        const mainChart = document.getElementById('mainChart');
        if (mainChart) {
            drawMainChart(mainChart);
        }
        
        // Animar barras
        animateBars();
    }
    
    // Desenhar gráfico principal
    function drawMainChart(canvas) {
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        
        // Limpar canvas
        ctx.clearRect(0, 0, width, height);
        
        // Dados simulados mais realistas
        const data = {
            labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
            created: [45, 52, 38, 61, 55, 48, 42, 58, 65, 52, 48, 41],
            approved: [38, 45, 32, 52, 48, 42, 35, 49, 58, 45, 41, 35]
        };
        
        // Configurações
        const padding = 60;
        const chartWidth = width - padding * 2;
        const chartHeight = height - padding * 2;
        
        // Desenhar grid
        drawGrid(ctx, padding, chartWidth, chartHeight, width, height);
        
        // Desenhar eixos
        drawAxes(ctx, padding, chartWidth, chartHeight, data.labels);
        
        // Gradiente de fundo
        const gradient = ctx.createLinearGradient(0, padding, 0, height - padding);
        gradient.addColorStop(0, 'rgba(102, 126, 234, 0.2)');
        gradient.addColorStop(1, 'rgba(102, 126, 234, 0.05)');
        
        // Desenhar área de fundo com gradiente
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(padding, height - padding);
        
        for (let i = 0; i < data.approved.length; i++) {
            const x = padding + (chartWidth / (data.approved.length - 1)) * i;
            const y = height - padding - (data.approved[i] / 70) * chartHeight;
            ctx.lineTo(x, y);
        }
        
        ctx.lineTo(padding + chartWidth, height - padding);
        ctx.closePath();
        ctx.fill();
        
        // Desenhar linha de dados aprovados com gradiente
        const lineGradient = ctx.createLinearGradient(0, 0, chartWidth, 0);
        lineGradient.addColorStop(0, '#28a745');
        lineGradient.addColorStop(1, '#20c997');
        
        ctx.strokeStyle = lineGradient;
        ctx.lineWidth = 3;
        ctx.shadowColor = 'rgba(40, 167, 69, 0.3)';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        
        for (let i = 0; i < data.approved.length; i++) {
            const x = padding + (chartWidth / (data.approved.length - 1)) * i;
            const y = height - padding - (data.approved[i] / 70) * chartHeight;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        // Desenhar linha de dados criados
        ctx.strokeStyle = '#ffc107';
        ctx.setLineDash([5, 5]);
        ctx.shadowColor = 'rgba(255, 193, 7, 0.3)';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        
        for (let i = 0; i < data.created.length; i++) {
            const x = padding + (chartWidth / (data.created.length - 1)) * i;
            const y = height - padding - (data.created[i] / 70) * chartHeight;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.shadowBlur = 0;
        
        // Desenhar pontos com animação
        data.approved.forEach((value, i) => {
            const x = padding + (chartWidth / (data.approved.length - 1)) * i;
            const y = height - padding - (value / 70) * chartHeight;
            
            // Gradiente para os pontos
            const pointGradient = ctx.createRadialGradient(x, y, 0, x, y, 6);
            pointGradient.addColorStop(0, '#28a745');
            pointGradient.addColorStop(1, '#20c997');
            
            ctx.fillStyle = pointGradient;
            ctx.shadowColor = 'rgba(40, 167, 69, 0.5)';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        });
        
        // Adicionar interatividade com tooltip
        const tooltip = document.getElementById('chartTooltip');
        let hoveredPoint = -1;
        
        canvas.addEventListener('mousemove', function(e) {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            let foundPoint = false;
            
            // Verificar se o mouse está sobre um ponto
            data.approved.forEach((value, i) => {
                const pointX = padding + (chartWidth / (data.approved.length - 1)) * i;
                const pointY = height - padding - (value / 70) * chartHeight;
                
                const distance = Math.sqrt((x - pointX) ** 2 + (y - pointY) ** 2);
                
                if (distance < 15) {
                    canvas.style.cursor = 'pointer';
                    foundPoint = true;
                    
                    if (hoveredPoint !== i) {
                        hoveredPoint = i;
                        showTooltip(e, data.labels[i], value, data.created[i]);
                    }
                }
            });
            
            if (!foundPoint) {
                canvas.style.cursor = 'default';
                hideTooltip();
                hoveredPoint = -1;
            }
        });
        
        canvas.addEventListener('mouseleave', function() {
            hideTooltip();
            hoveredPoint = -1;
        });
        
        function showTooltip(event, label, approved, created) {
            const monthNames = {
                'Jan': 'Janeiro', 'Fev': 'Fevereiro', 'Mar': 'Março', 'Abr': 'Abril',
                'Mai': 'Maio', 'Jun': 'Junho', 'Jul': 'Julho', 'Ago': 'Agosto',
                'Set': 'Setembro', 'Out': 'Outubro', 'Nov': 'Novembro', 'Dez': 'Dezembro'
            };
            
            tooltip.innerHTML = `
                <div class="tooltip-header">${monthNames[label] || label} 2024</div>
                <div class="tooltip-content">
                    <div class="tooltip-item">
                        <span class="tooltip-label">Solicitações</span>
                        <span class="tooltip-value">${approved}</span>
                    </div>
                </div>
            `;
            
            tooltip.classList.add('show');
            
            // Posicionar tooltip acima do ponto
            const rect = canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            
            tooltip.style.left = (x - 60) + 'px';
            tooltip.style.top = (y - 60) + 'px';
        }
        
        function hideTooltip() {
            tooltip.classList.remove('show');
        }
    }
    
    // Desenhar grid do gráfico
    function drawGrid(ctx, padding, chartWidth, chartHeight, width, height) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        
        // Linhas horizontais (valores Y)
        const maxValue = 70;
        const stepCount = 7;
        const stepValue = maxValue / stepCount;
        
        for (let i = 0; i <= stepCount; i++) {
            const y = padding + (chartHeight / stepCount) * i;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(width - padding, y);
            ctx.stroke();
            
            // Labels do eixo Y
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.font = '12px Inter, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(Math.round(stepValue * (stepCount - i)).toString(), padding - 10, y + 4);
        }
        
        // Linhas verticais (meses)
        const monthCount = 12;
        for (let i = 0; i <= monthCount; i++) {
            const x = padding + (chartWidth / monthCount) * i;
            ctx.beginPath();
            ctx.moveTo(x, padding);
            ctx.lineTo(x, height - padding);
            ctx.stroke();
        }
    }
    
    // Desenhar eixos
    function drawAxes(ctx, padding, chartWidth, chartHeight, labels) {
        // Eixo Y (valores)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, padding + chartHeight);
        ctx.stroke();
        
        // Eixo X (meses)
        ctx.beginPath();
        ctx.moveTo(padding, padding + chartHeight);
        ctx.lineTo(padding + chartWidth, padding + chartHeight);
        ctx.stroke();
        
        // Labels do eixo X
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = '12px Inter, sans-serif';
        ctx.textAlign = 'center';
        
        labels.forEach((label, index) => {
            const x = padding + (chartWidth / (labels.length - 1)) * index;
            ctx.fillText(label, x, padding + chartHeight + 20);
        });
    }
    
    // Animar barras
    function animateBars() {
        const bars = document.querySelectorAll('.bar-fill, .week-value');
        bars.forEach((bar, index) => {
            const targetWidth = bar.style.width || bar.style.height;
            bar.style.width = '0%';
            bar.style.height = '0%';
            
            setTimeout(() => {
                bar.style.transition = 'all 0.8s ease';
                bar.style.width = targetWidth;
                bar.style.height = targetWidth;
            }, index * 100);
        });
    }
    
    // Atualizar dados do dashboard
    function updateDashboardData() {
        // Simular atualização de dados
        setInterval(() => {
            try {
                // Atualizar métricas
                updateMetrics();
                // Atualizar gráficos
                updateCharts();
            } catch (error) {
                console.error('Erro ao atualizar dados do dashboard:', error);
            }
        }, 30000); // Atualizar a cada 30 segundos
    }
    
    // Atualizar gráficos
    function updateCharts() {
        // Atualizar dados do gráfico principal
        const mainChart = document.getElementById('mainChart');
        if (mainChart) {
            drawMainChart(mainChart);
        }
        
        // Atualizar animações
        animateBars();
    }
    
    // Adicionar interatividade aos gráficos de rosca
    function initializeDonutInteractivity() {
        const legendItems = document.querySelectorAll('.donut-legend .legend-item');
        legendItems.forEach((item, index) => {
            item.addEventListener('click', function() {
                // Destacar segmento clicado
                legendItems.forEach(l => l.classList.remove('active'));
                this.classList.add('active');
                
                // Animar gráfico
                const donutChart = document.querySelector('.donut-chart');
                donutChart.style.transform = 'scale(1.05)';
                setTimeout(() => {
                    donutChart.style.transform = 'scale(1)';
                }, 200);
            });
        });
    }
    
    // Adicionar interatividade às barras
    function initializeBarInteractivity() {
        const barItems = document.querySelectorAll('.bar-item');
        barItems.forEach((item, index) => {
            item.addEventListener('click', function() {
                // Destacar barra clicada
                barItems.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                
                // Mostrar detalhes
                showBarDetails(this, index);
            });
        });
    }
    
    function showBarDetails(barItem, index) {
        const departments = ['TI', 'Financeiro', 'RH', 'Marketing'];
        const values = ['R$ 1.2M', 'R$ 980K', 'R$ 650K', 'R$ 420K'];
        const changes = ['+12%', '+8%', '-3%', '+15%'];
        
        // Criar modal ou tooltip com detalhes
        console.log(`Detalhes do ${departments[index]}: ${values[index]} (${changes[index]})`);
    }
    
    // Atualizar métricas
    function updateMetrics() {
        const metricValues = document.querySelectorAll('.metric-value');
        metricValues.forEach(metric => {
            // Simular pequenas variações nos dados
            const currentValue = metric.textContent;
            if (currentValue.includes('R$')) {
                // Atualizar valor monetário
                const baseValue = 2.4;
                const variation = (Math.random() - 0.5) * 0.1;
                const newValue = (baseValue + variation).toFixed(1);
                metric.textContent = `R$ ${newValue}M`;
            } else if (currentValue.includes('d')) {
                // Atualizar tempo
                const days = Math.floor(Math.random() * 3) + 1;
                const hours = Math.floor(Math.random() * 24);
                metric.textContent = `${days}d ${hours}h`;
            } else if (!isNaN(parseInt(currentValue))) {
                // Atualizar números
                const current = parseInt(currentValue);
                const variation = Math.floor((Math.random() - 0.5) * 5);
                const newValue = Math.max(0, current + variation);
                metric.textContent = newValue.toString();
            }
        });
    }
    
    // Inicializar com view padrão
    if (kanbanBoard) {
        switchView('kanban');
    }
});

// Função para exportar dados do dashboard
function exportDashboardData(format) {
    const data = {
        metrics: {
            avgApprovalTime: '2d 14h',
            avgResolutionTime: '1d 8h',
            pendingRequests: 47,
            totalProcessed: 'R$ 2.4M'
        },
        charts: {
            monthlyFlow: 'Dados do fluxo mensal',
            statusDistribution: 'Distribuição por status',
            departmentValues: 'Valores por departamento',
            weeklyPattern: 'Padrão semanal'
        }
    };
    
    if (format === 'pdf') {
        // Simular exportação PDF
        console.log('Exportando dashboard para PDF...', data);
        alert('Dashboard exportado para PDF com sucesso!');
    } else if (format === 'excel') {
        // Simular exportação Excel
        console.log('Exportando dashboard para Excel...', data);
        alert('Dashboard exportado para Excel com sucesso!');
    }
}

// Função para filtrar dados do dashboard
function filterDashboardData(filter) {
    console.log('Filtrando dashboard com:', filter);
    // Implementar lógica de filtro
}

// Função para atualizar período do dashboard
function updateDashboardPeriod(period) {
    console.log('Atualizando período do dashboard para:', period);
    // Implementar lógica de atualização de período
}
