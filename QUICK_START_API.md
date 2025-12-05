# Quick Start - API REST

Guia rápido para começar a usar a API em 5 minutos.

## 🚀 Início Rápido

### 1. Obter Token

```bash
curl -X POST http://localhost:8000/api/v1/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "sua_senha"}'
```

**Salve o token:**
```bash
export TOKEN="seu_token_aqui"
```

### 2. Criar Solicitação

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

### 3. Listar Solicitações

```bash
curl -X GET "http://localhost:8000/api/v1/solicitacoes/?status=pendente" \
  -H "Authorization: Bearer $TOKEN"
```

### 4. Atualizar Solicitação

```bash
curl -X PATCH http://localhost:8000/api/v1/solicitacoes/1/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"valor": 2000.00}'
```

---

## 📚 Endpoints Principais

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/v1/auth/token/` | Obter token JWT |
| POST | `/api/v1/solicitacoes/` | Criar solicitação |
| GET | `/api/v1/solicitacoes/` | Listar solicitações |
| GET | `/api/v1/solicitacoes/{id}/` | Ver detalhes |
| PATCH | `/api/v1/solicitacoes/{id}/` | Atualizar (parcial) |
| PUT | `/api/v1/solicitacoes/{id}/` | Atualizar (completo) |
| DELETE | `/api/v1/solicitacoes/{id}/` | Deletar |
| GET | `/api/v1/solicitacoes/estatisticas/` | Ver estatísticas |

---

## 🔍 Filtros Comuns

```bash
# Por status
?status=pendente

# Por tipo
?tipo=casual

# Por data
?data_inicio=2025-01-01&data_fim=2025-01-31

# Por solicitante
?solicitante_id=1

# Combinar
?status=pendente&tipo=casual&data_inicio=2025-01-01
```

---

## ⚠️ Regras Importantes

- **Token válido por 1 hora** - Renove quando expirar
- **Apenas Administradores** podem usar a API
- **Apenas pendentes** podem ser editadas
- **Apenas recusadas** podem ser deletadas

---

## 📖 Documentação Completa

Para mais detalhes, consulte:
- **Guia Completo:** `GUIA_USO_API.md`
- **Documentação Técnica:** `API_DOCUMENTATION.md`

---

## 🐛 Problemas Comuns

**401 Unauthorized:** Token expirado ou ausente
**403 Forbidden:** Usuário não é Administrador
**400 Bad Request:** Dados inválidos ou campos faltando

Ver `GUIA_USO_API.md` → Solução de Problemas para mais detalhes.









Guia rápido para começar a usar a API em 5 minutos.

## 🚀 Início Rápido

### 1. Obter Token

```bash
curl -X POST http://localhost:8000/api/v1/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "sua_senha"}'
```

**Salve o token:**
```bash
export TOKEN="seu_token_aqui"
```

### 2. Criar Solicitação

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

### 3. Listar Solicitações

```bash
curl -X GET "http://localhost:8000/api/v1/solicitacoes/?status=pendente" \
  -H "Authorization: Bearer $TOKEN"
```

### 4. Atualizar Solicitação

```bash
curl -X PATCH http://localhost:8000/api/v1/solicitacoes/1/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"valor": 2000.00}'
```

---

## 📚 Endpoints Principais

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/v1/auth/token/` | Obter token JWT |
| POST | `/api/v1/solicitacoes/` | Criar solicitação |
| GET | `/api/v1/solicitacoes/` | Listar solicitações |
| GET | `/api/v1/solicitacoes/{id}/` | Ver detalhes |
| PATCH | `/api/v1/solicitacoes/{id}/` | Atualizar (parcial) |
| PUT | `/api/v1/solicitacoes/{id}/` | Atualizar (completo) |
| DELETE | `/api/v1/solicitacoes/{id}/` | Deletar |
| GET | `/api/v1/solicitacoes/estatisticas/` | Ver estatísticas |

---

## 🔍 Filtros Comuns

```bash
# Por status
?status=pendente

# Por tipo
?tipo=casual

# Por data
?data_inicio=2025-01-01&data_fim=2025-01-31

# Por solicitante
?solicitante_id=1

# Combinar
?status=pendente&tipo=casual&data_inicio=2025-01-01
```

---

## ⚠️ Regras Importantes

- **Token válido por 1 hora** - Renove quando expirar
- **Apenas Administradores** podem usar a API
- **Apenas pendentes** podem ser editadas
- **Apenas recusadas** podem ser deletadas

---

## 📖 Documentação Completa

Para mais detalhes, consulte:
- **Guia Completo:** `GUIA_USO_API.md`
- **Documentação Técnica:** `API_DOCUMENTATION.md`

---

## 🐛 Problemas Comuns

**401 Unauthorized:** Token expirado ou ausente
**403 Forbidden:** Usuário não é Administrador
**400 Bad Request:** Dados inválidos ou campos faltando

Ver `GUIA_USO_API.md` → Solução de Problemas para mais detalhes.









