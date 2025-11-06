"""
Script para criar a tabela ClienteEmpresa no banco de dados SQLite
"""
import os
import sys
import django

# Configurar Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'attend_finence.settings')
django.setup()

from django.db import connection
from django.utils import timezone

def criar_tabela_cliente_empresa():
    """Cria a tabela solicitacoes_clienteempresa se ela não existir"""
    try:
        cursor = connection.cursor()
        
        # Verificar se a tabela já existe
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='solicitacoes_clienteempresa';
        """)
        
        if cursor.fetchone():
            print("✅ Tabela solicitacoes_clienteempresa já existe!")
            return True
        
        # Criar a tabela
        cursor.execute("""
            CREATE TABLE solicitacoes_clienteempresa (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nome VARCHAR(200) NOT NULL UNIQUE,
                ativo BOOLEAN NOT NULL DEFAULT 1,
                data_criacao DATETIME NOT NULL,
                data_atualizacao DATETIME NOT NULL
            );
        """)
        
        # Criar índice para busca
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_clienteempresa_nome 
            ON solicitacoes_clienteempresa(nome);
        """)
        
        # Registrar a migração
        cursor.execute("""
            INSERT OR IGNORE INTO django_migrations (app, name, applied)
            VALUES (?, ?, ?)
        """, ['solicitacoes', '0007_clienteempresa', timezone.now()])
        
        print("✅ Tabela solicitacoes_clienteempresa criada com sucesso!")
        print("✅ Migração registrada no Django")
        
        return True
        
    except Exception as e:
        print(f"❌ Erro ao criar tabela: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    print("🔧 Criando tabela ClienteEmpresa...")
    if criar_tabela_cliente_empresa():
        print("✅ Processo concluído com sucesso!")
    else:
        print("❌ Processo falhou!")
        sys.exit(1)

