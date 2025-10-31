from django.urls import path
from . import views

urlpatterns = [
    path("home/", views.receber_dados, name='home'),
    path("atualizar-status/", views.atualizar_status, name='atualizar_status'),
]
