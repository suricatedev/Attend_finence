import logging
from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.db.models import Sum, Count, Q, F
from django.utils import timezone
from datetime import timedelta
from .models import Lead, Oportunidade, Interacao, Tarefa, PipelineEstagio, Segmento
from usuarios.decorators import group_required

logger = logging.getLogger(__name__)


@group_required('Administrador', 'Financeiro', 'Vendas')
def dashboard_crm(request):
    """Dashboard principal do CRM"""
    return render(request, 'crm/dashboard.html')


@group_required('Administrador', 'Financeiro', 'Vendas')
@require_http_methods(["GET"])
def dashboard_crm_dados(request):
    """API para dados do dashboard CRM"""
    try:
        agora = timezone.now()
        inicio_mes = agora.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        # Contagem de leads
        leads_total = Lead.objects.count()
        leads_novos_mes = Lead.objects.filter(data_criacao__gte=inicio_mes).count()
        leads_por_status = dict(
            Lead.objects.values_list('status').annotate(total=Count('id')).values_list('status', 'total')
        )

        # Oportunidades
        oportunidades_abertas = Oportunidade.objects.filter(status='aberta')
        valor_pipeline = oportunidades_abertas.aggregate(
            total=Sum('valor_estimado')
        )['total'] or 0
        oportunidades_por_status = dict(
            Oportunidade.objects.values_list('status').annotate(total=Count('id')).values_list('status', 'total')
        )

        # Taxa de conversão
        leads_convertidos = Lead.objects.filter(status='convertido').count()
        taxa_conversao = (leads_convertidos / leads_total * 100) if leads_total > 0 else 0

        # Tarefas
        tarefas_pendentes = Tarefa.objects.filter(
            status__in=['pendente', 'em_andamento']
        ).count()
        tarefas_atrasadas = Tarefa.objects.filter(
            status__in=['pendente', 'em_andamento'],
            data_vencimento__lt=agora
        ).count()

        # Interações recentes (últimos 7 dias)
        interacoes_semana = Interacao.objects.filter(
            data_interacao__gte=agora - timedelta(days=7)
        ).count()

        # Pipeline por estágio
        pipeline_estagios = []
        for estagio in PipelineEstagio.objects.filter(ativo=True).order_by('ordem'):
            ops = Oportunidade.objects.filter(estagio=estagio, status='aberta')
            pipeline_estagios.append({
                'nome': estagio.nome,
                'cor': estagio.cor,
                'quantidade': ops.count(),
                'valor': float(ops.aggregate(total=Sum('valor_estimado'))['total'] or 0),
            })

        return JsonResponse({
            'success': True,
            'dados': {
                'leads_total': leads_total,
                'leads_novos_mes': leads_novos_mes,
                'leads_por_status': leads_por_status,
                'valor_pipeline': float(valor_pipeline),
                'oportunidades_por_status': oportunidades_por_status,
                'taxa_conversao': round(taxa_conversao, 1),
                'tarefas_pendentes': tarefas_pendentes,
                'tarefas_atrasadas': tarefas_atrasadas,
                'interacoes_semana': interacoes_semana,
                'pipeline_estagios': pipeline_estagios,
            }
        })
    except Exception as e:
        logger.error(f"Erro ao carregar dados do dashboard CRM: {e}")
        return JsonResponse({'success': False, 'message': str(e)}, status=500)


@group_required('Administrador', 'Financeiro', 'Vendas')
def leads_page(request):
    """Página de gestão de leads"""
    return render(request, 'crm/leads.html')


@group_required('Administrador', 'Financeiro', 'Vendas')
@require_http_methods(["GET"])
def listar_leads(request):
    """API para listar leads com filtros"""
    try:
        queryset = Lead.objects.select_related('segmento', 'responsavel', 'criado_por')

        status_filter = request.GET.get('status')
        origem_filter = request.GET.get('origem')
        busca = request.GET.get('q', '').strip()

        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if origem_filter:
            queryset = queryset.filter(origem=origem_filter)
        if busca:
            queryset = queryset.filter(
                Q(nome__icontains=busca) |
                Q(empresa__icontains=busca) |
                Q(email__icontains=busca) |
                Q(telefone__icontains=busca)
            )

        leads = []
        for lead in queryset[:100]:
            leads.append({
                'id': lead.id,
                'nome': lead.nome,
                'empresa': lead.empresa,
                'email': lead.email,
                'telefone': lead.telefone,
                'status': lead.status,
                'status_display': lead.get_status_display(),
                'origem': lead.origem,
                'origem_display': lead.get_origem_display(),
                'segmento': lead.segmento.nome if lead.segmento else '',
                'valor_estimado': float(lead.valor_estimado),
                'responsavel': lead.responsavel.get_full_name() if lead.responsavel else '',
                'data_criacao': lead.data_criacao.strftime('%d/%m/%Y %H:%M'),
            })

        return JsonResponse({'success': True, 'leads': leads, 'total': len(leads)})
    except Exception as e:
        logger.error(f"Erro ao listar leads: {e}")
        return JsonResponse({'success': False, 'message': str(e)}, status=500)


@group_required('Administrador', 'Financeiro', 'Vendas')
@require_http_methods(["POST"])
def criar_lead(request):
    """API para criar novo lead"""
    import json
    try:
        data = json.loads(request.body)
        lead = Lead.objects.create(
            nome=data.get('nome', ''),
            empresa=data.get('empresa', ''),
            email=data.get('email', ''),
            telefone=data.get('telefone', ''),
            cnpj=data.get('cnpj', ''),
            status=data.get('status', 'novo'),
            origem=data.get('origem', 'outro'),
            valor_estimado=data.get('valor_estimado', 0),
            observacoes=data.get('observacoes', ''),
            responsavel_id=data.get('responsavel_id') or None,
            segmento_id=data.get('segmento_id') or None,
            criado_por=request.user,
        )
        return JsonResponse({'success': True, 'id': lead.id, 'message': 'Lead criado com sucesso.'})
    except Exception as e:
        logger.error(f"Erro ao criar lead: {e}")
        return JsonResponse({'success': False, 'message': str(e)}, status=400)


@group_required('Administrador', 'Financeiro', 'Vendas')
@require_http_methods(["PUT"])
def atualizar_lead(request, lead_id):
    """API para atualizar lead"""
    import json
    try:
        lead = Lead.objects.get(id=lead_id)
        data = json.loads(request.body)

        for field in ['nome', 'empresa', 'email', 'telefone', 'cnpj', 'status',
                      'origem', 'observacoes']:
            if field in data:
                setattr(lead, field, data[field])

        if 'valor_estimado' in data:
            lead.valor_estimado = data['valor_estimado']
        if 'responsavel_id' in data:
            lead.responsavel_id = data['responsavel_id'] or None
        if 'segmento_id' in data:
            lead.segmento_id = data['segmento_id'] or None

        lead.save()
        return JsonResponse({'success': True, 'message': 'Lead atualizado com sucesso.'})
    except Lead.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Lead não encontrado.'}, status=404)
    except Exception as e:
        logger.error(f"Erro ao atualizar lead: {e}")
        return JsonResponse({'success': False, 'message': str(e)}, status=400)


@group_required('Administrador', 'Financeiro', 'Vendas')
def pipeline_page(request):
    """Página do pipeline/kanban de oportunidades"""
    return render(request, 'crm/pipeline.html')


@group_required('Administrador', 'Financeiro', 'Vendas')
@require_http_methods(["GET"])
def listar_oportunidades(request):
    """API para listar oportunidades"""
    try:
        queryset = Oportunidade.objects.select_related(
            'lead', 'estagio', 'responsavel', 'cliente_empresa'
        )

        status_filter = request.GET.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        oportunidades = []
        for op in queryset[:100]:
            oportunidades.append({
                'id': op.id,
                'titulo': op.titulo,
                'lead_nome': op.lead.nome if op.lead else '',
                'cliente_empresa': op.cliente_empresa.nome if op.cliente_empresa else '',
                'estagio': op.estagio.nome if op.estagio else '',
                'estagio_id': op.estagio_id,
                'status': op.status,
                'status_display': op.get_status_display(),
                'prioridade': op.prioridade,
                'valor_estimado': float(op.valor_estimado),
                'probabilidade': op.probabilidade,
                'valor_ponderado': float(op.valor_ponderado),
                'data_fechamento_prevista': op.data_fechamento_prevista.strftime('%d/%m/%Y') if op.data_fechamento_prevista else '',
                'responsavel': op.responsavel.get_full_name() if op.responsavel else '',
                'data_criacao': op.data_criacao.strftime('%d/%m/%Y'),
            })

        return JsonResponse({'success': True, 'oportunidades': oportunidades, 'total': len(oportunidades)})
    except Exception as e:
        logger.error(f"Erro ao listar oportunidades: {e}")
        return JsonResponse({'success': False, 'message': str(e)}, status=500)


@group_required('Administrador', 'Financeiro', 'Vendas')
@require_http_methods(["POST"])
def criar_oportunidade(request):
    """API para criar nova oportunidade"""
    import json
    try:
        data = json.loads(request.body)
        op = Oportunidade.objects.create(
            titulo=data.get('titulo', ''),
            lead_id=data.get('lead_id') or None,
            cliente_empresa_id=data.get('cliente_empresa_id') or None,
            estagio_id=data.get('estagio_id') or None,
            status=data.get('status', 'aberta'),
            prioridade=data.get('prioridade', 'media'),
            valor_estimado=data.get('valor_estimado', 0),
            probabilidade=data.get('probabilidade', 50),
            data_fechamento_prevista=data.get('data_fechamento_prevista') or None,
            descricao=data.get('descricao', ''),
            responsavel_id=data.get('responsavel_id') or None,
            criado_por=request.user,
        )
        return JsonResponse({'success': True, 'id': op.id, 'message': 'Oportunidade criada com sucesso.'})
    except Exception as e:
        logger.error(f"Erro ao criar oportunidade: {e}")
        return JsonResponse({'success': False, 'message': str(e)}, status=400)


@group_required('Administrador', 'Financeiro', 'Vendas')
@require_http_methods(["GET"])
def listar_tarefas(request):
    """API para listar tarefas CRM"""
    try:
        queryset = Tarefa.objects.select_related('lead', 'oportunidade', 'responsavel')

        status_filter = request.GET.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        tarefas = []
        for t in queryset[:100]:
            tarefas.append({
                'id': t.id,
                'titulo': t.titulo,
                'descricao': t.descricao,
                'status': t.status,
                'status_display': t.get_status_display(),
                'prioridade': t.prioridade,
                'lead_nome': t.lead.nome if t.lead else '',
                'oportunidade_titulo': t.oportunidade.titulo if t.oportunidade else '',
                'responsavel': t.responsavel.get_full_name() if t.responsavel else '',
                'data_vencimento': t.data_vencimento.strftime('%d/%m/%Y %H:%M') if t.data_vencimento else '',
                'atrasada': t.atrasada,
                'data_criacao': t.data_criacao.strftime('%d/%m/%Y'),
            })

        return JsonResponse({'success': True, 'tarefas': tarefas, 'total': len(tarefas)})
    except Exception as e:
        logger.error(f"Erro ao listar tarefas: {e}")
        return JsonResponse({'success': False, 'message': str(e)}, status=500)


@group_required('Administrador', 'Financeiro', 'Vendas')
@require_http_methods(["GET"])
def listar_interacoes(request):
    """API para listar interações"""
    try:
        lead_id = request.GET.get('lead_id')
        oportunidade_id = request.GET.get('oportunidade_id')

        queryset = Interacao.objects.select_related('lead', 'oportunidade', 'usuario')

        if lead_id:
            queryset = queryset.filter(lead_id=lead_id)
        if oportunidade_id:
            queryset = queryset.filter(oportunidade_id=oportunidade_id)

        interacoes = []
        for i in queryset[:50]:
            interacoes.append({
                'id': i.id,
                'tipo': i.tipo,
                'tipo_display': i.get_tipo_display(),
                'assunto': i.assunto,
                'descricao': i.descricao,
                'data_interacao': i.data_interacao.strftime('%d/%m/%Y %H:%M'),
                'duracao_minutos': i.duracao_minutos,
                'usuario': i.usuario.get_full_name() if i.usuario else '',
            })

        return JsonResponse({'success': True, 'interacoes': interacoes, 'total': len(interacoes)})
    except Exception as e:
        logger.error(f"Erro ao listar interações: {e}")
        return JsonResponse({'success': False, 'message': str(e)}, status=500)


@group_required('Administrador', 'Financeiro', 'Vendas')
@require_http_methods(["POST"])
def criar_interacao(request):
    """API para registrar nova interação"""
    import json
    try:
        data = json.loads(request.body)
        interacao = Interacao.objects.create(
            lead_id=data.get('lead_id') or None,
            oportunidade_id=data.get('oportunidade_id') or None,
            cliente_empresa_id=data.get('cliente_empresa_id') or None,
            tipo=data.get('tipo', 'nota'),
            assunto=data.get('assunto', ''),
            descricao=data.get('descricao', ''),
            data_interacao=data.get('data_interacao', timezone.now()),
            duracao_minutos=data.get('duracao_minutos', 0),
            usuario=request.user,
        )
        return JsonResponse({'success': True, 'id': interacao.id, 'message': 'Interação registrada.'})
    except Exception as e:
        logger.error(f"Erro ao criar interação: {e}")
        return JsonResponse({'success': False, 'message': str(e)}, status=400)


@group_required('Administrador', 'Financeiro', 'Vendas')
@require_http_methods(["GET"])
def listar_segmentos(request):
    """API para listar segmentos ativos"""
    segmentos = list(
        Segmento.objects.filter(ativo=True).values('id', 'nome', 'cor')
    )
    return JsonResponse({'success': True, 'segmentos': segmentos})


@group_required('Administrador', 'Financeiro', 'Vendas')
@require_http_methods(["GET"])
def listar_estagios(request):
    """API para listar estágios do pipeline"""
    estagios = list(
        PipelineEstagio.objects.filter(ativo=True).order_by('ordem').values('id', 'nome', 'cor', 'ordem')
    )
    return JsonResponse({'success': True, 'estagios': estagios})
