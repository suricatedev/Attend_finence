from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group

class Command(BaseCommand):
    help = 'Cria os grupos padrão do sistema: Administrador, Financeiro e Solicitante'

    def handle(self, *args, **options):
        grupos = ['Administrador', 'Financeiro', 'Solicitante']
        
        for grupo_nome in grupos:
            grupo, criado = Group.objects.get_or_create(name=grupo_nome)
            if criado:
                self.stdout.write(
                    self.style.SUCCESS(f'Grupo "{grupo_nome}" criado com sucesso!')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'Grupo "{grupo_nome}" já existe.')
                )
        
        self.stdout.write(
            self.style.SUCCESS('\n✅ Grupos criados/verificados com sucesso!')
        )

