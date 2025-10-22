from django.db import models

class Solicitacoes(models.Model):
    status = models.Chard.CharField(max_length = 30)
    titulo = models.CharField(max_length = 70) 
    nome_solicitante = models.ForeignKey(User) 
    id = models.IntegerField()
    nome_do_recebedor = models.CharField(max_length = 30)
    valor = models.FloatField()
    descricao = models.TextField()
    data_de_pagamento = models.DateField()
    data_de_criacao = models.DateField()
    anexo = models.FileField(upload_to = 'anexos/')
    tempo_criacao = models.TimeField()
    tempo_fila =  models.TimeField()
    prioridade = models.CharField(max_length = 20)
    servico = models.CharField(max_length = 30)

STATUS_CHOICES = [
    ('pendente', 'Pendentes'),
    ('aprovado', 'Aprovado'),
    ('recusado', 'Recusado'),
    ('concluido', 'Concluido'),
]

PRIORIDADE_CHOICES = [
    ('baixa', 'Baixa'),
    ('media', 'Média'),
    ('alta', 'Alta'),
]

SERVICO_CHOICES = [
    ('consultoria_TI', 'Consultoria em TI'),
    ('desenvolvimento', 'Desenvolvimento de Software'),
    ('manutenção_equipamentos', 'Manutenção de Equipamentos'),
    ('treinamento_corporativo', 'Treinamento Corporativo'),
]
status = models.ChardCharField(max_length = 30, choices = STATUS_CHOICES, default = 'pendentes')
prioridade = models.CharField(max_length = 20, choices = PRIORIDADE_CHOICES, default = 'baixa')
servico = models.CharField(max_length = 30, choices = SERVICO_CHOICES, default = 'consultoria_TI')



