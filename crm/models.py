from django.db import models
from django.contrib.auth.models import User
from django.core.validators import RegexValidator
from solicitacoes.models import ClienteEmpresa, Recebedor


class Segmento(models.Model):
    """Segmentação de clientes por categoria"""
    nome = models.CharField(max_length=100, unique=True, verbose_name="Nome do Segmento")
    descricao = models.TextField(blank=True, verbose_name="Descrição")
    cor = models.CharField(max_length=7, default='#3B82F6', verbose_name="Cor (hex)")
    ativo = models.BooleanField(default=True, verbose_name="Ativo")
    data_criacao = models.DateTimeField(auto_now_add=True, verbose_name="Data de Criação")
    data_atualizacao = models.DateTimeField(auto_now=True, verbose_name="Data de Atualização")

    class Meta:
        verbose_name = "Segmento"
        verbose_name_plural = "Segmentos"
        ordering = ['nome']

    def __str__(self):
        return self.nome


class PipelineEstagio(models.Model):
    """Estágios do funil/pipeline de vendas"""
    nome = models.CharField(max_length=100, verbose_name="Nome do Estágio")
    ordem = models.IntegerField(default=0, verbose_name="Ordem")
    cor = models.CharField(max_length=7, default='#6B7280', verbose_name="Cor (hex)")
    ativo = models.BooleanField(default=True, verbose_name="Ativo")
    data_criacao = models.DateTimeField(auto_now_add=True, verbose_name="Data de Criação")

    class Meta:
        verbose_name = "Estágio do Pipeline"
        verbose_name_plural = "Estágios do Pipeline"
        ordering = ['ordem']

    def __str__(self):
        return self.nome


class Lead(models.Model):
    """Leads/prospecções de clientes"""
    STATUS_CHOICES = [
        ('novo', 'Novo'),
        ('contatado', 'Contatado'),
        ('qualificado', 'Qualificado'),
        ('proposta', 'Proposta Enviada'),
        ('convertido', 'Convertido'),
        ('perdido', 'Perdido'),
    ]

    ORIGEM_CHOICES = [
        ('indicacao', 'Indicação'),
        ('site', 'Site'),
        ('telefone', 'Telefone'),
        ('email', 'E-mail'),
        ('evento', 'Evento'),
        ('rede_social', 'Rede Social'),
        ('outro', 'Outro'),
    ]

    telefone_validator = RegexValidator(
        regex=r'^\+?1?\d{9,15}$',
        message="Telefone deve estar no formato: '+999999999'. Até 15 dígitos."
    )

    nome = models.CharField(max_length=200, verbose_name="Nome do Lead", db_index=True)
    empresa = models.CharField(max_length=200, blank=True, verbose_name="Empresa")
    email = models.EmailField(blank=True, verbose_name="E-mail")
    telefone = models.CharField(
        max_length=20, blank=True, verbose_name="Telefone",
        validators=[telefone_validator]
    )
    cnpj = models.CharField(max_length=18, blank=True, verbose_name="CNPJ")
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default='novo',
        verbose_name="Status", db_index=True
    )
    origem = models.CharField(
        max_length=20, choices=ORIGEM_CHOICES, default='outro',
        verbose_name="Origem"
    )
    segmento = models.ForeignKey(
        Segmento, on_delete=models.SET_NULL, null=True, blank=True,
        verbose_name="Segmento"
    )
    valor_estimado = models.DecimalField(
        max_digits=12, decimal_places=2, default=0,
        verbose_name="Valor Estimado"
    )
    observacoes = models.TextField(blank=True, verbose_name="Observações")
    responsavel = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='leads_responsavel', verbose_name="Responsável"
    )
    cliente_empresa = models.ForeignKey(
        ClienteEmpresa, on_delete=models.SET_NULL, null=True, blank=True,
        verbose_name="Cliente/Empresa (vinculado)"
    )
    data_criacao = models.DateTimeField(auto_now_add=True, verbose_name="Data de Criação")
    data_atualizacao = models.DateTimeField(auto_now=True, verbose_name="Data de Atualização")
    criado_por = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='leads_criados', verbose_name="Criado por"
    )

    class Meta:
        verbose_name = "Lead"
        verbose_name_plural = "Leads"
        ordering = ['-data_criacao']

    def __str__(self):
        return f"{self.nome} ({self.get_status_display()})"


class Oportunidade(models.Model):
    """Oportunidades de negócio no pipeline"""
    STATUS_CHOICES = [
        ('aberta', 'Aberta'),
        ('em_negociacao', 'Em Negociação'),
        ('ganha', 'Ganha'),
        ('perdida', 'Perdida'),
    ]

    PRIORIDADE_CHOICES = [
        ('baixa', 'Baixa'),
        ('media', 'Média'),
        ('alta', 'Alta'),
        ('critica', 'Crítica'),
    ]

    titulo = models.CharField(max_length=200, verbose_name="Título", db_index=True)
    lead = models.ForeignKey(
        Lead, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='oportunidades', verbose_name="Lead"
    )
    cliente_empresa = models.ForeignKey(
        ClienteEmpresa, on_delete=models.SET_NULL, null=True, blank=True,
        verbose_name="Cliente/Empresa"
    )
    estagio = models.ForeignKey(
        PipelineEstagio, on_delete=models.SET_NULL, null=True, blank=True,
        verbose_name="Estágio do Pipeline"
    )
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default='aberta',
        verbose_name="Status", db_index=True
    )
    prioridade = models.CharField(
        max_length=20, choices=PRIORIDADE_CHOICES, default='media',
        verbose_name="Prioridade"
    )
    valor_estimado = models.DecimalField(
        max_digits=12, decimal_places=2, default=0,
        verbose_name="Valor Estimado"
    )
    probabilidade = models.IntegerField(
        default=50, verbose_name="Probabilidade (%)",
        help_text="Probabilidade de conversão (0-100)"
    )
    data_fechamento_prevista = models.DateField(
        null=True, blank=True, verbose_name="Data de Fechamento Prevista"
    )
    descricao = models.TextField(blank=True, verbose_name="Descrição")
    responsavel = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='oportunidades_responsavel', verbose_name="Responsável"
    )
    data_criacao = models.DateTimeField(auto_now_add=True, verbose_name="Data de Criação")
    data_atualizacao = models.DateTimeField(auto_now=True, verbose_name="Data de Atualização")
    criado_por = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='oportunidades_criadas', verbose_name="Criado por"
    )

    class Meta:
        verbose_name = "Oportunidade"
        verbose_name_plural = "Oportunidades"
        ordering = ['-data_criacao']

    def __str__(self):
        return f"{self.titulo} - {self.get_status_display()}"

    @property
    def valor_ponderado(self):
        """Valor estimado x probabilidade de conversão"""
        return (self.valor_estimado * self.probabilidade) / 100


class Interacao(models.Model):
    """Histórico de interações com clientes/leads"""
    TIPO_CHOICES = [
        ('ligacao', 'Ligação'),
        ('email', 'E-mail'),
        ('reuniao', 'Reunião'),
        ('visita', 'Visita'),
        ('whatsapp', 'WhatsApp'),
        ('nota', 'Nota Interna'),
        ('outro', 'Outro'),
    ]

    lead = models.ForeignKey(
        Lead, on_delete=models.CASCADE, null=True, blank=True,
        related_name='interacoes', verbose_name="Lead"
    )
    oportunidade = models.ForeignKey(
        Oportunidade, on_delete=models.CASCADE, null=True, blank=True,
        related_name='interacoes', verbose_name="Oportunidade"
    )
    cliente_empresa = models.ForeignKey(
        ClienteEmpresa, on_delete=models.CASCADE, null=True, blank=True,
        related_name='interacoes_crm', verbose_name="Cliente/Empresa"
    )
    tipo = models.CharField(
        max_length=20, choices=TIPO_CHOICES, default='nota',
        verbose_name="Tipo de Interação"
    )
    assunto = models.CharField(max_length=200, verbose_name="Assunto")
    descricao = models.TextField(blank=True, verbose_name="Descrição")
    data_interacao = models.DateTimeField(verbose_name="Data da Interação", db_index=True)
    duracao_minutos = models.IntegerField(
        default=0, verbose_name="Duração (minutos)"
    )
    usuario = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='interacoes_crm', verbose_name="Usuário"
    )
    data_criacao = models.DateTimeField(auto_now_add=True, verbose_name="Data de Criação")

    class Meta:
        verbose_name = "Interação"
        verbose_name_plural = "Interações"
        ordering = ['-data_interacao']

    def __str__(self):
        return f"{self.get_tipo_display()} - {self.assunto}"


class Tarefa(models.Model):
    """Follow-ups e tarefas agendadas"""
    STATUS_CHOICES = [
        ('pendente', 'Pendente'),
        ('em_andamento', 'Em Andamento'),
        ('concluida', 'Concluída'),
        ('cancelada', 'Cancelada'),
    ]

    PRIORIDADE_CHOICES = [
        ('baixa', 'Baixa'),
        ('media', 'Média'),
        ('alta', 'Alta'),
    ]

    titulo = models.CharField(max_length=200, verbose_name="Título")
    descricao = models.TextField(blank=True, verbose_name="Descrição")
    lead = models.ForeignKey(
        Lead, on_delete=models.CASCADE, null=True, blank=True,
        related_name='tarefas', verbose_name="Lead"
    )
    oportunidade = models.ForeignKey(
        Oportunidade, on_delete=models.CASCADE, null=True, blank=True,
        related_name='tarefas', verbose_name="Oportunidade"
    )
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default='pendente',
        verbose_name="Status", db_index=True
    )
    prioridade = models.CharField(
        max_length=20, choices=PRIORIDADE_CHOICES, default='media',
        verbose_name="Prioridade"
    )
    data_vencimento = models.DateTimeField(
        null=True, blank=True, verbose_name="Data de Vencimento", db_index=True
    )
    responsavel = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='tarefas_crm', verbose_name="Responsável"
    )
    data_criacao = models.DateTimeField(auto_now_add=True, verbose_name="Data de Criação")
    data_atualizacao = models.DateTimeField(auto_now=True, verbose_name="Data de Atualização")
    criado_por = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='tarefas_crm_criadas', verbose_name="Criado por"
    )

    class Meta:
        verbose_name = "Tarefa"
        verbose_name_plural = "Tarefas"
        ordering = ['data_vencimento', '-prioridade']

    def __str__(self):
        return f"{self.titulo} ({self.get_status_display()})"

    @property
    def atrasada(self):
        """Verifica se a tarefa está atrasada"""
        from django.utils import timezone
        if self.data_vencimento and self.status in ('pendente', 'em_andamento'):
            return timezone.now() > self.data_vencimento
        return False
