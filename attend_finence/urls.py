from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from pathlib import Path
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
# Estratégia: Tenta usar STATIC_ROOT se existir e tiver conteúdo
# Caso contrário, usa STATICFILES_DIRS (sempre funciona como fallback)
import os
from django.contrib.staticfiles.urls import staticfiles_urlpatterns

# Sempre adiciona staticfiles_urlpatterns (serve de STATICFILES_DIRS)
urlpatterns += staticfiles_urlpatterns()

# Se STATIC_ROOT existe e tem conteúdo, também serve de lá (prioridade)
if hasattr(settings, 'STATIC_ROOT') and settings.STATIC_ROOT:
    static_root_path = Path(settings.STATIC_ROOT)
    if static_root_path.exists() and static_root_path.is_dir():
        try:
            if any(static_root_path.iterdir()):
                # Serve também do STATIC_ROOT (produção)
                urlpatterns += static(settings.STATIC_URL, document_root=str(settings.STATIC_ROOT))
        except (OSError, PermissionError):
            pass  # Ignora erros, já temos staticfiles_urlpatterns
