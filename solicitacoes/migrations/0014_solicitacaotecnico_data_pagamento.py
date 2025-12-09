# Generated manually
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('solicitacoes', '0013_solicitacaotecnico_ticket_item'),
    ]

    operations = [
        migrations.AddField(
            model_name='solicitacaotecnico',
            name='data_pagamento',
            field=models.DateField(blank=True, null=True, verbose_name='Data de Pagamento'),
        ),
    ]

