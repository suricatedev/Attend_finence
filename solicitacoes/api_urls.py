from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .api_views import SolicitacoesViewSet

# Criar router para o ViewSet
router = DefaultRouter()
router.register(r'solicitacoes', SolicitacoesViewSet, basename='solicitacoes')

urlpatterns = [
    path('', include(router.urls)),
]








from rest_framework.routers import DefaultRouter
from .api_views import SolicitacoesViewSet

# Criar router para o ViewSet
router = DefaultRouter()
router.register(r'solicitacoes', SolicitacoesViewSet, basename='solicitacoes')

urlpatterns = [
    path('', include(router.urls)),
]











