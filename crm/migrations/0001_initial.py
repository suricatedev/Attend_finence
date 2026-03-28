from django.conf import settings
from django.db import migrations, models
import django.core.validators
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('solicitacoes', '0022_drop_prioridade_solicitacaotecnico'),
    ]

    operations = [
        migrations.CreateModel(
            name='Segmento',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nome', models.CharField(max_length=100, unique=True, verbose_name='Nome do Segmento')),
                ('descricao', models.TextField(blank=True, verbose_name='Descrição')),
                ('cor', models.CharField(default='#3B82F6', max_length=7, verbose_name='Cor (hex)')),
                ('ativo', models.BooleanField(default=True, verbose_name='Ativo')),
                ('data_criacao', models.DateTimeField(auto_now_add=True, verbose_name='Data de Criação')),
                ('data_atualizacao', models.DateTimeField(auto_now=True, verbose_name='Data de Atualização')),
            ],
            options={
                'verbose_name': 'Segmento',
                'verbose_name_plural': 'Segmentos',
                'ordering': ['nome'],
            },
        ),
        migrations.CreateModel(
            name='PipelineEstagio',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nome', models.CharField(max_length=100, verbose_name='Nome do Estágio')),
                ('ordem', models.IntegerField(default=0, verbose_name='Ordem')),
                ('cor', models.CharField(default='#6B7280', max_length=7, verbose_name='Cor (hex)')),
                ('ativo', models.BooleanField(default=True, verbose_name='Ativo')),
                ('data_criacao', models.DateTimeField(auto_now_add=True, verbose_name='Data de Criação')),
            ],
            options={
                'verbose_name': 'Estágio do Pipeline',
                'verbose_name_plural': 'Estágios do Pipeline',
                'ordering': ['ordem'],
            },
        ),
        migrations.CreateModel(
            name='Lead',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nome', models.CharField(db_index=True, max_length=200, verbose_name='Nome do Lead')),
                ('empresa', models.CharField(blank=True, max_length=200, verbose_name='Empresa')),
                ('email', models.EmailField(blank=True, max_length=254, verbose_name='E-mail')),
                ('telefone', models.CharField(blank=True, max_length=20, validators=[django.core.validators.RegexValidator(message="Telefone deve estar no formato: '+999999999'. Até 15 dígitos.", regex='^\\+?1?\\d{9,15}$')], verbose_name='Telefone')),
                ('cnpj', models.CharField(blank=True, max_length=18, verbose_name='CNPJ')),
                ('status', models.CharField(choices=[('novo', 'Novo'), ('contatado', 'Contatado'), ('qualificado', 'Qualificado'), ('proposta', 'Proposta Enviada'), ('convertido', 'Convertido'), ('perdido', 'Perdido')], db_index=True, default='novo', max_length=20, verbose_name='Status')),
                ('origem', models.CharField(choices=[('indicacao', 'Indicação'), ('site', 'Site'), ('telefone', 'Telefone'), ('email', 'E-mail'), ('evento', 'Evento'), ('rede_social', 'Rede Social'), ('outro', 'Outro')], default='outro', max_length=20, verbose_name='Origem')),
                ('valor_estimado', models.DecimalField(decimal_places=2, default=0, max_digits=12, verbose_name='Valor Estimado')),
                ('observacoes', models.TextField(blank=True, verbose_name='Observações')),
                ('data_criacao', models.DateTimeField(auto_now_add=True, verbose_name='Data de Criação')),
                ('data_atualizacao', models.DateTimeField(auto_now=True, verbose_name='Data de Atualização')),
                ('cliente_empresa', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='solicitacoes.clienteempresa', verbose_name='Cliente/Empresa (vinculado)')),
                ('criado_por', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='leads_criados', to=settings.AUTH_USER_MODEL, verbose_name='Criado por')),
                ('responsavel', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='leads_responsavel', to=settings.AUTH_USER_MODEL, verbose_name='Responsável')),
                ('segmento', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='crm.segmento', verbose_name='Segmento')),
            ],
            options={
                'verbose_name': 'Lead',
                'verbose_name_plural': 'Leads',
                'ordering': ['-data_criacao'],
            },
        ),
        migrations.CreateModel(
            name='Oportunidade',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('titulo', models.CharField(db_index=True, max_length=200, verbose_name='Título')),
                ('status', models.CharField(choices=[('aberta', 'Aberta'), ('em_negociacao', 'Em Negociação'), ('ganha', 'Ganha'), ('perdida', 'Perdida')], db_index=True, default='aberta', max_length=20, verbose_name='Status')),
                ('prioridade', models.CharField(choices=[('baixa', 'Baixa'), ('media', 'Média'), ('alta', 'Alta'), ('critica', 'Crítica')], default='media', max_length=20, verbose_name='Prioridade')),
                ('valor_estimado', models.DecimalField(decimal_places=2, default=0, max_digits=12, verbose_name='Valor Estimado')),
                ('probabilidade', models.IntegerField(default=50, help_text='Probabilidade de conversão (0-100)', verbose_name='Probabilidade (%)')),
                ('data_fechamento_prevista', models.DateField(blank=True, null=True, verbose_name='Data de Fechamento Prevista')),
                ('descricao', models.TextField(blank=True, verbose_name='Descrição')),
                ('data_criacao', models.DateTimeField(auto_now_add=True, verbose_name='Data de Criação')),
                ('data_atualizacao', models.DateTimeField(auto_now=True, verbose_name='Data de Atualização')),
                ('cliente_empresa', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='solicitacoes.clienteempresa', verbose_name='Cliente/Empresa')),
                ('criado_por', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='oportunidades_criadas', to=settings.AUTH_USER_MODEL, verbose_name='Criado por')),
                ('estagio', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='crm.pipelineestagio', verbose_name='Estágio do Pipeline')),
                ('lead', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='oportunidades', to='crm.lead', verbose_name='Lead')),
                ('responsavel', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='oportunidades_responsavel', to=settings.AUTH_USER_MODEL, verbose_name='Responsável')),
            ],
            options={
                'verbose_name': 'Oportunidade',
                'verbose_name_plural': 'Oportunidades',
                'ordering': ['-data_criacao'],
            },
        ),
        migrations.CreateModel(
            name='Interacao',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('tipo', models.CharField(choices=[('ligacao', 'Ligação'), ('email', 'E-mail'), ('reuniao', 'Reunião'), ('visita', 'Visita'), ('whatsapp', 'WhatsApp'), ('nota', 'Nota Interna'), ('outro', 'Outro')], default='nota', max_length=20, verbose_name='Tipo de Interação')),
                ('assunto', models.CharField(max_length=200, verbose_name='Assunto')),
                ('descricao', models.TextField(blank=True, verbose_name='Descrição')),
                ('data_interacao', models.DateTimeField(db_index=True, verbose_name='Data da Interação')),
                ('duracao_minutos', models.IntegerField(default=0, verbose_name='Duração (minutos)')),
                ('data_criacao', models.DateTimeField(auto_now_add=True, verbose_name='Data de Criação')),
                ('cliente_empresa', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='interacoes_crm', to='solicitacoes.clienteempresa', verbose_name='Cliente/Empresa')),
                ('lead', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='interacoes', to='crm.lead', verbose_name='Lead')),
                ('oportunidade', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='interacoes', to='crm.oportunidade', verbose_name='Oportunidade')),
                ('usuario', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='interacoes_crm', to=settings.AUTH_USER_MODEL, verbose_name='Usuário')),
            ],
            options={
                'verbose_name': 'Interação',
                'verbose_name_plural': 'Interações',
                'ordering': ['-data_interacao'],
            },
        ),
        migrations.CreateModel(
            name='Tarefa',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('titulo', models.CharField(max_length=200, verbose_name='Título')),
                ('descricao', models.TextField(blank=True, verbose_name='Descrição')),
                ('status', models.CharField(choices=[('pendente', 'Pendente'), ('em_andamento', 'Em Andamento'), ('concluida', 'Concluída'), ('cancelada', 'Cancelada')], db_index=True, default='pendente', max_length=20, verbose_name='Status')),
                ('prioridade', models.CharField(choices=[('baixa', 'Baixa'), ('media', 'Média'), ('alta', 'Alta')], default='media', max_length=20, verbose_name='Prioridade')),
                ('data_vencimento', models.DateTimeField(blank=True, db_index=True, null=True, verbose_name='Data de Vencimento')),
                ('data_criacao', models.DateTimeField(auto_now_add=True, verbose_name='Data de Criação')),
                ('data_atualizacao', models.DateTimeField(auto_now=True, verbose_name='Data de Atualização')),
                ('criado_por', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='tarefas_crm_criadas', to=settings.AUTH_USER_MODEL, verbose_name='Criado por')),
                ('lead', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='tarefas', to='crm.lead', verbose_name='Lead')),
                ('oportunidade', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='tarefas', to='crm.oportunidade', verbose_name='Oportunidade')),
                ('responsavel', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='tarefas_crm', to=settings.AUTH_USER_MODEL, verbose_name='Responsável')),
            ],
            options={
                'verbose_name': 'Tarefa',
                'verbose_name_plural': 'Tarefas',
                'ordering': ['data_vencimento', '-prioridade'],
            },
        ),
    ]
