# Configuração de Arquivos Estáticos para Produção (VPS)

## Problema
Os vídeos e outros arquivos estáticos (CSS, JS, imagens) não aparecem na VPS porque o Django em produção não serve arquivos estáticos automaticamente.

## Solução

### 1. Coletar arquivos estáticos na VPS

Execute o comando na VPS (dentro do diretório do projeto):

```bash
python manage.py collectstatic --noinput
```

Este comando irá:
- Copiar todos os arquivos de `static/` para `staticfiles/`
- Incluir os vídeos (back17.mp4, back18.mp4, back20.mp4)
- Preparar os arquivos para serem servidos em produção

### 2. Configurar servidor web (Recomendado)

**Opção A: Nginx (Recomendado)**

Adicione no seu arquivo de configuração do Nginx (`/etc/nginx/sites-available/seu-site`):

```nginx
server {
    # ... outras configurações ...
    
    location /static/ {
        alias /caminho/para/seu/projeto/staticfiles/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
    
    # ... resto da configuração ...
}
```

Depois recarregue o Nginx:
```bash
sudo nginx -t  # Testar configuração
sudo systemctl reload nginx  # Recarregar
```

**Opção B: Usar Django para servir estáticos (Temporário)**

Se você não tem Nginx configurado, o Django pode servir os arquivos estáticos (mas não é recomendado para produção de alta performance).

A configuração no `urls.py` já está preparada para isso após rodar `collectstatic`.

### 3. Verificar permissões

Certifique-se de que o diretório `staticfiles/` tem as permissões corretas:

```bash
chmod -R 755 staticfiles/
```

### 4. Após fazer mudanças nos arquivos estáticos

Sempre que atualizar arquivos estáticos (CSS, JS, imagens, vídeos), rode novamente:

```bash
python manage.py collectstatic --noinput
```

## Teste

Após seguir os passos acima, acesse a página de login e verifique:
- ✅ O vídeo de fundo está aparecendo
- ✅ CSS e JS estão carregando
- ✅ Imagens estão aparecendo

## Troubleshooting

### Vídeos ainda não aparecem:

1. Verifique se os arquivos existem em `staticfiles/img/`:
   ```bash
   ls -lh staticfiles/img/*.mp4
   ```

2. Verifique o console do navegador (F12) para ver erros 404

3. Verifique as permissões do diretório:
   ```bash
   ls -la staticfiles/
   ```

4. Teste o acesso direto ao vídeo:
   ```
   http://seu-dominio.com/static/img/back17.mp4
   ```

## Notas Importantes

- O diretório `staticfiles/` foi adicionado ao `.gitignore` (não deve ser versionado)
- Execute `collectstatic` sempre na VPS, não no ambiente local
- Em produção, configure `DEBUG = False` no `settings.py` para segurança

