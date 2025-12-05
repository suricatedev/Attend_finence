from .models import Recebedor

def recebedores_context(request):
    """
    Context processor para disponibilizar recebedores ativos em todos os templates.
    """
    recebedores_ativos = Recebedor.objects.filter(ativo=True).order_by('nome')
    return {
        'recebedores_disponiveis': recebedores_ativos
    }



def recebedores_context(request):
    """
    Context processor para disponibilizar recebedores ativos em todos os templates.
    """
    recebedores_ativos = Recebedor.objects.filter(ativo=True).order_by('nome')
    return {
        'recebedores_disponiveis': recebedores_ativos
    }



