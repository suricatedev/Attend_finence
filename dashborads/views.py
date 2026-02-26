from django.shortcuts import render
from django.contrib import messages
from django.db.models import Sum, Count, Avg, Q
from django.utils import timezone
from django.utils.safestring import mark_safe
from django.http import JsonResponse
from datetime import datetime, timedelta
from calendar import monthrange
import json
from solicitacoes.models import Solicitacoes
from servicos.models import Servico
from usuarios.decorators import user_can_view_dashboard, user_can_view_reports
from django.shortcuts import render, redirect

def dashboard(request):
    if request.method == "GET":
        if not request.user.is_authenticated:
            return redirect('login')
        
        # Verificar permissão: apenas Administrador e Financeiro podem ver dashboard
        if not user_can_view_dashboard(request.user):
            messages.error(request, 'Você não tem permissão para acessar esta página.')
            return redirect('home')
        
        # Buscar todas as solicitações
        todas_solicitacoes = Solicitacoes.objects.all()
        total_solicitacoes = todas_solicitacoes.count()
        
        # Métricas por status
        pendentes = todas_solicitacoes.filter(status='pendente').count()
        aprovadas = todas_solicitacoes.filter(status='aprovado').count()
        recusadas = todas_solicitacoes.filter(status='recusado').count()
        concluidas = todas_solicitacoes.filter(status='concluido').count()
        
        # Valores financeiros
        valor_total = todas_solicitacoes.aggregate(Sum('valor'))['valor__sum'] or 0
        valor_aprovadas = todas_solicitacoes.filter(status='aprovado').aggregate(Sum('valor'))['valor__sum'] or 0
        valor_pendentes = todas_solicitacoes.filter(status='pendente').aggregate(Sum('valor'))['valor__sum'] or 0
        valor_concluidas = todas_solicitacoes.filter(status='concluido').aggregate(Sum('valor'))['valor__sum'] or 0
        
        # Taxa de aprovação
        taxa_aprovacao = 0
        if total_solicitacoes > 0:
            processadas = aprovadas + recusadas + concluidas
            if processadas > 0:
                taxa_aprovacao = (aprovadas / processadas) * 100
        
        # Solicitações por mês (últimos 12 meses) com status separado
        hoje = timezone.now().date()
        solicitacoes_por_mes = []
        solicitacoes_por_mes_detalhado = []
        
        # Gerar dados para os últimos 12 meses
        # Começar do mês atual e retroceder 11 meses (total de 12 meses)
        from datetime import date
        
        # Nome do mês em português
        meses_pt = {
            1: 'Jan', 2: 'Fev', 3: 'Mar', 4: 'Abr', 5: 'Mai', 6: 'Jun',
            7: 'Jul', 8: 'Ago', 9: 'Set', 10: 'Out', 11: 'Nov', 12: 'Dez'
        }
        
        # Primeiro dia do mês atual
        primeiro_dia_mes_atual = hoje.replace(day=1)
        
        # Gerar os últimos 12 meses (do mais antigo para o mais recente)
        # Começar de 11 meses atrás até o mês atual
        for i in range(12):
            # i=0: 11 meses atrás (mais antigo)
            # i=11: mês atual (mais recente)
            meses_retroceder = 11 - i
            
            # Calcular o mês retrocedendo a partir do mês atual
            # Se estamos em novembro (mês 11) e retrocedemos 0 meses, temos novembro
            # Se retrocedemos 1 mês, temos outubro
            # Se retrocedemos 2 meses, temos setembro
            mes_calcular = primeiro_dia_mes_atual.month - meses_retroceder
            ano_calcular = primeiro_dia_mes_atual.year
            
            # Ajustar para ano anterior se necessário
            while mes_calcular <= 0:
                mes_calcular += 12
                ano_calcular -= 1
            
            mes_inicio = date(ano_calcular, mes_calcular, 1)
            
            # Próximo mês (fim do período)
            if mes_inicio.month == 12:
                mes_fim = date(mes_inicio.year + 1, 1, 1)
            else:
                mes_fim = date(mes_inicio.year, mes_inicio.month + 1, 1)
            
            mes_solicitacoes = todas_solicitacoes.filter(
                data_de_criacao__gte=mes_inicio,
                data_de_criacao__lt=mes_fim
            )
            
            count_total = mes_solicitacoes.count()
            count_criadas = count_total
            # Considerar solicitações concluídas como aprovadas também, pois necessariamente passaram por aprovação
            count_aprovadas = mes_solicitacoes.filter(status__in=['aprovado', 'concluido']).count()
            count_recusadas = mes_solicitacoes.filter(status='recusado').count()
            count_concluidas = mes_solicitacoes.filter(status='concluido').count()
            
            solicitacoes_por_mes.append({
                'mes': meses_pt[mes_inicio.month],
                'count': count_total,
                'ano': mes_inicio.year,
                'mes_numero': mes_inicio.month,
                'data_inicio': mes_inicio.isoformat(),
                'data_fim': mes_fim.isoformat()
            })
            
            solicitacoes_por_mes_detalhado.append({
                'mes': meses_pt[mes_inicio.month],
                'criadas': count_criadas,
                'aprovadas': count_aprovadas,
                'recusadas': count_recusadas,
                'concluidas': count_concluidas,
                'ano': mes_inicio.year,
                'mes_numero': mes_inicio.month,
                'data_inicio': mes_inicio.isoformat(),
                'data_fim': mes_fim.isoformat()
            })
        
        # Não precisa fazer reverse() pois já estamos gerando na ordem correta (do mais antigo para o mais recente)
        
        # Debug: verificar se todos os 12 meses foram gerados
        if len(solicitacoes_por_mes_detalhado) != 12:
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f'Atenção: Esperado 12 meses, mas foram gerados {len(solicitacoes_por_mes_detalhado)} meses')
        
        # Debug: imprimir os meses gerados
        if solicitacoes_por_mes_detalhado:
            primeiro_mes = solicitacoes_por_mes_detalhado[0]
            ultimo_mes = solicitacoes_por_mes_detalhado[-1]
            print(f"DEBUG: Primeiro mês (mais antigo): {primeiro_mes['mes']} {primeiro_mes['ano']}")
            print(f"DEBUG: Último mês (mais recente): {ultimo_mes['mes']} {ultimo_mes['ano']}")
            print(f"DEBUG: Total de meses: {len(solicitacoes_por_mes_detalhado)}")
            meses_str = [f"{m['mes']} {m['ano']}" for m in solicitacoes_por_mes_detalhado]
            print(f"DEBUG: Todos os meses gerados: {meses_str}")
            ultimos_3_str = [f"{m['mes']} {m['ano']}" for m in solicitacoes_por_mes_detalhado[-3:]]
            print(f"DEBUG: Últimos 3 meses: {ultimos_3_str}")
        
        # Solicitações por status (para gráfico)
        status_data = {
            'pendente': pendentes,
            'aprovado': aprovadas,
            'recusado': recusadas,
            'concluido': concluidas
        }
        
        # Média mensal
        media_mensal = 0
        if len(solicitacoes_por_mes) > 0:
            total_meses = sum(m['count'] for m in solicitacoes_por_mes)
            media_mensal = total_meses / len(solicitacoes_por_mes) if len(solicitacoes_por_mes) > 0 else 0
        
        context = {
            # Métricas principais
            'total_solicitacoes': total_solicitacoes,
            'pendentes': pendentes,
            'aprovadas': aprovadas,
            'recusadas': recusadas,
            'concluidas': concluidas,
            
            # Valores
            'valor_total': valor_total,
            'valor_aprovadas': valor_aprovadas,
            'valor_pendentes': valor_pendentes,
            'valor_concluidas': valor_concluidas,
            
            # Taxas
            'taxa_aprovacao': taxa_aprovacao,
            
            # Dados para gráficos (convertidos para JSON)
            'solicitacoes_por_mes_json': mark_safe(json.dumps(solicitacoes_por_mes)),
            'solicitacoes_por_mes_detalhado_json': mark_safe(json.dumps(solicitacoes_por_mes_detalhado)),
            'status_data': status_data,
            'media_mensal': int(media_mensal),
        }
        
        return render(request, "dashboard/dashboard.html", context)
        
    elif request.method == "POST":
        pass

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
