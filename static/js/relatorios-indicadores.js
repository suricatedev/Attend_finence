/**
 * Dashboard de Indicadores - Relatórios Financeiros
 * Carrega dados da API e renderiza gráficos (Chart.js)
 */
(function() {
    'use strict';

    var charts = {};
    var currentPeriod = 'hoje';

    function getIndicadoresUrl(period, dateFrom, dateTo) {
        var base = window.RELATORIO_INDICADORES_URL || '/dashboards/relatorio/indicadores/';
        var params = new URLSearchParams();
        params.set('period', period || 'hoje');
        if (dateFrom) params.set('date_from', dateFrom);
        if (dateTo) params.set('date_to', dateTo);
        return base + '?' + params.toString();
    }

    function fetchIndicadores(period, dateFrom, dateTo) {
        period = period || currentPeriod;
        dateFrom = dateFrom || document.getElementById('dateFrom')?.value || '';
        dateTo = dateTo || document.getElementById('dateTo')?.value || '';
        currentPeriod = period;

        var url = getIndicadoresUrl(period, dateFrom, dateTo);
        fetch(url, { credentials: 'same-origin', headers: { 'X-Requested-With': 'XMLHttpRequest' } })
            .then(function(r) { return r.ok ? r.json() : Promise.reject(r); })
            .then(function(data) { updateIndicadores(data); })
            .catch(function() {
                updateIndicadores(fallbackData());
            });
    }

    function fallbackData() {
        return {
            lead_time_medio: 0,
            lead_time_vs_mes: 0,
            pendentes_por_analista: [],
            serie_pendentes: [],
            pareto_servico: [],
            total_departamento: 0,
            concentracao_favorecido: [],
            previsao_conciliado_pct: 0,
            previsao_total: 0,
            previsao_conciliados: 0,
            dias_mes: [],
            taxa_pendencia: 0,
            taxa_vs_mes: 0
        };
    }

    function updateIndicadores(data) {
        if (!data) data = fallbackData();

        // Cards Lead Time e Taxa (valores com privacidade – sem olho individual)
        var leadEl = document.getElementById('leadTimeValor');
        if (leadEl) {
            var leadWrap = leadEl.querySelector('.private-value-wrap');
            if (leadWrap) {
                if (data.lead_time_medio != null && data.lead_time_medio !== '') {
                    var leadStr = Number(data.lead_time_medio).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
                    leadWrap.setAttribute('data-private-real', leadStr + ' Dias');
                } else {
                    leadWrap.setAttribute('data-private-real', '—');
                }
            }
        }
        var leadVs = document.getElementById('leadTimeVs');
        if (leadVs) {
            leadVs.textContent = (data.lead_time_vs_mes > 0 ? '+' : '') + data.lead_time_vs_mes + '%';
            var trendLead = document.getElementById('leadTimeTrend');
            if (trendLead) {
                trendLead.querySelector('.trend-badge').className = 'trend-badge ' + (data.lead_time_vs_mes <= 0 ? 'trend-up' : 'trend-down');
            }
        }

        var taxaEl = document.getElementById('taxaPendenciaValor');
        if (taxaEl) {
            var taxaWrap = taxaEl.querySelector('.private-value-wrap');
            if (taxaWrap) taxaWrap.setAttribute('data-private-real', data.taxa_pendencia != null ? data.taxa_pendencia + '%' : '—');
        }
        var taxaVs = document.getElementById('taxaPendenciaVs');
        if (taxaVs) {
            taxaVs.textContent = (data.taxa_vs_mes > 0 ? '+' : '') + data.taxa_vs_mes + '%';
            var trendTaxa = document.getElementById('taxaPendenciaTrend');
            if (trendTaxa) {
                trendTaxa.querySelector('.trend-badge').className = 'trend-badge ' + (data.taxa_vs_mes <= 0 ? 'trend-down' : 'trend-up');
            }
        }

        // Legenda Pareto (Serviço/Departamento – R$ X.XXX,XX) – com privacidade
        var paretoLegend = document.getElementById('paretoLegend');
        if (paretoLegend) {
            var tot = data.total_departamento || 0;
            var totStr = Number(tot).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            var paretoWrap = paretoLegend.querySelector('.private-value-wrap');
            if (paretoWrap) paretoWrap.setAttribute('data-private-real', 'Serviço/Departamento (R$ ' + totStr + ')');
        }

        // Previsão % – com privacidade
        var previsaoPct = document.getElementById('previsaoPct');
        if (previsaoPct) {
            var pctVal = (data.previsao_conciliado_pct || 0) + '%';
            var previsaoWrap = previsaoPct.querySelector('.private-value-wrap');
            if (previsaoWrap) previsaoWrap.setAttribute('data-private-real', pctVal);
        }
        if (typeof window.refreshReportsPrivacy === 'function') window.refreshReportsPrivacy();

        // Gráficos
        renderChartPendenciasLinha(data.serie_pendentes || []);
        renderChartPendenciasBarras(data.pendentes_por_analista || []);
        renderChartPareto(data.pareto_servico || [], data.total_departamento || 0);
        renderChartConcentracao(data.concentracao_favorecido || []);
        renderChartPrevisaoRing(data.previsao_conciliado_pct || 0);
        renderPrevisaoCalendar(data.dias_mes || []);
    }

    function renderChartPendenciasLinha(serie) {
        var canvas = document.getElementById('chartPendenciasLinha');
        if (!canvas) return;
        var labels = serie.map(function(d) { return d.dia ? d.dia.substring(5) : ''; });
        var values = serie.map(function(d) { return d.total || 0; });
        if (!labels.length) { labels = ['']; values = [0]; }

        if (charts.pendenciasLinha) charts.pendenciasLinha.destroy();
        charts.pendenciasLinha = new Chart(canvas.getContext('2d'), {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Pendências',
                    data: values,
                    borderColor: '#22c55e',
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, display: true },
                    x: { display: labels.length <= 1 ? false : true }
                }
            }
        });
    }

    function renderChartPendenciasBarras(analistas) {
        var canvas = document.getElementById('chartPendenciasBarras');
        if (!canvas) return;
        var labels = analistas.map(function(a) { return (a.nome || '').substring(0, 10); });
        var values = analistas.map(function(a) { return a.count || 0; });
        if (!labels.length) { labels = ['Nenhum']; values = [0]; }

        if (charts.pendenciasBarras) charts.pendenciasBarras.destroy();
        charts.pendenciasBarras = new Chart(canvas.getContext('2d'), {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Pendências',
                    data: values,
                    backgroundColor: '#8b5cf6'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true },
                    x: { display: true }
                }
            }
        });
    }

    function renderChartPareto(pareto, totalDepartamento) {
        var canvas = document.getElementById('chartPareto');
        if (!canvas) return;
        var labels = pareto.map(function(p) {
            var nome = (p.nome || '').substring(0, 10);
            var pct = p.percentual != null ? p.percentual : 0;
            return nome + ' ' + pct + '%';
        });
        var valores = pareto.map(function(p) { return p.percentual || 0; });
        var acumulado = pareto.map(function(p) { return p.acumulado || 0; });
        if (!labels.length) { labels = ['']; valores = [0]; acumulado = [0]; }

        if (charts.pareto) charts.pareto.destroy();
        charts.pareto = new Chart(canvas.getContext('2d'), {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: '%',
                        data: valores,
                        backgroundColor: '#8b5cf6',
                        yAxisID: 'y'
                    },
                    {
                        label: '% Acumulado',
                        data: acumulado,
                        type: 'line',
                        borderColor: '#3b82f6',
                        backgroundColor: 'transparent',
                        fill: false,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, max: 100, position: 'left' },
                    y1: { beginAtZero: true, max: 100, position: 'right', grid: { drawOnChartArea: false } }
                }
            }
        });
    }

    function renderChartConcentracao(concentracao) {
        var canvas = document.getElementById('chartConcentracao');
        if (!canvas) return;
        var labels = concentracao.map(function(c) { return c.nome || ''; });
        var values = concentracao.map(function(c) { return c.percentual || 0; });
        var colors = ['#3b82f6', '#eab308', '#22c55e', '#f97316', '#6b7280'];
        if (!labels.length) { labels = ['Nenhum']; values = [100]; }

        if (charts.concentracao) charts.concentracao.destroy();
        charts.concentracao = new Chart(canvas.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: values.map(function(_, i) { return colors[i % colors.length]; })
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' }
                },
                cutout: '60%'
            }
        });
    }

    function renderChartPrevisaoRing(pct) {
        var canvas = document.getElementById('chartPrevisaoRing');
        if (!canvas) return;
        pct = Math.min(100, Math.max(0, pct));

        if (charts.previsaoRing) charts.previsaoRing.destroy();
        charts.previsaoRing = new Chart(canvas.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Conciliado', 'Pendente'],
                datasets: [{
                    data: [pct, 100 - pct],
                    backgroundColor: ['#22c55e', '#e2e8f0']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: { legend: { display: false } },
                cutout: '75%'
            }
        });
    }

    function renderPrevisaoCalendar(diasMes) {
        var container = document.getElementById('previsaoCalendar');
        if (!container) return;

        var diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        var html = '';
        diasSemana.forEach(function(d) { html += '<span class="cal-day weekday">' + d + '</span>'; });

        if (diasMes && diasMes.length) {
            var firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getDay();
            for (var i = 0; i < firstDay; i++) html += '<span class="cal-day empty"></span>';
            diasMes.forEach(function(d) {
                var cl = 'cal-day';
                if (d.conciliado && d.total > 0) cl += ' conciliado';
                html += '<span class="' + cl + '">' + d.dia + '</span>';
            });
        } else {
            var hoje = new Date();
            var year = hoje.getFullYear();
            var month = hoje.getMonth();
            var first = new Date(year, month, 1).getDay();
            var daysInMonth = new Date(year, month + 1, 0).getDate();
            for (var j = 0; j < first; j++) html += '<span class="cal-day empty"></span>';
            for (var k = 1; k <= daysInMonth; k++) {
                html += '<span class="cal-day">' + k + '</span>';
            }
        }
        container.innerHTML = html;
    }

    function onPeriodChange(e) {
        var d = e.detail || {};
        fetchIndicadores(d.period, d.dateFrom, d.dateTo);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            fetchIndicadores('hoje');
            document.addEventListener('relatorio:periodChange', onPeriodChange);
        });
    } else {
        fetchIndicadores('hoje');
        document.addEventListener('relatorio:periodChange', onPeriodChange);
    }

    window.refreshIndicadores = fetchIndicadores;
})();
