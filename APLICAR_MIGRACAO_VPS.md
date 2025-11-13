# Como Aplicar Migrações no VPS

## Problema
A tabela `solicitacoes_clienteempresa` já existe no banco de dados, mas a migração está tentando criá-la novamente.

## Solução Rápida

Execute os seguintes comandos no VPS:

```bash
cd /home/attendgean/sistema_financeiro/attend_finence

# Ativar ambiente virtual
source venv/bin/activate

# Marcar a migração 0008 como aplicada (sem executá-la)
python manage.py migrate solicitacoes 0008 --fake

# Aplicar migrações restantes
python manage.py migrate
```

## Solução Automatizada

Execute o script de correção:

```bash
cd /home/attendgean/sistema_financeiro/attend_finence
source venv/bin/activate
python fix_migrations.py
```

## Verificar Estado das Migrações

Para ver quais migrações foram aplicadas:

```bash
python manage.py showmigrations solicitacoes
```

## Se Ainda Der Erro

Se ainda houver problemas, você pode marcar manualmente a migração no banco:

```bash
python manage.py shell
```

No shell do Django:
```python
from django.db import connection
from django.utils import timezone
from django.db import transaction

with transaction.atomic():
    cursor = connection.cursor()
    # Verificar se a migração já está registrada
    cursor.execute("""
        SELECT * FROM django_migrations 
        WHERE app = 'solicitacoes' AND name = '0008_clienteempresa_alter_recebedor_options_and_more'
    """)
    
    if not cursor.fetchone():
        # Registrar a migração como aplicada
        cursor.execute("""
            INSERT INTO django_migrations (app, name, applied)
            VALUES ('solicitacoes', '0008_clienteempresa_alter_recebedor_options_and_more', ?)
        """, [timezone.now()])
        print("✅ Migração registrada!")
    else:
        print("✅ Migração já estava registrada!")
```

## Verificar Tabelas Existentes

Para verificar quais tabelas existem:

```bash
python manage.py shell
```

```python
from django.db import connection

cursor = connection.cursor()
cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'solicitacoes_%'")
tables = cursor.fetchall()
for table in tables:
    print(table[0])
```
