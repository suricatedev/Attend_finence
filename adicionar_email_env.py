"""
Script para adicionar configurações de email ao arquivo .env
Preserva outras variáveis existentes
"""

from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
ENV_FILE = BASE_DIR / '.env'

# Configurações padrão para Gmail (você pode editar depois)
config_email = '''# Configurações de Email - Gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=seu-email@gmail.com
EMAIL_HOST_PASSWORD=sua-senha-de-app
DEFAULT_FROM_EMAIL=seu-email@gmail.com
'''

print('\n' + '='*70)
print('📧 ADICIONANDO CONFIGURAÇÕES DE EMAIL AO .env')
print('='*70)

# Ler conteúdo existente
conteudo_existente = []
variaveis_email = ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USE_TLS', 'EMAIL_HOST_USER', 'EMAIL_HOST_PASSWORD', 'DEFAULT_FROM_EMAIL']
tem_config_email = False

if ENV_FILE.exists():
    print('\n✅ Arquivo .env encontrado. Preservando variáveis existentes...')
    with open(ENV_FILE, 'r', encoding='utf-8') as f:
        linhas = f.readlines()
        for linha in linhas:
            # Verificar se já tem configurações de email
            if any(var in linha for var in variaveis_email):
                tem_config_email = True
                continue  # Pular linhas de email existentes
            conteudo_existente.append(linha)
else:
    print('\n📝 Criando novo arquivo .env...')

# Escrever arquivo atualizado
try:
    with open(ENV_FILE, 'w', encoding='utf-8') as f:
        # Escrever conteúdo existente (sem as variáveis de email antigas)
        if conteudo_existente:
            f.writelines(conteudo_existente)
            # Adicionar linha em branco se não terminar com uma
            if conteudo_existente[-1].strip():
                f.write('\n')
        
        # Adicionar configurações de email
        f.write(config_email)
    
    print('✅ Arquivo .env atualizado!')
    print()
    print('⚠️  IMPORTANTE: Edite o arquivo .env e configure:')
    print('   1. EMAIL_HOST_USER - seu email Gmail')
    print('   2. EMAIL_HOST_PASSWORD - sua senha de app do Gmail')
    print('   3. DEFAULT_FROM_EMAIL - mesmo email do usuário')
    print()
    print('📖 Para Gmail, gere uma senha de app em:')
    print('   https://myaccount.google.com/apppasswords')
    print()
    print('🔄 Após editar, reinicie o servidor Django')
    print()
    
except Exception as e:
    print(f'\n❌ Erro: {e}')

