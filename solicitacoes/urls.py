from django.urls import path
from . import views

urlpatterns = [
    path("home/", views.receber_dados, name='home'),
    path("atualizar-status/", views.atualizar_status, name='atualizar_status'),
    path("obter-itens-rota/<int:solicitacao_id>/", views.obter_itens_rota, name='obter_itens_rota'),
]
