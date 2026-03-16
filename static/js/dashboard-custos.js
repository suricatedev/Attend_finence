/**
 * Dashboard de Custos - Attend Finance
 * Gráficos: Distribuição de Custos, Custo por Tipo de Serviço, Evolução de Gastos
 */
(function() {
    'use strict';

    Chart.defaults.font.family = "'Segoe UI', 'Helvetica', 'Arial', sans-serif";
    Chart.defaults.color = '#666';

    var data = window.DASHBOARD_CUSTOS_DATA || {};
    var costDistribution = (data.costDistribution || [0, 0, 0]).slice(0, 3);
    var serviceTypeData = data.serviceTypeData || [0, 0, 0];
    var evolutionWeeks = data.evolutionWeeks || [];

    var chartInstances = [];

    function isDashboardRevealed() {
        var view = document.querySelector('.dashboard-custos-view');
        return view && view.classList.contains('dashboard-custos-revealed');
    }

    window.updateDashboardCustosCharts = function() {
        chartInstances.forEach(function(chart) {
            if (chart) chart.update();
        });
    };

    function initCharts() {
        var ctx1 = document.getElementById('costDistributionChart');
        if (ctx1) {
            chartInstances.push(new Chart(ctx1.getContext('2d'), {
                type: 'doughnut',
                data: {
                    labels: ['Custo Deslocamento', 'Custo Logístico', 'Custo com Técnicos'],
                    datasets: [{
                        data: costDistribution,
                        backgroundColor: ['#ffcc4d', '#3b82f6', '#10b981'],
                        borderWidth: 0,
                        hoverOffset: 10
                    }]
                },
                options: {
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom' },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    var revealed = isDashboardRevealed();
                                    var label = context.label || '';
                                    var raw = context.raw;
                                    if (!revealed) return label + ': ******';
                                    return label + ': R$ ' + Number(raw).toLocaleString('pt-BR');
                                }
                            }
                        }
                    },
                    cutout: '70%'
                }
            }));
        }

        var ctx2 = document.getElementById('serviceTypeChart');
        if (ctx2) {
            chartInstances.push(new Chart(ctx2.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: ['Custo Deslocamento', 'Custo Logístico', 'Custo com Técnicos'],
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
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    var revealed = isDashboardRevealed();
                                    var label = context.label || '';
                                    var raw = context.raw;
                                    if (!revealed) return label + ': ******';
                                    return label + ': R$ ' + Number(raw).toLocaleString('pt-BR');
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            ticks: {
                                callback: function(value) {
                                    if (!isDashboardRevealed()) return '******';
                                    return 'R$ ' + Number(value).toLocaleString('pt-BR');
                                }
                            }
                        }
                    }
                }
            }));
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
            chartInstances.push(new Chart(ctx3.getContext('2d'), {
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
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    var revealed = isDashboardRevealed();
                                    var label = context.dataset ? context.dataset.label : '';
                                    var value = context.parsed ? context.parsed.y : context.raw;
                                    if (!revealed) return label + ': ******';
                                    return label + ': R$ ' + Number(value).toLocaleString('pt-BR');
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    if (!isDashboardRevealed()) return '******';
                                    return 'R$ ' + Number(value).toLocaleString('pt-BR');
                                }
                            }
                        }
                    }
                }
            }));
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCharts);
    } else {
        initCharts();
    }
})();
