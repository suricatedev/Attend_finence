# Guia Prático: Como Usar a API REST

Este guia apresenta instruções práticas para usar a API REST de Solicitações Financeiras.

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Autenticação - Obter Token](#1-autenticação---obter-token)
3. [Criar uma Solicitação](#2-criar-uma-solicitação)
4. [Listar Solicitações](#3-listar-solicitações)
5. [Visualizar Detalhes](#4-visualizar-detalhes-de-uma-solicitação)
6. [Atualizar Solicitação](#5-atualizar-uma-solicitação)
7. [Deletar Solicitação](#6-deletar-uma-solicitação)
8. [Ver Estatísticas](#7-ver-estatísticas)
9. [Exemplos Práticos](#exemplos-práticos)
10. [Solução de Problemas](#solução-de-problemas)

---

## Pré-requisitos

### 1. Instalar Dependências

Antes de usar a API, certifique-se de ter instalado as dependências:

```bash
cd /home/gean/Documents/projeto_finança/attend_finence
pip install -r requirements.txt
```

### 2. Verificar Servidor em Execução

Certifique-se de que o servidor Django está rodando:

```bash
python3 manage.py runserver
```

A API estará disponível em: `http://localhost:8000/api/v1/`

### 3. Credenciais de Acesso

Você precisa de:
- **Usuário**: Uma conta de usuário do sistema
- **Grupo**: O usuário deve estar no grupo **"Administrador"** ou ser **superuser**
- **Senha**: A senha do usuário

---

## 1. Autenticação - Obter Token

Antes de fazer qualquer requisição, você precisa obter um token de acesso.

### Passo 1: Fazer Login

**URL:** `POST http://localhost:8000/api/v1/auth/token/`

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

### Exemplo com cURL:

```bash
curl -X POST http://localhost:8000/api/v1/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "senha123"
  }'
```

### Resposta de Sucesso:

```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzA1MzE2MDAwLCJpYXQiOjE3MDUzMTI0MDAsImp0aSI6IjEyMzQ1Njc4IiwidXNlcl9pZCI6MX0.abc123def456",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTcwNTM5ODgwMCwiaWF0IjoxNzA1MzEyNDAwLCJqdGkiOiIxMjM0NTY3OCIsInVzZXJfaWQiOjF9.xyz789"
}
```

### Guardar o Token

Salve o token `access` para usar nas próximas requisições:

```bash
# No Linux/Mac, salve em uma variável:
export TOKEN="eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."

# No Windows PowerShell:
$TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
```

### Renovar Token (quando expirar)

Se o token expirar (válido por 1 hora), use o `refresh` para obter um novo:

**URL:** `POST http://localhost:8000/api/v1/auth/token/refresh/`

```bash
curl -X POST http://localhost:8000/api/v1/auth/token/refresh/ \
  -H "Content-Type: application/json" \
  -d '{
    "refresh": "seu_refresh_token_aqui"
  }'
```

---

## 2. Criar uma Solicitação

### Solicitação Casual (Individual)

**URL:** `POST http://localhost:8000/api/v1/solicitacoes/`

**Headers:**
```
Authorization: Bearer SEU_TOKEN_AQUI
Content-Type: application/json
```

**Body Completo:**

```json
{
  "titulo": "Solicitação de Reembolso - Viagem",
  "nome_do_recebedor": "João Silva",
  "chave_pix": "joao.silva@email.com",
  "cliente_empresa": "Empresa XYZ",
  "cnpj": "12.345.678/0001-90",
  "valor": 1500.00,
  "descricao": "Reembolso de despesas de viagem para reunião com cliente",
  "data_de_pagamento": "2025-02-15",
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

**Body Mínimo (campos obrigatórios):**

```json
{
  "titulo": "Solicitação de Reembolso",
  "nome_do_recebedor": "João Silva",
  "valor": 1500.00,
  "descricao": "Reembolso de despesas",
  "data_de_pagamento": "2025-02-15",
  "data_de_criacao": "2025-01-15",
  "tipo": "casual"
}
```

**Exemplo com cURL:**

```bash
curl -X POST http://localhost:8000/api/v1/solicitacoes/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Solicitação de Reembolso",
    "nome_do_recebedor": "João Silva",
    "valor": 1500.00,
    "descricao": "Reembolso de despesas",
    "data_de_pagamento": "2025-02-15",
    "data_de_criacao": "2025-01-15",
    "tipo": "casual"
  }'
```

### Solicitação Em Rota (com múltiplos itens)

```json
{
  "titulo": "Solicitação Em Rota - Múltiplos Pagamentos",
  "descricao": "Pagamentos agrupados de múltiplos serviços",
  "data_de_pagamento": "2025-02-15",
  "data_de_criacao": "2025-01-15",
  "prioridade": "alta",
  "tipo": "em_rota",
  "valor_em_rota": 500.00,
  "descricao_em_rota": "Pagamento EM ROTA para serviços diversos",
  "valor_receita": 1000.00,
  "itens_rota": [
    {
      "ticket_item": "INC000001",
      "valor": 300.00,
      "recebedor": "Maria Santos",
      "chave_pix": "maria@email.com",
      "cliente_empresa": "Empresa ABC",
      "cnpj": "98.765.432/0001-10",
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

**Resposta de Sucesso (201 Created):**

```json
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
  ...
}
```

---

## 3. Listar Solicitações

### Listar Todas

**URL:** `GET http://localhost:8000/api/v1/solicitacoes/`

**Headers:**
```
Authorization: Bearer SEU_TOKEN_AQUI
```

**Exemplo com cURL:**

```bash
curl -X GET http://localhost:8000/api/v1/solicitacoes/ \
  -H "Authorization: Bearer $TOKEN"
```

### Filtrar por Status

**URL:** `GET http://localhost:8000/api/v1/solicitacoes/?status=pendente`

```bash
curl -X GET "http://localhost:8000/api/v1/solicitacoes/?status=pendente" \
  -H "Authorization: Bearer $TOKEN"
```

**Status disponíveis:**
- `pendente`
- `aprovado`
- `recusado`
- `concluido`

### Filtrar por Tipo

**URL:** `GET http://localhost:8000/api/v1/solicitacoes/?tipo=casual`

```bash
curl -X GET "http://localhost:8000/api/v1/solicitacoes/?tipo=casual" \
  -H "Authorization: Bearer $TOKEN"
```

**Tipos disponíveis:**
- `casual`
- `em_rota`

### Filtrar por Solicitante

**URL:** `GET http://localhost:8000/api/v1/solicitacoes/?solicitante_id=1`

```bash
curl -X GET "http://localhost:8000/api/v1/solicitacoes/?solicitante_id=1" \
  -H "Authorization: Bearer $TOKEN"
```

### Filtrar por Data

**Por data de início:**
```
GET /api/v1/solicitacoes/?data_inicio=2025-01-01
```

**Por data de fim:**
```
GET /api/v1/solicitacoes/?data_fim=2025-01-31
```

**Por período:**
```
GET /api/v1/solicitacoes/?data_inicio=2025-01-01&data_fim=2025-01-31
```

### Combinar Filtros

```bash
curl -X GET "http://localhost:8000/api/v1/solicitacoes/?status=pendente&tipo=casual&data_inicio=2025-01-01" \
  -H "Authorization: Bearer $TOKEN"
```

### Paginação

A API retorna 50 itens por página por padrão.

**Navegar páginas:**
```
GET /api/v1/solicitacoes/?page=2
GET /api/v1/solicitacoes/?page=3
```

**Alterar tamanho da página:**
```
GET /api/v1/solicitacoes/?page_size=10
```

**Resposta com Paginação:**

```json
{
  "count": 100,
  "next": "http://localhost:8000/api/v1/solicitacoes/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "ticket": "INC000001",
      ...
    },
    ...
  ]
}
```

---

## 4. Visualizar Detalhes de uma Solicitação

**URL:** `GET http://localhost:8000/api/v1/solicitacoes/{id}/`

**Exemplo:**

```bash
curl -X GET http://localhost:8000/api/v1/solicitacoes/1/ \
  -H "Authorization: Bearer $TOKEN"
```

**Resposta:**

```json
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
  "chave_pix": "joao@email.com",
  "cliente_empresa": "Empresa XYZ",
  "cnpj": "12.345.678/0001-90",
  "valor": 1500.00,
  "descricao": "Reembolso de despesas",
  "data_de_pagamento": "2025-02-15",
  "data_de_criacao": "2025-01-15",
  "prioridade": "media",
  "tipo": "casual",
  "valor_km": 200.00,
  "valor_pedagio": 50.00,
  "valor_hospedagem": 800.00,
  "valor_fluvial": 0.00,
  "valor_outros": 450.00,
  "valor_receita": 0.00,
  "itens_rota": [],
  "valor_total_detalhados": 1500.00
}
```

---

## 5. Atualizar uma Solicitação

### Atualização Parcial (PATCH) - Recomendado

Atualiza apenas os campos fornecidos.

**URL:** `PATCH http://localhost:8000/api/v1/solicitacoes/{id}/`

**Headers:**
```
Authorization: Bearer SEU_TOKEN_AQUI
Content-Type: application/json
```

**Exemplo: Atualizar apenas o valor**

```bash
curl -X PATCH http://localhost:8000/api/v1/solicitacoes/1/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "valor": 2000.00
  }'
```

**Exemplo: Atualizar múltiplos campos**

```bash
curl -X PATCH http://localhost:8000/api/v1/solicitacoes/1/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "valor": 2000.00,
    "prioridade": "alta",
    "descricao": "Descrição atualizada"
  }'
```

### Atualização Completa (PUT)

Atualiza TODOS os campos. Deve enviar todos os dados.

**URL:** `PUT http://localhost:8000/api/v1/solicitacoes/{id}/`

**Importante:** 
- Apenas solicitações com status **"pendente"** podem ser editadas
- Se tentar editar uma solicitação aprovada/recusada/concluída, receberá erro 400

---

## 6. Deletar uma Solicitação

**URL:** `DELETE http://localhost:8000/api/v1/solicitacoes/{id}/`

**Headers:**
```
Authorization: Bearer SEU_TOKEN_AQUI
```

**Exemplo:**

```bash
curl -X DELETE http://localhost:8000/api/v1/solicitacoes/1/ \
  -H "Authorization: Bearer $TOKEN"
```

**Importante:**
- Apenas solicitações com status **"recusado"** podem ser deletadas
- A resposta será 204 No Content (sem corpo)

---

## 7. Ver Estatísticas

**URL:** `GET http://localhost:8000/api/v1/solicitacoes/estatisticas/`

**Headers:**
```
Authorization: Bearer SEU_TOKEN_AQUI
```

**Exemplo:**

```bash
curl -X GET http://localhost:8000/api/v1/solicitacoes/estatisticas/ \
  -H "Authorization: Bearer $TOKEN"
```

**Resposta:**

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

---

## Exemplos Práticos

### Exemplo 1: Criar e Listar Solicitações

```bash
# 1. Obter token
TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "senha123"}' \
  | jq -r '.access')

# 2. Criar solicitação
curl -X POST http://localhost:8000/api/v1/solicitacoes/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Reembolso de Viagem",
    "nome_do_recebedor": "João Silva",
    "valor": 1500.00,
    "descricao": "Reembolso de despesas de viagem",
    "data_de_pagamento": "2025-02-15",
    "data_de_criacao": "2025-01-15",
    "tipo": "casual"
  }'

# 3. Listar solicitações pendentes
curl -X GET "http://localhost:8000/api/v1/solicitacoes/?status=pendente" \
  -H "Authorization: Bearer $TOKEN"
```

### Exemplo 2: Atualizar Valor de Solicitação

```bash
# Atualizar apenas o valor
curl -X PATCH http://localhost:8000/api/v1/solicitacoes/1/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"valor": 2000.00}'
```

### Exemplo 3: Filtrar por Período

```bash
# Buscar solicitações de janeiro de 2025
curl -X GET "http://localhost:8000/api/v1/solicitacoes/?data_inicio=2025-01-01&data_fim=2025-01-31" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Solução de Problemas

### Erro 401 Unauthorized

**Problema:** Token ausente ou inválido.

**Solução:**
1. Verifique se o token está sendo enviado no header `Authorization: Bearer TOKEN`
2. Verifique se o token não expirou (válido por 1 hora)
3. Renove o token usando o refresh token

```bash
# Renovar token
curl -X POST http://localhost:8000/api/v1/auth/token/refresh/ \
  -H "Content-Type: application/json" \
  -d '{"refresh": "seu_refresh_token"}'
```

### Erro 403 Forbidden

**Problema:** Usuário não tem permissão.

**Solução:**
1. Verifique se o usuário pertence ao grupo "Administrador"
2. Verifique se o usuário é superuser
3. Entre em contato com o administrador do sistema

### Erro 400 Bad Request

**Problema:** Dados inválidos ou campos obrigatórios faltando.

**Soluções comuns:**

1. **Data inválida:** Use formato YYYY-MM-DD
   ```json
   "data_de_pagamento": "2025-02-15"  ✅ Correto
   "data_de_pagamento": "15/02/2025"  ❌ Errado
   ```

2. **Valor negativo:** Valores devem ser >= 0
   ```json
   "valor": 1500.00  ✅ Correto
   "valor": -100     ❌ Errado
   ```

3. **Título muito longo:** Máximo 70 caracteres

4. **Campos obrigatórios faltando:**
   - `titulo`
   - `nome_do_recebedor` (para casual)
   - `valor`
   - `descricao`
   - `data_de_pagamento`
   - `data_de_criacao`
   - `tipo`

### Erro 404 Not Found

**Problema:** Solicitação não encontrada.

**Solução:**
1. Verifique se o ID existe
2. Verifique se você tem permissão para ver a solicitação

### Erro ao Editar (400 Bad Request)

**Problema:** Tentando editar solicitação que não está pendente.

**Mensagem de erro:**
```json
{
  "error": "Somente solicitações com status 'pendente' podem ser editadas.",
  "current_status": "aprovado"
}
```

**Solução:**
- Apenas solicitações com status "pendente" podem ser editadas

### Erro ao Deletar (400 Bad Request)

**Problema:** Tentando deletar solicitação que não está recusada.

**Mensagem de erro:**
```json
{
  "error": "Somente solicitações com status 'recusado' podem ser deletadas.",
  "current_status": "aprovado"
}
```

**Solução:**
- Apenas solicitações com status "recusado" podem ser deletadas

---

## Dicas Úteis

### 1. Formato de Datas

Sempre use o formato ISO 8601: `YYYY-MM-DD`

```json
"data_de_pagamento": "2025-02-15"  ✅
```

### 2. Formato de Valores

Use números decimais com ponto:

```json
"valor": 1500.00  ✅
"valor": 1500,00  ❌ (errado)
```

### 3. Prioridades

Valores válidos: `"baixa"`, `"media"`, `"alta"`

### 4. Tipos

Valores válidos: `"casual"`, `"em_rota"`

### 5. Status

Valores válidos: `"pendente"`, `"aprovado"`, `"recusado"`, `"concluido"`

### 6. Campos Automáticos

Não precisa fornecer (são gerados automaticamente):
- `ticket`: Gerado automaticamente
- `nome_solicitante`: Usa o usuário autenticado
- `data_de_criacao`: Usa a data atual (se não fornecido)
- `tempo_criacao`: Usa o horário atual (se não fornecido)
- `status`: Padrão é "pendente"

---

## Usando com Postman

### Configuração Inicial

1. **Criar Nova Requisição** para obter token:
   - Método: `POST`
   - URL: `http://localhost:8000/api/v1/auth/token/`
   - Headers: `Content-Type: application/json`
   - Body (raw JSON):
     ```json
     {
       "username": "admin",
       "password": "sua_senha"
     }
     ```

2. **Salvar o Token:**
   - Copie o valor de `access` da resposta
   - Crie uma variável de ambiente `token` no Postman

3. **Usar o Token:**
   - Em todas as requisições, adicione header:
     - Key: `Authorization`
     - Value: `Bearer {{token}}`

### Coleção Postman

Você pode criar uma coleção com todas as requisições:
- Obter Token
- Criar Solicitação
- Listar Solicitações
- Visualizar Detalhes
- Atualizar Solicitação
- Deletar Solicitação
- Ver Estatísticas

---

## Usando com Python

### Exemplo Completo

```python
import requests

# Base URL
BASE_URL = "http://localhost:8000/api/v1"

# 1. Obter token
response = requests.post(
    f"{BASE_URL}/auth/token/",
    json={
        "username": "admin",
        "password": "senha123"
    }
)
token = response.json()["access"]

# Headers para próximas requisições
headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

# 2. Criar solicitação
nova_solicitacao = {
    "titulo": "Reembolso de Viagem",
    "nome_do_recebedor": "João Silva",
    "valor": 1500.00,
    "descricao": "Reembolso de despesas",
    "data_de_pagamento": "2025-02-15",
    "data_de_criacao": "2025-01-15",
    "tipo": "casual"
}

response = requests.post(
    f"{BASE_URL}/solicitacoes/",
    json=nova_solicitacao,
    headers=headers
)
solicitacao_criada = response.json()
print(f"Solicitação criada: {solicitacao_criada['ticket']}")

# 3. Listar solicitações pendentes
response = requests.get(
    f"{BASE_URL}/solicitacoes/?status=pendente",
    headers=headers
)
solicitacoes = response.json()
print(f"Total de pendentes: {solicitacoes['count']}")

# 4. Atualizar solicitação
response = requests.patch(
    f"{BASE_URL}/solicitacoes/{solicitacao_criada['id']}/",
    json={"valor": 2000.00},
    headers=headers
)
print("Solicitação atualizada!")
```

---

## Usando com JavaScript/Node.js

### Exemplo Completo

```javascript
const axios = require('axios');

const BASE_URL = 'http://localhost:8000/api/v1';

async function usarAPI() {
  try {
    // 1. Obter token
    const tokenResponse = await axios.post(`${BASE_URL}/auth/token/`, {
      username: 'admin',
      password: 'senha123'
    });
    const token = tokenResponse.data.access;

    // Headers
    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // 2. Criar solicitação
    const novaSolicitacao = {
      titulo: 'Reembolso de Viagem',
      nome_do_recebedor: 'João Silva',
      valor: 1500.00,
      descricao: 'Reembolso de despesas',
      data_de_pagamento: '2025-02-15',
      data_de_criacao: '2025-01-15',
      tipo: 'casual'
    };

    const criarResponse = await axios.post(
      `${BASE_URL}/solicitacoes/`,
      novaSolicitacao,
      { headers }
    );
    console.log('Solicitação criada:', criarResponse.data.ticket);

    // 3. Listar pendentes
    const listarResponse = await axios.get(
      `${BASE_URL}/solicitacoes/?status=pendente`,
      { headers }
    );
    console.log('Total de pendentes:', listarResponse.data.count);

  } catch (error) {
    console.error('Erro:', error.response?.data || error.message);
  }
}

usarAPI();
```

---

## Suporte

Para mais informações, consulte:
- **Documentação Completa:** `API_DOCUMENTATION.md`
- **Resumo da Implementação:** `API_IMPLEMENTATION_SUMMARY.md`

Se encontrar problemas, verifique:
1. Se o servidor está rodando
2. Se as dependências estão instaladas
3. Se o usuário tem permissão de Administrador
4. Se o token não expirou
5. Se os dados estão no formato correto









Este guia apresenta instruções práticas para usar a API REST de Solicitações Financeiras.

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Autenticação - Obter Token](#1-autenticação---obter-token)
3. [Criar uma Solicitação](#2-criar-uma-solicitação)
4. [Listar Solicitações](#3-listar-solicitações)
5. [Visualizar Detalhes](#4-visualizar-detalhes-de-uma-solicitação)
6. [Atualizar Solicitação](#5-atualizar-uma-solicitação)
7. [Deletar Solicitação](#6-deletar-uma-solicitação)
8. [Ver Estatísticas](#7-ver-estatísticas)
9. [Exemplos Práticos](#exemplos-práticos)
10. [Solução de Problemas](#solução-de-problemas)

---

## Pré-requisitos

### 1. Instalar Dependências

Antes de usar a API, certifique-se de ter instalado as dependências:

```bash
cd /home/gean/Documents/projeto_finança/attend_finence
pip install -r requirements.txt
```

### 2. Verificar Servidor em Execução

Certifique-se de que o servidor Django está rodando:

```bash
python3 manage.py runserver
```

A API estará disponível em: `http://localhost:8000/api/v1/`

### 3. Credenciais de Acesso

Você precisa de:
- **Usuário**: Uma conta de usuário do sistema
- **Grupo**: O usuário deve estar no grupo **"Administrador"** ou ser **superuser**
- **Senha**: A senha do usuário

---

## 1. Autenticação - Obter Token

Antes de fazer qualquer requisição, você precisa obter um token de acesso.

### Passo 1: Fazer Login

**URL:** `POST http://localhost:8000/api/v1/auth/token/`

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

### Exemplo com cURL:

```bash
curl -X POST http://localhost:8000/api/v1/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "senha123"
  }'
```

### Resposta de Sucesso:

```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzA1MzE2MDAwLCJpYXQiOjE3MDUzMTI0MDAsImp0aSI6IjEyMzQ1Njc4IiwidXNlcl9pZCI6MX0.abc123def456",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTcwNTM5ODgwMCwiaWF0IjoxNzA1MzEyNDAwLCJqdGkiOiIxMjM0NTY3OCIsInVzZXJfaWQiOjF9.xyz789"
}
```

### Guardar o Token

Salve o token `access` para usar nas próximas requisições:

```bash
# No Linux/Mac, salve em uma variável:
export TOKEN="eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."

# No Windows PowerShell:
$TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
```

### Renovar Token (quando expirar)

Se o token expirar (válido por 1 hora), use o `refresh` para obter um novo:

**URL:** `POST http://localhost:8000/api/v1/auth/token/refresh/`

```bash
curl -X POST http://localhost:8000/api/v1/auth/token/refresh/ \
  -H "Content-Type: application/json" \
  -d '{
    "refresh": "seu_refresh_token_aqui"
  }'
```

---

## 2. Criar uma Solicitação

### Solicitação Casual (Individual)

**URL:** `POST http://localhost:8000/api/v1/solicitacoes/`

**Headers:**
```
Authorization: Bearer SEU_TOKEN_AQUI
Content-Type: application/json
```

**Body Completo:**

```json
{
  "titulo": "Solicitação de Reembolso - Viagem",
  "nome_do_recebedor": "João Silva",
  "chave_pix": "joao.silva@email.com",
  "cliente_empresa": "Empresa XYZ",
  "cnpj": "12.345.678/0001-90",
  "valor": 1500.00,
  "descricao": "Reembolso de despesas de viagem para reunião com cliente",
  "data_de_pagamento": "2025-02-15",
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

**Body Mínimo (campos obrigatórios):**

```json
{
  "titulo": "Solicitação de Reembolso",
  "nome_do_recebedor": "João Silva",
  "valor": 1500.00,
  "descricao": "Reembolso de despesas",
  "data_de_pagamento": "2025-02-15",
  "data_de_criacao": "2025-01-15",
  "tipo": "casual"
}
```

**Exemplo com cURL:**

```bash
curl -X POST http://localhost:8000/api/v1/solicitacoes/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Solicitação de Reembolso",
    "nome_do_recebedor": "João Silva",
    "valor": 1500.00,
    "descricao": "Reembolso de despesas",
    "data_de_pagamento": "2025-02-15",
    "data_de_criacao": "2025-01-15",
    "tipo": "casual"
  }'
```

### Solicitação Em Rota (com múltiplos itens)

```json
{
  "titulo": "Solicitação Em Rota - Múltiplos Pagamentos",
  "descricao": "Pagamentos agrupados de múltiplos serviços",
  "data_de_pagamento": "2025-02-15",
  "data_de_criacao": "2025-01-15",
  "prioridade": "alta",
  "tipo": "em_rota",
  "valor_em_rota": 500.00,
  "descricao_em_rota": "Pagamento EM ROTA para serviços diversos",
  "valor_receita": 1000.00,
  "itens_rota": [
    {
      "ticket_item": "INC000001",
      "valor": 300.00,
      "recebedor": "Maria Santos",
      "chave_pix": "maria@email.com",
      "cliente_empresa": "Empresa ABC",
      "cnpj": "98.765.432/0001-10",
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

**Resposta de Sucesso (201 Created):**

```json
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
  ...
}
```

---

## 3. Listar Solicitações

### Listar Todas

**URL:** `GET http://localhost:8000/api/v1/solicitacoes/`

**Headers:**
```
Authorization: Bearer SEU_TOKEN_AQUI
```

**Exemplo com cURL:**

```bash
curl -X GET http://localhost:8000/api/v1/solicitacoes/ \
  -H "Authorization: Bearer $TOKEN"
```

### Filtrar por Status

**URL:** `GET http://localhost:8000/api/v1/solicitacoes/?status=pendente`

```bash
curl -X GET "http://localhost:8000/api/v1/solicitacoes/?status=pendente" \
  -H "Authorization: Bearer $TOKEN"
```

**Status disponíveis:**
- `pendente`
- `aprovado`
- `recusado`
- `concluido`

### Filtrar por Tipo

**URL:** `GET http://localhost:8000/api/v1/solicitacoes/?tipo=casual`

```bash
curl -X GET "http://localhost:8000/api/v1/solicitacoes/?tipo=casual" \
  -H "Authorization: Bearer $TOKEN"
```

**Tipos disponíveis:**
- `casual`
- `em_rota`

### Filtrar por Solicitante

**URL:** `GET http://localhost:8000/api/v1/solicitacoes/?solicitante_id=1`

```bash
curl -X GET "http://localhost:8000/api/v1/solicitacoes/?solicitante_id=1" \
  -H "Authorization: Bearer $TOKEN"
```

### Filtrar por Data

**Por data de início:**
```
GET /api/v1/solicitacoes/?data_inicio=2025-01-01
```

**Por data de fim:**
```
GET /api/v1/solicitacoes/?data_fim=2025-01-31
```

**Por período:**
```
GET /api/v1/solicitacoes/?data_inicio=2025-01-01&data_fim=2025-01-31
```

### Combinar Filtros

```bash
curl -X GET "http://localhost:8000/api/v1/solicitacoes/?status=pendente&tipo=casual&data_inicio=2025-01-01" \
  -H "Authorization: Bearer $TOKEN"
```

### Paginação

A API retorna 50 itens por página por padrão.

**Navegar páginas:**
```
GET /api/v1/solicitacoes/?page=2
GET /api/v1/solicitacoes/?page=3
```

**Alterar tamanho da página:**
```
GET /api/v1/solicitacoes/?page_size=10
```

**Resposta com Paginação:**

```json
{
  "count": 100,
  "next": "http://localhost:8000/api/v1/solicitacoes/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "ticket": "INC000001",
      ...
    },
    ...
  ]
}
```

---

## 4. Visualizar Detalhes de uma Solicitação

**URL:** `GET http://localhost:8000/api/v1/solicitacoes/{id}/`

**Exemplo:**

```bash
curl -X GET http://localhost:8000/api/v1/solicitacoes/1/ \
  -H "Authorization: Bearer $TOKEN"
```

**Resposta:**

```json
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
  "chave_pix": "joao@email.com",
  "cliente_empresa": "Empresa XYZ",
  "cnpj": "12.345.678/0001-90",
  "valor": 1500.00,
  "descricao": "Reembolso de despesas",
  "data_de_pagamento": "2025-02-15",
  "data_de_criacao": "2025-01-15",
  "prioridade": "media",
  "tipo": "casual",
  "valor_km": 200.00,
  "valor_pedagio": 50.00,
  "valor_hospedagem": 800.00,
  "valor_fluvial": 0.00,
  "valor_outros": 450.00,
  "valor_receita": 0.00,
  "itens_rota": [],
  "valor_total_detalhados": 1500.00
}
```

---

## 5. Atualizar uma Solicitação

### Atualização Parcial (PATCH) - Recomendado

Atualiza apenas os campos fornecidos.

**URL:** `PATCH http://localhost:8000/api/v1/solicitacoes/{id}/`

**Headers:**
```
Authorization: Bearer SEU_TOKEN_AQUI
Content-Type: application/json
```

**Exemplo: Atualizar apenas o valor**

```bash
curl -X PATCH http://localhost:8000/api/v1/solicitacoes/1/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "valor": 2000.00
  }'
```

**Exemplo: Atualizar múltiplos campos**

```bash
curl -X PATCH http://localhost:8000/api/v1/solicitacoes/1/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "valor": 2000.00,
    "prioridade": "alta",
    "descricao": "Descrição atualizada"
  }'
```

### Atualização Completa (PUT)

Atualiza TODOS os campos. Deve enviar todos os dados.

**URL:** `PUT http://localhost:8000/api/v1/solicitacoes/{id}/`

**Importante:** 
- Apenas solicitações com status **"pendente"** podem ser editadas
- Se tentar editar uma solicitação aprovada/recusada/concluída, receberá erro 400

---

## 6. Deletar uma Solicitação

**URL:** `DELETE http://localhost:8000/api/v1/solicitacoes/{id}/`

**Headers:**
```
Authorization: Bearer SEU_TOKEN_AQUI
```

**Exemplo:**

```bash
curl -X DELETE http://localhost:8000/api/v1/solicitacoes/1/ \
  -H "Authorization: Bearer $TOKEN"
```

**Importante:**
- Apenas solicitações com status **"recusado"** podem ser deletadas
- A resposta será 204 No Content (sem corpo)

---

## 7. Ver Estatísticas

**URL:** `GET http://localhost:8000/api/v1/solicitacoes/estatisticas/`

**Headers:**
```
Authorization: Bearer SEU_TOKEN_AQUI
```

**Exemplo:**

```bash
curl -X GET http://localhost:8000/api/v1/solicitacoes/estatisticas/ \
  -H "Authorization: Bearer $TOKEN"
```

**Resposta:**

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

---

## Exemplos Práticos

### Exemplo 1: Criar e Listar Solicitações

```bash
# 1. Obter token
TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "senha123"}' \
  | jq -r '.access')

# 2. Criar solicitação
curl -X POST http://localhost:8000/api/v1/solicitacoes/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Reembolso de Viagem",
    "nome_do_recebedor": "João Silva",
    "valor": 1500.00,
    "descricao": "Reembolso de despesas de viagem",
    "data_de_pagamento": "2025-02-15",
    "data_de_criacao": "2025-01-15",
    "tipo": "casual"
  }'

# 3. Listar solicitações pendentes
curl -X GET "http://localhost:8000/api/v1/solicitacoes/?status=pendente" \
  -H "Authorization: Bearer $TOKEN"
```

### Exemplo 2: Atualizar Valor de Solicitação

```bash
# Atualizar apenas o valor
curl -X PATCH http://localhost:8000/api/v1/solicitacoes/1/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"valor": 2000.00}'
```

### Exemplo 3: Filtrar por Período

```bash
# Buscar solicitações de janeiro de 2025
curl -X GET "http://localhost:8000/api/v1/solicitacoes/?data_inicio=2025-01-01&data_fim=2025-01-31" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Solução de Problemas

### Erro 401 Unauthorized

**Problema:** Token ausente ou inválido.

**Solução:**
1. Verifique se o token está sendo enviado no header `Authorization: Bearer TOKEN`
2. Verifique se o token não expirou (válido por 1 hora)
3. Renove o token usando o refresh token

```bash
# Renovar token
curl -X POST http://localhost:8000/api/v1/auth/token/refresh/ \
  -H "Content-Type: application/json" \
  -d '{"refresh": "seu_refresh_token"}'
```

### Erro 403 Forbidden

**Problema:** Usuário não tem permissão.

**Solução:**
1. Verifique se o usuário pertence ao grupo "Administrador"
2. Verifique se o usuário é superuser
3. Entre em contato com o administrador do sistema

### Erro 400 Bad Request

**Problema:** Dados inválidos ou campos obrigatórios faltando.

**Soluções comuns:**

1. **Data inválida:** Use formato YYYY-MM-DD
   ```json
   "data_de_pagamento": "2025-02-15"  ✅ Correto
   "data_de_pagamento": "15/02/2025"  ❌ Errado
   ```

2. **Valor negativo:** Valores devem ser >= 0
   ```json
   "valor": 1500.00  ✅ Correto
   "valor": -100     ❌ Errado
   ```

3. **Título muito longo:** Máximo 70 caracteres

4. **Campos obrigatórios faltando:**
   - `titulo`
   - `nome_do_recebedor` (para casual)
   - `valor`
   - `descricao`
   - `data_de_pagamento`
   - `data_de_criacao`
   - `tipo`

### Erro 404 Not Found

**Problema:** Solicitação não encontrada.

**Solução:**
1. Verifique se o ID existe
2. Verifique se você tem permissão para ver a solicitação

### Erro ao Editar (400 Bad Request)

**Problema:** Tentando editar solicitação que não está pendente.

**Mensagem de erro:**
```json
{
  "error": "Somente solicitações com status 'pendente' podem ser editadas.",
  "current_status": "aprovado"
}
```

**Solução:**
- Apenas solicitações com status "pendente" podem ser editadas

### Erro ao Deletar (400 Bad Request)

**Problema:** Tentando deletar solicitação que não está recusada.

**Mensagem de erro:**
```json
{
  "error": "Somente solicitações com status 'recusado' podem ser deletadas.",
  "current_status": "aprovado"
}
```

**Solução:**
- Apenas solicitações com status "recusado" podem ser deletadas

---

## Dicas Úteis

### 1. Formato de Datas

Sempre use o formato ISO 8601: `YYYY-MM-DD`

```json
"data_de_pagamento": "2025-02-15"  ✅
```

### 2. Formato de Valores

Use números decimais com ponto:

```json
"valor": 1500.00  ✅
"valor": 1500,00  ❌ (errado)
```

### 3. Prioridades

Valores válidos: `"baixa"`, `"media"`, `"alta"`

### 4. Tipos

Valores válidos: `"casual"`, `"em_rota"`

### 5. Status

Valores válidos: `"pendente"`, `"aprovado"`, `"recusado"`, `"concluido"`

### 6. Campos Automáticos

Não precisa fornecer (são gerados automaticamente):
- `ticket`: Gerado automaticamente
- `nome_solicitante`: Usa o usuário autenticado
- `data_de_criacao`: Usa a data atual (se não fornecido)
- `tempo_criacao`: Usa o horário atual (se não fornecido)
- `status`: Padrão é "pendente"

---

## Usando com Postman

### Configuração Inicial

1. **Criar Nova Requisição** para obter token:
   - Método: `POST`
   - URL: `http://localhost:8000/api/v1/auth/token/`
   - Headers: `Content-Type: application/json`
   - Body (raw JSON):
     ```json
     {
       "username": "admin",
       "password": "sua_senha"
     }
     ```

2. **Salvar o Token:**
   - Copie o valor de `access` da resposta
   - Crie uma variável de ambiente `token` no Postman

3. **Usar o Token:**
   - Em todas as requisições, adicione header:
     - Key: `Authorization`
     - Value: `Bearer {{token}}`

### Coleção Postman

Você pode criar uma coleção com todas as requisições:
- Obter Token
- Criar Solicitação
- Listar Solicitações
- Visualizar Detalhes
- Atualizar Solicitação
- Deletar Solicitação
- Ver Estatísticas

---

## Usando com Python

### Exemplo Completo

```python
import requests

# Base URL
BASE_URL = "http://localhost:8000/api/v1"

# 1. Obter token
response = requests.post(
    f"{BASE_URL}/auth/token/",
    json={
        "username": "admin",
        "password": "senha123"
    }
)
token = response.json()["access"]

# Headers para próximas requisições
headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

# 2. Criar solicitação
nova_solicitacao = {
    "titulo": "Reembolso de Viagem",
    "nome_do_recebedor": "João Silva",
    "valor": 1500.00,
    "descricao": "Reembolso de despesas",
    "data_de_pagamento": "2025-02-15",
    "data_de_criacao": "2025-01-15",
    "tipo": "casual"
}

response = requests.post(
    f"{BASE_URL}/solicitacoes/",
    json=nova_solicitacao,
    headers=headers
)
solicitacao_criada = response.json()
print(f"Solicitação criada: {solicitacao_criada['ticket']}")

# 3. Listar solicitações pendentes
response = requests.get(
    f"{BASE_URL}/solicitacoes/?status=pendente",
    headers=headers
)
solicitacoes = response.json()
print(f"Total de pendentes: {solicitacoes['count']}")

# 4. Atualizar solicitação
response = requests.patch(
    f"{BASE_URL}/solicitacoes/{solicitacao_criada['id']}/",
    json={"valor": 2000.00},
    headers=headers
)
print("Solicitação atualizada!")
```

---

## Usando com JavaScript/Node.js

### Exemplo Completo

```javascript
const axios = require('axios');

const BASE_URL = 'http://localhost:8000/api/v1';

async function usarAPI() {
  try {
    // 1. Obter token
    const tokenResponse = await axios.post(`${BASE_URL}/auth/token/`, {
      username: 'admin',
      password: 'senha123'
    });
    const token = tokenResponse.data.access;

    // Headers
    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // 2. Criar solicitação
    const novaSolicitacao = {
      titulo: 'Reembolso de Viagem',
      nome_do_recebedor: 'João Silva',
      valor: 1500.00,
      descricao: 'Reembolso de despesas',
      data_de_pagamento: '2025-02-15',
      data_de_criacao: '2025-01-15',
      tipo: 'casual'
    };

    const criarResponse = await axios.post(
      `${BASE_URL}/solicitacoes/`,
      novaSolicitacao,
      { headers }
    );
    console.log('Solicitação criada:', criarResponse.data.ticket);

    // 3. Listar pendentes
    const listarResponse = await axios.get(
      `${BASE_URL}/solicitacoes/?status=pendente`,
      { headers }
    );
    console.log('Total de pendentes:', listarResponse.data.count);

  } catch (error) {
    console.error('Erro:', error.response?.data || error.message);
  }
}

usarAPI();
```

---

## Suporte

Para mais informações, consulte:
- **Documentação Completa:** `API_DOCUMENTATION.md`
- **Resumo da Implementação:** `API_IMPLEMENTATION_SUMMARY.md`

Se encontrar problemas, verifique:
1. Se o servidor está rodando
2. Se as dependências estão instaladas
3. Se o usuário tem permissão de Administrador
4. Se o token não expirou
5. Se os dados estão no formato correto









