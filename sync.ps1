# Script de sincronización rápida
# Uso: .\sync.ps1 "mensaje de commit"

param(
    [string]$mensaje = "Actualización automática"
)

Write-Host "Sincronizando cambios..." -ForegroundColor Cyan

# Verificar si hay cambios
$status = git status --porcelain
if ($status) {
    Write-Host "Cambios detectados. Subiendo..." -ForegroundColor Yellow
    git add .
    git commit -m $mensaje
    git push
    Write-Host "✓ Cambios subidos correctamente" -ForegroundColor Green
} else {
    Write-Host "No hay cambios para subir" -ForegroundColor Gray
}

# Bajar cambios del servidor
Write-Host "Bajando cambios del servidor..." -ForegroundColor Cyan
git pull

Write-Host "✓ Sincronización completa" -ForegroundColor Green
