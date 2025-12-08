# View para solicitações de técnico - Adicionar ao final de views.py
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from .models import SolicitacaoTecnico

@require_http_methods(["GET"])
def listar_solicitacoes_tecnico(request):
    """
    View para listar todas as solicitações de técnico via AJAX
    """
    if not request.user.is_authenticated:
        return JsonResponse({
            'success': False,
            'message': 'Não autenticado'
        }, status=401)
    
    try:
        solicitacoes_tecnico = SolicitacaoTecnico.objects.select_related(
            'solicitacao',
            'recebedor',
            'servico'
        ).all().order_by('-data_criacao')
        
        data = []
        for sol in solicitacoes_tecnico:
            data.append({
                'id': sol.id,
                'valor_pagamento_tecnico': float(sol.valor_pagamento_tecnico),
                'valor_extra': float(sol.valor_extra) if sol.valor_extra else 0.0,
                'descricao': sol.descricao or '',
                'atividade_produtiva': sol.atividade_produtiva,
                'nome_tecnico': sol.recebedor.nome if sol.recebedor else '',
                'chave_pix': sol.recebedor.chave_pix if sol.recebedor else '',
                'tipo_servico': sol.servico.nome if sol.servico else '',
                'id_solicitacao': sol.solicitacao.ticket if sol.solicitacao else '',
                'data_criacao': sol.data_criacao.strftime('%d/%m/%Y %H:%M') if sol.data_criacao else '',
            })
        
        return JsonResponse({
            'success': True,
            'solicitacoes': data,
            'total': len(data)
        })
    
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({
            'success': False,
            'message': f'Erro ao buscar solicitações de técnico: {str(e)}'
        }, status=500)




