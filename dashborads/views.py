from django.shortcuts import render, redirect
from django.contrib import messages
from django.db.models import Sum, Count, Avg, Q
from django.utils import timezone
from django.utils.safestring import mark_safe
from datetime import timedelta, datetime
import json
from solicitacoes.models import Solicitacoes
from servicos.models import Servico
from usuarios.decorators import user_can_view_dashboard, user_can_view_reports

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
        
        # Calcular tempo médio de aprovação (diferença entre criação e quando foi aprovado)
        aprovadas_com_data = todas_solicitacoes.filter(status='aprovado', data_de_criacao__isnull=False)
        tempo_medio_aprovacao = None
        if aprovadas_com_data.exists():
            tempos = []
            for sol in aprovadas_com_data:
                # Considerar que aprovado significa que mudou de status, usar data_de_criacao como base
                # Como não temos data de aprovação, vamos usar uma estimativa baseada em tempo_fila
                if sol.data_de_criacao:
                    tempos.append(1)  # Placeholder - pode ser melhorado quando tiver data de aprovação
            if tempos:
                tempo_medio_aprovacao = sum(tempos) / len(tempos)
        
        # Tempo médio de resolução (concluídos)
        concluidas_com_data = todas_solicitacoes.filter(status='concluido', data_de_criacao__isnull=False)
        tempo_medio_resolucao = None
        if concluidas_com_data.exists():
            tempos = []
            for sol in concluidas_com_data:
                if sol.data_de_criacao and sol.data_de_pagamento:
                    delta = (sol.data_de_pagamento - sol.data_de_criacao).days
                    tempos.append(delta)
            if tempos:
                tempo_medio_resolucao = sum(tempos) / len(tempos)
        
        # Taxa de aprovação
        taxa_aprovacao = 0
        if total_solicitacoes > 0:
            processadas = aprovadas + recusadas + concluidas
            if processadas > 0:
                taxa_aprovacao = (aprovadas / processadas) * 100
        
        # Solicitações por mês (últimos 6 meses) com status separado
        hoje = timezone.now().date()
        solicitacoes_por_mes = []
        solicitacoes_por_mes_detalhado = []
        
        for i in range(6):
            mes_inicio = hoje - timedelta(days=30*(i+1))
            mes_fim = hoje - timedelta(days=30*i)
            
            mes_solicitacoes = todas_solicitacoes.filter(
                data_de_criacao__gte=mes_inicio,
                data_de_criacao__lt=mes_fim
            )
            
            count_total = mes_solicitacoes.count()
            count_criadas = count_total
            count_aprovadas = mes_solicitacoes.filter(status='aprovado').count()
            count_recusadas = mes_solicitacoes.filter(status='recusado').count()
            count_concluidas = mes_solicitacoes.filter(status='concluido').count()
            
            solicitacoes_por_mes.append({
                'mes': mes_inicio.strftime('%b'),
                'count': count_total
            })
            
            solicitacoes_por_mes_detalhado.append({
                'mes': mes_inicio.strftime('%b'),
                'criadas': count_criadas,
                'aprovadas': count_aprovadas,
                'recusadas': count_recusadas,
                'concluidas': count_concluidas
            })
        
        solicitacoes_por_mes.reverse()
        solicitacoes_por_mes_detalhado.reverse()
        
        # Solicitações por status (para gráfico)
        status_data = {
            'pendente': pendentes,
            'aprovado': aprovadas,
            'recusado': recusadas,
            'concluido': concluidas
        }
        
        # Solicitações por serviço
        solicitacoes_por_servico = todas_solicitacoes.values('servico__nome').annotate(
            total=Count('id'),
            valor_total=Sum('valor')
        ).order_by('-total')[:10]
        
        # Solicitações por prioridade
        por_prioridade = todas_solicitacoes.values('prioridade').annotate(
            total=Count('id')
        )
        prioridade_data = {
            'baixa': 0,
            'media': 0,
            'alta': 0
        }
        for item in por_prioridade:
            prioridade = item.get('prioridade')
            if prioridade:
                prioridade_data[prioridade] = item['total']
        
        # Solicitações por dia da semana (baseado na data de criação)
        dias_semana_map = {
            0: 'Segunda',
            1: 'Terça',
            2: 'Quarta',
            3: 'Quinta',
            4: 'Sexta',
            5: 'Sábado',
            6: 'Domingo'
        }
        solicitacoes_por_dia_count = {i: 0 for i in range(7)}
        
        for sol in todas_solicitacoes.filter(data_de_criacao__isnull=False):
            if sol.data_de_criacao:
                dia_semana = sol.data_de_criacao.weekday()  # 0 = segunda, 6 = domingo
                solicitacoes_por_dia_count[dia_semana] += 1
        
        solicitacoes_por_dia = [
            {
                'dia': dias_semana_map[i],
                'count': solicitacoes_por_dia_count[i]
            }
            for i in range(7)
        ]
        
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
            
            # Tempos
            'tempo_medio_aprovacao': tempo_medio_aprovacao or 0,
            'tempo_medio_resolucao': tempo_medio_resolucao or 0,
            
            # Taxas
            'taxa_aprovacao': taxa_aprovacao,
            
            # Dados para gráficos (convertidos para JSON)
            'solicitacoes_por_mes_json': mark_safe(json.dumps(solicitacoes_por_mes)),
            'solicitacoes_por_mes_detalhado_json': mark_safe(json.dumps(solicitacoes_por_mes_detalhado)),
            'status_data': status_data,
            'solicitacoes_por_servico_json': mark_safe(json.dumps(list(solicitacoes_por_servico))),
            'prioridade_data': prioridade_data,
            'solicitacoes_por_dia_json': mark_safe(json.dumps(solicitacoes_por_dia)),
            'media_mensal': int(media_mensal),
        }
        
        return render(request, "dashboard/dashboard.html", context)
        
    elif request.method == "POST":
        pass
    
def relatorio(request):
    if request.method == "GET":
        if not request.user.is_authenticated:
            return redirect('login')
        
        # Verificar permissão: Solicitante, Financeiro e Admin podem ver relatórios
        if not user_can_view_reports(request.user):
            messages.error(request, 'Você não tem permissão para acessar esta página.')
            return redirect('home')
        
        # Buscar todas as solicitações do banco de dados
        solicitacoes = Solicitacoes.objects.all().order_by('-data_de_criacao')
        
        # Estatísticas
        total_solicitacoes = solicitacoes.count()
        
        # Calcular valor total
        valor_total = sum(s.valor for s in solicitacoes)
        
        # Contar por status
        aprovadas = solicitacoes.filter(status='aprovado').count()
        pendentes = solicitacoes.filter(status='pendente').count()
        recusadas = solicitacoes.filter(status='recusado').count()
        concluidas = solicitacoes.filter(status='concluido').count()
        
        context = {
            'solicitacoes': solicitacoes,
            'total_solicitacoes': total_solicitacoes,
            'valor_total': valor_total,
            'aprovadas': aprovadas,
            'pendentes': pendentes,
            'recusadas': recusadas,
            'concluidas': concluidas,
        }
        
        return render(request, "dashboard/relatorios.html", context)
        
    elif request.method == "POST":
        pass
