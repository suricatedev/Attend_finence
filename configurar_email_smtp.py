"""
Script interativo para configurar email SMTP
Execute: py configurar_email_smtp.py
"""

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
ENV_FILE = BASE_DIR / '.env'

print('\n' + '='*70)
print('📧 CONFIGURAÇÃO DE EMAIL SMTP')
print('='*70)
print()

# Verificar se .env já existe
if ENV_FILE.exists():
    print('⚠️  Arquivo .env já existe.')
    resposta = input('Deseja sobrescrever? (s/N): ').strip().lower()
    if resposta != 's':
        print('❌ Operação cancelada.')
        exit(0)

print('Escolha o provedor de email:')
print('1. Gmail (Recomendado)')
print('2. Outlook/Hotmail')
print('3. Outro (configuração manual)')
print()

escolha = input('Digite o número (1-3): ').strip()

if escolha == '1':
    # Gmail
    print('\n📋 Configuração Gmail')
    print('-'*70)
    print('Para Gmail, você precisa de uma "Senha de App"')
    print('1. Acesse: https://myaccount.google.com/apppasswords')
    print('2. Gere uma senha de app')
    print('3. Cole a senha aqui (16 caracteres, sem espaços)')
    print()
    
    email_user = input('Email do Gmail: ').strip()
    email_password = input('Senha de App (16 caracteres): ').strip().replace(' ', '')
    
    config = f'''# Configurações de Email - Gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER={email_user}
EMAIL_HOST_PASSWORD={email_password}
DEFAULT_FROM_EMAIL={email_user}
'''

elif escolha == '2':
    # Outlook
    print('\n📋 Configuração Outlook/Hotmail')
    print('-'*70)
    
    email_user = input('Email do Outlook/Hotmail: ').strip()
    email_password = input('Senha do email: ').strip()
    
    config = f'''# Configurações de Email - Outlook/Hotmail
EMAIL_HOST=smtp.office365.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER={email_user}
EMAIL_HOST_PASSWORD={email_password}
DEFAULT_FROM_EMAIL={email_user}
'''

else:
    # Outro
    print('\n📋 Configuração Manual')
    print('-'*70)
    
    email_host = input('Servidor SMTP (ex: smtp.gmail.com): ').strip()
    email_port = input('Porta (ex: 587): ').strip() or '587'
    email_use_tls = input('Usar TLS? (S/n): ').strip().lower() != 'n'
    email_user = input('Email/Usuário SMTP: ').strip()
    email_password = input('Senha: ').strip()
    default_from = input(f'Email remetente (Enter para usar {email_user}): ').strip() or email_user
    
    config = f'''# Configurações de Email - Personalizado
EMAIL_HOST={email_host}
EMAIL_PORT={email_port}
EMAIL_USE_TLS={'True' if email_use_tls else 'False'}
EMAIL_HOST_USER={email_user}
EMAIL_HOST_PASSWORD={email_password}
DEFAULT_FROM_EMAIL={default_from}
'''

# Escrever no arquivo .env
try:
    # Ler conteúdo existente (se houver) para preservar outras variáveis
    conteudo_existente = ''
    outras_variaveis = []
    
    if ENV_FILE.exists():
        with open(ENV_FILE, 'r', encoding='utf-8') as f:
            linhas = f.readlines()
            for linha in linhas:
                if not linha.strip().startswith('EMAIL_') and not linha.strip().startswith('# Configurações de Email'):
                    outras_variaveis.append(linha)
    
    # Escrever arquivo
    with open(ENV_FILE, 'w', encoding='utf-8') as f:
        # Preservar outras variáveis
        if outras_variaveis:
            f.write(''.join(outras_variaveis))
            f.write('\n')
        
        # Adicionar configurações de email
        f.write(config)
    
    print()
    print('='*70)
    print('✅ Arquivo .env criado/atualizado com sucesso!')
    print('='*70)
    print()
    print('📋 Próximos passos:')
    print('1. Reinicie o servidor Django para carregar as novas configurações')
    print('2. Teste solicitando um código de recuperação')
    print('3. Verifique se o email chegou na caixa de entrada')
    print()
    print('🔍 Para verificar se está configurado corretamente:')
    print('   Execute: py verificar_config_email.py')
    print()
    
except Exception as e:
    print(f'\n❌ Erro ao criar arquivo .env: {e}')
    print('Verifique as permissões do diretório.')

