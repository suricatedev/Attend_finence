from django.db import models
from django.contrib.auth.models import User

STATUS_CHOICES = [
    ('pendente', 'Pendente'),
    ('aprovado', 'Aprovado'),
    ('recusado', 'Recusado'),
    ('concluido', 'Concluído'),
]

PRIORIDADE_CHOICES = [
    ('baixa', 'Baixa'),
    ('media', 'Média'),
    ('alta', 'Alta'),
]

# Create your models here.
class Solicitacoes(models.Model):
    TIPO_CHOICES = [
        ('casual', 'Casual'),
        ('em_rota', 'Em Rota'),
    ]
    ticket = models.CharField(max_length=25, unique=True, help_text="ID único da solicitação (Ex: INC001, ROTA-002)")
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='pendente')
    titulo = models.CharField(max_length = 70) 
    nome_solicitante = models.ForeignKey(User, on_delete=models.CASCADE) 
    nome_do_recebedor = models.CharField(max_length = 30)
    valor = models.FloatField()
    descricao = models.TextField()
    data_de_pagamento = models.DateField()
    data_de_criacao = models.DateField()
    anexo = models.FileField(upload_to = 'anexos/', blank = True, null = True)
    tempo_criacao = models.TimeField()
    tempo_fila =  models.TimeField()
    data_entrada_status = models.DateTimeField(auto_now_add=True, null=True, blank=True, verbose_name="Data de Entrada no Status Atual")
    prioridade = models.CharField(max_length=20, choices=PRIORIDADE_CHOICES, default='baixa')
    servico = models.ForeignKey('servicos.Servico', on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Serviço")
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES, default='casual', verbose_name="Tipo de Solicitação")
    
    # Campos de valores detalhados (para Casual e geral Em Rota)
    valor_km = models.FloatField(default=0.0, verbose_name="Valor KM")
    valor_pedagio = models.FloatField(default=0.0, verbose_name="Valor Pedagio")
    valor_hospedagem = models.FloatField(default=0.0, verbose_name="Valor Hospedagem")
    valor_fluvial = models.FloatField(default=0.0, verbose_name="Valor Fluvial")
    valor_outros = models.FloatField(default=0.0, verbose_name="Valor Outros")
    valor_receita = models.FloatField(default=0.0, verbose_name="Valor de Receita")
    valor_em_rota = models.FloatField(default=0.0, verbose_name="Valor EM ROTA")
    descricao_em_rota = models.TextField(blank=True, null=True, verbose_name="Descrição do Pagamento EM ROTA")

    def __str__(self):
        return f"{self.titulo} - {self.status}"

class SolicitacaoRotaItem(models.Model):
    """Modelo para armazenar os itens de uma solicitação Em Rota"""
    solicitacao = models.ForeignKey(Solicitacoes, on_delete=models.CASCADE, related_name='itens_rota')
    ticket_item = models.CharField(max_length=25, verbose_name="ID da Solicitação")
    valor = models.FloatField(verbose_name="Valor")
    servico = models.ForeignKey('servicos.Servico', on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Serviço")
    ordem = models.IntegerField(default=1, verbose_name="Ordem")
    
    # Campos de valores detalhados (para cada ID em Em Rota)
    valor_km = models.FloatField(default=0.0, verbose_name="Valor KM")
    valor_pedagio = models.FloatField(default=0.0, verbose_name="Valor Pedagio")
    valor_hospedagem = models.FloatField(default=0.0, verbose_name="Valor Hospedagem")
    valor_fluvial = models.FloatField(default=0.0, verbose_name="Valor Fluvial")
    valor_outros = models.FloatField(default=0.0, verbose_name="Valor Outros")

    class Meta:
        ordering = ['ordem']
        verbose_name = "Item da Rota"
        verbose_name_plural = "Itens da Rota"

    def __str__(self):
        return f"{self.solicitacao.titulo} - Item {self.ordem}: {self.ticket_item}"
