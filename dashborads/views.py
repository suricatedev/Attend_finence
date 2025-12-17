from django.shortcuts import render
from django.contrib import messages
from django.db.models import Sum, Count, Avg, Q
from django.utils import timezone
from django.utils.safestring import mark_safe
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
        
        # Buscar serviços disponíveis para o filtro
        servicos_disponiveis = Servico.objects.all().order_by('nome')
        
        context = {
            'solicitacoes': solicitacoes_expandidas,
            'total_solicitacoes': total_solicitacoes,
            'valor_total': valor_total,
            'aprovadas': aprovadas,
            'pendentes': pendentes,
            'recusadas': recusadas,
            'concluidas': concluidas,
            'servicos_disponiveis': servicos_disponiveis,
        }
        
        return render(request, "dashboard/relatorios.html", context)
        
    elif request.method == "POST":
        pass

        
        # Buscar serviços disponíveis para o filtro
        servicos_disponiveis = Servico.objects.all().order_by('nome')
        
        context = {
            'solicitacoes': solicitacoes_expandidas,
            'total_solicitacoes': total_solicitacoes,
            'valor_total': valor_total,
            'aprovadas': aprovadas,
            'pendentes': pendentes,
            'recusadas': recusadas,
            'concluidas': concluidas,
            'servicos_disponiveis': servicos_disponiveis,
        }
        
        return render(request, "dashboard/relatorios.html", context)
        
    elif request.method == "POST":
        pass

        
        # Buscar serviços disponíveis para o filtro
        servicos_disponiveis = Servico.objects.all().order_by('nome')
        
        context = {
            'solicitacoes': solicitacoes_expandidas,
            'total_solicitacoes': total_solicitacoes,
            'valor_total': valor_total,
            'aprovadas': aprovadas,
            'pendentes': pendentes,
            'recusadas': recusadas,
            'concluidas': concluidas,
            'servicos_disponiveis': servicos_disponiveis,
        }
        
        return render(request, "dashboard/relatorios.html", context)
        
    elif request.method == "POST":
        pass
