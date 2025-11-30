from django.urls import path
from . import views

urlpatterns = [
    path("home/", views.receber_dados, name='home'), # Mantido para compatibilidade
    path("atualizar-status/", views.atualizar_status, name='atualizar_status'),
    path("obter-itens-rota/<int:solicitacao_id>/", views.obter_itens_rota, name='obter_itens_rota'),
    path("obter-valores-casual/<int:solicitacao_id>/", views.obter_valores_detalhados_casual, name='obter_valores_casual'),
    path("obter-detalhes-completos/<int:solicitacao_id>/", views.obter_detalhes_completos, name='obter_detalhes_completos'),
    path("buscar-recebedores/", views.buscar_recebedores, name='buscar_recebedores'),
    path("buscar-clientes-empresas/", views.buscar_clientes_empresas, name='buscar_clientes_empresas'),
    path("exportar-relatorio-card/<int:solicitacao_id>/", views.exportar_relatorio_card, name='exportar_relatorio_card'),
    path("excluir-solicitacao/<int:solicitacao_id>/", views.excluir_solicitacao, name='excluir_solicitacao'),
    path("excluir-solicitacoes-recusadas/", views.excluir_solicitacoes_recusadas, name='excluir_solicitacoes_recusadas'),
    path("verificar-id-existente/", views.verificar_id_existente, name='verificar_id_existente'),
]
