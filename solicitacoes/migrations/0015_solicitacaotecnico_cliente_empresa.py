# Generated manually
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('solicitacoes', '0014_solicitacaotecnico_data_pagamento'),
    ]

    operations = [
        migrations.AddField(
            model_name='solicitacaotecnico',
            name='cliente_empresa',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='solicitacoes.clienteempresa', verbose_name='Cliente/Empresa'),
        ),
    ]

