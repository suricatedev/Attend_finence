# 📧 Configuração Rápida de Email

## ⚠️ Importante

Você tem emails cadastrados no banco de dados (destinatários), mas precisa configurar um **servidor SMTP** para ENVIAR os emails.

## 🎯 Configuração Rápida (Gmail)

### Passo 1: Criar arquivo `.env` na raiz do projeto

Adicione estas linhas:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=seu-email@gmail.com
EMAIL_HOST_PASSWORD=sua-senha-de-app
DEFAULT_FROM_EMAIL=seu-email@gmail.com
```

### Passo 2: Gerar Senha de App (Gmail)

1. Acesse: https://myaccount.google.com/apppasswords
2. Se não aparecer, ative a "Verificação em duas etapas" primeiro
3. Selecione "App" → "Outro (nome personalizado)"
4. Digite: "Attend Finance"
5. Clique em "Gerar"
6. **Copie a senha de 16 caracteres** (sem espaços)

### Passo 3: Configurar no .env

```env
EMAIL_HOST_USER=seu-email@gmail.com
EMAIL_HOST_PASSWORD=xxxx xxxx xxxx xxxx  # Cole a senha de app aqui (sem espaços)
```

### Passo 4: Reiniciar o servidor

Após configurar, reinicie o servidor Django para carregar as novas configurações.

## ✅ Teste

1. Solicite um código de recuperação
2. Verifique se aparece: "Código de verificação enviado para [email]"
3. Verifique a caixa de entrada (e spam)

## 📝 Exemplo Completo

```env
# No arquivo .env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=seu-email@gmail.com
EMAIL_HOST_PASSWORD=abcdefghijklmnop
DEFAULT_FROM_EMAIL=seu-email@gmail.com
```

## 🔍 Verificar Configuração

Execute: `py verificar_config_email.py`

