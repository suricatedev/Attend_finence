"""
Script para adicionar o campo supervisor à tabela Recebedor
Execute: python adicionar_campo_supervisor_recebedor.py
"""
import os
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'attend_finence.settings')
django.setup()

from django.db import connection

def adicionar_campo_supervisor():
    """Adiciona o campo supervisor à tabela Recebedor se não existir"""
    try:
        with connection.cursor() as cursor:
            # Verificar se o campo já existe
            cursor.execute("""
                PRAGMA table_info(solicitacoes_recebedor);
            """)
            columns = [row[1] for row in cursor.fetchall()]
            
            if 'supervisor' not in columns:
                # Adicionar campo supervisor
                cursor.execute("""
                    ALTER TABLE solicitacoes_recebedor 
                    ADD COLUMN supervisor VARCHAR(50) DEFAULT NULL;
                """)
                print("✅ Campo 'supervisor' adicionado à tabela solicitacoes_recebedor")
            else:
                print("ℹ️ Campo 'supervisor' já existe na tabela solicitacoes_recebedor")
                
    except Exception as e:
        print(f"⚠️ Erro ao adicionar campo supervisor: {e}")

if __name__ == '__main__':
    adicionar_campo_supervisor()
    print("✅ Processo concluído!")

