from .models import Servico

def servicos_context(request):
    """
    Context processor para disponibilizar serviços ativos em todos os templates.
    """
    servicos_ativos = Servico.objects.filter(ativo=True).order_by('nome')
    return {
        'servicos_disponiveis': servicos_ativos
    }

