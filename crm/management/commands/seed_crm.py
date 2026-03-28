from django.core.management.base import BaseCommand
from crm.models import PipelineEstagio, Segmento


class Command(BaseCommand):
    help = 'Cria dados iniciais para o módulo CRM (estágios do pipeline e segmentos)'

    def handle(self, *args, **options):
        # Estágios do Pipeline
        estagios = [
            {'nome': 'Prospecção', 'ordem': 1, 'cor': '#6B7280'},
            {'nome': 'Qualificação', 'ordem': 2, 'cor': '#3B82F6'},
            {'nome': 'Proposta', 'ordem': 3, 'cor': '#F59E0B'},
            {'nome': 'Negociação', 'ordem': 4, 'cor': '#8B5CF6'},
            {'nome': 'Fechamento', 'ordem': 5, 'cor': '#10B981'},
        ]

        criados_estagios = 0
        for estagio_data in estagios:
            _, created = PipelineEstagio.objects.get_or_create(
                nome=estagio_data['nome'],
                defaults=estagio_data,
            )
            if created:
                criados_estagios += 1

        # Segmentos
        segmentos = [
            {'nome': 'Telecomunicações', 'cor': '#3B82F6', 'descricao': 'Empresas do setor de telecomunicações'},
            {'nome': 'Tecnologia', 'cor': '#8B5CF6', 'descricao': 'Empresas de tecnologia e software'},
            {'nome': 'Varejo', 'cor': '#F59E0B', 'descricao': 'Comércio varejista'},
            {'nome': 'Indústria', 'cor': '#6B7280', 'descricao': 'Setor industrial e manufatura'},
            {'nome': 'Serviços', 'cor': '#10B981', 'descricao': 'Prestação de serviços diversos'},
            {'nome': 'Governo', 'cor': '#EF4444', 'descricao': 'Órgãos governamentais e setor público'},
        ]

        criados_segmentos = 0
        for segmento_data in segmentos:
            _, created = Segmento.objects.get_or_create(
                nome=segmento_data['nome'],
                defaults=segmento_data,
            )
            if created:
                criados_segmentos += 1

        self.stdout.write(self.style.SUCCESS(
            f'Seed CRM concluído: {criados_estagios} estágios e {criados_segmentos} segmentos criados.'
        ))
