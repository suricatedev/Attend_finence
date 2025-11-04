# Como Aplicar a Migração

O erro ocorre porque os novos campos foram adicionados ao modelo, mas ainda não foram criados no banco de dados.

## Opção 1: Usando Django (Recomendado)

Execute no terminal (no diretório do projeto):

```bash
python manage.py migrate solicitacoes
```

Ou para aplicar todas as migrações pendentes:

```bash
python manage.py migrate
```

## Opção 2: Aplicação Manual via SQL (Alternativa)

Se o comando acima não funcionar, você pode aplicar manualmente via SQLite:

1. Abra o banco de dados SQLite (use um cliente SQL ou execute via Python):
   ```bash
   sqlite3 db.sqlite3
   ```

2. Execute os seguintes comandos SQL:

```sql
-- Adicionar campos ao modelo Solicitacoes
ALTER TABLE solicitacoes_solicitacoes ADD COLUMN valor_km REAL DEFAULT 0.0;
ALTER TABLE solicitacoes_solicitacoes ADD COLUMN valor_pedagio REAL DEFAULT 0.0;
ALTER TABLE solicitacoes_solicitacoes ADD COLUMN valor_hospedagem REAL DEFAULT 0.0;
ALTER TABLE solicitacoes_solicitacoes ADD COLUMN valor_fluvial REAL DEFAULT 0.0;
ALTER TABLE solicitacoes_solicitacoes ADD COLUMN valor_outros REAL DEFAULT 0.0;
ALTER TABLE solicitacoes_solicitacoes ADD COLUMN valor_receita REAL DEFAULT 0.0;

-- Adicionar campos ao modelo SolicitacaoRotaItem
ALTER TABLE solicitacoes_solicitacaorotaitem ADD COLUMN valor_km REAL DEFAULT 0.0;
ALTER TABLE solicitacoes_solicitacaorotaitem ADD COLUMN valor_pedagio REAL DEFAULT 0.0;
ALTER TABLE solicitacoes_solicitacaorotaitem ADD COLUMN valor_hospedagem REAL DEFAULT 0.0;
ALTER TABLE solicitacoes_solicitacaorotaitem ADD COLUMN valor_fluvial REAL DEFAULT 0.0;
ALTER TABLE solicitacoes_solicitacaorotaitem ADD COLUMN valor_outros REAL DEFAULT 0.0;

-- Registrar a migração como aplicada
INSERT INTO django_migrations (app, name, applied) VALUES ('solicitacoes', '0005_add_valores_detalhados', datetime('now'));
```

## Opção 3: Usando Python Interativo

Execute no terminal Python:

```python
python manage.py shell
```

E então execute:

```python
from django.db import connection

with connection.cursor() as cursor:
    cursor.execute("ALTER TABLE solicitacoes_solicitacoes ADD COLUMN valor_km REAL DEFAULT 0.0;")
    cursor.execute("ALTER TABLE solicitacoes_solicitacoes ADD COLUMN valor_pedagio REAL DEFAULT 0.0;")
    cursor.execute("ALTER TABLE solicitacoes_solicitacoes ADD COLUMN valor_hospedagem REAL DEFAULT 0.0;")
    cursor.execute("ALTER TABLE solicitacoes_solicitacoes ADD COLUMN valor_fluvial REAL DEFAULT 0.0;")
    cursor.execute("ALTER TABLE solicitacoes_solicitacoes ADD COLUMN valor_outros REAL DEFAULT 0.0;")
    cursor.execute("ALTER TABLE solicitacoes_solicitacoes ADD COLUMN valor_receita REAL DEFAULT 0.0;")
    cursor.execute("ALTER TABLE solicitacoes_solicitacaorotaitem ADD COLUMN valor_km REAL DEFAULT 0.0;")
    cursor.execute("ALTER TABLE solicitacoes_solicitacaorotaitem ADD COLUMN valor_pedagio REAL DEFAULT 0.0;")
    cursor.execute("ALTER TABLE solicitacoes_solicitacaorotaitem ADD COLUMN valor_hospedagem REAL DEFAULT 0.0;")
    cursor.execute("ALTER TABLE solicitacoes_solicitacaorotaitem ADD COLUMN valor_fluvial REAL DEFAULT 0.0;")
    cursor.execute("ALTER TABLE solicitacoes_solicitacaorotaitem ADD COLUMN valor_outros REAL DEFAULT 0.0;")
```

Depois, registre a migração:

```python
from django.db import connection
from django.utils import timezone

with connection.cursor() as cursor:
    cursor.execute(
        "INSERT INTO django_migrations (app, name, applied) VALUES (?, ?, ?)",
        ['solicitacoes', '0005_add_valores_detalhados', timezone.now()]
    )
```

