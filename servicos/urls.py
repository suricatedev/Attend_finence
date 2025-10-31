from django.urls import path
from . import views

urlpatterns = [
    path("", views.servicos, name="servicos"),
    path("criar/", views.criar_servico, name="criar_servico"),
    path("editar/<int:servico_id>/", views.editar_servico, name="editar_servico"),
    path("deletar/<int:servico_id>/", views.deletar_servico, name="deletar_servico"),
]