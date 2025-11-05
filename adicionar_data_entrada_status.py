#!/usr/bin/env python
"""
Script para adicionar a coluna data_entrada_status ao banco de dados
Execute este script para criar a nova coluna no banco de dados SQLite
"""
import os
import sys
import django
from django.db import connection
from django.utils import timezone

# Configurar o Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'attend_finence.settings')
django.setup()

def adicionar_coluna_data_entrada_status():
    """Adiciona a coluna data_entrada_status ao banco de dados"""
    print("Adicionando coluna data_entrada_status...")
    
    try:
        with connection.cursor() as cursor:
            # Verificar se a coluna já existe
            cursor.execute("PRAGMA table_info(solicitacoes_solicitacoes);")
            columns = [row[1] for row in cursor.fetchall()]
            
            if 'data_entrada_status' in columns:
                print("  ✓ Coluna data_entrada_status já existe")
            else:
                # Adicionar coluna data_entrada_status
                # SQLite não suporta ALTER TABLE ADD COLUMN com TIMESTAMP diretamente
                # Usaremos TEXT e depois converteremos se necessário
                cursor.execute("""
                    ALTER TABLE solicitacoes_solicitacoes 
                    ADD COLUMN data_entrada_status TEXT NULL;
                """)
                print("  ✓ Coluna data_entrada_status adicionada")
                
                # Preencher com a data atual para registros existentes
                cursor.execute("""
                    UPDATE solicitacoes_solicitacoes 
                    SET data_entrada_status = datetime('now')
                    WHERE data_entrada_status IS NULL;
                """)
                print("  ✓ Dados existentes atualizados com data atual")
        
        print("\n✅ Coluna data_entrada_status adicionada com sucesso!")
        print("   O site deve funcionar normalmente agora.")
        
    except Exception as e:
        print(f"\n❌ Erro ao adicionar coluna: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    adicionar_coluna_data_entrada_status()

