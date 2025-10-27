// Dashboard JavaScript Otimizado - Performance Melhorada

class DashboardOptimized {
    constructor() {
        this.isInitialized = false;
        this.charts = new Map();
        this.data = {
            metrics: {},
            charts: {},
            recentActivity: []
        };
        
        // Cache para melhor performance
        this.cache = {
            lastUpdate: 0,
            updateInterval: 30000, // 30 segundos
            debounceTimer: null
        };
        
        this.init();
    }

    async init() {
        if (this.isInitialized) return;
        
        try {
            // Mostrar indicador de carregamento
            this.showLoadingIndicator();
            
            // Carregar dados de forma assíncrona
            await this.loadDashboardData();
            
            // Inicializar componentes
            this.initializeMetrics();
            this.initializeCharts();
            this.initializeRecentActivity();
            
            // Configurar atualizações automáticas
            this.setupAutoRefresh();
            
            this.isInitialized = true;
            
        } catch (error) {
            console.error('Erro ao inicializar dashboard:', error);
        } finally {
            this.hideLoadingIndicator();
        }
    }

    async loadDashboardData() {
        // Simular carregamento de dados do servidor
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Carregar dados do localStorage ou gerar dados simulados
        const savedData = localStorage.getItem('dashboardData');
        if (savedData) {
            this.data = JSON.parse(savedData);
        } else {
            this.data = this.generateSampleData();
        }
    }

    generateSampleData() {
        return {
            metrics: {
                totalSolicitacoes: 156,
                valorTotal: 1250000,
                aprovadas: 89,
                pendentes: 45,
                recusadas: 22,
                tempoMedioAprovacao: 3.2,
                satisfacaoMedia: 4.6
            },
            charts: {
                solicitacoesPorMes: [
                    { mes: 'Jan', valor: 45000 },
                    { mes: 'Fev', valor: 52000 },
                    { mes: 'Mar', valor: 48000 },
                    { mes: 'Abr', valor: 61000 },
                    { mes: 'Mai', valor: 55000 },
                    { mes: 'Jun', valor: 67000 }
                ],
                statusDistribution: [
                    { status: 'Aprovadas', valor: 89, cor: '#28a745' },
                    { status: 'Pendentes', valor: 45, cor: '#ffc107' },
                    { status: 'Recusadas', valor: 22, cor: '#dc3545' }
                ],
                servicosMaisUtilizados: [
                    { servico: 'Consultoria TI', valor: 35 },
                    { servico: 'Desenvolvimento', valor: 28 },
                    { servico: 'Manutenção', valor: 20 },
                    { servico: 'Treinamento', valor: 17 }
                ]
            },
            recentActivity: [
                { id: 1, tipo: 'aprovacao', descricao: 'Solicitação SOL-2024-001 aprovada', tempo: '2 min atrás', usuario: 'Maria Santos' },
                { id: 2, tipo: 'criacao', descricao: 'Nova solicitação SOL-2024-002 criada', tempo: '5 min atrás', usuario: 'João Silva' },
                { id: 3, tipo: 'pagamento', descricao: 'Pagamento de SOL-2024-003 processado', tempo: '10 min atrás', usuario: 'Sistema' },
                { id: 4, tipo: 'recusa', descricao: 'Solicitação SOL-2024-004 recusada', tempo: '15 min atrás', usuario: 'Ana Costa' },
                { id: 5, tipo: 'aprovacao', descricao: 'Solicitação SOL-2024-005 aprovada', tempo: '20 min atrás', usuario: 'Carlos Lima' }
            ]
        };
    }

    initializeMetrics() {
        const metrics = this.data.metrics;
        
        // Atualizar métricas principais
        this.updateMetric('totalSolicitacoes', metrics.totalSolicitacoes);
        this.updateMetric('valorTotal', this.formatCurrency(metrics.valorTotal));
        this.updateMetric('aprovadas', metrics.aprovadas);
        this.updateMetric('pendentes', metrics.pendentes);
        this.updateMetric('recusadas', metrics.recusadas);
        this.updateMetric('tempoMedioAprovacao', `${metrics.tempoMedioAprovacao} dias`);
        this.updateMetric('satisfacaoMedia', `${metrics.satisfacaoMedia}/5.0`);
    }

    updateMetric(metricId, value) {
        const element = document.getElementById(metricId);
        if (element) {
            element.textContent = value;
        }
    }

    initializeCharts() {
        // Inicializar gráficos de forma otimizada
        this.createSolicitacoesChart();
        this.createStatusChart();
        this.createServicosChart();
    }

    createSolicitacoesChart() {
        const canvas = document.getElementById('solicitacoesChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const data = this.data.charts.solicitacoesPorMes;
        
        // Gráfico simples usando Canvas
        this.drawBarChart(ctx, data, {
            width: canvas.width,
            height: canvas.height,
            colors: ['#FFCB57', '#e6b84d', '#d4a853', '#c29959', '#b08a5f', '#9e7b65']
        });
    }

    createStatusChart() {
        const canvas = document.getElementById('statusChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const data = this.data.charts.statusDistribution;
        
        // Gráfico de pizza simples
        this.drawPieChart(ctx, data, {
            width: canvas.width,
            height: canvas.height
        });
    }

    createServicosChart() {
        const canvas = document.getElementById('servicosChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const data = this.data.charts.servicosMaisUtilizados;
        
        // Gráfico de barras horizontais
        this.drawHorizontalBarChart(ctx, data, {
            width: canvas.width,
            height: canvas.height,
            colors: ['#1C1C1C', '#544350', '#FFCB57', '#F4F7F5']
        });
    }

    drawBarChart(ctx, data, options) {
        const { width, height, colors } = options;
        const barWidth = width / data.length * 0.8;
        const maxValue = Math.max(...data.map(d => d.valor));
        
        ctx.clearRect(0, 0, width, height);
        
        data.forEach((item, index) => {
            const barHeight = (item.valor / maxValue) * height * 0.8;
            const x = (width / data.length) * index + (width / data.length) * 0.1;
            const y = height - barHeight;
            
            ctx.fillStyle = colors[index % colors.length];
            ctx.fillRect(x, y, barWidth, barHeight);
            
            // Texto do valor
            ctx.fillStyle = '#1C1C1C';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(item.valor.toString(), x + barWidth / 2, y - 5);
            
            // Texto do mês
            ctx.fillText(item.mes, x + barWidth / 2, height - 5);
        });
    }

    drawPieChart(ctx, data, options) {
        const { width, height } = options;
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 2 - 20;
        
        const total = data.reduce((sum, item) => sum + item.valor, 0);
        let currentAngle = 0;
        
        ctx.clearRect(0, 0, width, height);
        
        data.forEach((item, index) => {
            const sliceAngle = (item.valor / total) * 2 * Math.PI;
            
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
            ctx.closePath();
            ctx.fillStyle = item.cor;
            ctx.fill();
            
            // Legenda
            const labelX = centerX + Math.cos(currentAngle + sliceAngle / 2) * (radius + 30);
            const labelY = centerY + Math.sin(currentAngle + sliceAngle / 2) * (radius + 30);
            
            ctx.fillStyle = '#1C1C1C';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`${item.status}: ${item.valor}`, labelX, labelY);
            
            currentAngle += sliceAngle;
        });
    }

    drawHorizontalBarChart(ctx, data, options) {
        const { width, height, colors } = options;
        const barHeight = height / data.length * 0.8;
        const maxValue = Math.max(...data.map(d => d.valor));
        
        ctx.clearRect(0, 0, width, height);
        
        data.forEach((item, index) => {
            const barWidth = (item.valor / maxValue) * width * 0.8;
            const x = 0;
            const y = (height / data.length) * index + (height / data.length) * 0.1;
            
            ctx.fillStyle = colors[index % colors.length];
            ctx.fillRect(x, y, barWidth, barHeight);
            
            // Texto do serviço
            ctx.fillStyle = '#1C1C1C';
            ctx.font = '12px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(item.servico, x + barWidth + 10, y + barHeight / 2 + 4);
            
            // Texto do valor
            ctx.textAlign = 'right';
            ctx.fillText(item.valor.toString(), barWidth - 5, y + barHeight / 2 + 4);
        });
    }

    initializeRecentActivity() {
        const container = document.getElementById('recentActivity');
        if (!container) return;

        container.innerHTML = '';
        
        this.data.recentActivity.forEach(activity => {
            const activityElement = document.createElement('div');
            activityElement.className = 'activity-item';
            activityElement.innerHTML = `
                <div class="activity-icon activity-${activity.tipo}">
                    <i class="fas fa-${this.getActivityIcon(activity.tipo)}"></i>
                </div>
                <div class="activity-content">
                    <p class="activity-description">${activity.descricao}</p>
                    <span class="activity-meta">${activity.tempo} • ${activity.usuario}</span>
                </div>
            `;
            container.appendChild(activityElement);
        });
    }

    getActivityIcon(tipo) {
        const icons = {
            'aprovacao': 'check-circle',
            'criacao': 'plus-circle',
            'pagamento': 'credit-card',
            'recusa': 'times-circle',
            'edicao': 'edit',
            'exclusao': 'trash'
        };
        return icons[tipo] || 'circle';
    }

    setupAutoRefresh() {
        // Atualizar dados automaticamente a cada 30 segundos
        setInterval(() => {
            if (this.shouldRefresh()) {
                this.refreshData();
            }
        }, this.cache.updateInterval);
    }

    shouldRefresh() {
        return Date.now() - this.cache.lastUpdate > this.cache.updateInterval;
    }

    async refreshData() {
        try {
            await this.loadDashboardData();
            this.initializeMetrics();
            this.initializeCharts();
            this.initializeRecentActivity();
            this.cache.lastUpdate = Date.now();
        } catch (error) {
            console.error('Erro ao atualizar dados:', error);
        }
    }

    showLoadingIndicator() {
        const existingIndicator = document.getElementById('dashboardLoadingIndicator');
        if (existingIndicator) return;

        const indicator = document.createElement('div');
        indicator.id = 'dashboardLoadingIndicator';
        indicator.innerHTML = `
            <div style="
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 20px;
                border-radius: 8px;
                z-index: 10000;
                display: flex;
                align-items: center;
                gap: 10px;
            ">
                <div style="
                    width: 20px;
                    height: 20px;
                    border: 2px solid #f3f3f3;
                    border-top: 2px solid #FFCB57;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                "></div>
                Carregando dashboard...
            </div>
        `;
        document.body.appendChild(indicator);
    }

    hideLoadingIndicator() {
        const indicator = document.getElementById('dashboardLoadingIndicator');
        if (indicator) {
            indicator.remove();
        }
    }

    formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    }

    // Método para alternar entre views (compatibilidade)
    switchView(view) {
        const kanbanBoard = document.getElementById('kanbanBoard');
        const dashboardView = document.getElementById('dashboardView');
        const reportsModal = document.getElementById('reportsModal');
        
        if (!kanbanBoard || !dashboardView) return;
        
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
                document.querySelector('[data-view="kanban"]')?.classList.add('active');
                break;
            case 'dashboard':
                dashboardView.style.display = 'block';
                document.querySelector('[data-view="dashboard"]')?.classList.add('active');
                if (!this.isInitialized) {
                    this.init();
                }
                break;
            case 'reports':
                if (reportsModal) {
                    reportsModal.style.display = 'flex';
                }
                document.querySelector('[data-view="reports"]')?.classList.add('active');
                break;
        }
    }
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    // Verificar se estamos na página de dashboard
    if (document.querySelector('.dashboard-view') || document.getElementById('dashboardView')) {
        window.dashboardOptimized = new DashboardOptimized();
        
        // Configurar event listeners para navegação
        const cardsTab = document.querySelector('[data-view="kanban"]');
        const dashboardTab = document.querySelector('[data-view="dashboard"]');
        const reportsTab = document.querySelector('[data-view="reports"]');
        
        if (cardsTab) {
            cardsTab.addEventListener('click', () => window.dashboardOptimized.switchView('kanban'));
        }
        
        if (dashboardTab) {
            dashboardTab.addEventListener('click', () => window.dashboardOptimized.switchView('dashboard'));
        }
        
        if (reportsTab) {
            reportsTab.addEventListener('click', () => window.dashboardOptimized.switchView('reports'));
        }
    }
});
