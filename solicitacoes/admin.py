from django.contrib import admin
from .models import Solicitacoes, SolicitacaoRotaItem

@admin.register(Solicitacoes)
class SolicitacoesAdmin(admin.ModelAdmin):
    list_display = ('ticket', 'titulo', 'tipo', 'status', 'prioridade', 'valor', 'nome_do_recebedor', 'data_de_criacao')
    list_filter = ('status', 'prioridade', 'tipo', 'data_de_criacao')
    search_fields = ('ticket', 'titulo', 'nome_do_recebedor')
    readonly_fields = ('data_de_criacao', 'tempo_criacao')

@admin.register(SolicitacaoRotaItem)
class SolicitacaoRotaItemAdmin(admin.ModelAdmin):
    list_display = ('solicitacao', 'ticket_item', 'ordem', 'valor', 'servico')
    list_filter = ('servico', 'ordem')
    search_fields = ('ticket_item', 'solicitacao__titulo')
