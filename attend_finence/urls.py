from django.contrib import admin
from django.urls import path, include
from solicitacoes import views as solicitacoes_views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', solicitacoes_views.receber_dados, name='home'),  # Rota para a página inicial
    path("usuarios/", include("usuarios.urls")),
    path("solicitacoes/", include("solicitacoes.urls")),
    path("servicos/", include("servicos.urls")),
    path("dashboards/", include("dashborads.urls")), # Mantido para dashboards
]
