from django.contrib import admin
from django.urls import path, include
from dashborads import views as dashboard_views

urlpatterns = [
    path('admin/', admin.site.urls),
    path("usuarios/", include("usuarios.urls")),
    path("solicitacoes/", include("solicitacoes.urls")),
    path("servicos/", include("servicos.urls")),
    path("dashboards/", include("dashborads.urls")),
    # Rotas diretas para dashboard e relatórios
   
]

