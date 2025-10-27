from django.contrib import admin
from django.urls import path, include
from django.shortcuts import render

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', home_view, name='home'),
    path('dashboard/', dashboard_view, name='dashboard'),
    path('relatorios/', relatorios_view, name='relatorios'),
    path('servicos/', servicos_view, name='servicos'),
    path("usuarios/", include("usuarios.urls")),
    path("Solicitacoes/", include("solicitacoes.urls")),
]

