#!/usr/bin/env python
"""
Script de diagnóstico para arquivos estáticos
Execute: python diagnostico_static.py
"""
import os
import sys
from pathlib import Path

# Adiciona o diretório do projeto ao path
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

# Configura o Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'attend_finence.settings')

import django
django.setup()

from django.conf import settings

print("=" * 60)
print("DIAGNÓSTICO DE ARQUIVOS ESTÁTICOS")
print("=" * 60)

# 1. Verificar configurações
print("\n1. CONFIGURAÇÕES:")
print(f"   DEBUG = {settings.DEBUG}")
print(f"   STATIC_URL = {settings.STATIC_URL}")
print(f"   STATIC_ROOT = {getattr(settings, 'STATIC_ROOT', 'NÃO CONFIGURADO')}")
print(f"   STATICFILES_DIRS = {getattr(settings, 'STATICFILES_DIRS', [])}")

# 2. Verificar STATIC_ROOT
print("\n2. VERIFICANDO STATIC_ROOT:")
static_root = getattr(settings, 'STATIC_ROOT', None)
if static_root:
    static_root_path = Path(static_root)
    print(f"   Caminho: {static_root_path}")
    print(f"   Existe: {static_root_path.exists()}")
    if static_root_path.exists():
        print(f"   É diretório: {static_root_path.is_dir()}")
        try:
            files = list(static_root_path.rglob('*'))
            mp4_files = list(static_root_path.rglob('*.mp4'))
            print(f"   Total de arquivos: {len(files)}")
            print(f"   Arquivos MP4: {len(mp4_files)}")
            if mp4_files:
                print("   Vídeos encontrados:")
                for mp4 in mp4_files[:5]:  # Mostra até 5
                    size = mp4.stat().st_size / (1024 * 1024)  # MB
                    rel_path = mp4.relative_to(static_root_path)
                    print(f"      - {rel_path} ({size:.2f} MB)")
            else:
                print("   ⚠️  NENHUM VÍDEO MP4 ENCONTRADO!")
            
            # Verificar estrutura
            img_dir = static_root_path / 'img'
            print(f"\n   Diretório img/ existe: {img_dir.exists()}")
            if img_dir.exists():
                img_files = list(img_dir.glob('*.mp4'))
                print(f"   Vídeos em img/: {len(img_files)}")
                for img_file in img_files:
                    print(f"      - {img_file.name}")
        except Exception as e:
            print(f"   ❌ Erro ao ler diretório: {e}")
    else:
        print("   ⚠️  STATIC_ROOT não existe! Execute: python manage.py collectstatic")
else:
    print("   ⚠️  STATIC_ROOT não configurado!")

# 3. Verificar STATICFILES_DIRS
print("\n3. VERIFICANDO STATICFILES_DIRS:")
static_dirs = getattr(settings, 'STATICFILES_DIRS', [])
for static_dir in static_dirs:
    static_dir_path = Path(static_dir)
    print(f"   Caminho: {static_dir_path}")
    print(f"   Existe: {static_dir_path.exists()}")
    if static_dir_path.exists():
        mp4_files = list(static_dir_path.rglob('*.mp4'))
        print(f"   Vídeos encontrados: {len(mp4_files)}")
        if mp4_files:
            for mp4 in mp4_files[:3]:
                rel_path = mp4.relative_to(static_dir_path)
                print(f"      - {rel_path}")

# 4. Verificar URLs de static
print("\n4. VERIFICANDO ROTAS:")
from django.urls import get_resolver
resolver = get_resolver()
url_patterns = [str(p.pattern) for p in resolver.url_patterns]
static_patterns = [p for p in url_patterns if 'static' in p.lower()]
if static_patterns:
    print("   Rotas de static encontradas:")
    for pattern in static_patterns:
        print(f"      - {pattern}")
else:
    print("   ⚠️  Nenhuma rota de static encontrada!")

# 5. Recomendações
print("\n5. RECOMENDAÇÕES:")
if not static_root or not Path(static_root).exists():
    print("   🔧 Execute: python manage.py collectstatic --noinput")
if not static_root or not Path(static_root).exists() or len(list(Path(static_root).rglob('*.mp4'))) == 0:
    print("   🔧 Verifique se os vídeos estão em static/img/")
    print("   🔧 Após collectstatic, verifique se aparecem em staticfiles/img/")

print("\n" + "=" * 60)
print("DIAGNÓSTICO CONCLUÍDO")
print("=" * 60)

