from django.urls import path
from . import views

urlpatterns = [
    path("dashboard/", views.dashboard, name="dashboard"), # Mantido
    path("relatorio/", views.relatorio, name="relatorio"),
    path("relatorio/indicadores/", views.relatorio_indicadores, name="relatorio_indicadores"),
    path("dashboard/metrics/", views.dashboard_metrics, name="dashboard_metrics"),
]
