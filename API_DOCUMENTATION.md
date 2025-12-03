# API REST - Documentação

## Visão Geral

A API REST permite criar e editar solicitações financeiras com autenticação por token JWT. O acesso é restrito apenas para usuários do grupo **Administrador**.

## Autenticação

A API usa autenticação JWT (JSON Web Token). Você precisa obter um token de acesso antes de fazer requisições.

### 1. Obter Token de Acesso

**Endpoint:** `POST /api/v1/auth/token/`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "username": "seu_usuario",
  "password": "sua_senha"
}
```

**Resposta (200 OK):**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

### 2. Renovar Token de Acesso

**Endpoint:** `POST /api/v1/auth/token/refresh/`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

**Resposta (200 OK):**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

### 3. Usar Token nas Requisições

Todas as requisições subsequentes devem incluir o token no header:

```
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

## Endpoints da API

### Base URL
```
/api/v1/solicitacoes/
```

### 1. Listar Solicitações

**Endpoint:** `GET /api/v1/solicitacoes/`

**Headers:**
```
Authorization: Bearer <seu_token>
```

**Parâmetros de Query (opcionais):**
- `status`: Filtrar por status (pendente, aprovado, recusado, concluido)
- `tipo`: Filtrar por tipo (casual, em_rota)
- `solicitante_id`: Filtrar por ID do solicitante
- `data_inicio`: Filtrar por data inicial (formato: YYYY-MM-DD)
- `data_fim`: Filtrar por data final (formato: YYYY-MM-DD)
- `page`: Número da página (paginação)
- `page_size`: Itens por página (padrão: 50)

**Exemplo:**
```bash
GET /api/v1/solicitacoes/?status=pendente&tipo=casual
```

**Resposta (200 OK):**
```json
{
  "count": 10,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "ticket": "INC000001",
      "status": "pendente",
      "titulo": "Solicitação de Reembolso",
      "nome_solicitante": {
        "id": 1,
        "username": "admin",
        "first_name": "Admin",
        "last_name": "User",
        "email": "admin@example.com"
      },
      "nome_do_recebedor": "João Silva",
      "valor": 1500.00,
      "data_de_criacao": "2025-01-15",
      "prioridade": "media",
      "tipo": "casual",
      ...
    }
  ]
}
```

### 2. Criar Nova Solicitação

**Endpoint:** `POST /api/v1/solicitacoes/`

**Headers:**
```
Authorization: Bearer <seu_token>
Content-Type: application/json
```

**Body (Solicitação Casual):**
```json
{
  "titulo": "Solicitação de Reembolso",
  "nome_do_recebedor": "João Silva",
  "chave_pix": "joao@email.com",
  "valor": 1500.00,
  "descricao": "Reembolso de despesas",
  "data_de_pagamento": "2025-02-01",
  "data_de_criacao": "2025-01-15",
  "prioridade": "media",
  "tipo": "casual",
  "valor_km": 200.00,
  "valor_pedagio": 50.00,
  "valor_hospedagem": 800.00,
  "valor_fluvial": 0.00,
  "valor_outros": 450.00,
  "valor_receita": 0.00
}
```

**Body (Solicitação Em Rota):**
```json
{
  "titulo": "Solicitação Em Rota",
  "descricao": "Solicitação com múltiplos itens",
  "data_de_pagamento": "2025-02-01",
  "data_de_criacao": "2025-01-15",
  "prioridade": "alta",
  "tipo": "em_rota",
  "valor_em_rota": 500.00,
  "descricao_em_rota": "Pagamento EM ROTA",
  "valor_receita": 1000.00,
  "itens_rota": [
    {
      "ticket_item": "INC000001",
      "valor": 300.00,
      "recebedor": "Maria Santos",
      "chave_pix": "maria@email.com",
      "valor_km": 150.00,
      "valor_pedagio": 50.00,
      "valor_hospedagem": 100.00,
      "valor_fluvial": 0.00,
      "valor_outros": 0.00,
      "ordem": 1
    },
    {
      "ticket_item": "INC000002",
      "valor": 200.00,
      "recebedor": "Pedro Costa",
      "chave_pix": "pedro@email.com",
      "valor_km": 100.00,
      "valor_pedagio": 0.00,
      "valor_hospedagem": 0.00,
      "valor_fluvial": 0.00,
      "valor_outros": 100.00,
      "ordem": 2
    }
  ]
}
```

**Resposta (201 Created):**
```json
{
  "id": 1,
  "ticket": "INC000001",
  "status": "pendente",
  ...
}
```

### 3. Obter Detalhes de uma Solicitação

**Endpoint:** `GET /api/v1/solicitacoes/{id}/`

**Headers:**
```
Authorization: Bearer <seu_token>
```

**Resposta (200 OK):**
```json
{
  "id": 1,
  "ticket": "INC000001",
  "status": "pendente",
  "titulo": "Solicitação de Reembolso",
  ...
}
```

### 4. Atualizar Solicitação (PUT - Completo)

**Endpoint:** `PUT /api/v1/solicitacoes/{id}/`

**Headers:**
```
Authorization: Bearer <seu_token>
Content-Type: application/json
```

**Body:** Mesmo formato da criação, com todos os campos.

**Nota:** Apenas solicitações com status "pendente" podem ser editadas.

**Resposta (200 OK):**
```json
{
  "id": 1,
  "ticket": "INC000001",
  "status": "pendente",
  ...
}
```

### 5. Atualizar Solicitação (PATCH - Parcial)

**Endpoint:** `PATCH /api/v1/solicitacoes/{id}/`

**Headers:**
```
Authorization: Bearer <seu_token>
Content-Type: application/json
```

**Body:** Apenas os campos que deseja atualizar.

**Exemplo:**
```json
{
  "valor": 2000.00,
  "prioridade": "alta"
}
```

**Nota:** Apenas solicitações com status "pendente" podem ser editadas.

**Resposta (200 OK):**
```json
{
  "id": 1,
  "ticket": "INC000001",
  "status": "pendente",
  "valor": 2000.00,
  "prioridade": "alta",
  ...
}
```

### 6. Deletar Solicitação

**Endpoint:** `DELETE /api/v1/solicitacoes/{id}/`

**Headers:**
```
Authorization: Bearer <seu_token>
```

**Nota:** Apenas solicitações com status "recusado" podem ser deletadas (por segurança).

**Resposta (204 No Content):**
Sem corpo de resposta.

### 7. Obter Detalhes Completos

**Endpoint:** `GET /api/v1/solicitacoes/{id}/detalhes-completos/`

**Headers:**
```
Authorization: Bearer <seu_token>
```

Retorna todos os detalhes da solicitação, incluindo itens da rota se aplicável.

**Resposta (200 OK):**
Mesmo formato do GET `/api/v1/solicitacoes/{id}/`

### 8. Estatísticas

**Endpoint:** `GET /api/v1/solicitacoes/estatisticas/`

**Headers:**
```
Authorization: Bearer <seu_token>
```

Retorna estatísticas gerais das solicitações.

**Resposta (200 OK):**
```json
{
  "total": 100,
  "por_status": {
    "pendente": 25,
    "aprovado": 50,
    "recusado": 10,
    "concluido": 15
  },
  "por_tipo": {
    "casual": 70,
    "em_rota": 30
  },
  "valor_total": 150000.00
}
```

## Códigos de Status HTTP

- `200 OK`: Requisição bem-sucedida
- `201 Created`: Recurso criado com sucesso
- `204 No Content`: Recurso deletado com sucesso
- `400 Bad Request`: Erro de validação ou requisição inválida
- `401 Unauthorized`: Token ausente ou inválido
- `403 Forbidden`: Usuário não tem permissão (não é Administrador)
- `404 Not Found`: Recurso não encontrado
- `500 Internal Server Error`: Erro interno do servidor

## Permissões

- **Acesso:** Apenas usuários do grupo "Administrador" ou superusuários
- **Edição:** Apenas solicitações com status "pendente" podem ser editadas
- **Exclusão:** Apenas solicitações com status "recusado" podem ser deletadas

## Validações

### Campos Obrigatórios

**Solicitação Casual:**
- `titulo` (máximo 70 caracteres)
- `nome_do_recebedor`
- `valor` (deve ser >= 0)
- `descricao`
- `data_de_pagamento` (formato: YYYY-MM-DD)
- `data_de_criacao` (formato: YYYY-MM-DD)

**Solicitação Em Rota:**
- `titulo` (máximo 70 caracteres)
- `descricao`
- `data_de_pagamento` (formato: YYYY-MM-DD)
- `data_de_criacao` (formato: YYYY-MM-DD)
- `itens_rota` (pelo menos um item)

### Campos Opcionais

- `nome_solicitante_id`: Se não fornecido, usa o usuário autenticado
- `ticket`: Se não fornecido, é gerado automaticamente
- `status`: Padrão é "pendente"
- `prioridade`: Padrão é "baixa"
- `tipo`: Padrão é "casual"
- `chave_pix`
- `cliente_empresa`
- `cnpj`
- `servico`: ID do serviço
- `anexo`: Arquivo (usar multipart/form-data)

## Exemplo Completo (cURL)

```bash
# 1. Obter token
TOKEN=$(curl -X POST http://localhost:8000/api/v1/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "senha123"}' \
  | jq -r '.access')

# 2. Criar solicitação
curl -X POST http://localhost:8000/api/v1/solicitacoes/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Solicitação de Reembolso",
    "nome_do_recebedor": "João Silva",
    "valor": 1500.00,
    "descricao": "Reembolso de despesas",
    "data_de_pagamento": "2025-02-01",
    "data_de_criacao": "2025-01-15",
    "prioridade": "media",
    "tipo": "casual"
  }'

# 3. Listar solicitações
curl -X GET http://localhost:8000/api/v1/solicitacoes/?status=pendente \
  -H "Authorization: Bearer $TOKEN"

# 4. Atualizar solicitação
curl -X PATCH http://localhost:8000/api/v1/solicitacoes/1/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"valor": 2000.00}'
```

## Notas de Segurança

1. **Tokens JWT:** Os tokens têm validade limitada (1 hora para access, 1 dia para refresh)
2. **HTTPS:** Em produção, sempre use HTTPS para proteger os tokens
3. **Permissões:** Apenas Administradores podem usar a API
4. **Validação:** Todos os dados são validados antes de serem salvos
5. **Edição:** Apenas solicitações pendentes podem ser editadas
6. **Exclusão:** Apenas solicitações recusadas podem ser deletadas

## Suporte

Para dúvidas ou problemas, consulte a documentação do Django REST Framework ou entre em contato com a equipe de desenvolvimento.









## Visão Geral

A API REST permite criar e editar solicitações financeiras com autenticação por token JWT. O acesso é restrito apenas para usuários do grupo **Administrador**.

## Autenticação

A API usa autenticação JWT (JSON Web Token). Você precisa obter um token de acesso antes de fazer requisições.

### 1. Obter Token de Acesso

**Endpoint:** `POST /api/v1/auth/token/`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "username": "seu_usuario",
  "password": "sua_senha"
}
```

**Resposta (200 OK):**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

### 2. Renovar Token de Acesso

**Endpoint:** `POST /api/v1/auth/token/refresh/`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

**Resposta (200 OK):**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

### 3. Usar Token nas Requisições

Todas as requisições subsequentes devem incluir o token no header:

```
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

## Endpoints da API

### Base URL
```
/api/v1/solicitacoes/
```

### 1. Listar Solicitações

**Endpoint:** `GET /api/v1/solicitacoes/`

**Headers:**
```
Authorization: Bearer <seu_token>
```

**Parâmetros de Query (opcionais):**
- `status`: Filtrar por status (pendente, aprovado, recusado, concluido)
- `tipo`: Filtrar por tipo (casual, em_rota)
- `solicitante_id`: Filtrar por ID do solicitante
- `data_inicio`: Filtrar por data inicial (formato: YYYY-MM-DD)
- `data_fim`: Filtrar por data final (formato: YYYY-MM-DD)
- `page`: Número da página (paginação)
- `page_size`: Itens por página (padrão: 50)

**Exemplo:**
```bash
GET /api/v1/solicitacoes/?status=pendente&tipo=casual
```

**Resposta (200 OK):**
```json
{
  "count": 10,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "ticket": "INC000001",
      "status": "pendente",
      "titulo": "Solicitação de Reembolso",
      "nome_solicitante": {
        "id": 1,
        "username": "admin",
        "first_name": "Admin",
        "last_name": "User",
        "email": "admin@example.com"
      },
      "nome_do_recebedor": "João Silva",
      "valor": 1500.00,
      "data_de_criacao": "2025-01-15",
      "prioridade": "media",
      "tipo": "casual",
      ...
    }
  ]
}
```

### 2. Criar Nova Solicitação

**Endpoint:** `POST /api/v1/solicitacoes/`

**Headers:**
```
Authorization: Bearer <seu_token>
Content-Type: application/json
```

**Body (Solicitação Casual):**
```json
{
  "titulo": "Solicitação de Reembolso",
  "nome_do_recebedor": "João Silva",
  "chave_pix": "joao@email.com",
  "valor": 1500.00,
  "descricao": "Reembolso de despesas",
  "data_de_pagamento": "2025-02-01",
  "data_de_criacao": "2025-01-15",
  "prioridade": "media",
  "tipo": "casual",
  "valor_km": 200.00,
  "valor_pedagio": 50.00,
  "valor_hospedagem": 800.00,
  "valor_fluvial": 0.00,
  "valor_outros": 450.00,
  "valor_receita": 0.00
}
```

**Body (Solicitação Em Rota):**
```json
{
  "titulo": "Solicitação Em Rota",
  "descricao": "Solicitação com múltiplos itens",
  "data_de_pagamento": "2025-02-01",
  "data_de_criacao": "2025-01-15",
  "prioridade": "alta",
  "tipo": "em_rota",
  "valor_em_rota": 500.00,
  "descricao_em_rota": "Pagamento EM ROTA",
  "valor_receita": 1000.00,
  "itens_rota": [
    {
      "ticket_item": "INC000001",
      "valor": 300.00,
      "recebedor": "Maria Santos",
      "chave_pix": "maria@email.com",
      "valor_km": 150.00,
      "valor_pedagio": 50.00,
      "valor_hospedagem": 100.00,
      "valor_fluvial": 0.00,
      "valor_outros": 0.00,
      "ordem": 1
    },
    {
      "ticket_item": "INC000002",
      "valor": 200.00,
      "recebedor": "Pedro Costa",
      "chave_pix": "pedro@email.com",
      "valor_km": 100.00,
      "valor_pedagio": 0.00,
      "valor_hospedagem": 0.00,
      "valor_fluvial": 0.00,
      "valor_outros": 100.00,
      "ordem": 2
    }
  ]
}
```

**Resposta (201 Created):**
```json
{
  "id": 1,
  "ticket": "INC000001",
  "status": "pendente",
  ...
}
```

### 3. Obter Detalhes de uma Solicitação

**Endpoint:** `GET /api/v1/solicitacoes/{id}/`

**Headers:**
```
Authorization: Bearer <seu_token>
```

**Resposta (200 OK):**
```json
{
  "id": 1,
  "ticket": "INC000001",
  "status": "pendente",
  "titulo": "Solicitação de Reembolso",
  ...
}
```

### 4. Atualizar Solicitação (PUT - Completo)

**Endpoint:** `PUT /api/v1/solicitacoes/{id}/`

**Headers:**
```
Authorization: Bearer <seu_token>
Content-Type: application/json
```

**Body:** Mesmo formato da criação, com todos os campos.

**Nota:** Apenas solicitações com status "pendente" podem ser editadas.

**Resposta (200 OK):**
```json
{
  "id": 1,
  "ticket": "INC000001",
  "status": "pendente",
  ...
}
```

### 5. Atualizar Solicitação (PATCH - Parcial)

**Endpoint:** `PATCH /api/v1/solicitacoes/{id}/`

**Headers:**
```
Authorization: Bearer <seu_token>
Content-Type: application/json
```

**Body:** Apenas os campos que deseja atualizar.

**Exemplo:**
```json
{
  "valor": 2000.00,
  "prioridade": "alta"
}
```

**Nota:** Apenas solicitações com status "pendente" podem ser editadas.

**Resposta (200 OK):**
```json
{
  "id": 1,
  "ticket": "INC000001",
  "status": "pendente",
  "valor": 2000.00,
  "prioridade": "alta",
  ...
}
```

### 6. Deletar Solicitação

**Endpoint:** `DELETE /api/v1/solicitacoes/{id}/`

**Headers:**
```
Authorization: Bearer <seu_token>
```

**Nota:** Apenas solicitações com status "recusado" podem ser deletadas (por segurança).

**Resposta (204 No Content):**
Sem corpo de resposta.

### 7. Obter Detalhes Completos

**Endpoint:** `GET /api/v1/solicitacoes/{id}/detalhes-completos/`

**Headers:**
```
Authorization: Bearer <seu_token>
```

Retorna todos os detalhes da solicitação, incluindo itens da rota se aplicável.

**Resposta (200 OK):**
Mesmo formato do GET `/api/v1/solicitacoes/{id}/`

### 8. Estatísticas

**Endpoint:** `GET /api/v1/solicitacoes/estatisticas/`

**Headers:**
```
Authorization: Bearer <seu_token>
```

Retorna estatísticas gerais das solicitações.

**Resposta (200 OK):**
```json
{
  "total": 100,
  "por_status": {
    "pendente": 25,
    "aprovado": 50,
    "recusado": 10,
    "concluido": 15
  },
  "por_tipo": {
    "casual": 70,
    "em_rota": 30
  },
  "valor_total": 150000.00
}
```

## Códigos de Status HTTP

- `200 OK`: Requisição bem-sucedida
- `201 Created`: Recurso criado com sucesso
- `204 No Content`: Recurso deletado com sucesso
- `400 Bad Request`: Erro de validação ou requisição inválida
- `401 Unauthorized`: Token ausente ou inválido
- `403 Forbidden`: Usuário não tem permissão (não é Administrador)
- `404 Not Found`: Recurso não encontrado
- `500 Internal Server Error`: Erro interno do servidor

## Permissões

- **Acesso:** Apenas usuários do grupo "Administrador" ou superusuários
- **Edição:** Apenas solicitações com status "pendente" podem ser editadas
- **Exclusão:** Apenas solicitações com status "recusado" podem ser deletadas

## Validações

### Campos Obrigatórios

**Solicitação Casual:**
- `titulo` (máximo 70 caracteres)
- `nome_do_recebedor`
- `valor` (deve ser >= 0)
- `descricao`
- `data_de_pagamento` (formato: YYYY-MM-DD)
- `data_de_criacao` (formato: YYYY-MM-DD)

**Solicitação Em Rota:**
- `titulo` (máximo 70 caracteres)
- `descricao`
- `data_de_pagamento` (formato: YYYY-MM-DD)
- `data_de_criacao` (formato: YYYY-MM-DD)
- `itens_rota` (pelo menos um item)

### Campos Opcionais

- `nome_solicitante_id`: Se não fornecido, usa o usuário autenticado
- `ticket`: Se não fornecido, é gerado automaticamente
- `status`: Padrão é "pendente"
- `prioridade`: Padrão é "baixa"
- `tipo`: Padrão é "casual"
- `chave_pix`
- `cliente_empresa`
- `cnpj`
- `servico`: ID do serviço
- `anexo`: Arquivo (usar multipart/form-data)

## Exemplo Completo (cURL)

```bash
# 1. Obter token
TOKEN=$(curl -X POST http://localhost:8000/api/v1/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "senha123"}' \
  | jq -r '.access')

# 2. Criar solicitação
curl -X POST http://localhost:8000/api/v1/solicitacoes/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Solicitação de Reembolso",
    "nome_do_recebedor": "João Silva",
    "valor": 1500.00,
    "descricao": "Reembolso de despesas",
    "data_de_pagamento": "2025-02-01",
    "data_de_criacao": "2025-01-15",
    "prioridade": "media",
    "tipo": "casual"
  }'

# 3. Listar solicitações
curl -X GET http://localhost:8000/api/v1/solicitacoes/?status=pendente \
  -H "Authorization: Bearer $TOKEN"

# 4. Atualizar solicitação
curl -X PATCH http://localhost:8000/api/v1/solicitacoes/1/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"valor": 2000.00}'
```

## Notas de Segurança

1. **Tokens JWT:** Os tokens têm validade limitada (1 hora para access, 1 dia para refresh)
2. **HTTPS:** Em produção, sempre use HTTPS para proteger os tokens
3. **Permissões:** Apenas Administradores podem usar a API
4. **Validação:** Todos os dados são validados antes de serem salvos
5. **Edição:** Apenas solicitações pendentes podem ser editadas
6. **Exclusão:** Apenas solicitações recusadas podem ser deletadas

## Suporte

Para dúvidas ou problemas, consulte a documentação do Django REST Framework ou entre em contato com a equipe de desenvolvimento.







