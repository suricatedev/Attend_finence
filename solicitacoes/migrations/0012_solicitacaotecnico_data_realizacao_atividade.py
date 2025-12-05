# Generated manually
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('solicitacoes', '0011_solicitacaotecnico'),
    ]

    operations = [
        migrations.AddField(
            model_name='solicitacaotecnico',
            name='data_realizacao_atividade',
            field=models.DateField(blank=True, null=True, verbose_name='Data da Realização da Atividade'),
        ),
    ]


