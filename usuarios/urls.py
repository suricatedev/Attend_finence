from . import views
from django.urls import path

urlpatterns = [
    path("login/",views.LoginUsuarios.as_view(),name="login")
]