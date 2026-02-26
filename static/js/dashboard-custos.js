/**
 * Dashboard de Custos - Attend Finance
 * Gráficos: Distribuição de Custos, Custo por Tipo de Serviço, Evolução de Gastos
 */
(function() {
    'use strict';

    Chart.defaults.font.family = "'Segoe UI', 'Helvetica', 'Arial', sans-serif";
    Chart.defaults.color = '#666';

    var data = window.DASHBOARD_CUSTOS_DATA || {};
    var costDistribution = data.costDistribution || [0, 0, 0, 0];
    var serviceTypeData = data.serviceTypeData || [0, 0, 0];
    var evolutionWeeks = data.evolutionWeeks || [];

    function initCharts() {
        var ctx1 = document.getElementById('costDistributionChart');
        if (ctx1) {
            new Chart(ctx1.getContext('2d'), {
                type: 'doughnut',
                data: {
                    labels: ['Deslocamento', 'Envio Logístico', 'Custo Técnico', 'Outros'],
                    datasets: [{
                        data: costDistribution,
                        backgroundColor: ['#ffcc4d', '#3b82f6', '#10b981', '#94a3b8'],
                        borderWidth: 0,
                        hoverOffset: 10
                    }]
                },
                options: {
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom' }
                    },
                    cutout: '70%'
                }
            });
        }

        var ctx2 = document.getElementById('serviceTypeChart');
        if (ctx2) {
            new Chart(ctx2.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: ['Deslocamento', 'Logística', 'Custo Técnico'],
                    datasets: [{
                        label: 'Custo (R$)',
                        data: serviceTypeData,
                        backgroundColor: ['#ffcc4d', '#3b82f6', '#10b981'],
                        borderRadius: 8
                    }]
                },
                options: {
                    maintainAspectRatio: false,
                    indexAxis: 'y',
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        x: {
                            ticks: {
                                callback: function(value) {
                                    return 'R$ ' + Number(value).toLocaleString('pt-BR');
                                }
                            }
                        }
                    }
                }
            });
        }

        var labels = evolutionWeeks.map(function(w) { return w.label || ''; });
        var tecnicos = evolutionWeeks.map(function(w) { return w.tecnicos || 0; });
        var logistica = evolutionWeeks.map(function(w) { return w.logistica || 0; });
        var deslocamento = evolutionWeeks.map(function(w) { return w.deslocamento || 0; });

        if (labels.length === 0) {
            labels = ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'];
            tecnicos = [0, 0, 0, 0];
            logistica = [0, 0, 0, 0];
            deslocamento = [0, 0, 0, 0];
        }

        var ctx3 = document.getElementById('evolutionChart');
        if (ctx3) {
            new Chart(ctx3.getContext('2d'), {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Custos Técnicos',
                            data: tecnicos,
                            borderColor: '#10b981',
                            backgroundColor: 'rgba(16, 185, 129, 0.2)',
                            fill: true,
                            tension: 0.4
                        },
                        {
                            label: 'Logística',
                            data: logistica,
                            borderColor: '#3b82f6',
                            backgroundColor: 'rgba(59, 130, 246, 0.2)',
                            fill: true,
                            tension: 0.4
                        },
                        {
                            label: 'Deslocamento',
                            data: deslocamento,
                            borderColor: '#ffcc4d',
                            backgroundColor: 'rgba(255, 204, 77, 0.2)',
                            fill: true,
                            tension: 0.4
                        }
                    ]
                },
                options: {
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return 'R$ ' + Number(value).toLocaleString('pt-BR');
                                }
                            }
                        }
                    }
                }
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCharts);
    } else {
        initCharts();
    }
})();
