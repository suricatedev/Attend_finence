from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('solicitacoes', '0015_solicitacaotecnico_cliente_empresa'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='AuditoriaLog',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('app', models.CharField(max_length=100, verbose_name='App')),
                ('modelo', models.CharField(max_length=100, verbose_name='Modelo')),
                ('objeto_id', models.CharField(max_length=64, verbose_name='ID do Objeto')),
                ('acao', models.CharField(choices=[('create', 'Criar'), ('update', 'Atualizar'), ('delete', 'Deletar')], max_length=10, verbose_name='Ação')),
                ('dados_anteriores', models.JSONField(blank=True, null=True, verbose_name='Dados Anteriores')),
                ('dados_novos', models.JSONField(blank=True, null=True, verbose_name='Dados Novos')),
                ('campos_alterados', models.JSONField(blank=True, null=True, verbose_name='Campos Alterados')),
                ('ip_address', models.GenericIPAddressField(blank=True, null=True, verbose_name='IP')),
                ('user_agent', models.TextField(blank=True, null=True, verbose_name='User Agent')),
                ('origem', models.CharField(blank=True, max_length=255, null=True, verbose_name='Origem')),
                ('data_hora', models.DateTimeField(auto_now_add=True, verbose_name='Data/Hora')),
                ('usuario', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL, verbose_name='Usuário')),
            ],
            options={
                'verbose_name': 'Auditoria Log',
                'verbose_name_plural': 'Auditoria Logs',
                'ordering': ['-data_hora'],
            },
        ),
    ]
