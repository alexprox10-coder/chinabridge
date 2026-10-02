# Загрузка реестра МСП ФНС → парсинг → сохранение в Neon через chinabridge.pro
# Запуск: .\scripts\outreach\run-msp.ps1 [-Limit 5000] [-Clear]
param(
  [int]$Limit = 5000,
  [switch]$Clear
)

$ErrorActionPreference = "Stop"
$ZipDest = "$env:TEMP\chinabridge-rsmp.zip"

Write-Host "=== Реестр МСП → База продавцов ===" -ForegroundColor Cyan
Write-Host "Лимит: $Limit  |  Очистка: $Clear"

# 1. Найти актуальный архив
Write-Host "`n[1/3] Ищу ссылку на архив..." -ForegroundColor Yellow
$indexUrl = "https://www.nalog.gov.ru/opendata/7707329152-rsmp/"
$html = (Invoke-WebRequest -Uri $indexUrl -UseBasicParsing -TimeoutSec 30).Content
$match = [regex]::Match($html, 'https?://file\.nalog\.ru/opendata/7707329152-rsmp/data-[\d]+-structure-[\d]+\.zip')
if (-not $match.Success) { Write-Error "Ссылка на архив не найдена"; exit 1 }
$archiveUrl = $match.Value
Write-Host "Архив: $archiveUrl"

# 2. Скачать архив (с докачкой)
Write-Host "`n[2/3] Скачиваю архив..." -ForegroundColor Yellow
$existingSize = 0
if (Test-Path $ZipDest) { $existingSize = (Get-Item $ZipDest).Length }

$headResp = Invoke-WebRequest -Uri $archiveUrl -Method HEAD -UseBasicParsing
$totalSize = [long]$headResp.Headers["Content-Length"]
Write-Host "Размер: $([math]::Round($totalSize/1MB,1)) МБ  |  Уже скачано: $([math]::Round($existingSize/1MB,1)) МБ"

if ($existingSize -ge $totalSize) {
  Write-Host "Архив уже скачан полностью." -ForegroundColor Green
} else {
  $headers = @{}
  if ($existingSize -gt 0) { $headers["Range"] = "bytes=$existingSize-" }
  $wc = New-Object System.Net.WebClient
  foreach ($h in $headers.GetEnumerator()) { $wc.Headers.Add($h.Key, $h.Value) }
  Write-Host "Скачиваю (это может занять несколько минут)..."
  if ($existingSize -gt 0) {
    $tmpDest = "$ZipDest.part"
    $wc.DownloadFile($archiveUrl, $tmpDest)
    $srcStream = [System.IO.File]::OpenRead($tmpDest)
    $dstStream = [System.IO.File]::Open($ZipDest, [System.IO.FileMode]::Append)
    $srcStream.CopyTo($dstStream)
    $srcStream.Close(); $dstStream.Close()
    Remove-Item $tmpDest -ErrorAction SilentlyContinue
  } else {
    $wc.DownloadFile($archiveUrl, $ZipDest)
  }
  Write-Host "Скачано: $([math]::Round((Get-Item $ZipDest).Length/1MB,1)) МБ" -ForegroundColor Green
}

# 3. Парсить и сохранить
Write-Host "`n[3/3] Парсю и сохраняю (Node.js + Vercel API)..." -ForegroundColor Yellow
$clearFlag = if ($Clear) { "--clear" } else { "" }
$cmd = "node scripts/outreach/parse-msp-registry.mjs --zip=`"$ZipDest`" --limit=$Limit $clearFlag"
Write-Host "Команда: $cmd"
Invoke-Expression $cmd

Write-Host "`nГотово! Открой https://chinabridge.pro/admin/sellers-base" -ForegroundColor Green
