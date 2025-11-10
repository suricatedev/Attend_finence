from django.urls import path
from . import views

urlpatterns = [
    path("", views.servicos, name="servicos"),
    path("criar/", views.criar_servico, name="criar_servico"),
    path("editar/<int:servico_id>/", views.editar_servico, name="editar_servico"),
    path("deletar/<int:servico_id>/", views.deletar_servico, name="deletar_servico"),
    # URLs para Recebedores
    path("recebedores/criar/", views.criar_recebedor, name="criar_recebedor"),
    path("recebedores/editar/<int:recebedor_id>/", views.editar_recebedor, name="editar_recebedor"),
    path("recebedores/deletar/<int:recebedor_id>/", views.deletar_recebedor, name="deletar_recebedor"),
    # URLs para Clientes/Empresas
    path("clientes-empresas/criar/", views.criar_cliente_empresa, name="criar_cliente_empresa"),
    path("clientes-empresas/editar/<int:cliente_empresa_id>/", views.editar_cliente_empresa, name="editar_cliente_empresa"),
    path("clientes-empresas/deletar/<int:cliente_empresa_id>/", views.deletar_cliente_empresa, name="deletar_cliente_empresa"),
]