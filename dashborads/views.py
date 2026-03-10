from django.shortcuts import render
from django.contrib import messages
from django.db.models import Sum, Count, Avg, Q, F, Min, Max
from django.db.models.functions import Coalesce
from django.utils import timezone
from django.utils.safestring import mark_safe
from django.http import JsonResponse
from datetime import datetime, timedelta, date
from calendar import monthrange
import json
from solicitacoes.models import Solicitacoes, SolicitacaoTecnico, SolicitacaoRotaItem
from servicos.models import Servico
from usuarios.decorators import user_can_view_dashboard, user_can_view_reports
from django.shortcuts import render, redirect

def dashboard(request):
    """Dashboard de Custos: apenas métricas e gráficos de análise de custos."""
    if request.method == "GET":
        if not request.user.is_authenticated:
            return redirect('login')
        if not user_can_view_dashboard(request.user):
            messages.error(request, 'Você não tem permissão para acessar esta página.')
            return redirect('home')
        
        todas_solicitacoes = Solicitacoes.objects.all()
        total_solicitacoes = todas_solicitacoes.count()
        pendentes = todas_solicitacoes.filter(status='pendente').count()
        # Aprovadas = já aprovadas (status aprovado) + concluídas (fluxo normal: aprovado -> concluído)
        aprovadas = todas_solicitacoes.filter(status__in=['aprovado', 'concluido']).count()
        valor_total = todas_solicitacoes.aggregate(Sum('valor'))['valor__sum'] or 0

        hoje = timezone.now().date()
        # KPIs e gráficos de custo consideram todo o período (todas as solicitações)
        qs_custos = Solicitacoes.objects.all()
        ids_custos = list(qs_custos.values_list('id', flat=True))
        period_bounds = Solicitacoes.objects.aggregate(Min('data_de_criacao'), Max('data_de_criacao'))
        v_min = period_bounds.get('data_de_criacao__min')
        v_max = period_bounds.get('data_de_criacao__max')
        data_inicial_custos = v_min.date() if isinstance(v_min, datetime) else (v_min if isinstance(v_min, date) else hoje)
        data_final_custos = v_max.date() if isinstance(v_max, datetime) else (v_max if isinstance(v_max, date) else hoje)
        # Custo Logístico = soma de "Valor da atividade" + "Valores detalhados" apenas das solicitações com serviço "Chamado Logístico"
        servico_chamado_logistico = Servico.objects.filter(nome__iexact='Chamado Logístico').first()
        custo_logistico = 0.0
        if servico_chamado_logistico:
            qs_log_solic = qs_custos.filter(servico_id=servico_chamado_logistico.id)
            agg_log_solic = qs_log_solic.aggregate(
                vrec=Sum('valor_receita'), sk=Sum('valor_km'), sp=Sum('valor_pedagio'),
                sh=Sum('valor_hospedagem'), sf=Sum('valor_fluvial'), so=Sum('valor_outros')
            )
            custo_log_solic = (
                (agg_log_solic['vrec'] or 0) + (agg_log_solic['sk'] or 0) + (agg_log_solic['sp'] or 0) +
                (agg_log_solic['sh'] or 0) + (agg_log_solic['sf'] or 0) + (agg_log_solic['so'] or 0)
            )
            itens_log = SolicitacaoRotaItem.objects.filter(
                solicitacao_id__in=ids_custos,
                servico_id=servico_chamado_logistico.id
            )
            agg_log_itens = itens_log.aggregate(
                v=Sum('valor'), ik=Sum('valor_km'), ip=Sum('valor_pedagio'),
                ih=Sum('valor_hospedagem'), iflu=Sum('valor_fluvial'), io=Sum('valor_outros')
            )
            custo_log_itens = (
                (agg_log_itens['v'] or 0) + (agg_log_itens['ik'] or 0) + (agg_log_itens['ip'] or 0) +
                (agg_log_itens['ih'] or 0) + (agg_log_itens['iflu'] or 0) + (agg_log_itens['io'] or 0)
            )
            custo_logistico = float(custo_log_solic + custo_log_itens)
        # Custo deslocamento = soma de todos os "Valores Detalhados" (KM, Pedágio, Hospedagem, Fluvial, Outros) de todas as solicitações
        agg_solic = qs_custos.aggregate(
            s_km=Sum('valor_km'), s_ped=Sum('valor_pedagio'), s_hosp=Sum('valor_hospedagem'),
            s_flu=Sum('valor_fluvial'), s_out=Sum('valor_outros')
        )
        custo_desloc_solic = (
            (agg_solic['s_km'] or 0) + (agg_solic['s_ped'] or 0) + (agg_solic['s_hosp'] or 0) +
            (agg_solic['s_flu'] or 0) + (agg_solic['s_out'] or 0)
        )
        agg_itens = SolicitacaoRotaItem.objects.filter(solicitacao_id__in=ids_custos).aggregate(
            i_km=Sum('valor_km'), i_ped=Sum('valor_pedagio'), i_hosp=Sum('valor_hospedagem'),
            i_flu=Sum('valor_fluvial'), i_out=Sum('valor_outros')
        )
        custo_desloc_itens = (
            (agg_itens['i_km'] or 0) + (agg_itens['i_ped'] or 0) + (agg_itens['i_hosp'] or 0) +
            (agg_itens['i_flu'] or 0) + (agg_itens['i_out'] or 0)
        )
        custo_deslocamento = float(custo_desloc_solic + custo_desloc_itens)
        # Custo com Técnicos = soma do Valor Total de cada item (Valor que vai pagar para o técnico + Valor Extra)
        agg_tec = SolicitacaoTecnico.objects.filter(solicitacao_id__in=ids_custos).aggregate(
            s=Sum(F('valor_pagamento_tecnico') + Coalesce(F('valor_extra'), 0.0))
        )
        custo_tecnicos = float(agg_tec['s'] or 0)
        valor_total_custos = float(qs_custos.aggregate(Sum('valor'))['valor__sum'] or 0)
        custo_outros = max(0, valor_total_custos - (custo_logistico + custo_tecnicos + custo_deslocamento))
        cost_distribution = [custo_deslocamento, custo_logistico, custo_tecnicos, custo_outros]
        service_type_data = [custo_deslocamento, custo_logistico, custo_tecnicos]
        evolution_weeks = []
        for i in range(4):
            fim = hoje - timedelta(days=i * 7)
            ini = fim - timedelta(days=6)
            qw = Solicitacoes.objects.filter(data_de_criacao__gte=ini, data_de_criacao__lte=fim)
            ids_w = list(qw.values_list('id', flat=True))
            log_w = 0.0
            if servico_chamado_logistico:
                qw_log = qw.filter(servico_id=servico_chamado_logistico.id)
                agg_w_s = qw_log.aggregate(vrec=Sum('valor_receita'), sk=Sum('valor_km'), sp=Sum('valor_pedagio'), sh=Sum('valor_hospedagem'), sf=Sum('valor_fluvial'), so=Sum('valor_outros'))
                log_w_s = (agg_w_s['vrec'] or 0) + (agg_w_s['sk'] or 0) + (agg_w_s['sp'] or 0) + (agg_w_s['sh'] or 0) + (agg_w_s['sf'] or 0) + (agg_w_s['so'] or 0)
                itens_w = SolicitacaoRotaItem.objects.filter(solicitacao__data_de_criacao__gte=ini, solicitacao__data_de_criacao__lte=fim, servico_id=servico_chamado_logistico.id)
                agg_w_i = itens_w.aggregate(v=Sum('valor'), ik=Sum('valor_km'), ip=Sum('valor_pedagio'), ih=Sum('valor_hospedagem'), iflu=Sum('valor_fluvial'), io=Sum('valor_outros'))
                log_w_i = (agg_w_i['v'] or 0) + (agg_w_i['ik'] or 0) + (agg_w_i['ip'] or 0) + (agg_w_i['ih'] or 0) + (agg_w_i['iflu'] or 0) + (agg_w_i['io'] or 0)
                log_w = float(log_w_s + log_w_i)
            agg_ws = qw.aggregate(s_km=Sum('valor_km'), s_ped=Sum('valor_pedagio'), s_hosp=Sum('valor_hospedagem'), s_flu=Sum('valor_fluvial'), s_out=Sum('valor_outros'))
            desl_s = (agg_ws['s_km'] or 0) + (agg_ws['s_ped'] or 0) + (agg_ws['s_hosp'] or 0) + (agg_ws['s_flu'] or 0) + (agg_ws['s_out'] or 0)
            agg_wi = SolicitacaoRotaItem.objects.filter(solicitacao__data_de_criacao__gte=ini, solicitacao__data_de_criacao__lte=fim).aggregate(i_km=Sum('valor_km'), i_ped=Sum('valor_pedagio'), i_hosp=Sum('valor_hospedagem'), i_flu=Sum('valor_fluvial'), i_out=Sum('valor_outros'))
            desl_i = (agg_wi['i_km'] or 0) + (agg_wi['i_ped'] or 0) + (agg_wi['i_hosp'] or 0) + (agg_wi['i_flu'] or 0) + (agg_wi['i_out'] or 0)
            agg_tec_w = SolicitacaoTecnico.objects.filter(solicitacao_id__in=ids_w).aggregate(
                s=Sum(F('valor_pagamento_tecnico') + Coalesce(F('valor_extra'), 0.0))
            )
            tec_w = float(agg_tec_w['s'] or 0)
            evolution_weeks.append({'label': f'Semana {4 - i}', 'tecnicos': tec_w, 'logistica': log_w, 'deslocamento': float(desl_s) + float(desl_i)})
        evolution_weeks.reverse()
        
        context = {
            'total_solicitacoes': total_solicitacoes,
            'pendentes': pendentes,
            'aprovadas': aprovadas,
            'valor_total': valor_total,
            'custo_logistico': custo_logistico,
            'custo_tecnicos': custo_tecnicos,
            'custo_deslocamento': custo_deslocamento,
            'data_inicial_custos': data_inicial_custos,
            'data_final_custos': data_final_custos,
            'cost_distribution': mark_safe(json.dumps(cost_distribution)),
            'service_type_data': mark_safe(json.dumps(service_type_data)),
            'evolution_weeks': mark_safe(json.dumps(evolution_weeks)),
        }
        return render(request, "dashboard/dashboard.html", context)
        
    elif request.method == "POST":
        pass


def redirect_to_dashboard(request):
    """Redireciona para a aba Dashboards (conteúdo de custos está lá)."""
    return redirect('dashboard')


def dashboard_metrics(request):
    """View para retornar métricas do dashboard filtradas por período via AJAX"""
    from django.http import JsonResponse
    from datetime import datetime, timedelta
    from calendar import monthrange
    
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Não autenticado'}, status=401)
    
    # Verificar permissão
    if not user_can_view_dashboard(request.user):
        return JsonResponse({'error': 'Sem permissão'}, status=403)
    
    # Obter período da requisição ou filtro de data customizado
    period = request.GET.get('period', '3months')
    date_from = request.GET.get('date_from', None)
    date_to = request.GET.get('date_to', None)
    
    # Calcular data inicial baseado no período
    hoje = timezone.now().date()
    data_inicial = None
    data_final = None
    
    # Função auxiliar para subtrair meses
    def subtract_months(date, months):
        month = date.month - months
        year = date.year
        while month <= 0:
            month += 12
            year -= 1
        # Garantir que o dia seja válido para o mês (ex: 31 de janeiro -> 28/29 de fevereiro)
        last_day = monthrange(year, month)[1]
        day = min(date.day, last_day)
        return date.replace(year=year, month=month, day=day)
    
    # Se houver filtro de data customizado, usar ele
    if date_from or date_to:
        try:
            if date_from:
                data_inicial = datetime.strptime(date_from, '%Y-%m-%d').date()
            if date_to:
                data_final = datetime.strptime(date_to, '%Y-%m-%d').date()
        except ValueError:
            pass
    else:
        # Usar período padrão
        if period == '3months':
            data_inicial = subtract_months(hoje, 3)
        elif period == '6months':
            data_inicial = subtract_months(hoje, 6)
        elif period == '12months':
            data_inicial = subtract_months(hoje, 12)
        elif period == 'all':
            data_inicial = None
        else:
            data_inicial = subtract_months(hoje, 3)  # padrão: 3 meses
    
    # Filtrar solicitações pelo período
    solicitacoes_filtradas = Solicitacoes.objects.all()
    
    if data_inicial:
        solicitacoes_filtradas = solicitacoes_filtradas.filter(data_de_criacao__gte=data_inicial)
    if data_final:
        solicitacoes_filtradas = solicitacoes_filtradas.filter(data_de_criacao__lte=data_final)
    
    # Calcular métricas filtradas
    pendentes = solicitacoes_filtradas.filter(status='pendente').count()
    valor_total = solicitacoes_filtradas.aggregate(Sum('valor'))['valor__sum'] or 0
    
    return JsonResponse({
        'pendentes': pendentes,
        'valor_total': float(valor_total),
        'period': period
    })
    

def _get_relatorio_date_range(period, date_from_str, date_to_str):
    """Retorna (data_inicial, data_final) para o período dos relatórios."""
    hoje = timezone.now().date()
    data_inicial = None
    data_final = None
    if date_from_str or date_to_str:
        try:
            if date_from_str:
                data_inicial = datetime.strptime(date_from_str, '%Y-%m-%d').date()
            if date_to_str:
                data_final = datetime.strptime(date_to_str, '%Y-%m-%d').date()
        except ValueError:
            pass
    if data_inicial is None and data_final is None:
        if period == 'hoje':
            data_inicial = data_final = hoje
        elif period == 'semana':
            # Esta semana (segunda a domingo)
            dia_semana = hoje.weekday()
            data_inicial = hoje - timedelta(days=dia_semana)
            data_final = hoje
        elif period == 'ultima_semana':
            data_inicial = hoje - timedelta(days=hoje.weekday() + 7)
            data_final = data_inicial + timedelta(days=6)
        elif period == 'mes':
            data_inicial = hoje.replace(day=1)
            _, ultimo = monthrange(hoje.year, hoje.month)
            data_final = hoje.replace(day=ultimo)
        elif period == '3meses':
            data_inicial = hoje - timedelta(days=90)
            data_final = hoje
        elif period == 'ano':
            data_inicial = hoje.replace(month=1, day=1)
            data_final = hoje
        else:
            data_inicial = hoje - timedelta(days=30)
            data_final = hoje
    return data_inicial, data_final


def relatorio_indicadores(request):
    """API que retorna dados para os gráficos do dashboard de relatórios (filtro por período)."""
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Não autenticado'}, status=401)
    if not user_can_view_reports(request.user):
        return JsonResponse({'error': 'Sem permissão'}, status=403)

    hoje = timezone.now().date()
    period = request.GET.get('period', 'mes')
    date_from = request.GET.get('date_from', '')
    date_to = request.GET.get('date_to', '')
    data_inicial, data_final = _get_relatorio_date_range(period, date_from, date_to)

    qs = Solicitacoes.objects.all()
    if data_inicial:
        qs = qs.filter(data_de_criacao__gte=data_inicial)
    if data_final:
        qs = qs.filter(data_de_criacao__lte=data_final)

    # Lead time médio (dias entre criação e pagamento)
    lead_times = []
    for s in qs.exclude(data_de_pagamento__isnull=True).filter(data_de_criacao__isnull=False)[:500]:
        if s.data_de_criacao and s.data_de_pagamento:
            delta = s.data_de_pagamento - s.data_de_criacao
            lead_times.append(delta.days)
    lead_time_medio = round(sum(lead_times) / len(lead_times), 1) if lead_times else 0

    # Comparar com mês passado para tendência
    primeiro_mes_atual = data_final.replace(day=1) if data_final else hoje
    if primeiro_mes_atual.month == 1:
        mes_anterior_inicio = primeiro_mes_atual.replace(year=primeiro_mes_atual.year - 1, month=12, day=1)
    else:
        mes_anterior_inicio = primeiro_mes_atual.replace(month=primeiro_mes_atual.month - 1, day=1)
    _, ultimo_ant = monthrange(mes_anterior_inicio.year, mes_anterior_inicio.month)
    mes_anterior_fim = mes_anterior_inicio.replace(day=ultimo_ant)
    qs_mes_ant = Solicitacoes.objects.filter(
        data_de_criacao__gte=mes_anterior_inicio,
        data_de_criacao__lte=mes_anterior_fim
    )
    lead_ant = []
    for s in qs_mes_ant:
        if s.data_de_criacao and s.data_de_pagamento:
            lead_ant.append((s.data_de_pagamento - s.data_de_criacao).days)
    lead_ant_medio = sum(lead_ant) / len(lead_ant) if lead_ant else lead_time_medio
    if lead_ant_medio and lead_time_medio:
        lead_time_vs = round(((lead_time_medio - lead_ant_medio) / lead_ant_medio) * 100)
    else:
        lead_time_vs = 0

    # Pendências por analista (nome_solicitante é FK para User)
    from django.contrib.auth import get_user_model
    User = get_user_model()
    pendentes_por_analista = list(
        qs.filter(status='pendente')
        .values('nome_solicitante_id')
        .annotate(total=Count('id'))
        .order_by('-total')[:10]
    )
    user_ids = [a['nome_solicitante_id'] for a in pendentes_por_analista if a['nome_solicitante_id']]
    users = {u.id: (u.get_full_name() or u.username) for u in User.objects.filter(pk__in=user_ids)} if user_ids else {}
    pendentes_list = []
    for a in pendentes_por_analista:
        uid = a['nome_solicitante_id']
        nome = users.get(uid, f'Analista {uid}' if uid else 'N/A')
        pendentes_list.append({'nome': nome, 'count': a['total']})
    if not pendentes_list:
        for u in User.objects.filter(is_active=True)[:5]:
            pendentes_list.append({'nome': u.get_full_name() or u.username, 'count': 0})

    # Série temporal para gráfico de linha (pendências por dia no período)
    dias_pendentes = list(
        qs.filter(status='pendente')
        .values('data_de_criacao')
        .annotate(total=Count('id'))
        .order_by('data_de_criacao')
    )
    serie_pendentes = [
        {'dia': str(d['data_de_criacao']), 'total': d['total']}
        for d in dias_pendentes
        if d.get('data_de_criacao')
    ]

    # Pareto por serviço (valor por serviço + % acumulado)
    por_servico = list(
        qs.values('servico_id')
        .annotate(valor=Sum('valor'))
        .order_by('-valor')
    )
    total_geral = sum(x['valor'] or 0 for x in por_servico)
    servico_nomes = {s.id: s.nome for s in Servico.objects.all()}
    pareto = []
    ac = 0
    for item in por_servico:
        v = item['valor'] or 0
        ac += v
        nome = servico_nomes.get(item['servico_id'], 'Outros') if item['servico_id'] else 'Sem serviço'
        pct = round((v / total_geral * 100), 1) if total_geral else 0
        acum = round((ac / total_geral * 100), 1) if total_geral else 0
        pareto.append({'nome': nome, 'valor': float(v), 'percentual': pct, 'acumulado': acum})
    if not pareto and total_geral:
        pareto.append({'nome': 'Geral', 'valor': float(total_geral), 'percentual': 100, 'acumulado': 100})

    # Concentração por favorecido (recebedor) - donut
    por_recebedor = list(
        qs.values('nome_do_recebedor')
        .annotate(valor=Sum('valor'))
        .order_by('-valor')[:8]
    )
    total_fav = sum(x['valor'] or 0 for x in por_recebedor)
    concentracao = []
    for item in por_recebedor:
        v = item['valor'] or 0
        nome = (item['nome_do_recebedor'] or 'N/A').strip() or 'N/A'
        pct = round((v / total_fav * 100), 1) if total_fav else 0
        concentracao.append({'nome': nome, 'valor': float(v), 'percentual': pct})
    if len(concentracao) > 5:
        # Agrupar os menores em "Outros"
        top5 = concentracao[:5]
        outros_val = sum(x['valor'] for x in concentracao[5:])
        outros_pct = round((outros_val / total_fav * 100), 1) if total_fav else 0
        concentracao = top5 + [{'nome': 'Outros', 'valor': outros_val, 'percentual': outros_pct}]

    # Previsão próximos 7 dias: % conciliado (aprovado+concluído) no período
    total_per = qs.count()
    conciliados = qs.filter(status__in=['aprovado', 'concluido']).count()
    conciliado_pct = round((conciliados / total_per * 100), 0) if total_per else 0

    # Dias do mês para o calendário (marcar conciliados)
    hoje = timezone.now().date()
    primeiro = hoje.replace(day=1)
    _, ultimo_dia = monthrange(hoje.year, hoje.month)
    dias_mes = []
    for d in range(1, ultimo_dia + 1):
        data_d = primeiro.replace(day=d)
        count = qs.filter(data_de_criacao=data_d).filter(status__in=['aprovado', 'concluido']).count()
        total_d = qs.filter(data_de_criacao=data_d).count()
        dias_mes.append({
            'dia': d,
            'conciliado': total_d and count == total_d,
            'total': total_d,
            'conciliados': count
        })

    # Porcentagem do segundo card (ex.: taxa de pendência ou similar)
    pendentes_count = qs.filter(status='pendente').count()
    taxa_pendencia = round((pendentes_count / total_per * 100), 0) if total_per else 0
    qs_mes_ant_count = Solicitacoes.objects.filter(
        data_de_criacao__gte=mes_anterior_inicio,
        data_de_criacao__lte=mes_anterior_fim
    )
    pend_mes_ant = qs_mes_ant_count.filter(status='pendente').count()
    total_mes_ant = qs_mes_ant_count.count()
    taxa_ant = round((pend_mes_ant / total_mes_ant * 100), 0) if total_mes_ant else 0
    taxa_vs = taxa_pendencia - taxa_ant

    return JsonResponse({
        'lead_time_medio': lead_time_medio,
        'lead_time_vs_mes': lead_time_vs,
        'pendentes_por_analista': pendentes_list,
        'serie_pendentes': serie_pendentes,
        'pareto_servico': pareto,
        'total_departamento': float(total_geral or 0),
        'concentracao_favorecido': concentracao,
        'previsao_conciliado_pct': conciliado_pct,
        'previsao_total': total_per,
        'previsao_conciliados': conciliados,
        'dias_mes': dias_mes,
        'taxa_pendencia': taxa_pendencia,
        'taxa_vs_mes': taxa_vs,
    })

    
def relatorio(request):
    if request.method == "GET":
        if not request.user.is_authenticated:
            return redirect('login')
        
        # Verificar permissão: Solicitante, Financeiro e Admin podem ver relatórios
        if not user_can_view_reports(request.user):
            messages.error(request, 'Você não tem permissão para acessar esta página.')
            return redirect('home')
        
        # Buscar todas as solicitações do banco de dados
        solicitacoes_originais = Solicitacoes.objects.prefetch_related(
            'itens_rota__servico',
            'solicitacoes_tecnico__servico',
            'solicitacoes_tecnico__recebedor',
            'solicitacoes_tecnico__cliente_empresa'
        ).all().order_by('-data_de_criacao')
        
        # Adicionar supervisor do recebedor e expandir solicitações "Em Rota" e "Técnico"
        from solicitacoes.models import Recebedor
        solicitacoes_expandidas = []
        
        for solicitacao in solicitacoes_originais:
            supervisor_nome = None
            if solicitacao.nome_do_recebedor:
                try:
                    recebedor = Recebedor.objects.filter(nome__iexact=solicitacao.nome_do_recebedor).first()
                    if recebedor and hasattr(recebedor, 'supervisor') and recebedor.supervisor:
                        supervisor_nome = recebedor.get_supervisor_display_name()
                except Exception:
                    pass
            solicitacao.supervisor_recebedor = supervisor_nome
            
            # Se for "Em Rota" com itens, modificar o título para incluir TODOS os tickets
            if solicitacao.tipo == 'em_rota' and solicitacao.itens_rota.exists():
                itens = solicitacao.itens_rota.all().order_by('ordem')
                # Coletar todos os tickets dos itens (filtrar vazios)
                todos_tickets = [item.ticket_item for item in itens if item.ticket_item and item.ticket_item.strip()]
                if todos_tickets:
                    # Criar título com TODOS os tickets separados por vírgula e espaço
                    # Não limitar o tamanho - mostrar todos os tickets na célula
                    solicitacao.titulo = f"Solicitação Em Rota - {', '.join(todos_tickets)}"
                solicitacoes_expandidas.append(solicitacao)
            # Se for "Técnico" com itens, modificar o título para incluir TODOS os tickets
            elif solicitacao.is_tecnico() and solicitacao.solicitacoes_tecnico.exists():
                itens_tecnico = solicitacao.solicitacoes_tecnico.all().order_by('id')
                # Coletar todos os tickets dos itens (filtrar vazios)
                todos_tickets = [item.ticket_item for item in itens_tecnico if item.ticket_item and item.ticket_item.strip()]
                if todos_tickets:
                    # Criar título com TODOS os tickets separados por vírgula e espaço
                    # Não limitar o tamanho - mostrar todos os tickets na célula
                    solicitacao.titulo = f"Solicitação de Técnico - {', '.join(todos_tickets)}"
                solicitacoes_expandidas.append(solicitacao)
            else:
                # Para solicitações "Casual" ou outras, adicionar normalmente
                solicitacoes_expandidas.append(solicitacao)
        
        # Estatísticas (usar solicitações originais, não expandidas)
        total_solicitacoes = solicitacoes_originais.count()
        
        # Calcular valor total (usar solicitações originais)
        valor_total = sum(s.valor for s in solicitacoes_originais)
        
        # Contar por status (usar solicitações originais)
        aprovadas = solicitacoes_originais.filter(status='aprovado').count()
        pendentes = solicitacoes_originais.filter(status='pendente').count()
        recusadas = solicitacoes_originais.filter(status='recusado').count()
        concluidas = solicitacoes_originais.filter(status='concluido').count()
        
        # Buscar serviços e recebedores disponíveis para os filtros
        servicos_disponiveis = Servico.objects.all().order_by('nome')
        recebedores_disponiveis = Recebedor.objects.filter(ativo=True).order_by('nome')
        
        context = {
            'solicitacoes': solicitacoes_expandidas,
            'total_solicitacoes': total_solicitacoes,
            'valor_total': valor_total,
            'aprovadas': aprovadas,
            'pendentes': pendentes,
            'recusadas': recusadas,
            'concluidas': concluidas,
            'servicos_disponiveis': servicos_disponiveis,
            'recebedores_disponiveis': recebedores_disponiveis,
        }
        
        return render(request, "dashboard/relatorios.html", context)
        
    elif request.method == "POST":
        pass
