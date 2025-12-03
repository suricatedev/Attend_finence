# 📚 Documentação Completa da API REST - Solicitações Financeiras

Este é o documento único e completo com todas as informações sobre como usar a API REST do sistema de Solicitações Financeiras.

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Início Rápido (5 minutos)](#início-rápido-5-minutos)
3. [Pré-requisitos](#pré-requisitos)
4. [Autenticação](#autenticação)
5. [Endpoints da API](#endpoints-da-api)
   - [Criar Solicitação](#criar-solicitação)
   - [Listar Solicitações](#listar-solicitações)
   - [Visualizar Detalhes](#visualizar-detalhes)
   - [Atualizar Solicitação](#atualizar-solicitação)
   - [Deletar Solicitação](#deletar-solicitação)
   - [Estatísticas](#estatísticas)
6. [Exemplos Práticos](#exemplos-práticos)
7. [Solução de Problemas](#solução-de-problemas)
8. [Referência Técnica](#referência-técnica)
9. [Resumo da Implementação](#resumo-da-implementação)

---

## Visão Geral

A API REST permite criar e editar solicitações financeiras com autenticação por token JWT. O acesso é restrito apenas para usuários do grupo **Administrador**.

### Características Principais

- ✅ Autenticação JWT (JSON Web Token)
- ✅ Acesso restrito a Administradores
- ✅ CRUD completo de solicitações
- ✅ Suporte a solicitações Casual e Em Rota
- ✅ Filtros avançados e paginação
- ✅ Validações robustas de dados
- ✅ Documentação completa

### Base URL

```
http://localhost:8000/api/v1/
```

---

## Início Rápido (5 minutos)

### 1. Instalar Dependências

```bash
cd /home/gean/Documents/projeto_finança/attend_finence
pip install -r requirements.txt
```

### 2. Iniciar Servidor

```bash
python3 manage.py runserver
```

### 3. Obter Token

```bash
curl -X POST http://localhost:8000/api/v1/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "sua_senha"}'
```

**Salve o token:**
```bash
export TOKEN="seu_token_aqui"
```

### 4. Criar Solicitação

```bash
curl -X POST http://localhost:8000/api/v1/solicitacoes/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Reembolso de Viagem",
    "nome_do_recebedor": "João Silva",
    "valor": 1500.00,
    "descricao": "Reembolso de despesas",
    "data_de_pagamento": "2025-02-15",
    "data_de_criacao": "2025-01-15",
    "tipo": "casual"
  }'
```

### 5. Listar Solicitações

```bash
curl -X GET "http://localhost:8000/api/v1/solicitacoes/?status=pendente" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Pré-requisitos

### 1. Instalar Dependências

Antes de usar a API, certifique-se de ter instalado as dependências:

```bash
cd /home/gean/Documents/projeto_finança/attend_finence
pip install -r requirements.txt
```

As dependências incluem:
- `djangorestframework>=3.15.0`
- `djangorestframework-simplejwt>=5.3.0`

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

## Autenticação

### 1. Obter Token de Acesso

Antes de fazer qualquer requisição, você precisa obter um token de acesso.

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

**Exemplo com cURL:**

```bash
curl -X POST http://localhost:8000/api/v1/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "senha123"
  }'
```

**Resposta de Sucesso (200 OK):**

```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

### 2. Guardar o Token

Salve o token `access` para usar nas próximas requisições:

```bash
# No Linux/Mac, salve em uma variável:
export TOKEN="eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."

# No Windows PowerShell:
$TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
```

### 3. Usar Token nas Requisições

Todas as requisições subsequentes devem incluir o token no header:

```
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

**Exemplo:**

```bash
curl -X GET http://localhost:8000/api/v1/solicitacoes/ \
  -H "Authorization: Bearer $TOKEN"
```

### 4. Renovar Token (quando expirar)

Os tokens têm validade limitada:
- **Access token**: Válido por **1 hora**
- **Refresh token**: Válido por **1 dia**

Se o token expirar, use o `refresh` para obter um novo:

**Endpoint:** `POST /api/v1/auth/token/refresh/`

```bash
curl -X POST http://localhost:8000/api/v1/auth/token/refresh/ \
  -H "Content-Type: application/json" \
  -d '{
    "refresh": "seu_refresh_token_aqui"
  }'
```

**Resposta:**

```json
{
  "access": "novo_token_aqui"
}
```

---

## Endpoints da API

Todos os endpoints da API estão disponíveis em:

**Base URL:** `http://localhost:8000/api/v1/`

---

## Criar Solicitação

**Endpoint:** `POST /api/v1/solicitacoes/`

**Headers:**
```
Authorization: Bearer SEU_TOKEN_AQUI
Content-Type: application/json
```

### Solicitação Casual (Individual)

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
  "data_de_criacao": "2025-01-15",
  "prioridade": "baixa",
  "tipo": "casual"
}
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

**Nota:** Solicitações Em Rota devem ter pelo menos um item em `itens_rota`.

### Campos Automáticos

Os seguintes campos são gerados automaticamente se não fornecidos:

- **`ticket`**: Gerado automaticamente (formato: `INC000001` para casual, `ROTA-001` para em_rota)
- **`nome_solicitante`**: Usa o usuário autenticado
- **`data_de_criacao`**: Usa a data atual se não fornecido
- **`tempo_criacao`**: Usa o horário atual se não fornecido
- **`status`**: Padrão é `"pendente"`

---

## Listar Solicitações

**Endpoint:** `GET /api/v1/solicitacoes/`

**Headers:**
```
Authorization: Bearer SEU_TOKEN_AQUI
```

### Listar Todas

```bash
curl -X GET http://localhost:8000/api/v1/solicitacoes/ \
  -H "Authorization: Bearer $TOKEN"
```

### Filtrar por Status

**URL:** `GET /api/v1/solicitacoes/?status=pendente`

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

**URL:** `GET /api/v1/solicitacoes/?tipo=casual`

```bash
curl -X GET "http://localhost:8000/api/v1/solicitacoes/?tipo=casual" \
  -H "Authorization: Bearer $TOKEN"
```

**Tipos disponíveis:**
- `casual`
- `em_rota`

### Filtrar por Solicitante

**URL:** `GET /api/v1/solicitacoes/?solicitante_id=1`

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

**Exemplo:**

```bash
curl -X GET "http://localhost:8000/api/v1/solicitacoes/?data_inicio=2025-01-01&data_fim=2025-01-31" \
  -H "Authorization: Bearer $TOKEN"
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
      "status": "pendente",
      "titulo": "Solicitação de Reembolso",
      ...
    },
    ...
  ]
}
```

---

## Visualizar Detalhes

**Endpoint:** `GET /api/v1/solicitacoes/{id}/`

**Exemplo:**

```bash
curl -X GET http://localhost:8000/api/v1/solicitacoes/1/ \
  -H "Authorization: Bearer $TOKEN"
```

**Resposta (200 OK):**

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
  "valor_total_detalhados": 1500.00,
  "anexo_url": null
}
```

---

## Atualizar Solicitação

### Atualização Parcial (PATCH) - Recomendado

Atualiza apenas os campos fornecidos.

**Endpoint:** `PATCH /api/v1/solicitacoes/{id}/`

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

**Endpoint:** `PUT /api/v1/solicitacoes/{id}/`

**⚠️ Importante:** 
- Apenas solicitações com status **"pendente"** podem ser editadas
- Se tentar editar uma solicitação aprovada/recusada/concluída, receberá erro 400

**Resposta de Erro (400 Bad Request):**

```json
{
  "error": "Somente solicitações com status 'pendente' podem ser editadas.",
  "current_status": "aprovado"
}
```

---

## Deletar Solicitação

**Endpoint:** `DELETE /api/v1/solicitacoes/{id}/`

**Headers:**
```
Authorization: Bearer SEU_TOKEN_AQUI
```

**Exemplo:**

```bash
curl -X DELETE http://localhost:8000/api/v1/solicitacoes/1/ \
  -H "Authorization: Bearer $TOKEN"
```

**⚠️ Importante:**
- Apenas solicitações com status **"recusado"** podem ser deletadas
- A resposta será 204 No Content (sem corpo)

**Resposta de Erro (400 Bad Request):**

```json
{
  "error": "Somente solicitações com status 'recusado' podem ser deletadas.",
  "current_status": "aprovado"
}
```

---

## Estatísticas

**Endpoint:** `GET /api/v1/solicitacoes/estatisticas/`

**Headers:**
```
Authorization: Bearer SEU_TOKEN_AQUI
```

**Exemplo:**

```bash
curl -X GET http://localhost:8000/api/v1/solicitacoes/estatisticas/ \
  -H "Authorization: Bearer $TOKEN"
```

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

### Exemplo com Python

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

### Exemplo com JavaScript/Node.js

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

## Solução de Problemas

### Erro 401 Unauthorized

**Problema:** Token ausente ou inválido.

**Soluções:**
1. Verifique se o token está sendo enviado no header `Authorization: Bearer TOKEN`
2. Verifique se o token não expirou (válido por 1 hora)
3. Renove o token usando o refresh token:

```bash
curl -X POST http://localhost:8000/api/v1/auth/token/refresh/ \
  -H "Content-Type: application/json" \
  -d '{"refresh": "seu_refresh_token"}'
```

### Erro 403 Forbidden

**Problema:** Usuário não tem permissão.

**Soluções:**
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

5. **Solicitação Em Rota sem itens:**
   - Deve ter pelo menos um item em `itens_rota`

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

## Referência Técnica

### Códigos de Status HTTP

| Código | Significado | Quando Ocorre |
|--------|-------------|---------------|
| 200 | OK | Requisição bem-sucedida |
| 201 | Created | Recurso criado com sucesso |
| 204 | No Content | Recurso deletado com sucesso |
| 400 | Bad Request | Erro de validação ou requisição inválida |
| 401 | Unauthorized | Token ausente ou inválido |
| 403 | Forbidden | Usuário não tem permissão |
| 404 | Not Found | Recurso não encontrado |
| 500 | Internal Server Error | Erro interno do servidor |

### Validações

#### Campos Obrigatórios

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

#### Campos Opcionais

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

### Formatos de Dados

#### Datas
- Formato: `YYYY-MM-DD`
- Exemplo: `2025-02-15`

#### Valores Monetários
- Formato: Número decimal com ponto
- Exemplo: `1500.00`

#### Prioridades
- Valores válidos: `"baixa"`, `"media"`, `"alta"`

#### Tipos
- Valores válidos: `"casual"`, `"em_rota"`

#### Status
- Valores válidos: `"pendente"`, `"aprovado"`, `"recusado"`, `"concluido"`

### Geração Automática de Tickets

- **Casuais**: Formato `INC000001`, `INC000002`, etc.
- **Em Rota**: Formato `ROTA-001`, `ROTA-002`, etc.
- Se não fornecido, é gerado automaticamente

### Permissões

- **Acesso:** Apenas usuários do grupo "Administrador" ou superusuários
- **Edição:** Apenas solicitações com status "pendente" podem ser editadas
- **Exclusão:** Apenas solicitações com status "recusado" podem ser deletadas

---

## Resumo da Implementação

### O que foi implementado

1. **Dependências**
   - Django REST Framework
   - djangorestframework-simplejwt

2. **Configurações**
   - REST Framework configurado no settings.py
   - Autenticação JWT configurada
   - Permissões e paginação definidas

3. **Arquivos Criados**
   - `solicitacoes/serializers.py` - Serializadores para os modelos
   - `solicitacoes/permissions.py` - Permissão customizada para Administradores
   - `solicitacoes/api_views.py` - ViewSet com CRUD completo
   - `solicitacoes/api_urls.py` - URLs da API
   - Rotas adicionadas em `attend_finence/urls.py`

4. **Segurança Implementada**
   - Autenticação JWT obrigatória
   - Permissão de Administrador
   - Validação de edição (apenas pendentes)
   - Validação de exclusão (apenas recusadas)
   - Validações robustas de dados

### Estrutura de Arquivos

```
attend_finence/
├── solicitacoes/
│   ├── serializers.py       # Serializadores
│   ├── permissions.py       # Permissões customizadas
│   ├── api_views.py         # ViewSet da API
│   └── api_urls.py          # URLs da API
├── attend_finence/
│   ├── settings.py          # Configurações REST Framework
│   └── urls.py              # Rotas da API
└── requirements.txt         # Dependências
```

### Endpoints Disponíveis

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/v1/auth/token/` | Obter token JWT |
| POST | `/api/v1/auth/token/refresh/` | Renovar token |
| GET | `/api/v1/solicitacoes/` | Listar solicitações |
| POST | `/api/v1/solicitacoes/` | Criar solicitação |
| GET | `/api/v1/solicitacoes/{id}/` | Ver detalhes |
| PUT | `/api/v1/solicitacoes/{id}/` | Atualizar completo |
| PATCH | `/api/v1/solicitacoes/{id}/` | Atualizar parcial |
| DELETE | `/api/v1/solicitacoes/{id}/` | Deletar |
| GET | `/api/v1/solicitacoes/estatisticas/` | Ver estatísticas |

### Funcionalidades Principais

- ✅ CRUD completo de solicitações
- ✅ Suporte a solicitações Casual e Em Rota
- ✅ Filtros avançados (status, tipo, solicitante, data)
- ✅ Paginação automática
- ✅ Validações robustas
- ✅ Geração automática de tickets
- ✅ Estatísticas gerais
- ✅ Suporte a anexos

### Próximos Passos

1. Instalar dependências:
   ```bash
   pip install -r requirements.txt
   ```

2. Testar a API usando os exemplos deste documento

3. Integrar com sua aplicação frontend ou mobile

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

### 3. Campos Automáticos

Não precisa fornecer (são gerados automaticamente):
- `ticket`: Gerado automaticamente
- `nome_solicitante`: Usa o usuário autenticado
- `data_de_criacao`: Usa a data atual (se não fornecido)
- `tempo_criacao`: Usa o horário atual (se não fornecido)
- `status`: Padrão é "pendente"

### 4. Tokens JWT

- Access token válido por **1 hora**
- Refresh token válido por **1 dia**
- Use o refresh token para renovar o access token

### 5. Usando com Postman

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

---

## Notas Finais

### Importante Lembrar

- ⏰ Tokens expiram em 1 hora - use refresh token para renovar
- 👥 Apenas usuários Administradores podem usar a API
- ✏️ Apenas solicitações "pendente" podem ser editadas
- 🗑️ Apenas solicitações "recusado" podem ser deletadas
- 📅 Use formato de data: `YYYY-MM-DD`
- 💰 Valores devem ser números decimais (ex: `1500.00`)

### Suporte

Para dúvidas ou problemas:
1. Consulte esta documentação completa
2. Verifique os logs do servidor Django
3. Entre em contato com a equipe de desenvolvimento

---

**Documentação gerada em:** 2025-01-15  
**Versão da API:** v1  
**Última atualização:** 2025-01-15




Este é o documento único e completo com todas as informações sobre como usar a API REST do sistema de Solicitações Financeiras.

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Início Rápido (5 minutos)](#início-rápido-5-minutos)
3. [Pré-requisitos](#pré-requisitos)
4. [Autenticação](#autenticação)
5. [Endpoints da API](#endpoints-da-api)
   - [Criar Solicitação](#criar-solicitação)
   - [Listar Solicitações](#listar-solicitações)
   - [Visualizar Detalhes](#visualizar-detalhes)
   - [Atualizar Solicitação](#atualizar-solicitação)
   - [Deletar Solicitação](#deletar-solicitação)
   - [Estatísticas](#estatísticas)
6. [Exemplos Práticos](#exemplos-práticos)
7. [Solução de Problemas](#solução-de-problemas)
8. [Referência Técnica](#referência-técnica)
9. [Resumo da Implementação](#resumo-da-implementação)

---

## Visão Geral

A API REST permite criar e editar solicitações financeiras com autenticação por token JWT. O acesso é restrito apenas para usuários do grupo **Administrador**.

### Características Principais

- ✅ Autenticação JWT (JSON Web Token)
- ✅ Acesso restrito a Administradores
- ✅ CRUD completo de solicitações
- ✅ Suporte a solicitações Casual e Em Rota
- ✅ Filtros avançados e paginação
- ✅ Validações robustas de dados
- ✅ Documentação completa

### Base URL

```
http://localhost:8000/api/v1/
```

---

## Início Rápido (5 minutos)

### 1. Instalar Dependências

```bash
cd /home/gean/Documents/projeto_finança/attend_finence
pip install -r requirements.txt
```

### 2. Iniciar Servidor

```bash
python3 manage.py runserver
```

### 3. Obter Token

```bash
curl -X POST http://localhost:8000/api/v1/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "sua_senha"}'
```

**Salve o token:**
```bash
export TOKEN="seu_token_aqui"
```

### 4. Criar Solicitação

```bash
curl -X POST http://localhost:8000/api/v1/solicitacoes/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Reembolso de Viagem",
    "nome_do_recebedor": "João Silva",
    "valor": 1500.00,
    "descricao": "Reembolso de despesas",
    "data_de_pagamento": "2025-02-15",
    "data_de_criacao": "2025-01-15",
    "tipo": "casual"
  }'
```

### 5. Listar Solicitações

```bash
curl -X GET "http://localhost:8000/api/v1/solicitacoes/?status=pendente" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Pré-requisitos

### 1. Instalar Dependências

Antes de usar a API, certifique-se de ter instalado as dependências:

```bash
cd /home/gean/Documents/projeto_finança/attend_finence
pip install -r requirements.txt
```

As dependências incluem:
- `djangorestframework>=3.15.0`
- `djangorestframework-simplejwt>=5.3.0`

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

## Autenticação

### 1. Obter Token de Acesso

Antes de fazer qualquer requisição, você precisa obter um token de acesso.

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

**Exemplo com cURL:**

```bash
curl -X POST http://localhost:8000/api/v1/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "senha123"
  }'
```

**Resposta de Sucesso (200 OK):**

```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

### 2. Guardar o Token

Salve o token `access` para usar nas próximas requisições:

```bash
# No Linux/Mac, salve em uma variável:
export TOKEN="eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."

# No Windows PowerShell:
$TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
```

### 3. Usar Token nas Requisições

Todas as requisições subsequentes devem incluir o token no header:

```
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

**Exemplo:**

```bash
curl -X GET http://localhost:8000/api/v1/solicitacoes/ \
  -H "Authorization: Bearer $TOKEN"
```

### 4. Renovar Token (quando expirar)

Os tokens têm validade limitada:
- **Access token**: Válido por **1 hora**
- **Refresh token**: Válido por **1 dia**

Se o token expirar, use o `refresh` para obter um novo:

**Endpoint:** `POST /api/v1/auth/token/refresh/`

```bash
curl -X POST http://localhost:8000/api/v1/auth/token/refresh/ \
  -H "Content-Type: application/json" \
  -d '{
    "refresh": "seu_refresh_token_aqui"
  }'
```

**Resposta:**

```json
{
  "access": "novo_token_aqui"
}
```

---

## Endpoints da API

Todos os endpoints da API estão disponíveis em:

**Base URL:** `http://localhost:8000/api/v1/`

---

## Criar Solicitação

**Endpoint:** `POST /api/v1/solicitacoes/`

**Headers:**
```
Authorization: Bearer SEU_TOKEN_AQUI
Content-Type: application/json
```

### Solicitação Casual (Individual)

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
  "data_de_criacao": "2025-01-15",
  "prioridade": "baixa",
  "tipo": "casual"
}
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

**Nota:** Solicitações Em Rota devem ter pelo menos um item em `itens_rota`.

### Campos Automáticos

Os seguintes campos são gerados automaticamente se não fornecidos:

- **`ticket`**: Gerado automaticamente (formato: `INC000001` para casual, `ROTA-001` para em_rota)
- **`nome_solicitante`**: Usa o usuário autenticado
- **`data_de_criacao`**: Usa a data atual se não fornecido
- **`tempo_criacao`**: Usa o horário atual se não fornecido
- **`status`**: Padrão é `"pendente"`

---

## Listar Solicitações

**Endpoint:** `GET /api/v1/solicitacoes/`

**Headers:**
```
Authorization: Bearer SEU_TOKEN_AQUI
```

### Listar Todas

```bash
curl -X GET http://localhost:8000/api/v1/solicitacoes/ \
  -H "Authorization: Bearer $TOKEN"
```

### Filtrar por Status

**URL:** `GET /api/v1/solicitacoes/?status=pendente`

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

**URL:** `GET /api/v1/solicitacoes/?tipo=casual`

```bash
curl -X GET "http://localhost:8000/api/v1/solicitacoes/?tipo=casual" \
  -H "Authorization: Bearer $TOKEN"
```

**Tipos disponíveis:**
- `casual`
- `em_rota`

### Filtrar por Solicitante

**URL:** `GET /api/v1/solicitacoes/?solicitante_id=1`

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

**Exemplo:**

```bash
curl -X GET "http://localhost:8000/api/v1/solicitacoes/?data_inicio=2025-01-01&data_fim=2025-01-31" \
  -H "Authorization: Bearer $TOKEN"
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
      "status": "pendente",
      "titulo": "Solicitação de Reembolso",
      ...
    },
    ...
  ]
}
```

---

## Visualizar Detalhes

**Endpoint:** `GET /api/v1/solicitacoes/{id}/`

**Exemplo:**

```bash
curl -X GET http://localhost:8000/api/v1/solicitacoes/1/ \
  -H "Authorization: Bearer $TOKEN"
```

**Resposta (200 OK):**

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
  "valor_total_detalhados": 1500.00,
  "anexo_url": null
}
```

---

## Atualizar Solicitação

### Atualização Parcial (PATCH) - Recomendado

Atualiza apenas os campos fornecidos.

**Endpoint:** `PATCH /api/v1/solicitacoes/{id}/`

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

**Endpoint:** `PUT /api/v1/solicitacoes/{id}/`

**⚠️ Importante:** 
- Apenas solicitações com status **"pendente"** podem ser editadas
- Se tentar editar uma solicitação aprovada/recusada/concluída, receberá erro 400

**Resposta de Erro (400 Bad Request):**

```json
{
  "error": "Somente solicitações com status 'pendente' podem ser editadas.",
  "current_status": "aprovado"
}
```

---

## Deletar Solicitação

**Endpoint:** `DELETE /api/v1/solicitacoes/{id}/`

**Headers:**
```
Authorization: Bearer SEU_TOKEN_AQUI
```

**Exemplo:**

```bash
curl -X DELETE http://localhost:8000/api/v1/solicitacoes/1/ \
  -H "Authorization: Bearer $TOKEN"
```

**⚠️ Importante:**
- Apenas solicitações com status **"recusado"** podem ser deletadas
- A resposta será 204 No Content (sem corpo)

**Resposta de Erro (400 Bad Request):**

```json
{
  "error": "Somente solicitações com status 'recusado' podem ser deletadas.",
  "current_status": "aprovado"
}
```

---

## Estatísticas

**Endpoint:** `GET /api/v1/solicitacoes/estatisticas/`

**Headers:**
```
Authorization: Bearer SEU_TOKEN_AQUI
```

**Exemplo:**

```bash
curl -X GET http://localhost:8000/api/v1/solicitacoes/estatisticas/ \
  -H "Authorization: Bearer $TOKEN"
```

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

### Exemplo com Python

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

### Exemplo com JavaScript/Node.js

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

## Solução de Problemas

### Erro 401 Unauthorized

**Problema:** Token ausente ou inválido.

**Soluções:**
1. Verifique se o token está sendo enviado no header `Authorization: Bearer TOKEN`
2. Verifique se o token não expirou (válido por 1 hora)
3. Renove o token usando o refresh token:

```bash
curl -X POST http://localhost:8000/api/v1/auth/token/refresh/ \
  -H "Content-Type: application/json" \
  -d '{"refresh": "seu_refresh_token"}'
```

### Erro 403 Forbidden

**Problema:** Usuário não tem permissão.

**Soluções:**
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

5. **Solicitação Em Rota sem itens:**
   - Deve ter pelo menos um item em `itens_rota`

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

## Referência Técnica

### Códigos de Status HTTP

| Código | Significado | Quando Ocorre |
|--------|-------------|---------------|
| 200 | OK | Requisição bem-sucedida |
| 201 | Created | Recurso criado com sucesso |
| 204 | No Content | Recurso deletado com sucesso |
| 400 | Bad Request | Erro de validação ou requisição inválida |
| 401 | Unauthorized | Token ausente ou inválido |
| 403 | Forbidden | Usuário não tem permissão |
| 404 | Not Found | Recurso não encontrado |
| 500 | Internal Server Error | Erro interno do servidor |

### Validações

#### Campos Obrigatórios

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

#### Campos Opcionais

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

### Formatos de Dados

#### Datas
- Formato: `YYYY-MM-DD`
- Exemplo: `2025-02-15`

#### Valores Monetários
- Formato: Número decimal com ponto
- Exemplo: `1500.00`

#### Prioridades
- Valores válidos: `"baixa"`, `"media"`, `"alta"`

#### Tipos
- Valores válidos: `"casual"`, `"em_rota"`

#### Status
- Valores válidos: `"pendente"`, `"aprovado"`, `"recusado"`, `"concluido"`

### Geração Automática de Tickets

- **Casuais**: Formato `INC000001`, `INC000002`, etc.
- **Em Rota**: Formato `ROTA-001`, `ROTA-002`, etc.
- Se não fornecido, é gerado automaticamente

### Permissões

- **Acesso:** Apenas usuários do grupo "Administrador" ou superusuários
- **Edição:** Apenas solicitações com status "pendente" podem ser editadas
- **Exclusão:** Apenas solicitações com status "recusado" podem ser deletadas

---

## Resumo da Implementação

### O que foi implementado

1. **Dependências**
   - Django REST Framework
   - djangorestframework-simplejwt

2. **Configurações**
   - REST Framework configurado no settings.py
   - Autenticação JWT configurada
   - Permissões e paginação definidas

3. **Arquivos Criados**
   - `solicitacoes/serializers.py` - Serializadores para os modelos
   - `solicitacoes/permissions.py` - Permissão customizada para Administradores
   - `solicitacoes/api_views.py` - ViewSet com CRUD completo
   - `solicitacoes/api_urls.py` - URLs da API
   - Rotas adicionadas em `attend_finence/urls.py`

4. **Segurança Implementada**
   - Autenticação JWT obrigatória
   - Permissão de Administrador
   - Validação de edição (apenas pendentes)
   - Validação de exclusão (apenas recusadas)
   - Validações robustas de dados

### Estrutura de Arquivos

```
attend_finence/
├── solicitacoes/
│   ├── serializers.py       # Serializadores
│   ├── permissions.py       # Permissões customizadas
│   ├── api_views.py         # ViewSet da API
│   └── api_urls.py          # URLs da API
├── attend_finence/
│   ├── settings.py          # Configurações REST Framework
│   └── urls.py              # Rotas da API
└── requirements.txt         # Dependências
```

### Endpoints Disponíveis

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/v1/auth/token/` | Obter token JWT |
| POST | `/api/v1/auth/token/refresh/` | Renovar token |
| GET | `/api/v1/solicitacoes/` | Listar solicitações |
| POST | `/api/v1/solicitacoes/` | Criar solicitação |
| GET | `/api/v1/solicitacoes/{id}/` | Ver detalhes |
| PUT | `/api/v1/solicitacoes/{id}/` | Atualizar completo |
| PATCH | `/api/v1/solicitacoes/{id}/` | Atualizar parcial |
| DELETE | `/api/v1/solicitacoes/{id}/` | Deletar |
| GET | `/api/v1/solicitacoes/estatisticas/` | Ver estatísticas |

### Funcionalidades Principais

- ✅ CRUD completo de solicitações
- ✅ Suporte a solicitações Casual e Em Rota
- ✅ Filtros avançados (status, tipo, solicitante, data)
- ✅ Paginação automática
- ✅ Validações robustas
- ✅ Geração automática de tickets
- ✅ Estatísticas gerais
- ✅ Suporte a anexos

### Próximos Passos

1. Instalar dependências:
   ```bash
   pip install -r requirements.txt
   ```

2. Testar a API usando os exemplos deste documento

3. Integrar com sua aplicação frontend ou mobile

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

### 3. Campos Automáticos

Não precisa fornecer (são gerados automaticamente):
- `ticket`: Gerado automaticamente
- `nome_solicitante`: Usa o usuário autenticado
- `data_de_criacao`: Usa a data atual (se não fornecido)
- `tempo_criacao`: Usa o horário atual (se não fornecido)
- `status`: Padrão é "pendente"

### 4. Tokens JWT

- Access token válido por **1 hora**
- Refresh token válido por **1 dia**
- Use o refresh token para renovar o access token

### 5. Usando com Postman

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

---

## Notas Finais

### Importante Lembrar

- ⏰ Tokens expiram em 1 hora - use refresh token para renovar
- 👥 Apenas usuários Administradores podem usar a API
- ✏️ Apenas solicitações "pendente" podem ser editadas
- 🗑️ Apenas solicitações "recusado" podem ser deletadas
- 📅 Use formato de data: `YYYY-MM-DD`
- 💰 Valores devem ser números decimais (ex: `1500.00`)

### Suporte

Para dúvidas ou problemas:
1. Consulte esta documentação completa
2. Verifique os logs do servidor Django
3. Entre em contato com a equipe de desenvolvimento

---

**Documentação gerada em:** 2025-01-15  
**Versão da API:** v1  
**Última atualização:** 2025-01-15

