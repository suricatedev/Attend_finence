from django.shortcuts import render
from django.contrib import messages
from django.db.models import Sum, Count, Avg, Q
from django.utils import timezone
from django.utils.safestring import mark_safe
from datetime import timedelta, datetime
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
        
        # Calcular tempo médio de aprovação: tempo que uma solicitação leva para ir de "pendente" para "aprovado"
        # Como as solicitações são criadas com status "pendente" por padrão, consideramos:
        # - Data de entrada em "pendente": data_de_criacao (quando foi criada)
        # - Data de saída de "pendente" (entrada em "aprovado"): data_entrada_status (quando mudou para aprovado)
        tempos_aprovacao = []
        
        # Solicitações com status 'aprovado': tempo exato de pendente para aprovado
        aprovadas_com_data = todas_solicitacoes.filter(
            status='aprovado',
            data_de_criacao__isnull=False,
            data_entrada_status__isnull=False
        )
        for sol in aprovadas_com_data:
            if sol.data_de_criacao and sol.data_entrada_status:
                # Converter data_de_criacao para datetime (entrada em "pendente")
                data_entrada_pendente = timezone.make_aware(
                    datetime.combine(sol.data_de_criacao, datetime.min.time())
                )
                # data_entrada_status é quando mudou para "aprovado" (saída de "pendente")
                # Calcular diferença em dias: tempo em "pendente"
                delta = sol.data_entrada_status - data_entrada_pendente
                dias = delta.total_seconds() / (24 * 60 * 60)
                if dias >= 0:  # Apenas valores positivos
                    tempos_aprovacao.append(dias)
        
        # Solicitações com status 'concluido': estimativa do tempo em "pendente"
        # Como não temos a data exata de quando mudou de "pendente" para "aprovado",
        # usamos uma estimativa baseada no tempo total até a conclusão
        concluidas_aprovadas = todas_solicitacoes.filter(
            status='concluido',
            data_de_criacao__isnull=False,
            data_de_pagamento__isnull=False
        )
        for sol in concluidas_aprovadas:
            if sol.data_de_criacao and sol.data_de_pagamento:
                # Converter datas para datetime
                data_entrada_pendente = timezone.make_aware(
                    datetime.combine(sol.data_de_criacao, datetime.min.time())
                )
                data_pagamento_dt = timezone.make_aware(
                    datetime.combine(sol.data_de_pagamento, datetime.min.time())
                )
                # Calcular tempo total até pagamento
                delta_total = data_pagamento_dt - data_entrada_pendente
                dias_total = delta_total.total_seconds() / (24 * 60 * 60)
                # Estimativa: tempo em "pendente" é aproximadamente 50% do tempo total
                # (assumindo que: pendente -> aprovado -> concluido, e que o tempo em pendente
                # é uma parte significativa do processo)
                dias_em_pendente = dias_total * 0.5
                if dias_em_pendente >= 0:
                    tempos_aprovacao.append(dias_em_pendente)
        
        # Calcular média: tempo médio que uma solicitação leva para sair de "pendente" e ir para "aprovado"
        tempo_medio_aprovacao = 0
        if tempos_aprovacao:
            tempo_medio_aprovacao = sum(tempos_aprovacao) / len(tempos_aprovacao)
        
        # Tempo médio de resolução: tempo que uma solicitação leva para ir de "aprovado" para "concluído"
        # Considerar apenas solicitações com status 'concluido' que tenham data_entrada_status
        # data_entrada_status representa quando mudou para "concluído" (saída de "aprovado")
        tempos_resolucao = []
        
        concluidas_com_data = todas_solicitacoes.filter(
            status='concluido',
            data_de_criacao__isnull=False,
            data_entrada_status__isnull=False
        )
        
        for sol in concluidas_com_data:
            if sol.data_de_criacao and sol.data_entrada_status:
                # Para calcular o tempo de "aprovado" para "concluído", precisamos estimar quando foi aprovado
                # Como não temos histórico, vamos usar uma estimativa baseada no tempo total
                
                # Converter datas para datetime
                data_criacao_dt = timezone.make_aware(
                    datetime.combine(sol.data_de_criacao, datetime.min.time())
                )
                data_conclusao_dt = sol.data_entrada_status  # Quando mudou para "concluído"
                
                # Calcular tempo total desde criação até conclusão
                delta_total = data_conclusao_dt - data_criacao_dt
                dias_total = delta_total.total_seconds() / (24 * 60 * 60)
                
                # Estimar tempo em "pendente" (50% do tempo total, como no cálculo de aprovação)
                dias_em_pendente = dias_total * 0.5
                
                # Tempo de "aprovado" para "concluído" = tempo total - tempo em pendente
                # (assumindo que: pendente -> aprovado -> concluido)
                dias_aprovado_para_concluido = dias_total - dias_em_pendente
                
                if dias_aprovado_para_concluido >= 0:
                    tempos_resolucao.append(dias_aprovado_para_concluido)
        
        # Calcular média: tempo médio que uma solicitação leva para sair de "aprovado" e ir para "concluído"
        tempo_medio_resolucao = 0
        if tempos_resolucao:
            tempo_medio_resolucao = sum(tempos_resolucao) / len(tempos_resolucao)
        
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
        
        # Gerar dados para os últimos 12 meses para suportar ambos os filtros
        from datetime import date
        
        for i in range(12):
            # Calcular data do início do mês (mais preciso)
            # i=0 é o mês mais antigo (11 meses atrás), i=11 é o mês atual
            # Começar do primeiro dia do mês atual e retroceder
            primeiro_dia_mes_atual = hoje.replace(day=1)
            
            # Retroceder i+1 meses (i=0 retrocede 1 mês, i=11 retrocede 12 meses)
            meses_retroceder = i + 1
            
            # Calcular mês e ano
            mes_calcular = primeiro_dia_mes_atual.month - meses_retroceder
            ano_calcular = primeiro_dia_mes_atual.year
            
            # Ajustar para ano anterior se necessário
            while mes_calcular <= 0:
                mes_calcular += 12
                ano_calcular -= 1
            
            mes_inicio = date(ano_calcular, mes_calcular, 1)
            
            # Próximo mês
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
            count_aprovadas = mes_solicitacoes.filter(status='aprovado').count()
            count_recusadas = mes_solicitacoes.filter(status='recusado').count()
            count_concluidas = mes_solicitacoes.filter(status='concluido').count()
            
            # Nome do mês em português
            meses_pt = {
                1: 'Jan', 2: 'Fev', 3: 'Mar', 4: 'Abr', 5: 'Mai', 6: 'Jun',
                7: 'Jul', 8: 'Ago', 9: 'Set', 10: 'Out', 11: 'Nov', 12: 'Dez'
            }
            
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
            
            # Tempos (arredondados para dias inteiros)
            'tempo_medio_aprovacao': round(tempo_medio_aprovacao) if tempo_medio_aprovacao > 0 else 0,
            'tempo_medio_resolucao': round(tempo_medio_resolucao) if tempo_medio_resolucao else 0,
            
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
        solicitacoes_originais = Solicitacoes.objects.prefetch_related('itens_rota__servico').all().order_by('-data_de_criacao')
        
        # Adicionar supervisor do recebedor e expandir solicitações "Em Rota"
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
            
            # Se for "Em Rota", expandir em múltiplas linhas (uma para cada item)
            if solicitacao.tipo == 'em_rota' and solicitacao.itens_rota.exists():
                itens = solicitacao.itens_rota.all().order_by('ordem')
                for item in itens:
                    # Calcular valor total do item (atividade + detalhados)
                    soma_detalhados_item = (item.valor_km or 0.0) + (item.valor_pedagio or 0.0) + \
                                           (item.valor_hospedagem or 0.0) + (item.valor_fluvial or 0.0) + \
                                           (item.valor_outros or 0.0)
                    valor_atividade_item = item.valor or 0.0
                    valor_total_item = valor_atividade_item + soma_detalhados_item
                    
                    # Criar uma classe simples para representar o item
                    class SolicitacaoItem:
                        def __init__(self):
                            self.id = solicitacao.id
                            self.ticket = item.ticket_item  # ID do item
                            self.titulo = f"Solicitação Em Rota - {item.ticket_item}"
                            self.nome_solicitante = solicitacao.nome_solicitante
                            self.supervisor_recebedor = supervisor_nome
                            self.nome_do_recebedor = item.recebedor or solicitacao.nome_do_recebedor
                            self.chave_pix = item.chave_pix or solicitacao.chave_pix
                            self.cliente_empresa = item.cliente_empresa or solicitacao.cliente_empresa
                            self.cnpj = item.cnpj or solicitacao.cnpj
                            self.servico = item.servico or solicitacao.servico
                            self.valor = valor_total_item  # Valor total do item (atividade + detalhados)
                            self.valor_receita = valor_atividade_item  # Valor da atividade do item
                            self.valor_em_rota = 0.0  # Não aplicável para itens individuais
                            self.valor_km = item.valor_km or 0.0
                            self.valor_pedagio = item.valor_pedagio or 0.0
                            self.valor_hospedagem = item.valor_hospedagem or 0.0
                            self.valor_fluvial = item.valor_fluvial or 0.0
                            self.valor_outros = item.valor_outros or 0.0
                            self.status = solicitacao.status
                            self.prioridade = solicitacao.prioridade
                            self.data_de_criacao = solicitacao.data_de_criacao
                            self.data_de_pagamento = solicitacao.data_de_pagamento
                            self.tipo = 'em_rota'
                            self.is_item = True  # Flag para identificar que é um item
                            self.solicitacao_original_id = solicitacao.id  # ID da solicitação original
                            self.ticket_original = solicitacao.ticket  # Ticket da solicitação original
                        
                        def get_status_display(self):
                            return solicitacao.get_status_display()
                        
                        def get_prioridade_display(self):
                            return solicitacao.get_prioridade_display()
                    
                    solicitacao_item = SolicitacaoItem()
                    solicitacoes_expandidas.append(solicitacao_item)
            else:
                # Para solicitações "Casual" ou "Em Rota" sem itens, adicionar normalmente
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
