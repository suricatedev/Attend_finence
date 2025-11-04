#!/usr/bin/env python
"""
Script para aplicar manualmente a migração 0005_add_valores_detalhados
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
    print("Aplicando migração 0005_add_valores_detalhados...")
    
    try:
        with connection.cursor() as cursor:
            # Adicionar campos ao modelo Solicitacoes
            print("Adicionando campos ao modelo Solicitacoes...")
            try:
                cursor.execute("ALTER TABLE solicitacoes_solicitacoes ADD COLUMN valor_km REAL DEFAULT 0.0;")
                print("  ✓ valor_km adicionado")
            except Exception as e:
                if "duplicate column" in str(e).lower() or "already exists" in str(e).lower():
                    print("  - valor_km já existe")
                else:
                    raise
            
            try:
                cursor.execute("ALTER TABLE solicitacoes_solicitacoes ADD COLUMN valor_pedagio REAL DEFAULT 0.0;")
                print("  ✓ valor_pedagio adicionado")
            except Exception as e:
                if "duplicate column" in str(e).lower() or "already exists" in str(e).lower():
                    print("  - valor_pedagio já existe")
                else:
                    raise
            
            try:
                cursor.execute("ALTER TABLE solicitacoes_solicitacoes ADD COLUMN valor_hospedagem REAL DEFAULT 0.0;")
                print("  ✓ valor_hospedagem adicionado")
            except Exception as e:
                if "duplicate column" in str(e).lower() or "already exists" in str(e).lower():
                    print("  - valor_hospedagem já existe")
                else:
                    raise
            
            try:
                cursor.execute("ALTER TABLE solicitacoes_solicitacoes ADD COLUMN valor_fluvial REAL DEFAULT 0.0;")
                print("  ✓ valor_fluvial adicionado")
            except Exception as e:
                if "duplicate column" in str(e).lower() or "already exists" in str(e).lower():
                    print("  - valor_fluvial já existe")
                else:
                    raise
            
            try:
                cursor.execute("ALTER TABLE solicitacoes_solicitacoes ADD COLUMN valor_outros REAL DEFAULT 0.0;")
                print("  ✓ valor_outros adicionado")
            except Exception as e:
                if "duplicate column" in str(e).lower() or "already exists" in str(e).lower():
                    print("  - valor_outros já existe")
                else:
                    raise
            
            try:
                cursor.execute("ALTER TABLE solicitacoes_solicitacoes ADD COLUMN valor_receita REAL DEFAULT 0.0;")
                print("  ✓ valor_receita adicionado")
            except Exception as e:
                if "duplicate column" in str(e).lower() or "already exists" in str(e).lower():
                    print("  - valor_receita já existe")
                else:
                    raise
            
            # Adicionar campos ao modelo SolicitacaoRotaItem
            print("\nAdicionando campos ao modelo SolicitacaoRotaItem...")
            try:
                cursor.execute("ALTER TABLE solicitacoes_solicitacaorotaitem ADD COLUMN valor_km REAL DEFAULT 0.0;")
                print("  ✓ valor_km adicionado")
            except Exception as e:
                if "duplicate column" in str(e).lower() or "already exists" in str(e).lower():
                    print("  - valor_km já existe")
                else:
                    raise
            
            try:
                cursor.execute("ALTER TABLE solicitacoes_solicitacaorotaitem ADD COLUMN valor_pedagio REAL DEFAULT 0.0;")
                print("  ✓ valor_pedagio adicionado")
            except Exception as e:
                if "duplicate column" in str(e).lower() or "already exists" in str(e).lower():
                    print("  - valor_pedagio já existe")
                else:
                    raise
            
            try:
                cursor.execute("ALTER TABLE solicitacoes_solicitacaorotaitem ADD COLUMN valor_hospedagem REAL DEFAULT 0.0;")
                print("  ✓ valor_hospedagem adicionado")
            except Exception as e:
                if "duplicate column" in str(e).lower() or "already exists" in str(e).lower():
                    print("  - valor_hospedagem já existe")
                else:
                    raise
            
            try:
                cursor.execute("ALTER TABLE solicitacoes_solicitacaorotaitem ADD COLUMN valor_fluvial REAL DEFAULT 0.0;")
                print("  ✓ valor_fluvial adicionado")
            except Exception as e:
                if "duplicate column" in str(e).lower() or "already exists" in str(e).lower():
                    print("  - valor_fluvial já existe")
                else:
                    raise
            
            try:
                cursor.execute("ALTER TABLE solicitacoes_solicitacaorotaitem ADD COLUMN valor_outros REAL DEFAULT 0.0;")
                print("  ✓ valor_outros adicionado")
            except Exception as e:
                if "duplicate column" in str(e).lower() or "already exists" in str(e).lower():
                    print("  - valor_outros já existe")
                else:
                    raise
            
            # Registrar a migração como aplicada
            print("\nRegistrando migração no Django...")
            try:
                from django.db import IntegrityError
                cursor.execute(
                    "INSERT INTO django_migrations (app, name, applied) VALUES (?, ?, ?)",
                    ['solicitacoes', '0005_add_valores_detalhados', timezone.now()]
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

