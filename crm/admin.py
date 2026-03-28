from django.contrib import admin
from .models import Segmento, PipelineEstagio, Lead, Oportunidade, Interacao, Tarefa


@admin.register(Segmento)
class SegmentoAdmin(admin.ModelAdmin):
    list_display = ('nome', 'ativo', 'data_criacao')
    list_filter = ('ativo',)
    search_fields = ('nome',)


@admin.register(PipelineEstagio)
class PipelineEstagioAdmin(admin.ModelAdmin):
    list_display = ('nome', 'ordem', 'ativo')
    list_filter = ('ativo',)
    ordering = ('ordem',)


@admin.register(Lead)
class LeadAdmin(admin.ModelAdmin):
    list_display = ('nome', 'empresa', 'status', 'origem', 'valor_estimado', 'responsavel', 'data_criacao')
    list_filter = ('status', 'origem', 'segmento', 'data_criacao')
    search_fields = ('nome', 'empresa', 'email', 'telefone', 'cnpj')
    readonly_fields = ('data_criacao', 'data_atualizacao')
    fieldsets = (
        ('Informações do Lead', {
            'fields': ('nome', 'empresa', 'email', 'telefone', 'cnpj')
        }),
        ('Classificação', {
            'fields': ('status', 'origem', 'segmento', 'valor_estimado')
        }),
        ('Responsável', {
            'fields': ('responsavel', 'criado_por', 'cliente_empresa')
        }),
        ('Observações', {
            'fields': ('observacoes',)
        }),
        ('Datas', {
            'fields': ('data_criacao', 'data_atualizacao'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Oportunidade)
class OportunidadeAdmin(admin.ModelAdmin):
    list_display = ('titulo', 'status', 'prioridade', 'valor_estimado', 'probabilidade', 'responsavel', 'data_fechamento_prevista')
    list_filter = ('status', 'prioridade', 'estagio', 'data_criacao')
    search_fields = ('titulo', 'descricao')
    readonly_fields = ('data_criacao', 'data_atualizacao')


@admin.register(Interacao)
class InteracaoAdmin(admin.ModelAdmin):
    list_display = ('assunto', 'tipo', 'lead', 'oportunidade', 'usuario', 'data_interacao')
    list_filter = ('tipo', 'data_interacao')
    search_fields = ('assunto', 'descricao')
    readonly_fields = ('data_criacao',)


@admin.register(Tarefa)
class TarefaAdmin(admin.ModelAdmin):
    list_display = ('titulo', 'status', 'prioridade', 'responsavel', 'data_vencimento')
    list_filter = ('status', 'prioridade', 'data_vencimento')
    search_fields = ('titulo', 'descricao')
    readonly_fields = ('data_criacao', 'data_atualizacao')
