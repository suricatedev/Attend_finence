# Como Aplicar a Migração na VPS

## Problema
O erro `no such column: solicitacoes_solicitacoes.data_entrada_status` ocorre porque o campo foi adicionado ao modelo, mas a migração não foi aplicada no banco de dados da VPS.

## Solução

### Opção 1: Usar o Script Python (Recomendado)

1. **Conecte-se à VPS via SSH:**
```bash
ssh seu_usuario@161.97.95.90
```

2. **Navegue até o diretório do projeto:**
```bash
cd /home/attendgean/sistema_financeiro/attend_finence
```

3. **Ative o ambiente virtual:**
```bash
source venv/bin/activate
```

4. **Execute o script de migração:**
```bash
python aplicar_migracao_data_entrada_status.py
```

### Opção 2: Usar Django Migrate (Método Padrão)

1. **Conecte-se à VPS via SSH:**
```bash
ssh seu_usuario@161.97.95.90
```

2. **Navegue até o diretório do projeto:**
```bash
cd /home/attendgean/sistema_financeiro/attend_finence
```

3. **Ative o ambiente virtual:**
```bash
source venv/bin/activate
```

4. **Aplique as migrações:**
```bash
python manage.py migrate solicitacoes
```

### Opção 3: Aplicar SQL Manualmente

Se as opções acima não funcionarem, você pode executar o SQL diretamente:

1. **Conecte-se à VPS e acesse o banco SQLite:**
```bash
cd /home/attendgean/sistema_financeiro/attend_finence
sqlite3 db.sqlite3
```

2. **Execute os comandos SQL:**
```sql
ALTER TABLE solicitacoes_solicitacoes ADD COLUMN data_entrada_status DATETIME DEFAULT NULL;
ALTER TABLE solicitacoes_solicitacoes ADD COLUMN valor_em_rota REAL DEFAULT 0.0;
ALTER TABLE solicitacoes_solicitacoes ADD COLUMN descricao_em_rota TEXT DEFAULT NULL;

-- Atualizar registros existentes
UPDATE solicitacoes_solicitacoes 
SET data_entrada_status = datetime(data_de_criacao || ' ' || time(tempo_criacao))
WHERE data_entrada_status IS NULL;

-- Registrar a migração
INSERT INTO django_migrations (app, name, applied) 
VALUES ('solicitacoes', '0006_add_data_entrada_status', datetime('now'));

.quit
```

3. **Reinicie o servidor:**
```bash
# Se estiver usando systemd
sudo systemctl restart seu_servico

# Ou se estiver usando gunicorn/supervisor
sudo supervisorctl restart seu_app
```

## Verificação

Após aplicar a migração, verifique se funcionou:

1. **Acesse o site:** `http://161.97.95.90:5000/solicitacoes/home/`
2. **O erro não deve mais aparecer**

## Arquivos Necessários

Certifique-se de que os seguintes arquivos estão na VPS:

- `solicitacoes/migrations/0006_add_data_entrada_status.py` (novo arquivo de migração)
- `aplicar_migracao_data_entrada_status.py` (script auxiliar)

## Notas Importantes

- ⚠️ **Faça backup do banco de dados antes de aplicar migrações em produção**
- O script é seguro e não apaga dados existentes
- Se algum campo já existir, o script apenas informa e continua

