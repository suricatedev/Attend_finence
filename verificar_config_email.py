"""
Script para verificar configuração de email
Execute: py verificar_config_email.py
"""

import os
import sys
from pathlib import Path

# Adicionar o diretório do projeto ao path
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'attend_finence.settings')

import django
django.setup()

from django.conf import settings

print('\n' + '='*70)
print('🔍 VERIFICAÇÃO DE CONFIGURAÇÃO DE EMAIL')
print('='*70)

# Verificar se existe arquivo .env
env_file = BASE_DIR / '.env'
if env_file.exists():
    print('✅ Arquivo .env encontrado')
else:
    print('❌ Arquivo .env NÃO encontrado')
    print('   Crie um arquivo .env na raiz do projeto')

print()

# Verificar configurações
email_backend = getattr(settings, 'EMAIL_BACKEND', '')
email_host_user = getattr(settings, 'EMAIL_HOST_USER', '')

if 'console' in email_backend.lower():
    print('⚠️  MODO CONSOLE ATIVO')
    print('   Os emails NÃO serão enviados, apenas exibidos no terminal')
    print()
    print('📋 Variáveis necessárias no .env:')
    print('   EMAIL_HOST_USER=seu-email@gmail.com')
    print('   EMAIL_HOST_PASSWORD=sua-senha-de-app')
    print('   EMAIL_HOST=smtp.gmail.com')
    print('   EMAIL_PORT=587')
    print('   EMAIL_USE_TLS=True')
    print('   DEFAULT_FROM_EMAIL=seu-email@gmail.com')
    print()
    print('📖 Veja instruções completas em: CONFIGURAR_EMAIL.md')
else:
    print('✅ MODO SMTP ATIVO')
    print(f'   Backend: {email_backend}')
    print(f'   Host: {getattr(settings, "EMAIL_HOST", "N/A")}')
    print(f'   Port: {getattr(settings, "EMAIL_PORT", "N/A")}')
    print(f'   TLS: {getattr(settings, "EMAIL_USE_TLS", "N/A")}')
    print(f'   User: {email_host_user or "NÃO CONFIGURADO"}')
    print(f'   Password: {"✅ Configurado" if getattr(settings, "EMAIL_HOST_PASSWORD", "") else "❌ Não configurado"}')
    print(f'   From: {getattr(settings, "DEFAULT_FROM_EMAIL", "N/A")}')

print()
print('='*70)
print()

