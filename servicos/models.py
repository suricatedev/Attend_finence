from django.db import models
from django.utils import timezone

class Servico(models.Model):
    nome = models.CharField(max_length=100, verbose_name="Nome do Serviço")
    descricao = models.TextField(blank=True, null=True, verbose_name="Descrição")
    ativo = models.BooleanField(default=True, verbose_name="Ativo")
    data_criacao = models.DateTimeField(auto_now_add=True, verbose_name="Data de Criação")
    data_atualizacao = models.DateTimeField(auto_now=True, verbose_name="Última Atualização")
    
    class Meta:
        verbose_name = "Serviço"
        verbose_name_plural = "Serviços"
        ordering = ['nome']
    
    def __str__(self):
        return self.nome
    
    def get_status_display(self):
        return "Ativo" if self.ativo else "Inativo"
