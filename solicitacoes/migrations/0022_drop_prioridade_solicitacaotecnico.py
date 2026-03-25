# Generated manually for SQLite column drop.

from django.db import migrations


SQL = """
PRAGMA foreign_keys=off;

ALTER TABLE solicitacoes_solicitacaotecnico RENAME TO solicitacoes_solicitacaotecnico_old;

CREATE TABLE solicitacoes_solicitacaotecnico (
    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    valor_pagamento_tecnico REAL NOT NULL,
    valor_extra REAL NULL,
    descricao TEXT NULL,
    atividade_produtiva bool NOT NULL,
    data_criacao datetime NOT NULL,
    data_atualizacao datetime NOT NULL,
    recebedor_id bigint NOT NULL,
    servico_id bigint NULL,
    solicitacao_id bigint NOT NULL,
    data_realizacao_atividade date NULL,
    ticket_item varchar(25) NOT NULL,
    data_pagamento date NULL,
    cliente_empresa_id bigint NULL,
    FOREIGN KEY(recebedor_id) REFERENCES solicitacoes_recebedor(id) DEFERRABLE INITIALLY DEFERRED,
    FOREIGN KEY(servico_id) REFERENCES servicos_servico(id) DEFERRABLE INITIALLY DEFERRED,
    FOREIGN KEY(solicitacao_id) REFERENCES solicitacoes_solicitacoes(id) DEFERRABLE INITIALLY DEFERRED,
    FOREIGN KEY(cliente_empresa_id) REFERENCES solicitacoes_clienteempresa(id) DEFERRABLE INITIALLY DEFERRED
);

INSERT INTO solicitacoes_solicitacaotecnico (
    id,
    valor_pagamento_tecnico,
    valor_extra,
    descricao,
    atividade_produtiva,
    data_criacao,
    data_atualizacao,
    recebedor_id,
    servico_id,
    solicitacao_id,
    data_realizacao_atividade,
    ticket_item,
    data_pagamento,
    cliente_empresa_id
)
SELECT
    id,
    valor_pagamento_tecnico,
    valor_extra,
    descricao,
    atividade_produtiva,
    data_criacao,
    data_atualizacao,
    recebedor_id,
    servico_id,
    solicitacao_id,
    data_realizacao_atividade,
    ticket_item,
    data_pagamento,
    cliente_empresa_id
FROM solicitacoes_solicitacaotecnico_old;

DROP TABLE solicitacoes_solicitacaotecnico_old;

CREATE INDEX IF NOT EXISTS solicitacoes_solicitacaotecnico_recebedor_id_0d1e1a6c ON solicitacoes_solicitacaotecnico (recebedor_id);
CREATE INDEX IF NOT EXISTS solicitacoes_solicitacaotecnico_servico_id_8e6b8fdb ON solicitacoes_solicitacaotecnico (servico_id);
CREATE INDEX IF NOT EXISTS solicitacoes_solicitacaotecnico_solicitacao_id_5c8f4e8a ON solicitacoes_solicitacaotecnico (solicitacao_id);
CREATE INDEX IF NOT EXISTS solicitacoes_solicitacaotecnico_cliente_empresa_id_5b9fb7b2 ON solicitacoes_solicitacaotecnico (cliente_empresa_id);

PRAGMA foreign_keys=on;
"""


class Migration(migrations.Migration):

    dependencies = [
        ('solicitacoes', '0021_auditoria_solicitacao_id_e_login'),
    ]

    operations = [
        migrations.RunSQL(SQL, reverse_sql=migrations.RunSQL.noop),
    ]

