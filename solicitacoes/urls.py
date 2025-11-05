from django.urls import path
from . import views

urlpatterns = [
    path("home/", views.receber_dados, name='home'), # Mantido para compatibilidade
    path("atualizar-status/", views.atualizar_status, name='atualizar_status'),
    path("obter-itens-rota/<int:solicitacao_id>/", views.obter_itens_rota, name='obter_itens_rota'),
    path("obter-valores-casual/<int:solicitacao_id>/", views.obter_valores_detalhados_casual, name='obter_valores_casual'),
    path("obter-detalhes-completos/<int:solicitacao_id>/", views.obter_detalhes_completos, name='obter_detalhes_completos'),
]
