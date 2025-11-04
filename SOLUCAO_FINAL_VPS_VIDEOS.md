# Solução Final: Vídeos de Login não aparecem na VPS

## Problema Identificado
Os vídeos de background (back17.mp4, back18.mp4, back20.mp4) não aparecem na tela de login quando o site está hospedado na VPS.

## Soluções Implementadas

### 1. ✅ Melhorias no JavaScript de Login
- Adicionado sistema de fallback automático para imagens caso os vídeos não carreguem
- Adicionado logs detalhados no console para debug
- Implementado timeout de 3 segundos para detectar vídeos que não carregam
- Adicionado tratamento robusto de erros

### 2. ✅ Script de Verificação
Criado script `verificar_videos_vps.py` para diagnosticar problemas na VPS.

## Passos para Resolver na VPS

### Passo 1: Verificar se os vídeos existem
```bash
cd /caminho/para/seu/projeto
ls -lh static/img/*.mp4
```

Deve mostrar:
- back17.mp4
- back18.mp4
- back20.mp4

### Passo 2: Executar collectstatic (CRÍTICO)
```bash
python manage.py collectstatic --noinput
```

**VERIFIQUE SE OS VÍDEOS FORAM COPIADOS:**
```bash
ls -lh staticfiles/img/*.mp4
```

Se os vídeos não aparecerem aqui, o problema está no collectstatic.

### Passo 3: Executar script de verificação
```bash
python verificar_videos_vps.py
```

Este script mostrará exatamente onde está o problema.

### Passo 4: Ajustar permissões
```bash
# Dar permissões de leitura ao diretório staticfiles
chmod -R 755 staticfiles/
chmod -R 644 staticfiles/img/*.mp4
```

### Passo 5: Se usar Nginx (Recomendado)

Adicione no arquivo de configuração do Nginx (`/etc/nginx/sites-available/seu-site`):

```nginx
server {
    # ... outras configurações ...
    
    location /static/ {
        alias /caminho/absoluto/para/seu/projeto/staticfiles/;
        expires 30d;
        add_header Cache-Control "public, immutable";
        
        # IMPORTANTE: Configurar tipos MIME para vídeos
        types {
            video/mp4 mp4;
            video/webm webm;
            video/ogg ogv;
        }
        
        # Permitir acesso a arquivos grandes (vídeos)
        client_max_body_size 100M;
    }
}
```

Depois recarregue:
```bash
sudo nginx -t  # Testar configuração
sudo systemctl reload nginx  # Recarregar
```

### Passo 6: Reiniciar servidor Django/Gunicorn
```bash
# Se usar Gunicorn:
sudo systemctl restart gunicorn
# ou
sudo systemctl restart seu-servico-django

# Se usar runserver:
# Pare e inicie novamente
```

### Passo 7: Testar acesso direto
No navegador, tente acessar diretamente:
```
http://seu-dominio.com/static/img/back17.mp4
```

- ✅ Se retornar o vídeo: Problema pode ser no JavaScript (ver console)
- ❌ Se retornar 404: Problema é com as rotas de static

### Passo 8: Verificar console do navegador
Abra o DevTools (F12) na página de login e verifique:

1. **Console**: Procure por logs de debug (🎬, 🎥, ✅, ❌)
2. **Network**: Procure por requisições a `/static/img/back*.mp4`
   - Se aparecerem como 404: Problema nas rotas
   - Se aparecerem como 200 mas não carregam: Pode ser tipo MIME ou CORS

## Sistema de Fallback Automático

O código agora inclui:
- ✅ Fallback automático para imagens se os vídeos não carregarem
- ✅ Logs detalhados no console para debug
- ✅ Timeout de segurança (3 segundos)
- ✅ Múltiplas tentativas de carregamento

## Checklist Final

- [ ] Vídeos existem em `static/img/`
- [ ] `collectstatic` foi executado
- [ ] Vídeos existem em `staticfiles/img/`
- [ ] Permissões corretas (755 para diretórios, 644 para arquivos)
- [ ] Servidor Django/Gunicorn reiniciado
- [ ] Acesso direto funciona: `http://seu-dominio.com/static/img/back17.mp4`
- [ ] Nginx configurado (se usar) com tipos MIME para vídeos
- [ ] Nenhum erro 404 no console do navegador
- [ ] Script de verificação executado e sem erros críticos

## Se ainda não funcionar

1. Execute o script de verificação e envie o resultado:
   ```bash
   python verificar_videos_vps.py > diagnostico_videos.txt
   ```

2. Verifique o console do navegador (F12) e envie os logs

3. Verifique se o arquivo `.gitignore` não está excluindo os vídeos:
   ```bash
   cat .gitignore | grep -i "mp4\|video"
   ```

## Notas Importantes

- ⚠️ O diretório `staticfiles/` NÃO deve estar no `.gitignore` se você vai fazer deploy
- ⚠️ Execute `collectstatic` SEMPRE na VPS após fazer mudanças nos arquivos estáticos
- ⚠️ Vídeos grandes podem precisar de configuração especial no Nginx (`client_max_body_size`)
- ✅ O sistema agora tem fallback automático, então mesmo se os vídeos não carregarem, as imagens aparecerão

