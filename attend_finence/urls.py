from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path("usuarios/", include("usuarios.urls")),
    path("solicitacoes/", include("solicitacoes.urls")),
    path("dashboard/", include("dashborads.urls")),
    path("servicos/", include("servicos.urls")),
]

