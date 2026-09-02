# Run from project root: .\scripts\add-tochka-env.ps1
$envFile = Get-Content .env.local -Raw

function Get-EnvVal([string]$name) {
    if ($envFile -match "(?m)^${name}=`"?([^`"\r\n]+)`"?") { return $Matches[1] }
    return $null
}

$vars = @("TOCHKA_JWT","TOCHKA_CUSTOMER_CODE","TOCHKA_MERCHANT_ID")
foreach ($name in $vars) {
    $val = Get-EnvVal $name
    if (-not $val) { Write-Host "SKIP: $name not found in .env.local"; continue }
    Write-Host "Adding $name ..."
    $val | vercel env add $name production --yes 2>&1
    Write-Host "Done: $name"
}
Write-Host "`nAll done. Trigger redeploy: git commit --allow-empty -m 'chore: refresh env' && git push"
