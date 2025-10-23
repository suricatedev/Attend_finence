from . import views
from django.urls import path

urlpatterns = [
    path("login/",views.LoginUsuarios.as_view(),name="login"),
    path("cadastrar-usuario/", views.RegisterarUsuario.as_view(), name="cadastrar_usuario"),
]