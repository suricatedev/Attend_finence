from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('solicitacoes', '0022_drop_prioridade_solicitacaotecnico'),
    ]

    operations = [
        # Solicitacoes - campo principal
        migrations.AlterField(
            model_name='solicitacoes',
            name='valor',
            field=models.DecimalField(decimal_places=2, max_digits=12),
        ),
        # Solicitacoes - valores detalhados
        migrations.AlterField(
            model_name='solicitacoes',
            name='valor_km',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=12, verbose_name='Valor KM'),
        ),
        migrations.AlterField(
            model_name='solicitacoes',
            name='valor_pedagio',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=12, verbose_name='Valor Pedagio'),
        ),
        migrations.AlterField(
            model_name='solicitacoes',
            name='valor_hospedagem',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=12, verbose_name='Valor Hospedagem'),
        ),
        migrations.AlterField(
            model_name='solicitacoes',
            name='valor_fluvial',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=12, verbose_name='Valor Fluvial'),
        ),
        migrations.AlterField(
            model_name='solicitacoes',
            name='valor_outros',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=12, verbose_name='Valor Outros'),
        ),
        migrations.AlterField(
            model_name='solicitacoes',
            name='valor_receita',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=12, verbose_name='Valor de Receita'),
        ),
        migrations.AlterField(
            model_name='solicitacoes',
            name='valor_em_rota',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=12, verbose_name='Valor EM ROTA'),
        ),
        # Solicitacoes - índices
        migrations.AlterField(
            model_name='solicitacoes',
            name='ticket',
            field=models.CharField(db_index=True, help_text='ID único da solicitação (Ex: INC001, ROTA-002)', max_length=25, unique=True),
        ),
        migrations.AlterField(
            model_name='solicitacoes',
            name='status',
            field=models.CharField(choices=[('pendente', 'Pendente'), ('aprovado', 'Aprovado'), ('recusado', 'Recusado'), ('concluido', 'Concluído'), ('estorno', 'Estorno')], db_index=True, default='pendente', max_length=30),
        ),
        migrations.AlterField(
            model_name='solicitacoes',
            name='data_de_criacao',
            field=models.DateField(db_index=True),
        ),
        migrations.AlterField(
            model_name='solicitacoes',
            name='tipo',
            field=models.CharField(choices=[('casual', 'Casual'), ('em_rota', 'Em Rota')], db_index=True, default='casual', max_length=20, verbose_name='Tipo de Solicitação'),
        ),

        # SolicitacaoRotaItem - campos financeiros
        migrations.AlterField(
            model_name='solicitacaorotaitem',
            name='valor',
            field=models.DecimalField(decimal_places=2, max_digits=12, verbose_name='Valor'),
        ),
        migrations.AlterField(
            model_name='solicitacaorotaitem',
            name='valor_km',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=12, verbose_name='Valor KM'),
        ),
        migrations.AlterField(
            model_name='solicitacaorotaitem',
            name='valor_pedagio',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=12, verbose_name='Valor Pedagio'),
        ),
        migrations.AlterField(
            model_name='solicitacaorotaitem',
            name='valor_hospedagem',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=12, verbose_name='Valor Hospedagem'),
        ),
        migrations.AlterField(
            model_name='solicitacaorotaitem',
            name='valor_fluvial',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=12, verbose_name='Valor Fluvial'),
        ),
        migrations.AlterField(
            model_name='solicitacaorotaitem',
            name='valor_outros',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=12, verbose_name='Valor Outros'),
        ),

        # SolicitacaoTecnico - campos financeiros
        migrations.AlterField(
            model_name='solicitacaotecnico',
            name='valor_pagamento_tecnico',
            field=models.DecimalField(decimal_places=2, max_digits=12, verbose_name='Valor que vai pagar para o técnico'),
        ),
        migrations.AlterField(
            model_name='solicitacaotecnico',
            name='valor_extra',
            field=models.DecimalField(blank=True, decimal_places=2, default=0, max_digits=12, null=True, verbose_name='Valor Extra'),
        ),

        # AuditoriaLog - índices
        migrations.AlterField(
            model_name='auditorialog',
            name='app',
            field=models.CharField(db_index=True, max_length=100, verbose_name='App'),
        ),
        migrations.AlterField(
            model_name='auditorialog',
            name='modelo',
            field=models.CharField(db_index=True, max_length=100, verbose_name='Modelo'),
        ),
        migrations.AlterField(
            model_name='auditorialog',
            name='acao',
            field=models.CharField(choices=[('create', 'Criar'), ('update', 'Atualizar'), ('delete', 'Deletar'), ('login', 'Login')], db_index=True, max_length=20, verbose_name='Ação'),
        ),
    ]
