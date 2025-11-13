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
    cliente_empresa_exists = table_exists('solicitacoes_clienteempresa')
    if cliente_empresa_exists:
        print("✅ Tabela solicitacoes_clienteempresa já existe")
    else:
        print("⚠️ Tabela solicitacoes_clienteempresa não existe")
    
    # Verificar se a coluna supervisor existe na tabela Recebedor
    recebedor_table_exists = table_exists('solicitacoes_recebedor')
    supervisor_column_exists = False
    
    if recebedor_table_exists:
        supervisor_column_exists = column_exists('solicitacoes_recebedor', 'supervisor')
        if supervisor_column_exists:
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
                supervisor_column_exists = True
            except Exception as e:
                print(f"❌ Erro ao adicionar coluna supervisor: {e}")
    else:
        print("⚠️ Tabela solicitacoes_recebedor não existe")
    
    # Verificar outras colunas que podem estar faltando
    if recebedor_table_exists:
        # Verificar colunas da migração 0008
        campos_verificar = ['cliente_empresa', 'cnpj']
        for campo in campos_verificar:
            if table_exists('solicitacoes_solicitacoes'):
                if not column_exists('solicitacoes_solicitacoes', campo):
                    print(f"⚠️ Coluna {campo} não existe em solicitacoes_solicitacoes")
                    try:
                        with connection.cursor() as cursor:
                            if campo == 'cliente_empresa':
                                cursor.execute("""
                                    ALTER TABLE solicitacoes_solicitacoes 
                                    ADD COLUMN cliente_empresa VARCHAR(200) NULL
                                """)
                            elif campo == 'cnpj':
                                cursor.execute("""
                                    ALTER TABLE solicitacoes_solicitacoes 
                                    ADD COLUMN cnpj VARCHAR(18) NULL
                                """)
                        print(f"✅ Coluna {campo} adicionada com sucesso!")
                    except Exception as e:
                        print(f"❌ Erro ao adicionar coluna {campo}: {e}")
    
    print("\n📦 Aplicando migrações...")
    
    # Se a tabela ClienteEmpresa já existe, marcar a migração como fake
    if cliente_empresa_exists:
        print("💡 Tabela ClienteEmpresa já existe, marcando migração 0008 como aplicada...")
        try:
            call_command('migrate', 'solicitacoes', '0008', '--fake', verbosity=2)
            print("✅ Migração 0008 marcada como aplicada!")
        except Exception as e:
            print(f"⚠️ Não foi possível marcar migração como fake: {e}")
    
    # Aplicar migrações restantes
    try:
        call_command('migrate', 'solicitacoes', verbosity=2)
        print("✅ Migrações aplicadas com sucesso!")
    except Exception as e:
        print(f"❌ Erro ao aplicar migrações: {e}")
        print("\n💡 Se o erro persistir, tente:")
        print("   python manage.py migrate solicitacoes 0008 --fake")
        print("   python manage.py migrate solicitacoes")

if __name__ == '__main__':
    fix_migrations()

