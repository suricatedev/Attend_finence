#!/usr/bin/env python
"""
Script para aplicar a migração 0005_add_valores_detalhados
Execute este script para criar as novas colunas no banco de dados
"""
import os
import sys
import django

# Configurar o Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'attend_finence.settings')
django.setup()

from django.core.management import execute_from_command_line

if __name__ == '__main__':
    print("Aplicando migrações...")
    execute_from_command_line(['manage.py', 'migrate', 'solicitacoes'])
    print("Migrações aplicadas com sucesso!")

