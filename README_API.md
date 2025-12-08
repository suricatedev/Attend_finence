# 📚 Documentação da API REST - Índice

Bem-vindo à documentação da API REST de Solicitações Financeiras!

## 🎯 Comece Aqui

### Para Começar Rápido (5 minutos)
👉 **[QUICK_START_API.md](QUICK_START_API.md)** - Guia rápido para começar a usar a API imediatamente

### Para Aprender Passo a Passo
👉 **[GUIA_USO_API.md](GUIA_USO_API.md)** - Guia completo e detalhado com todos os exemplos práticos

### Para Referência Técnica
👉 **[API_DOCUMENTATION.md](API_DOCUMENTATION.md)** - Documentação técnica completa com todos os endpoints

### Para Entender a Implementação
👉 **[API_IMPLEMENTATION_SUMMARY.md](API_IMPLEMENTATION_SUMMARY.md)** - Resumo técnico da implementação

---

## 📖 Qual Documento Usar?

### 👨‍💻 Você é Desenvolvedor e quer começar agora?
**→ Use:** `QUICK_START_API.md`
- Comandos prontos para copiar e colar
- Exemplos básicos de uso
- Referência rápida dos endpoints

### 👨‍🏫 Você precisa aprender como funciona?
**→ Use:** `GUIA_USO_API.md`
- Explicações detalhadas passo a passo
- Exemplos práticos completos
- Solução de problemas
- Como usar com Postman, Python, JavaScript

### 🔧 Você precisa de referência técnica?
**→ Use:** `API_DOCUMENTATION.md`
- Todos os endpoints documentados
- Estruturas de requisição e resposta
- Códigos de status HTTP
- Validações e regras de negócio

### 🏗️ Você quer entender como foi implementado?
**→ Use:** `API_IMPLEMENTATION_SUMMARY.md`
- Arquitetura da API
- Estrutura de arquivos
- Segurança implementada
- Melhorias futuras

---

## 🚀 Início Rápido

### 1. Instalar Dependências

```bash
cd /home/gean/Documents/projeto_finança/attend_finence
pip install -r requirements.txt
```

### 2. Iniciar o Servidor

```bash
python3 manage.py runserver
```

### 3. Obter Token

```bash
curl -X POST http://localhost:8000/api/v1/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "sua_senha"}'
```

### 4. Usar a API

Consulte o **[QUICK_START_API.md](QUICK_START_API.md)** para exemplos prontos.

---

## 📋 Pré-requisitos

- ✅ Django 5.2.7
- ✅ Django REST Framework
- ✅ djangorestframework-simplejwt
- ✅ Usuário no grupo "Administrador" ou superuser

---

## 🔐 Autenticação

A API usa autenticação JWT (JSON Web Token). Você precisa:

1. Obter um token fazendo login
2. Usar o token no header `Authorization: Bearer TOKEN`
3. Renovar o token quando expirar (válido por 1 hora)

Consulte **[GUIA_USO_API.md](GUIA_USO_API.md)** seção "Autenticação" para mais detalhes.

---

## 📍 Endpoints Principais

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/v1/auth/token/` | POST | Obter token JWT |
| `/api/v1/solicitacoes/` | GET, POST | Listar ou criar solicitações |
| `/api/v1/solicitacoes/{id}/` | GET, PUT, PATCH, DELETE | Gerenciar solicitação específica |
| `/api/v1/solicitacoes/estatisticas/` | GET | Ver estatísticas |

Veja **[API_DOCUMENTATION.md](API_DOCUMENTATION.md)** para documentação completa.

---

## 🛡️ Segurança

- ✅ Autenticação JWT obrigatória
- ✅ Acesso restrito a Administradores
- ✅ Apenas solicitações pendentes podem ser editadas
- ✅ Apenas solicitações recusadas podem ser deletadas
- ✅ Validação completa de todos os dados

---

## 💡 Exemplos Rápidos

### Criar Solicitação

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

### Listar Pendentes

```bash
curl -X GET "http://localhost:8000/api/v1/solicitacoes/?status=pendente" \
  -H "Authorization: Bearer $TOKEN"
```

### Atualizar Valor

```bash
curl -X PATCH http://localhost:8000/api/v1/solicitacoes/1/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"valor": 2000.00}'
```

Mais exemplos em **[GUIA_USO_API.md](GUIA_USO_API.md)**.

---

## 🐛 Problemas?

Consulte a seção "Solução de Problemas" no **[GUIA_USO_API.md](GUIA_USO_API.md)**.

**Problemas comuns:**
- ❌ **401 Unauthorized:** Token expirado ou ausente
- ❌ **403 Forbidden:** Usuário não é Administrador
- ❌ **400 Bad Request:** Dados inválidos

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Consulte a documentação relevante acima
2. Verifique os logs do servidor Django
3. Entre em contato com a equipe de desenvolvimento

---

## 📝 Notas Importantes

- ⏰ Tokens expiram em 1 hora - use refresh token para renovar
- 👥 Apenas usuários Administradores podem usar a API
- ✏️ Apenas solicitações "pendente" podem ser editadas
- 🗑️ Apenas solicitações "recusado" podem ser deletadas
- 📅 Use formato de data: `YYYY-MM-DD`
- 💰 Valores devem ser números decimais (ex: `1500.00`)

---

## 🎓 Aprendizado Progressivo

1. **Primeiro:** Leia o **[QUICK_START_API.md](QUICK_START_API.md)** (5 min)
2. **Depois:** Siga o **[GUIA_USO_API.md](GUIA_USO_API.md)** (30 min)
3. **Por fim:** Consulte **[API_DOCUMENTATION.md](API_DOCUMENTATION.md)** quando precisar (referência)

---

## ✨ Boa Sorte!

Agora você está pronto para usar a API! Comece pelo **[QUICK_START_API.md](QUICK_START_API.md)** e explore todas as funcionalidades.









Bem-vindo à documentação da API REST de Solicitações Financeiras!

## 🎯 Comece Aqui

### Para Começar Rápido (5 minutos)
👉 **[QUICK_START_API.md](QUICK_START_API.md)** - Guia rápido para começar a usar a API imediatamente

### Para Aprender Passo a Passo
👉 **[GUIA_USO_API.md](GUIA_USO_API.md)** - Guia completo e detalhado com todos os exemplos práticos

### Para Referência Técnica
👉 **[API_DOCUMENTATION.md](API_DOCUMENTATION.md)** - Documentação técnica completa com todos os endpoints

### Para Entender a Implementação
👉 **[API_IMPLEMENTATION_SUMMARY.md](API_IMPLEMENTATION_SUMMARY.md)** - Resumo técnico da implementação

---

## 📖 Qual Documento Usar?

### 👨‍💻 Você é Desenvolvedor e quer começar agora?
**→ Use:** `QUICK_START_API.md`
- Comandos prontos para copiar e colar
- Exemplos básicos de uso
- Referência rápida dos endpoints

### 👨‍🏫 Você precisa aprender como funciona?
**→ Use:** `GUIA_USO_API.md`
- Explicações detalhadas passo a passo
- Exemplos práticos completos
- Solução de problemas
- Como usar com Postman, Python, JavaScript

### 🔧 Você precisa de referência técnica?
**→ Use:** `API_DOCUMENTATION.md`
- Todos os endpoints documentados
- Estruturas de requisição e resposta
- Códigos de status HTTP
- Validações e regras de negócio

### 🏗️ Você quer entender como foi implementado?
**→ Use:** `API_IMPLEMENTATION_SUMMARY.md`
- Arquitetura da API
- Estrutura de arquivos
- Segurança implementada
- Melhorias futuras

---

## 🚀 Início Rápido

### 1. Instalar Dependências

```bash
cd /home/gean/Documents/projeto_finança/attend_finence
pip install -r requirements.txt
```

### 2. Iniciar o Servidor

```bash
python3 manage.py runserver
```

### 3. Obter Token

```bash
curl -X POST http://localhost:8000/api/v1/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "sua_senha"}'
```

### 4. Usar a API

Consulte o **[QUICK_START_API.md](QUICK_START_API.md)** para exemplos prontos.

---

## 📋 Pré-requisitos

- ✅ Django 5.2.7
- ✅ Django REST Framework
- ✅ djangorestframework-simplejwt
- ✅ Usuário no grupo "Administrador" ou superuser

---

## 🔐 Autenticação

A API usa autenticação JWT (JSON Web Token). Você precisa:

1. Obter um token fazendo login
2. Usar o token no header `Authorization: Bearer TOKEN`
3. Renovar o token quando expirar (válido por 1 hora)

Consulte **[GUIA_USO_API.md](GUIA_USO_API.md)** seção "Autenticação" para mais detalhes.

---

## 📍 Endpoints Principais

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/v1/auth/token/` | POST | Obter token JWT |
| `/api/v1/solicitacoes/` | GET, POST | Listar ou criar solicitações |
| `/api/v1/solicitacoes/{id}/` | GET, PUT, PATCH, DELETE | Gerenciar solicitação específica |
| `/api/v1/solicitacoes/estatisticas/` | GET | Ver estatísticas |

Veja **[API_DOCUMENTATION.md](API_DOCUMENTATION.md)** para documentação completa.

---

## 🛡️ Segurança

- ✅ Autenticação JWT obrigatória
- ✅ Acesso restrito a Administradores
- ✅ Apenas solicitações pendentes podem ser editadas
- ✅ Apenas solicitações recusadas podem ser deletadas
- ✅ Validação completa de todos os dados

---

## 💡 Exemplos Rápidos

### Criar Solicitação

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

### Listar Pendentes

```bash
curl -X GET "http://localhost:8000/api/v1/solicitacoes/?status=pendente" \
  -H "Authorization: Bearer $TOKEN"
```

### Atualizar Valor

```bash
curl -X PATCH http://localhost:8000/api/v1/solicitacoes/1/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"valor": 2000.00}'
```

Mais exemplos em **[GUIA_USO_API.md](GUIA_USO_API.md)**.

---

## 🐛 Problemas?

Consulte a seção "Solução de Problemas" no **[GUIA_USO_API.md](GUIA_USO_API.md)**.

**Problemas comuns:**
- ❌ **401 Unauthorized:** Token expirado ou ausente
- ❌ **403 Forbidden:** Usuário não é Administrador
- ❌ **400 Bad Request:** Dados inválidos

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Consulte a documentação relevante acima
2. Verifique os logs do servidor Django
3. Entre em contato com a equipe de desenvolvimento

---

## 📝 Notas Importantes

- ⏰ Tokens expiram em 1 hora - use refresh token para renovar
- 👥 Apenas usuários Administradores podem usar a API
- ✏️ Apenas solicitações "pendente" podem ser editadas
- 🗑️ Apenas solicitações "recusado" podem ser deletadas
- 📅 Use formato de data: `YYYY-MM-DD`
- 💰 Valores devem ser números decimais (ex: `1500.00`)

---

## 🎓 Aprendizado Progressivo

1. **Primeiro:** Leia o **[QUICK_START_API.md](QUICK_START_API.md)** (5 min)
2. **Depois:** Siga o **[GUIA_USO_API.md](GUIA_USO_API.md)** (30 min)
3. **Por fim:** Consulte **[API_DOCUMENTATION.md](API_DOCUMENTATION.md)** quando precisar (referência)

---

## ✨ Boa Sorte!

Agora você está pronto para usar a API! Comece pelo **[QUICK_START_API.md](QUICK_START_API.md)** e explore todas as funcionalidades.











