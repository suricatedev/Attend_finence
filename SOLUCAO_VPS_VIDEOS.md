# Solução: Vídeos não aparecem na VPS

## Passo a Passo para Resolver

### 1. Verificar se os vídeos existem no diretório fonte

Na VPS, verifique se os vídeos estão em `static/img/`:

```bash
cd /caminho/para/seu/projeto
ls -lh static/img/*.mp4
```

Você deve ver:
- `back17.mp4`
- `back18.mp4`
- `back20.mp4`

### 2. Executar collectstatic (IMPORTANTE)

```bash
cd /caminho/para/seu/projeto
python manage.py collectstatic --noinput
```

**Verifique se os vídeos foram copiados:**

```bash
ls -lh staticfiles/img/*.mp4
```

Se os vídeos não aparecerem aqui, o problema está no collectstatic.

### 3. Verificar permissões

```bash
# Dar permissões de leitura ao diretório staticfiles
chmod -R 755 staticfiles/
chmod -R 644 staticfiles/img/*.mp4
```

### 4. Executar script de diagnóstico

Na VPS, execute o script de diagnóstico:

```bash
python diagnostico_static.py
```

Isso mostrará exatamente o que está acontecendo.

### 5. Reiniciar o servidor Django/Gunicorn

Após fazer as mudanças, reinicie o servidor:

```bash
# Se usar Gunicorn:
sudo systemctl restart gunicorn
# ou
sudo systemctl restart seu-servico

# Se usar runserver:
# Pare e inicie novamente
```

### 6. Testar acesso direto ao vídeo

No navegador, tente acessar diretamente:

```
http://seu-dominio.com/static/img/back17.mp4
```

Se retornar 404, o problema é com as rotas de static.

Se retornar o vídeo, o problema pode ser no JavaScript do template.

### 7. Verificar console do navegador

Abra o DevTools (F12) na página de login e verifique:

1. **Console**: Procure por erros JavaScript
2. **Network**: Procure por requisições a `/static/img/back*.mp4`
   - Se aparecerem como 404, o problema é nas rotas
   - Se aparecerem como 200 mas não carregam, pode ser CORS ou tipo MIME

### 8. Se usar Nginx

Se você usa Nginx como proxy reverso, adicione no arquivo de configuração:

```nginx
server {
    # ... outras configurações ...
    
    location /static/ {
        alias /caminho/absoluto/para/seu/projeto/staticfiles/;
        expires 30d;
        add_header Cache-Control "public, immutable";
        
        # Importante para vídeos MP4
        types {
            video/mp4 mp4;
        }
    }
}
```

Depois recarregue:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 9. Verificar DEBUG no settings.py

**IMPORTANTE**: Como você tem `DEBUG = True`, o Django deveria servir os arquivos estáticos automaticamente. 

Mas verifique se realmente está assim na VPS (pode ser diferente do código local).

### 10. Solução Alternativa: Servir vídeos diretamente

Se nada funcionar, podemos criar uma view específica para servir os vídeos. Me avise se precisar dessa solução.

## Checklist Final

- [ ] Vídeos existem em `static/img/`
- [ ] `collectstatic` foi executado
- [ ] Vídeos existem em `staticfiles/img/`
- [ ] Permissões corretas (755 para diretórios, 644 para arquivos)
- [ ] Servidor Django/Gunicorn reiniciado
- [ ] Acesso direto funciona: `http://seu-dominio.com/static/img/back17.mp4`
- [ ] Nenhum erro 404 no console do navegador
- [ ] Nginx configurado (se usar)

## Se ainda não funcionar

Execute o diagnóstico e envie o resultado:

```bash
python diagnostico_static.py > diagnostico_resultado.txt
```

E me envie o conteúdo do arquivo `diagnostico_resultado.txt`.

