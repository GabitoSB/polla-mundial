# Despliega el backend en Cloud Run y ejecuta migraciones.
# Requiere: gcloud autenticado con el proyecto pulpopaul-497715
#
# Uso:
#   cd backend\scripts
#   .\deploy-gcp.ps1

$ErrorActionPreference = "Stop"

$Project = "pulpopaul-497715"
$Region = "us-central1"
$Service = "pulpo-paul-api"
$CloudSql = "pulpopaul-497715:us-central1:polla-db-instance"
$BackendDir = Split-Path -Parent $PSScriptRoot

Write-Host ""
Write-Host "=== Deploy backend Pulpo Paul -> Cloud Run ===" -ForegroundColor Cyan
Write-Host ""

Push-Location $BackendDir

try {
    Write-Host "[1/3] Desplegando $Service..." -ForegroundColor Yellow
    gcloud run deploy $Service `
        --source . `
        --region=$Region `
        --project=$Project `
        --add-cloudsql-instances=$CloudSql `
        --env-vars-file=env-vars.yaml `
        --update-secrets="SMTP_PASSWORD=smtp-password:latest" `
        --allow-unauthenticated `
        --port=8080 `
        --quiet

    $image = gcloud run services describe $Service `
        --region=$Region `
        --project=$Project `
        --format="value(spec.template.spec.containers[0].image)"

    Write-Host "[2/3] Actualizando job de migraciones..." -ForegroundColor Yellow
    gcloud run jobs update polla-migrate `
        --image=$image `
        --region=$Region `
        --project=$Project `
        --set-cloudsql-instances=$CloudSql `
        --env-vars-file=env-vars.yaml `
        --command=python `
        --args=migrate_prod.py `
        --quiet

    Write-Host "[3/3] Ejecutando migraciones..." -ForegroundColor Yellow
    gcloud run jobs execute polla-migrate `
        --region=$Region `
        --project=$Project `
        --wait

    $url = gcloud run services describe $Service `
        --region=$Region `
        --project=$Project `
        --format="value(status.url)"

    Write-Host ""
    Write-Host "Deploy completado: $url" -ForegroundColor Green
    Write-Host ""
    Write-Host "Siguiente paso (solo una vez): configurar correo SMTP" -ForegroundColor Yellow
    Write-Host "  .\configure-email-gcp.ps1" -ForegroundColor White
    Write-Host ""
}
finally {
    Pop-Location
}
