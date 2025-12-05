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

class Recebedor(models.Model):
    """Modelo para armazenar recebedores e suas chaves PIX"""
    SUPERVISOR_CHOICES = [
        ('supervisor1', 'Nayron Januario'),
        ('supervisor2', 'Flavio Medina'),
    ]
    
    nome = models.CharField(max_length=100, unique=True, verbose_name="Nome do Recebedor")
    chave_pix = models.CharField(max_length=255, verbose_name="Chave PIX")
    supervisor = models.CharField(max_length=50, choices=SUPERVISOR_CHOICES, blank=True, null=True, verbose_name="Supervisor")
    ativo = models.BooleanField(default=True, verbose_name="Ativo")
    data_criacao = models.DateTimeField(auto_now_add=True, verbose_name="Data de Criação")
    data_atualizacao = models.DateTimeField(auto_now=True, verbose_name="Data de Atualização")
    
    class Meta:
        verbose_name = "Recebedor"
        verbose_name_plural = "Recebedores"
        ordering = ['supervisor', 'nome']
    
    def __str__(self):
        return f"{self.nome} - {self.chave_pix}"
    
    def get_supervisor_display_name(self):
        """Retorna o nome do supervisor formatado"""
        if self.supervisor:
            return dict(self.SUPERVISOR_CHOICES).get(self.supervisor, self.supervisor)
        return "Sem Supervisor"

class ClienteEmpresa(models.Model):
    """Modelo para armazenar clientes/empresas"""
    nome = models.CharField(max_length=200, unique=True, verbose_name="Nome do Cliente/Empresa")
    cnpj = models.CharField(max_length=18, blank=True, null=True, verbose_name="CNPJ")
    ativo = models.BooleanField(default=True, verbose_name="Ativo")
    data_criacao = models.DateTimeField(auto_now_add=True, verbose_name="Data de Criação")
    data_atualizacao = models.DateTimeField(auto_now=True, verbose_name="Data de Atualização")
    
    class Meta:
        verbose_name = "Cliente/Empresa"
        verbose_name_plural = "Clientes/Empresas"
        ordering = ['nome']
    
    def __str__(self):
        return self.nome

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
    chave_pix = models.CharField(max_length=255, blank=True, null=True, verbose_name="Chave PIX")
    cliente_empresa = models.CharField(max_length=200, blank=True, null=True, verbose_name="Cliente/Empresa")
    cnpj = models.CharField(max_length=18, blank=True, null=True, verbose_name="CNPJ")
    valor = models.FloatField()
    descricao = models.TextField()
    data_de_pagamento = models.DateField()
    data_de_criacao = models.DateField()
    anexo = models.FileField(upload_to = 'anexos/', blank = True, null = True)
    tempo_criacao = models.TimeField()
    tempo_fila =  models.TimeField()
    data_entrada_status = models.DateTimeField(auto_now_add=True, null=True, blank=True, verbose_name="Data de Entrada no Status Atual")
    data_aprovacao = models.DateTimeField(null=True, blank=True, verbose_name="Data de Aprovação")
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
    
    def is_tecnico(self):
        """Verifica se esta solicitação é de técnico"""
        return hasattr(self, 'solicitacoes_tecnico') and self.solicitacoes_tecnico.exists()
    
    def get_valor_detalhados(self):
        """
        Retorna a soma apenas dos valores detalhados (sem incluir valor da atividade/receita).
        Para Em Rota: soma os valores detalhados de todos os itens
        Para Casual: soma apenas os valores detalhados do próprio modelo
        Para Solicitações de Técnico: retorna o valor total da solicitação (já que não há valores detalhados)
        """
        # Verificar se é uma solicitação de técnico
        if hasattr(self, 'solicitacoes_tecnico') and self.solicitacoes_tecnico.exists():
            # Para solicitações de técnico, retornar o valor total
            return self.valor or 0.0
        
        if self.tipo == 'em_rota':
            # Para Em Rota, somar valores detalhados de todos os itens
            total = 0.0
            for item in self.itens_rota.all():
                total += (item.valor_km or 0.0) + (item.valor_pedagio or 0.0) + \
                         (item.valor_hospedagem or 0.0) + (item.valor_fluvial or 0.0) + \
                         (item.valor_outros or 0.0)
            return total
        else:
            # Para Casual, somar apenas os valores detalhados do próprio modelo
            return (self.valor_km or 0.0) + (self.valor_pedagio or 0.0) + \
                   (self.valor_hospedagem or 0.0) + (self.valor_fluvial or 0.0) + \
                   (self.valor_outros or 0.0)

class SolicitacaoRotaItem(models.Model):
    """Modelo para armazenar os itens de uma solicitação Em Rota"""
    solicitacao = models.ForeignKey(Solicitacoes, on_delete=models.CASCADE, related_name='itens_rota')
    ticket_item = models.CharField(max_length=25, verbose_name="ID da Solicitação")
    valor = models.FloatField(verbose_name="Valor")
    servico = models.ForeignKey('servicos.Servico', on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Serviço")
    ordem = models.IntegerField(default=1, verbose_name="Ordem")
    
    # Campos de recebedor e chave PIX para cada ID
    recebedor = models.CharField(max_length=100, blank=True, null=True, verbose_name="Nome do Recebedor")
    chave_pix = models.CharField(max_length=255, blank=True, null=True, verbose_name="Chave PIX")
    cliente_empresa = models.CharField(max_length=200, blank=True, null=True, verbose_name="Cliente/Empresa")
    cnpj = models.CharField(max_length=18, blank=True, null=True, verbose_name="CNPJ")
    
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

class SolicitacaoTecnico(models.Model):
    """Modelo para armazenar solicitações de técnico"""
    solicitacao = models.ForeignKey(Solicitacoes, on_delete=models.CASCADE, related_name='solicitacoes_tecnico', verbose_name="ID da Solicitação")
    recebedor = models.ForeignKey(Recebedor, on_delete=models.CASCADE, related_name='solicitacoes_tecnico', verbose_name="Nome do Técnico")
    servico = models.ForeignKey('servicos.Servico', on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Tipo de Serviço")
    valor_pagamento_tecnico = models.FloatField(verbose_name="Valor que vai pagar para o técnico")
    valor_extra = models.FloatField(default=0.0, blank=True, null=True, verbose_name="Valor Extra")
    descricao = models.TextField(blank=True, null=True, verbose_name="Descrição")
    data_realizacao_atividade = models.DateField(verbose_name="Data da Realização da Atividade", null=True, blank=True)
    atividade_produtiva = models.BooleanField(default=True, verbose_name="Atividade Produtiva")
    data_criacao = models.DateTimeField(auto_now_add=True, verbose_name="Data de Criação")
    data_atualizacao = models.DateTimeField(auto_now=True, verbose_name="Data de Atualização")
    
    class Meta:
        verbose_name = "Solicitação de Técnico"
        verbose_name_plural = "Solicitações de Técnico"
        ordering = ['-data_criacao']
    
    def __str__(self):
        return f"{self.recebedor.nome} - {self.solicitacao.ticket if self.solicitacao else 'N/A'}"
    
    @property
    def chave_pix(self):
        """Retorna a chave PIX do recebedor"""
        return self.recebedor.chave_pix if self.recebedor else ''
    
    @property
    def nome_tecnico(self):
        """Retorna o nome do técnico (recebedor)"""
        return self.recebedor.nome if self.recebedor else ''
