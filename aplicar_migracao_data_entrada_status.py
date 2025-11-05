#!/usr/bin/env python
"""
Script para aplicar manualmente a migração 0006_add_data_entrada_status
Este script adiciona as novas colunas diretamente no banco de dados SQLite
"""
import os
import sys
import django
from django.db import connection
from django.utils import timezone

# Configurar o Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'attend_finence.settings')
django.setup()

def aplicar_migracao():
    """Aplica as alterações SQL diretamente no banco de dados"""
    print("Aplicando migração 0006_add_data_entrada_status...")
    
    try:
        with connection.cursor() as cursor:
            # Adicionar campo data_entrada_status ao modelo Solicitacoes
            print("Adicionando campo data_entrada_status ao modelo Solicitacoes...")
            try:
                cursor.execute("""
                    ALTER TABLE solicitacoes_solicitacoes 
                    ADD COLUMN data_entrada_status DATETIME DEFAULT NULL;
                """)
                print("  ✓ data_entrada_status adicionado")
            except Exception as e:
                error_msg = str(e).lower()
                if "duplicate column" in error_msg or "already exists" in error_msg:
                    print("  - data_entrada_status já existe")
                else:
                    raise
            
            # Adicionar campo valor_em_rota ao modelo Solicitacoes
            print("\nAdicionando campo valor_em_rota ao modelo Solicitacoes...")
            try:
                cursor.execute("ALTER TABLE solicitacoes_solicitacoes ADD COLUMN valor_em_rota REAL DEFAULT 0.0;")
                print("  ✓ valor_em_rota adicionado")
            except Exception as e:
                error_msg = str(e).lower()
                if "duplicate column" in error_msg or "already exists" in error_msg:
                    print("  - valor_em_rota já existe")
                else:
                    raise
            
            # Adicionar campo descricao_em_rota ao modelo Solicitacoes
            print("\nAdicionando campo descricao_em_rota ao modelo Solicitacoes...")
            try:
                cursor.execute("ALTER TABLE solicitacoes_solicitacoes ADD COLUMN descricao_em_rota TEXT DEFAULT NULL;")
                print("  ✓ descricao_em_rota adicionado")
            except Exception as e:
                error_msg = str(e).lower()
                if "duplicate column" in error_msg or "already exists" in error_msg:
                    print("  - descricao_em_rota já existe")
                else:
                    raise
            
            # Atualizar data_entrada_status para registros existentes (usar data_de_criacao como fallback)
            print("\nAtualizando data_entrada_status para registros existentes...")
            try:
                cursor.execute("""
                    UPDATE solicitacoes_solicitacoes 
                    SET data_entrada_status = datetime(data_de_criacao || ' ' || time(tempo_criacao))
                    WHERE data_entrada_status IS NULL;
                """)
                print(f"  ✓ {cursor.rowcount} registros atualizados")
            except Exception as e:
                print(f"  ⚠ Erro ao atualizar registros (pode ser ignorado): {e}")
            
            # Registrar a migração como aplicada
            print("\nRegistrando migração no Django...")
            try:
                from django.db import IntegrityError
                cursor.execute(
                    "INSERT INTO django_migrations (app, name, applied) VALUES (?, ?, ?)",
                    ['solicitacoes', '0006_add_data_entrada_status', timezone.now()]
                )
                print("  ✓ Migração registrada")
            except IntegrityError:
                print("  - Migração já estava registrada")
            except Exception as e:
                print(f"  ⚠ Erro ao registrar migração (pode ser ignorado): {e}")
        
        print("\n✅ Migração aplicada com sucesso!")
        print("   O site deve funcionar normalmente agora.")
        
    except Exception as e:
        print(f"\n❌ Erro ao aplicar migração: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    aplicar_migracao()

