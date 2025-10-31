from . import views
from django.urls import path

urlpatterns = [
    path("login/",views.LoginUsuarios.as_view(),name="login"),
    path("cadastrar-usuario/", views.RegisterarUsuario.as_view(), name="cadastrar_usuario"),
    path("logout/", views.LogoutUsuario.as_view(), name="logout"),
    path("gerenciar-usuarios/", views.GerenciarUsuarios.as_view(), name="gerenciar_usuarios"),
    path("equipes/", views.Equipes.as_view(), name="equipes"),
]