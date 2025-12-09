# Generated manually
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('solicitacoes', '0010_solicitacoes_data_aprovacao'),
        ('servicos', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='SolicitacaoTecnico',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('valor_pagamento_tecnico', models.FloatField(verbose_name='Valor que vai pagar para o técnico')),
                ('valor_extra', models.FloatField(blank=True, default=0.0, null=True, verbose_name='Valor Extra')),
                ('descricao', models.TextField(blank=True, null=True, verbose_name='Descrição')),
                ('atividade_produtiva', models.BooleanField(default=True, verbose_name='Atividade Produtiva')),
                ('data_criacao', models.DateTimeField(auto_now_add=True, verbose_name='Data de Criação')),
                ('data_atualizacao', models.DateTimeField(auto_now=True, verbose_name='Data de Atualização')),
                ('recebedor', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='solicitacoes_tecnico', to='solicitacoes.recebedor', verbose_name='Nome do Técnico')),
                ('servico', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='servicos.servico', verbose_name='Tipo de Serviço')),
                ('solicitacao', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='solicitacoes_tecnico', to='solicitacoes.solicitacoes', verbose_name='ID da Solicitação')),
            ],
            options={
                'verbose_name': 'Solicitação de Técnico',
                'verbose_name_plural': 'Solicitações de Técnico',
                'ordering': ['-data_criacao'],
            },
        ),
    ]





