# Script para resolver conflitos de merge automaticamente mantendo versão HEAD
# Remove marcadores de conflito mantendo o código entre <<<<<<< HEAD e =======

$files = Get-ChildItem -Recurse -File | Where-Object { 
    $_.Extension -match '\.(css|js|html|py)$' -and 
    (Select-String -Path $_.FullName -Pattern '<<<<<<<' -Quiet)
}

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $originalContent = $content
    
    # Regex para encontrar blocos de conflito e manter apenas a parte HEAD
    # Padrão: <<<<<<< HEAD ... ======= ... >>>>>>> hash
    $content = $content -replace '(?s)<<<<<<< HEAD\s*\r?\n(.*?)\r?\n=======.*?\r?\n>>>>>>> [^\r\n]+\r?\n', '$1'
    
    # Se houve mudanças, salvar
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
        Write-Host "Resolvido: $($file.FullName)"
    }
}

Write-Host "`nConflitos resolvidos! Verificando se ainda existem conflitos..."
$remaining = Get-ChildItem -Recurse -File | Where-Object { 
    $_.Extension -match '\.(css|js|html|py)$' -and 
    (Select-String -Path $_.FullName -Pattern '<<<<<<<' -Quiet)
}

if ($remaining) {
    Write-Host "Ainda existem conflitos em:" -ForegroundColor Yellow
    $remaining | ForEach-Object { Write-Host "  - $($_.FullName)" }
} else {
    Write-Host "Todos os conflitos foram resolvidos!" -ForegroundColor Green
}

