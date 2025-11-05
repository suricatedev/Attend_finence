# 📧 Como Configurar Email para Recuperação de Senha

## ⚠️ Situação Atual

O sistema está usando **modo console**, o que significa que:
- Os códigos de verificação **NÃO são enviados por email**
- Os códigos aparecem **no console/terminal do servidor Django**
- Isso é útil para desenvolvimento e testes

## 🔧 Para Habilitar Envio de Email Real

### 1. Crie/Edite o arquivo `.env` na raiz do projeto

Adicione as seguintes variáveis:

```env
# Configurações de Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=seu-email@gmail.com
EMAIL_HOST_PASSWORD=sua-senha-de-app
DEFAULT_FROM_EMAIL=seu-email@gmail.com
```

### 2. Configuração para Gmail

#### Passo 1: Ativar Verificação em Duas Etapas
1. Acesse: https://myaccount.google.com/security
2. Ative a "Verificação em duas etapas"

#### Passo 2: Gerar Senha de App
1. Acesse: https://myaccount.google.com/apppasswords
2. Selecione "App" → "Outro (nome personalizado)"
3. Digite: "Attend Finance"
4. Clique em "Gerar"
5. **Copie a senha gerada** (16 caracteres, sem espaços)

#### Passo 3: Configurar no .env
```env
EMAIL_HOST_USER=seu-email@gmail.com
EMAIL_HOST_PASSWORD=xxxx xxxx xxxx xxxx  # Cole a senha de app aqui (sem espaços)
```

### 3. Configuração para Outlook/Hotmail

```env
EMAIL_HOST=smtp.office365.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=seu-email@outlook.com
EMAIL_HOST_PASSWORD=sua-senha
DEFAULT_FROM_EMAIL=seu-email@outlook.com
```

### 4. Configuração para Outros Provedores

#### Yahoo Mail
```env
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
```

#### SendGrid (Serviço de Email Transacional)
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=apikey
EMAIL_HOST_PASSWORD=sua-api-key-do-sendgrid
```

## ✅ Verificar se Está Funcionando

1. Reinicie o servidor Django após alterar o `.env`
2. Solicite um código de recuperação
3. Verifique se aparece a mensagem: "Código de verificação enviado para [email]"
4. Se ainda aparecer "console do servidor", verifique se as variáveis no `.env` estão corretas

## 🔍 Onde Ver o Código (Modo Console)

Se você ainda não configurou o email, o código aparece no **terminal onde o servidor Django está rodando**:

```
============================================================
📧 CÓDIGO DE RECUPERAÇÃO DE SENHA
============================================================
Email: usuario@email.com
Código: 123456
Válido por: 15 minutos
============================================================
```

## ⚠️ Importante

- **NUNCA** compartilhe o arquivo `.env` publicamente
- Adicione `.env` ao `.gitignore` (já está configurado)
- Use senha de app para Gmail, não sua senha pessoal
- Em produção, use serviços de email transacional (SendGrid, Mailgun, etc.)

## 🆘 Problemas Comuns

### "Erro de autenticação"
- Verifique se está usando **senha de app** (não senha normal)
- Para Gmail, certifique-se de que a verificação em duas etapas está ativa

### "Erro de conexão"
- Verifique sua conexão com a internet
- Verifique se as portas 587 (TLS) ou 465 (SSL) não estão bloqueadas

### "Email não chega"
- Verifique a pasta de spam
- Verifique se o email está correto no banco de dados
- Verifique os logs do servidor para erros

