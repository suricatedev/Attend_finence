#!/usr/bin/env python
"""
Script para corrigir problemas de migração no VPS
Este script verifica e aplica migrações pendentes de forma segura
"""

import os
import sys
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'attend_finence.settings')
django.setup()

from django.db import connection
from django.core.management import call_command
from django.db.utils import OperationalError

def table_exists(table_name):
    """Verifica se uma tabela existe no banco de dados"""
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name=?
        """, [table_name])
        return cursor.fetchone() is not None

def column_exists(table_name, column_name):
    """Verifica se uma coluna existe em uma tabela"""
    with connection.cursor() as cursor:
        cursor.execute(f"PRAGMA table_info({table_name})")
        columns = [row[1] for row in cursor.fetchall()]
        return column_name in columns

def fix_migrations():
    """Corrige problemas de migração"""
    print("🔍 Verificando estado do banco de dados...")
    
    # Verificar se a tabela ClienteEmpresa existe
    if table_exists('solicitacoes_clienteempresa'):
        print("✅ Tabela solicitacoes_clienteempresa já existe")
    else:
        print("⚠️ Tabela solicitacoes_clienteempresa não existe")
    
    # Verificar se a coluna supervisor existe na tabela Recebedor
    if table_exists('solicitacoes_recebedor'):
        if column_exists('solicitacoes_recebedor', 'supervisor'):
            print("✅ Coluna supervisor já existe na tabela solicitacoes_recebedor")
        else:
            print("⚠️ Coluna supervisor NÃO existe na tabela solicitacoes_recebedor")
            print("📝 Adicionando coluna supervisor...")
            try:
                with connection.cursor() as cursor:
                    cursor.execute("""
                        ALTER TABLE solicitacoes_recebedor 
                        ADD COLUMN supervisor VARCHAR(50) NULL
                    """)
                print("✅ Coluna supervisor adicionada com sucesso!")
            except Exception as e:
                print(f"❌ Erro ao adicionar coluna supervisor: {e}")
    else:
        print("⚠️ Tabela solicitacoes_recebedor não existe")
    
    print("\n📦 Aplicando migrações...")
    try:
        # Aplicar migrações com --fake se necessário
        call_command('migrate', 'solicitacoes', verbosity=2)
        print("✅ Migrações aplicadas com sucesso!")
    except Exception as e:
        print(f"❌ Erro ao aplicar migrações: {e}")
        print("\n💡 Tentando aplicar migrações com --fake-initial...")
        try:
            call_command('migrate', 'solicitacoes', '--fake-initial', verbosity=2)
            print("✅ Migrações aplicadas com --fake-initial!")
        except Exception as e2:
            print(f"❌ Erro ao aplicar migrações com --fake-initial: {e2}")
            print("\n⚠️ Você pode precisar aplicar as migrações manualmente:")
            print("   python manage.py migrate solicitacoes --fake 0008")

if __name__ == '__main__':
    fix_migrations()

