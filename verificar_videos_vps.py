#!/usr/bin/env python
"""
Script para verificar se os vídeos estão sendo servidos corretamente na VPS
Execute este script na VPS para diagnosticar problemas com os vídeos de login
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
from django.contrib.staticfiles.finders import find

print("=" * 70)
print("VERIFICAÇÃO DE VÍDEOS DE LOGIN NA VPS")
print("=" * 70)

# 1. Verificar se os vídeos existem no diretório fonte
print("\n1. VERIFICANDO ARQUIVOS NO DIRETÓRIO FONTE (static/img/):")
static_img_dir = BASE_DIR / 'static' / 'img'
videos_source = ['back17.mp4', 'back18.mp4', 'back20.mp4']

for video in videos_source:
    video_path = static_img_dir / video
    if video_path.exists():
        size = video_path.stat().st_size / (1024 * 1024)  # MB
        print(f"   ✅ {video} - {size:.2f} MB")
    else:
        print(f"   ❌ {video} - NÃO ENCONTRADO")

# 2. Verificar STATIC_ROOT
print("\n2. VERIFICANDO STATIC_ROOT:")
static_root = Path(settings.STATIC_ROOT)
print(f"   STATIC_ROOT = {static_root}")
print(f"   Existe? {static_root.exists()}")
print(f"   É diretório? {static_root.is_dir() if static_root.exists() else 'N/A'}")

if static_root.exists():
    static_img_staticfiles = static_root / 'img'
    if static_img_staticfiles.exists():
        print(f"   ✅ Diretório staticfiles/img/ existe")
        
        print("\n   Arquivos em staticfiles/img/:")
        for video in videos_source:
            video_path = static_img_staticfiles / video
            if video_path.exists():
                size = video_path.stat().st_size / (1024 * 1024)  # MB
                print(f"      ✅ {video} - {size:.2f} MB")
            else:
                print(f"      ❌ {video} - NÃO ENCONTRADO (execute collectstatic!)")
    else:
        print(f"   ❌ Diretório staticfiles/img/ NÃO existe")
        print(f"   💡 Execute: python manage.py collectstatic --noinput")
else:
    print(f"   ❌ STATIC_ROOT não existe!")
    print(f"   💡 Execute: python manage.py collectstatic --noinput")

# 3. Verificar usando Django staticfiles finders
print("\n3. VERIFICANDO COM DJANGO STATICFILES FINDERS:")
for video in videos_source:
    found_path = find(f'img/{video}')
    if found_path:
        print(f"   ✅ img/{video} encontrado em: {found_path}")
    else:
        print(f"   ❌ img/{video} NÃO encontrado pelos finders")

# 4. Verificar STATIC_URL
print("\n4. CONFIGURAÇÕES:")
print(f"   STATIC_URL = {settings.STATIC_URL}")
print(f"   STATIC_ROOT = {settings.STATIC_ROOT}")
print(f"   STATICFILES_DIRS = {settings.STATICFILES_DIRS}")
print(f"   DEBUG = {settings.DEBUG}")

# 5. Verificar permissões
print("\n5. VERIFICANDO PERMISSÕES:")
if static_root.exists():
    try:
        import stat
        mode = os.stat(static_root).st_mode
        permissions = stat.filemode(mode)
        print(f"   staticfiles/: {permissions}")
        
        if (static_root / 'img').exists():
            mode_img = os.stat(static_root / 'img').st_mode
            permissions_img = stat.filemode(mode_img)
            print(f"   staticfiles/img/: {permissions_img}")
            
            for video in videos_source:
                video_path = static_root / 'img' / video
                if video_path.exists():
                    mode_video = os.stat(video_path).st_mode
                    permissions_video = stat.filemode(mode_video)
                    print(f"   staticfiles/img/{video}: {permissions_video}")
    except Exception as e:
        print(f"   ⚠️ Erro ao verificar permissões: {e}")

# 6. Recomendações
print("\n6. RECOMENDAÇÕES:")
print("   📋 Checklist para resolver problemas:")
print("   1. Execute: python manage.py collectstatic --noinput")
print("   2. Verifique se os vídeos estão em staticfiles/img/")
print("   3. Ajuste permissões: chmod -R 755 staticfiles/")
print("   4. Se usar Nginx, verifique a configuração de /static/")
print("   5. Teste acesso direto: http://seu-dominio.com/static/img/back17.mp4")
print("   6. Verifique o console do navegador (F12) para erros 404")

print("\n" + "=" * 70)
print("FIM DA VERIFICAÇÃO")
print("=" * 70)

