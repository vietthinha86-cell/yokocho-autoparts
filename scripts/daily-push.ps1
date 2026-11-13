param(
    [Parameter(Mandatory = $true)]
    [string]$Message
)

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $RepoRoot

Write-Host "==> [1/4] Kiem tra TypeScript va Backend Tests..." -ForegroundColor Cyan
npm run typecheck
if ($LASTEXITCODE -ne 0) {
    throw "Typecheck that bai. Huy push de tranh day code loi."
}

npm run test:backend
if ($LASTEXITCODE -ne 0) {
    throw "Backend tests that bai. Huy push."
}

Write-Host "==> [2/4] Cap nhat nhat ky ngay trong CHANGELOG.md..." -ForegroundColor Cyan
$today = Get-Date -Format "yyyy-MM-dd HH:mm"
Add-Content -Path "CHANGELOG.md" -Value "`n- **[$today]** $Message" -Encoding UTF8

Write-Host "==> [3/4] Commit thay doi..." -ForegroundColor Cyan
git add .
git status --short
git commit -m "$Message"

Write-Host "==> [4/4] Day len GitHub (origin main)..." -ForegroundColor Cyan
$remote = git remote 2>$null
if (-not $remote) {
    Write-Warning "Chua gan remote 'origin'. Hay chay: git remote add origin https://github.com/vietthinha86-cell/yokocho-autoparts.git"
    exit 1
}

git push -u origin main
Write-Host "Hoan tat! GitHub Actions se tu dong kiem tra build & deploy." -ForegroundColor Green

