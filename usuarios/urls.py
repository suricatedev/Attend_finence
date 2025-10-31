from . import views
from django.urls import path

urlpatterns = [
    path("login/",views.LoginUsuarios.as_view(),name="login"),
    path("cadastrar-usuario/", views.RegisterarUsuario.as_view(), name="cadastrar_usuario"),
    path("logout/", views.LogoutUsuario.as_view(), name="logout"),
    path("gerenciar-usuarios/", views.GerenciarUsuarios.as_view(), name="gerenciar_usuarios"),
    path("get-user/<int:user_id>/", views.GetUsuario.as_view(), name="get_usuario"),
    path("editar-usuario/<int:user_id>/", views.EditarUsuario.as_view(), name="editar_usuario"),
    path("deletar-usuario/<int:user_id>/", views.DeletarUsuario.as_view(), name="deletar_usuario"),
    path("equipes/", views.Equipes.as_view(), name="equipes"),
]