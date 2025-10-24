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

SERVICO_CHOICES = [
    ('consultoria_TI', 'Consultoria em TI'),
    ('desenvolvimento', 'Desenvolvimento de Software'),
    ('manutencao_equipamentos', 'Manutenção de Equipamentos'),
    ('treinamento_corporativo', 'Treinamento Corporativo'),
]

# Create your models here.
class Solicitacoes(models.Model):
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
    prioridade = models.CharField(max_length=20, choices=PRIORIDADE_CHOICES, default='baixa')
    servico = models.CharField(max_length=30, choices=SERVICO_CHOICES, default='consultoria_TI')

    def __str__(self):
        return f"{self.titulo} - {self.status}"
