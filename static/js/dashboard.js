// ========================================
// DASHBOARD JAVASCRIPT CONSOLIDADO - SISTEMA FINANCEIRO
// ========================================

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
                kanbanBoard.style.setProperty('display', 'flex', 'important');
                kanbanBoard.style.setProperty('flex-direction', 'row', 'important');
                kanbanBoard.style.setProperty('flex-wrap', 'nowrap', 'important');
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

// ========================================
// GRÁFICO DE LINHA PRINCIPAL - SOLICITAÇÕES AO LONGO DO TEMPO
// ========================================
let lineChart = null;

const chartData = {
    labels: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
    datasets: [
        {
            label: 'Solicitações Criadas',
            data: [180, 220, 280, 195, 240, 310, 275, 290, 320, 265, 285, 240],
            borderColor: '#FFCB57',
            backgroundColor: 'rgba(255, 203, 87, 0.15)',
            borderWidth: 4,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#FFCB57',
            pointBorderColor: '#1C1C1C',
            pointRadius: 8,
            pointHoverRadius: 12,
            pointHoverBackgroundColor: '#FFD700',
            pointHoverBorderColor: '#1C1C1C',
            pointHoverBorderWidth: 3,
        },
        {
            label: 'Solicitações Aprovadas',
            data: [150, 180, 220, 160, 200, 250, 220, 230, 260, 210, 230, 190],
            borderColor: '#4ade80',
            backgroundColor: 'rgba(74, 222, 128, 0.1)',
            borderWidth: 3,
            borderDash: [5, 5],
            fill: false,
            tension: 0.4,
            pointBackgroundColor: '#4ade80',
            pointBorderColor: '#1C1C1C',
            pointRadius: 6,
            pointHoverRadius: 10,
            pointHoverBackgroundColor: '#22c55e',
            pointHoverBorderColor: '#1C1C1C',
            pointHoverBorderWidth: 2,
        },
        {
            label: 'Solicitações Recusadas',
            data: [25, 35, 45, 30, 35, 50, 40, 45, 50, 40, 45, 35],
            borderColor: '#ef4444',
            backgroundColor: 'rgba(190, 67, 67, 0.1)',
            borderWidth: 3,
            borderDash: [10, 5],
            fill: false,
            tension: 0.4,
            pointBackgroundColor: '#ef4444',
            pointBorderColor: '#1C1C1C',
            pointRadius: 6,
            pointHoverRadius: 10,
            pointHoverBackgroundColor: '#dc2626',
            pointHoverBorderColor: '#1C1C1C',
            pointHoverBorderWidth: 2,
        }
    ]
};

const chartConfig = {
    type: 'line',
    data: chartData,
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                position: 'top',
                labels: {
                    color: '#F4F7F5',
                    font: {
                        size: 14,
                        weight: 'bold'
                    },
                    padding: 20,
                    usePointStyle: true,
                    pointStyle: 'circle'
                }
            },
            tooltip: {
                backgroundColor: 'rgba(28, 28, 28, 0.95)',
                titleColor: '#FFCB57',
                bodyColor: '#F4F7F5',
                borderColor: '#FFCB57',
                borderWidth: 2,
                cornerRadius: 12,
                displayColors: true,
                titleFont: {
                    size: 16,
                    weight: 'bold'
                },
                bodyFont: {
                    size: 14,
                    weight: '600'
                },
                padding: 12,
                callbacks: {
                    title: function(context) {
                        return context[0].label;
                    },
                    label: function(context) {
                        return context.dataset.label + ': ' + context.parsed.y + ' solicitações';
                    }
                }
            }
        },
        scales: {
            x: {
                grid: {
                    color: 'rgba(255, 203, 87, 0.2)',
                    drawBorder: false,
                    lineWidth: 1
                },
                ticks: {
                    color: '#F4F7F5',
                    font: {
                        size: 13,
                        weight: 'bold'
                    },
                    maxRotation: 45,
                    minRotation: 0
                },
                title: {
                    display: true,
                    text: 'Meses',
                    color: '#FFCB57',
                    font: {
                        size: 14,
                        weight: 'bold'
                    }
                }
            },
            y: {
                grid: {
                    color: 'rgba(255, 203, 87, 0.2)',
                    drawBorder: false,
                    lineWidth: 1
                },
                ticks: {
                    color: '#F4F7F5',
                    font: {
                        size: 13,
                        weight: 'bold'
                    },
                    callback: function(value) {
                        return value + ' solicitações';
                    }
                },
                title: {
                    display: true,
                    text: 'Número de Solicitações',
                    color: '#FFCB57',
                    font: {
                        size: 14,
                        weight: 'bold'
                    }
                }
            }
        },
        interaction: {
            intersect: false,
            mode: 'index'
        },
        animation: {
            duration: 2000,
            easing: 'easeInOutQuart'
        }
    }
};

function initializeLineChart() {
    const ctx = document.getElementById('lineChart');
    if (!ctx) return;
    if (lineChart) lineChart.destroy();
    
    // Usar dados reais do backend se disponíveis
    let dataToUse = chartData;
    if (window.dashboardData && window.dashboardData.solicitacoesPorMesDetalhado) {
        // Usar dados detalhados com status separado
        const meses = window.dashboardData.solicitacoesPorMesDetalhado.map(item => item.mes);
        const criadas = window.dashboardData.solicitacoesPorMesDetalhado.map(item => item.criadas || 0);
        const aprovadas = window.dashboardData.solicitacoesPorMesDetalhado.map(item => item.aprovadas || 0);
        const recusadas = window.dashboardData.solicitacoesPorMesDetalhado.map(item => item.recusadas || 0);
        
        dataToUse = {
            labels: meses,
            datasets: [
                {
                    ...chartData.datasets[0],
                    label: 'Solicitações Criadas',
                    data: criadas
                },
                {
                    ...chartData.datasets[1],
                    label: 'Solicitações Aprovadas',
                    data: aprovadas
                },
                {
                    ...chartData.datasets[2],
                    label: 'Solicitações Recusadas',
                    data: recusadas
                }
            ]
        };
    } else if (window.dashboardData && window.dashboardData.solicitacoesPorMes) {
        // Fallback para dados simples se detalhado não estiver disponível
        const meses = window.dashboardData.solicitacoesPorMes.map(item => item.mes);
        const counts = window.dashboardData.solicitacoesPorMes.map(item => item.count);
        
        const totalAprovadas = window.dashboardData.aprovadas || 0;
        const totalRecusadas = window.dashboardData.recusadas || 0;
        const totalCriadas = window.dashboardData.totalSolicitacoes || 0;
        
        const proporcaoAprovadas = totalCriadas > 0 ? totalAprovadas / totalCriadas : 0;
        const proporcaoRecusadas = totalCriadas > 0 ? totalRecusadas / totalCriadas : 0;
        
        const approvedData = counts.map(count => Math.round(count * proporcaoAprovadas));
        const rejectedData = counts.map(count => Math.round(count * proporcaoRecusadas));
        
        dataToUse = {
            labels: meses,
            datasets: [
                {
                    ...chartData.datasets[0],
                    label: 'Solicitações Criadas',
                    data: counts
                },
                {
                    ...chartData.datasets[1],
                    label: 'Solicitações Aprovadas',
                    data: approvedData
                },
                {
                    ...chartData.datasets[2],
                    label: 'Solicitações Recusadas',
                    data: rejectedData
                }
            ]
        };
    }
    
    const configToUse = {
        ...chartConfig,
        data: dataToUse
    };
    
    lineChart = new Chart(ctx, configToUse);
}

function changePeriod(period) {
    if (!lineChart) return;
    
    // Se temos dados reais, usar eles
    if (window.dashboardData && window.dashboardData.solicitacoesPorMesDetalhado) {
        // Usar dados detalhados
        let meses = window.dashboardData.solicitacoesPorMesDetalhado.map(item => item.mes);
        let criadas = window.dashboardData.solicitacoesPorMesDetalhado.map(item => item.criadas || 0);
        let aprovadas = window.dashboardData.solicitacoesPorMesDetalhado.map(item => item.aprovadas || 0);
        let recusadas = window.dashboardData.solicitacoesPorMesDetalhado.map(item => item.recusadas || 0);
        
        // Filtrar dados baseado no período
        if (period === '6months') {
            meses = meses.slice(-6);
            criadas = criadas.slice(-6);
            aprovadas = aprovadas.slice(-6);
            recusadas = recusadas.slice(-6);
        }
        
        lineChart.data.labels = meses;
        lineChart.data.datasets[0].data = criadas;
        lineChart.data.datasets[1].data = aprovadas;
        lineChart.data.datasets[2].data = recusadas;
        lineChart.update('active');
    } else if (window.dashboardData && window.dashboardData.solicitacoesPorMes) {
        // Fallback para dados simples
        let meses = window.dashboardData.solicitacoesPorMes.map(item => item.mes);
        let counts = window.dashboardData.solicitacoesPorMes.map(item => item.count);
        
        const totalAprovadas = window.dashboardData.aprovadas || 0;
        const totalRecusadas = window.dashboardData.recusadas || 0;
        const totalCriadas = window.dashboardData.totalSolicitacoes || 0;
        
        const proporcaoAprovadas = totalCriadas > 0 ? totalAprovadas / totalCriadas : 0;
        const proporcaoRecusadas = totalCriadas > 0 ? totalRecusadas / totalCriadas : 0;
        
        let approvedData = counts.map(count => Math.round(count * proporcaoAprovadas));
        let rejectedData = counts.map(count => Math.round(count * proporcaoRecusadas));
        
        // Filtrar dados baseado no período
        if (period === '6months') {
            meses = meses.slice(-6);
            counts = counts.slice(-6);
            approvedData = approvedData.slice(-6);
            rejectedData = rejectedData.slice(-6);
        }
        
        lineChart.data.labels = meses;
        lineChart.data.datasets[0].data = counts;
        lineChart.data.datasets[1].data = approvedData;
        lineChart.data.datasets[2].data = rejectedData;
        lineChart.update('active');
    } else {
        // Fallback para dados simulados se não houver dados reais
        const periods = {
            '6months': { 
                labels: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho'], 
                data: { 
                    created: [180, 220, 280, 195, 240, 310], 
                    approved: [150, 180, 220, 160, 200, 250],
                    rejected: [25, 35, 45, 30, 35, 50]
                } 
            },
            '12months': { 
                labels: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'], 
                data: { 
                    created: [180, 220, 280, 195, 240, 310, 275, 290, 320, 265, 285, 240], 
                    approved: [150, 180, 220, 160, 200, 250, 220, 230, 260, 210, 230, 190],
                    rejected: [25, 35, 45, 30, 35, 50, 40, 45, 50, 40, 45, 35]
                } 
            }
        };
        const selected = periods[period];
        if (!selected) return;
        lineChart.data.labels = selected.labels;
        lineChart.data.datasets[0].data = selected.data.created;
        lineChart.data.datasets[1].data = selected.data.approved;
        lineChart.data.datasets[2].data = selected.data.rejected;
        lineChart.update('active');
    }
}

window.addEventListener('DOMContentLoaded', () => {
    initializeLineChart();
    initializeSecondaryCharts();
    setTimeout(() => {
        if (lineChart) lineChart.update('show');
        if (flowChart) flowChart.update('show');
        if (preferencesChart) preferencesChart.update('show');
        if (statusAnalysisChart) statusAnalysisChart.update('show');
        if (departmentChart) departmentChart.update('show');
    }, 500);
    document.querySelectorAll('.period-button').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.period-button').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            changePeriod(this.getAttribute('data-period'));
        });
    });
});






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

// ========================================
// GRÁFICOS SECUNDÁRIOS - 4 GRÁFICOS EM GRID
// ========================================

// Gráfico 1: Fluxo de Solicitações por Período (Barras + Linha)
let flowChart = null;
const flowChartData = {
    labels: ['0-3h', '3-6h', '6-9h', '9-12h', '12-15h', '15-18h', '18-21h', '21-24h'],
    datasets: [
        {
            label: 'Solicitações Criadas',
            data: [45, 52, 38, 65, 55, 48, 42, 35],
            backgroundColor: '#3b82f6',
            borderColor: '#3b82f6',
            borderWidth: 0,
            type: 'bar'
        },
        {
            label: 'Solicitações Aprovadas',
            data: [28, 35, 22, 45, 38, 32, 28, 25],
            backgroundColor: '#ef4444',
            borderColor: '#ef4444',
            borderWidth: 0,
            type: 'bar'
        },
        {
            label: 'Taxa de Aprovação (%)',
            data: [62, 67, 58, 69, 69, 67, 67, 71],
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderColor: '#60a5fa',
            borderWidth: 3,
            fill: false,
            type: 'line',
            tension: 0.4,
            pointRadius: 6,
            pointHoverRadius: 8,
            yAxisID: 'y1'
        }
    ]
};

const flowChartConfig = {
    type: 'bar',
    data: flowChartData,
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                position: 'top',
                labels: {
                    color: '#F4F7F5',
                    font: { size: 11, weight: 'bold' },
                    usePointStyle: true
                }
            }
        },
        scales: {
            x: {
                grid: { color: 'rgba(255, 203, 87, 0.2)', drawBorder: false },
                ticks: { color: '#F4F7F5', font: { size: 10, weight: 'bold' } }
            },
            y: {
                type: 'linear',
                display: true,
                position: 'left',
                grid: { color: 'rgba(255, 203, 87, 0.2)', drawBorder: false },
                ticks: { color: '#F4F7F5', font: { size: 10, weight: 'bold' } }
            },
            y1: {
                type: 'linear',
                display: true,
                position: 'right',
                grid: { drawOnChartArea: false },
                ticks: { color: '#F4F7F5', font: { size: 10, weight: 'bold' }, callback: v => v + '%' }
            }
        }
    }
};

// Gráfico 2: Preferências por Dia da Semana
let preferencesChart = null;
const preferencesChartData = {
    labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
    datasets: [{
        label: 'Solicitações',
        data: [320, 380, 447, 420, 580, 650, 720],
        backgroundColor: '#3b82f6',
        borderColor: '#3b82f6',
        borderWidth: 0,
        borderRadius: 4
    }]
};

const preferencesChartConfig = {
    type: 'bar',
    data: preferencesChartData,
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false }
        },
        scales: {
            x: {
                grid: { color: 'rgba(255, 203, 87, 0.2)', drawBorder: false },
                ticks: { color: '#F4F7F5', font: { size: 10, weight: 'bold' } }
            },
            y: {
                grid: { color: 'rgba(255, 203, 87, 0.2)', drawBorder: false },
                ticks: { color: '#F4F7F5', font: { size: 10, weight: 'bold' } }
            }
        }
    }
};

// Gráfico 3: Análise de Status das Solicitações (Barras Horizontais Empilhadas)
let statusAnalysisChart = null;
const statusAnalysisData = {
    labels: ['TI', 'Financeiro', 'RH', 'Marketing', 'Operações'],
    datasets: [
        {
            label: 'Processadas',
            data: [45, 38, 42, 28, 35],
            backgroundColor: '#3b82f6',
            borderColor: '#3b82f6',
            borderWidth: 0
        },
        {
            label: 'Pendentes',
            data: [8, 12, 6, 15, 9],
            backgroundColor: '#ef4444',
            borderColor: '#ef4444',
            borderWidth: 0
        }
    ]
};

const statusAnalysisConfig = {
    type: 'bar',
    data: statusAnalysisData,
    options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                position: 'top',
                labels: {
                    color: '#F4F7F5',
                    font: { size: 11, weight: 'bold' },
                    usePointStyle: true
                }
            }
        },
        scales: {
            x: {
                grid: { color: 'rgba(255, 203, 87, 0.2)', drawBorder: false },
                ticks: { color: '#F4F7F5', font: { size: 10, weight: 'bold' } }
            },
            y: {
                grid: { display: false },
                ticks: { color: '#F4F7F5', font: { size: 10, weight: 'bold' } }
            }
        }
    }
};

// Gráfico 4: Análise por Departamento (Rosca)
let departmentChart = null;
const departmentData = {
    labels: ['TI', 'Financeiro', 'RH', 'Marketing'],
    datasets: [{
        data: [35, 25, 20, 20],
        backgroundColor: ['#3b82f6', '#10b981', '#ef4444', '#f59e0b'],
        borderColor: '#1C1C1C',
        borderWidth: 2,
        cutout: '60%'
    }]
};

const departmentConfig = {
    type: 'doughnut',
    data: departmentData,
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                position: 'bottom',
                labels: {
                    color: '#F4F7F5',
                    font: { size: 11, weight: 'bold' },
                    usePointStyle: true,
                    padding: 15
                }
            }
        }
    }
};

// Funções de inicialização
function initializeFlowChart() {
    const ctx = document.getElementById('flowChart');
    if (!ctx) return;
    if (flowChart) flowChart.destroy();
    flowChart = new Chart(ctx, flowChartConfig);
}

function initializePreferencesChart() {
    const ctx = document.getElementById('preferencesChart');
    if (!ctx) return;
    if (preferencesChart) preferencesChart.destroy();
    preferencesChart = new Chart(ctx, preferencesChartConfig);
}

function initializeStatusAnalysisChart() {
    const ctx = document.getElementById('statusAnalysisChart');
    if (!ctx) return;
    if (statusAnalysisChart) statusAnalysisChart.destroy();
    statusAnalysisChart = new Chart(ctx, statusAnalysisConfig);
}

function initializeDepartmentChart() {
    const ctx = document.getElementById('departmentChart');
    if (!ctx) return;
    if (departmentChart) departmentChart.destroy();
    departmentChart = new Chart(ctx, departmentConfig);
}

function initializeSecondaryCharts() {
    initializeFlowChart();
    initializePreferencesChart();
    initializeStatusAnalysisChart();
    initializeDepartmentChart();
}

