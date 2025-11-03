# Script para converter imagens JPG/PNG para WebP
# Requer: magick (ImageMagick) instalado

Write-Host "=== Conversor de Imagens para WebP ===" -ForegroundColor Cyan
Write-Host ""

# Verificar se ImageMagick está instalado
try {
    $null = magick --version
    Write-Host "[OK] ImageMagick detectado" -ForegroundColor Green
} catch {
    Write-Host "[ERRO] ImageMagick não encontrado!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Para instalar o ImageMagick:" -ForegroundColor Yellow
    Write-Host "1. Via Chocolatey: choco install imagemagick" -ForegroundColor Yellow
    Write-Host "2. Via Winget: winget install ImageMagick.ImageMagick" -ForegroundColor Yellow
    Write-Host "3. Download direto: https://imagemagick.org/script/download.php" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

Write-Host ""

# Função para converter uma imagem
function Convert-ToWebP {
    param(
        [string]$InputPath,
        [int]$Quality = 85
    )
    
    $outputPath = [System.IO.Path]::ChangeExtension($InputPath, ".webp")
    
    if (Test-Path $outputPath) {
        Write-Host "[SKIP] $outputPath já existe" -ForegroundColor Yellow
        return $outputPath
    }
    
    try {
        Write-Host "[CONVERTING] $InputPath -> $outputPath" -ForegroundColor Cyan
        magick convert "$InputPath" -quality $Quality "$outputPath"
        
        # Comparar tamanhos
        $originalSize = (Get-Item $InputPath).Length
        $webpSize = (Get-Item $outputPath).Length
        $reduction = [math]::Round((1 - ($webpSize / $originalSize)) * 100, 1)
        
        Write-Host "[OK] Redução: $reduction% ($(Format-FileSize $originalSize) -> $(Format-FileSize $webpSize))" -ForegroundColor Green
        return $outputPath
    } catch {
        Write-Host "[ERRO] Falha ao converter: $_" -ForegroundColor Red
        return $null
    }
}

# Função auxiliar para formatar tamanho de arquivo
function Format-FileSize {
    param([long]$Size)
    if ($Size -gt 1MB) { return "{0:N2} MB" -f ($Size / 1MB) }
    if ($Size -gt 1KB) { return "{0:N2} KB" -f ($Size / 1KB) }
    return "$Size bytes"
}

# Converter imagens de produtos
Write-Host "=== Convertendo Imagens de Produtos ===" -ForegroundColor Cyan
Write-Host ""

$productImages = @(
    ".\src\img\produtos\funkopop\funkopop_1.jpg",
    ".\src\img\produtos\funkopop\funkopop_1.1.jpg",
    ".\src\img\produtos\funkopop\funkopop_2.jpg",
    ".\src\img\produtos\funkopop\funkopop_2.1.jpg",
    ".\src\img\produtos\quadros\quadro_1.png",
    ".\src\img\produtos\quadros\quadro_1.1.png"
)

foreach ($img in $productImages) {
    if (Test-Path $img) {
        Convert-ToWebP -InputPath $img -Quality 85
    } else {
        Write-Host "[WARN] Arquivo não encontrado: $img" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "=== Convertendo Ícones ===" -ForegroundColor Cyan
Write-Host ""

$iconImages = @(
    ".\src\img\icons\logo.jpg",
    ".\src\img\icons\instagram.png",
    ".\src\img\icons\email.png"
)

foreach ($img in $iconImages) {
    if (Test-Path $img) {
        Convert-ToWebP -InputPath $img -Quality 90
    } else {
        Write-Host "[WARN] Arquivo não encontrado: $img" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "=== Conversão Concluída ===" -ForegroundColor Green
Write-Host ""
Write-Host "Próximos passos:" -ForegroundColor Yellow
Write-Host "1. Atualizar src/db/products.json com caminhos .webp" -ForegroundColor Yellow
Write-Host "2. Atualizar index.html e products.html com imagens WebP" -ForegroundColor Yellow
Write-Host "3. Implementar tag <picture> para fallback (opcional)" -ForegroundColor Yellow
Write-Host ""
