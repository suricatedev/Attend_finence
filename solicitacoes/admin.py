from django.contrib import admin
from .models import Solicitacoes, SolicitacaoRotaItem, Recebedor, ClienteEmpresa, SolicitacaoTecnico

@admin.register(Recebedor)
class RecebedorAdmin(admin.ModelAdmin):
    list_display = ('nome', 'chave_pix', 'ativo', 'data_criacao')
    list_filter = ('ativo', 'data_criacao')
    search_fields = ('nome', 'chave_pix')
    readonly_fields = ('data_criacao', 'data_atualizacao')

@admin.register(ClienteEmpresa)
class ClienteEmpresaAdmin(admin.ModelAdmin):
    list_display = ('nome', 'cnpj', 'ativo', 'data_criacao')
    list_filter = ('ativo', 'data_criacao')
    search_fields = ('nome', 'cnpj')
    readonly_fields = ('data_criacao', 'data_atualizacao')

@admin.register(Solicitacoes)
class SolicitacoesAdmin(admin.ModelAdmin):
    list_display = ('ticket', 'titulo', 'tipo', 'status', 'prioridade', 'valor', 'nome_do_recebedor', 'cliente_empresa', 'cnpj', 'data_de_criacao')
    list_filter = ('status', 'prioridade', 'tipo', 'data_de_criacao')
    search_fields = ('ticket', 'titulo', 'nome_do_recebedor', 'cliente_empresa', 'cnpj')
    readonly_fields = ('data_de_criacao', 'tempo_criacao')

@admin.register(SolicitacaoRotaItem)
class SolicitacaoRotaItemAdmin(admin.ModelAdmin):
    list_display = ('solicitacao', 'ticket_item', 'ordem', 'valor', 'servico', 'recebedor', 'chave_pix', 'cliente_empresa', 'cnpj')
    list_filter = ('servico', 'ordem')
    search_fields = ('ticket_item', 'solicitacao__titulo', 'recebedor', 'cliente_empresa', 'cnpj')

@admin.register(SolicitacaoTecnico)
class SolicitacaoTecnicoAdmin(admin.ModelAdmin):
    list_display = ('solicitacao', 'recebedor', 'servico', 'valor_pagamento_tecnico', 'valor_extra', 'data_realizacao_atividade', 'atividade_produtiva', 'data_criacao')
    list_filter = ('atividade_produtiva', 'servico', 'data_realizacao_atividade', 'data_criacao')
    search_fields = ('solicitacao__ticket', 'recebedor__nome', 'servico__nome', 'descricao')
    readonly_fields = ('data_criacao', 'data_atualizacao')
    fieldsets = (
        ('Informações da Solicitação', {
            'fields': ('solicitacao', 'recebedor', 'servico')
        }),
        ('Valores', {
            'fields': ('valor_pagamento_tecnico', 'valor_extra')
        }),
        ('Detalhes', {
            'fields': ('descricao', 'data_realizacao_atividade', 'atividade_produtiva')
        }),
        ('Datas', {
            'fields': ('data_criacao', 'data_atualizacao'),
            'classes': ('collapse',)
        }),
    )
