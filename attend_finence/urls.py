from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from solicitacoes import views as solicitacoes_views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', solicitacoes_views.receber_dados, name='home'),  # Rota para a página inicial
    path("usuarios/", include("usuarios.urls")),
    path("solicitacoes/", include("solicitacoes.urls")),
    path("servicos/", include("servicos.urls")),
    path("dashboards/", include("dashborads.urls")), # Mantido para dashboards
]

# Servir arquivos estáticos
# Em desenvolvimento: Django serve automaticamente
# Em produção: serve do STATIC_ROOT (após collectstatic) ou configure Nginx/Apache
if settings.DEBUG:
    # Em modo debug, usa staticfiles_urlpatterns que serve de STATICFILES_DIRS
    from django.contrib.staticfiles.urls import staticfiles_urlpatterns
    urlpatterns += staticfiles_urlpatterns()
else:
    # Em produção, serve do STATIC_ROOT (necessita rodar collectstatic antes)
    if hasattr(settings, 'STATIC_ROOT') and settings.STATIC_ROOT:
        urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
