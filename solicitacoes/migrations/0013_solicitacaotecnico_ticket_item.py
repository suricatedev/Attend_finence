# Generated manually
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('solicitacoes', '0012_solicitacaotecnico_data_realizacao_atividade'),
    ]

    operations = [
        migrations.AddField(
            model_name='solicitacaotecnico',
            name='ticket_item',
            field=models.CharField(blank=True, default='', max_length=25, verbose_name='ID/Ticket do Item', help_text='Ticket original informado no formulário'),
        ),
    ]

