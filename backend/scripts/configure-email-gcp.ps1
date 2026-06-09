# Configura el envío de correos de recuperación de contraseña en Cloud Run (GCP).
# Usa Gmail SMTP + Secret Manager para guardar la contraseña de forma segura.
#
# ANTES de ejecutar este script:
# 1. Activa verificación en 2 pasos en tu cuenta de Google:
#    https://myaccount.google.com/security
# 2. Crea una "Contraseña de aplicación" para "Correo":
#    https://myaccount.google.com/apppasswords
#    (son 16 caracteres, sin espacios)
#
# Uso:
#   cd backend\scripts
#   .\configure-email-gcp.ps1
#
# O con parámetros:
#   .\configure-email-gcp.ps1 -SmtpEmail "tu@gmail.com" -AppPassword "abcdabcdabcdabcd"

param(
    [string]$Project = "pulpopaul-497715",
    [string]$Region = "us-central1",
    [string]$Service = "pulpo-paul-api",
    [string]$SecretName = "smtp-password",
    [string]$SmtpEmail = "",
    [string]$AppPassword = ""
)

$ServiceAccount = "559457082433-compute@developer.gserviceaccount.com"
$FrontendUrl = "https://pulpopaul-497715.web.app"

Write-Host ""
Write-Host "=== Configurar correo SMTP en GCP (Pulpo Paul) ===" -ForegroundColor Cyan
Write-Host ""

if (-not $SmtpEmail) {
    $SmtpEmail = Read-Host "Email de Gmail o Google Workspace (ej. soporte@tudominio.cl)"
}

if (-not $AppPassword) {
    $secure = Read-Host "Contraseña de aplicación de Google (16 caracteres)" -AsSecureString
    $AppPassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    )
}

$AppPassword = $AppPassword -replace '\s', ''

if ($AppPassword.Length -lt 16) {
    Write-Error "La contraseña de aplicación debe tener 16 caracteres. Créala en https://myaccount.google.com/apppasswords"
    exit 1
}

Write-Host "Habilitando Secret Manager..." -ForegroundColor Yellow
gcloud services enable secretmanager.googleapis.com --project=$Project | Out-Null

Write-Host "Guardando contraseña en Secret Manager ($SecretName)..." -ForegroundColor Yellow
$AppPassword | gcloud secrets describe $SecretName --project=$Project 2>$null
if ($LASTEXITCODE -eq 0) {
    $AppPassword | gcloud secrets versions add $SecretName --data-file=- --project=$Project
} else {
    $AppPassword | gcloud secrets create $SecretName --data-file=- --project=$Project
}

Write-Host "Otorgando acceso al servicio de Cloud Run..." -ForegroundColor Yellow
gcloud secrets add-iam-policy-binding $SecretName `
    --member="serviceAccount:$ServiceAccount" `
    --role="roles/secretmanager.secretAccessor" `
    --project=$Project `
    --quiet | Out-Null

$SmtpFrom = "Pulpo Paul <$SmtpEmail>"

Write-Host "Actualizando Cloud Run ($Service)..." -ForegroundColor Yellow
gcloud run services update $Service `
    --region=$Region `
    --project=$Project `
    --update-env-vars="SMTP_HOST=smtp.gmail.com,SMTP_PORT=587,SMTP_USER=$SmtpEmail,SMTP_FROM=$SmtpFrom,FRONTEND_URL=$FrontendUrl,SMTP_USE_TLS=true" `
    --update-secrets="SMTP_PASSWORD=${SecretName}:latest"

if ($LASTEXITCODE -ne 0) {
    Write-Error "Error al actualizar Cloud Run."
    exit 1
}

Write-Host ""
Write-Host "Listo. El correo de recuperación de contraseña ya está configurado." -ForegroundColor Green
Write-Host "Prueba en: $FrontendUrl/login -> ¿Olvidaste tu contraseña?" -ForegroundColor Green
Write-Host ""
