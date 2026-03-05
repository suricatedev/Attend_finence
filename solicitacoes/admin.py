from django.contrib import admin
from .models import (
    AuditoriaLog,
    ClienteEmpresa,
    Recebedor,
    SolicitacaoRotaItem,
    SolicitacaoTecnico,
    Solicitacoes,
)

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
    list_display = ('ticket', 'titulo', 'tipo', 'status', 'prioridade', 'valor', 'recebedor', 'cliente_empresa', 'cnpj', 'data_de_criacao')
    list_filter = ('status', 'prioridade', 'tipo', 'data_de_criacao')
    search_fields = ('ticket', 'titulo', 'nome_do_recebedor', 'cliente_empresa', 'cnpj', 'recebedor__nome')
    readonly_fields = ('data_de_criacao', 'tempo_criacao', 'data_entrada_status', 'nome_do_recebedor', 'chave_pix')
    autocomplete_fields = ['recebedor']

    fieldsets = (
        (None, {
            'fields': ('ticket', 'titulo', 'status', 'prioridade', 'nome_solicitante', 'recebedor', 'valor', 'servico', 'tipo')
        }),
        ('Cliente / CNPJ', {
            'fields': ('cliente_empresa', 'cnpj')
        }),
        ('Datas e descrição', {
            'fields': ('data_de_pagamento', 'data_de_criacao', 'tempo_criacao', 'tempo_fila', 'descricao', 'data_entrada_status', 'data_aprovacao')
        }),
        ('Valores detalhados', {
            'fields': ('valor_km', 'valor_pedagio', 'valor_hospedagem', 'valor_fluvial', 'valor_outros', 'valor_receita', 'valor_em_rota', 'descricao_em_rota')
        }),
        ('Legado (somente leitura)', {
            'classes': ('collapse',),
            'fields': ('nome_do_recebedor', 'chave_pix')
        }),
        ('Outros', {
            'classes': ('collapse',),
            'fields': ('anexo', 'excluida', 'data_exclusao', 'excluida_por')
        }),
    )

    def save_model(self, request, obj, form, change):
        if obj.recebedor:
            obj.nome_do_recebedor = obj.recebedor.nome
            obj.chave_pix = obj.recebedor.chave_pix or ''
        super().save_model(request, obj, form, change)

@admin.register(SolicitacaoRotaItem)
class SolicitacaoRotaItemAdmin(admin.ModelAdmin):
    list_display = ('solicitacao', 'ticket_item', 'ordem', 'valor', 'servico', 'recebedor_fk', 'cliente_empresa', 'cnpj')
    list_filter = ('servico', 'ordem')
    search_fields = ('ticket_item', 'solicitacao__titulo', 'recebedor', 'cliente_empresa', 'cnpj', 'recebedor_fk__nome')
    readonly_fields = ('recebedor', 'chave_pix')
    autocomplete_fields = ['recebedor_fk']

    fieldsets = (
        (None, {
            'fields': ('solicitacao', 'ticket_item', 'ordem', 'servico', 'recebedor_fk', 'valor', 'cliente_empresa', 'cnpj')
        }),
        ('Valores detalhados', {
            'fields': ('valor_km', 'valor_pedagio', 'valor_hospedagem', 'valor_fluvial', 'valor_outros')
        }),
        ('Legado (somente leitura)', {
            'classes': ('collapse',),
            'fields': ('recebedor', 'chave_pix')
        }),
    )

    def save_model(self, request, obj, form, change):
        if obj.recebedor_fk:
            obj.recebedor = obj.recebedor_fk.nome
            obj.chave_pix = obj.recebedor_fk.chave_pix or ''
        super().save_model(request, obj, form, change)

@admin.register(SolicitacaoTecnico)
class SolicitacaoTecnicoAdmin(admin.ModelAdmin):
    list_display = ('id', 'ticket_item', 'solicitacao', 'recebedor', 'servico', 'cliente_empresa', 'valor_pagamento_tecnico', 'valor_extra', 'data_realizacao_atividade', 'data_pagamento', 'atividade_produtiva', 'data_criacao')
    list_filter = ('atividade_produtiva', 'servico', 'data_realizacao_atividade', 'data_pagamento', 'data_criacao')
    search_fields = ('ticket_item', 'solicitacao__ticket', 'recebedor__nome', 'servico__nome', 'descricao')
    readonly_fields = ('data_criacao', 'data_atualizacao')
    fieldsets = (
        ('Informações da Solicitação', {
            'fields': ('solicitacao', 'ticket_item', 'recebedor', 'servico', 'cliente_empresa')
        }),
        ('Valores', {
            'fields': ('valor_pagamento_tecnico', 'valor_extra')
        }),
        ('Detalhes', {
            'fields': ('descricao', 'data_realizacao_atividade', 'data_pagamento', 'atividade_produtiva')
        }),
        ('Datas', {
            'fields': ('data_criacao', 'data_atualizacao'),
            'classes': ('collapse',)
        }),
    )


@admin.register(AuditoriaLog)
class AuditoriaLogAdmin(admin.ModelAdmin):
    list_display = ('data_hora', 'acao', 'app', 'modelo', 'objeto_id', 'usuario', 'origem', 'ip_address')
    list_filter = ('acao', 'app', 'modelo', 'data_hora')
    search_fields = ('objeto_id', 'usuario__username', 'origem', 'ip_address')
    readonly_fields = ('data_hora',)
