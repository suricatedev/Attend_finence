from django.contrib import admin
from .models import Servico

@admin.register(Servico)
class ServicoAdmin(admin.ModelAdmin):
    list_display = ('nome', 'ativo', 'data_criacao', 'data_atualizacao')
    list_filter = ('ativo', 'data_criacao')
    search_fields = ('nome', 'descricao')
    ordering = ('nome',)
