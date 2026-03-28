from django.urls import path
from . import views

app_name = 'crm'

urlpatterns = [
    # Páginas
    path('', views.dashboard_crm, name='dashboard'),
    path('leads/', views.leads_page, name='leads'),
    path('pipeline/', views.pipeline_page, name='pipeline'),

    # APIs - Dashboard
    path('api/dashboard/', views.dashboard_crm_dados, name='api_dashboard'),

    # APIs - Leads
    path('api/leads/', views.listar_leads, name='api_listar_leads'),
    path('api/leads/criar/', views.criar_lead, name='api_criar_lead'),
    path('api/leads/<int:lead_id>/atualizar/', views.atualizar_lead, name='api_atualizar_lead'),

    # APIs - Oportunidades
    path('api/oportunidades/', views.listar_oportunidades, name='api_listar_oportunidades'),
    path('api/oportunidades/criar/', views.criar_oportunidade, name='api_criar_oportunidade'),

    # APIs - Tarefas
    path('api/tarefas/', views.listar_tarefas, name='api_listar_tarefas'),

    # APIs - Interações
    path('api/interacoes/', views.listar_interacoes, name='api_listar_interacoes'),
    path('api/interacoes/criar/', views.criar_interacao, name='api_criar_interacao'),

    # APIs - Auxiliares
    path('api/segmentos/', views.listar_segmentos, name='api_listar_segmentos'),
    path('api/estagios/', views.listar_estagios, name='api_listar_estagios'),
]
