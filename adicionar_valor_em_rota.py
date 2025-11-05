#!/usr/bin/env python
"""
Script para adicionar a coluna valor_em_rota ao banco de dados
Execute este script para criar a nova coluna no banco de dados SQLite
"""
import os
import sys
import django
from django.db import connection

# Configurar o Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'attend_finence.settings')
django.setup()

def adicionar_coluna_valor_em_rota():
    """Adiciona a coluna valor_em_rota ao banco de dados"""
    print("Adicionando coluna valor_em_rota...")
    
    try:
        with connection.cursor() as cursor:
            # Verificar se a coluna já existe
            cursor.execute("PRAGMA table_info(solicitacoes_solicitacoes);")
            columns = [row[1] for row in cursor.fetchall()]
            
            if 'valor_em_rota' in columns:
                print("  ✓ Coluna valor_em_rota já existe")
            else:
                # Adicionar coluna valor_em_rota
                cursor.execute("""
                    ALTER TABLE solicitacoes_solicitacoes 
                    ADD COLUMN valor_em_rota REAL DEFAULT 0.0;
                """)
                print("  ✓ Coluna valor_em_rota adicionada")
        
        print("\n✅ Coluna valor_em_rota adicionada com sucesso!")
        print("   O site deve funcionar normalmente agora.")
        
    except Exception as e:
        print(f"\n❌ Erro ao adicionar coluna: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    adicionar_coluna_valor_em_rota()

