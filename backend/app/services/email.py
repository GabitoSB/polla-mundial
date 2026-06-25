import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.core.config import settings

logger = logging.getLogger(__name__)


def send_password_reset_email(to_email: str, reset_url: str) -> None:
    subject = "Restablecer contraseña — Pulpo Paul"
    text_body = (
        "Recibimos una solicitud para restablecer tu contraseña en Pulpo Paul.\n\n"
        f"Usa este enlace (válido por {settings.PASSWORD_RESET_EXPIRE_MINUTES} minutos):\n"
        f"{reset_url}\n\n"
        "Si no solicitaste este cambio, puedes ignorar este correo.\n"
    )
    html_body = f"""
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #111;">
      <h2 style="color: #0d9488;">Pulpo Paul · FIFA World Cup 2026</h2>
      <p>Recibimos una solicitud para restablecer tu contraseña.</p>
      <p>
        <a href="{reset_url}"
           style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #00c9a7, #0057ff);
                  color: #fff; text-decoration: none; border-radius: 10px; font-weight: bold;">
          Restablecer contraseña
        </a>
      </p>
      <p style="font-size: 13px; color: #666;">
        El enlace expira en {settings.PASSWORD_RESET_EXPIRE_MINUTES} minutos.
        Si no solicitaste este cambio, ignora este correo.
      </p>
      <p style="font-size: 12px; color: #999; word-break: break-all;">{reset_url}</p>
    </div>
    """

    if not settings.smtp_configured:
        logger.error(
            "SMTP no configurado (SMTP_HOST=%r, SMTP_FROM=%r). "
            "No se envió correo de recuperación a %s",
            settings.SMTP_HOST,
            settings.SMTP_FROM,
            to_email,
        )
        return

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = settings.SMTP_FROM
    msg["To"] = to_email
    msg.attach(MIMEText(text_body, "plain", "utf-8"))
    msg.attach(MIMEText(html_body, "html", "utf-8"))

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=30) as server:
            if settings.SMTP_USE_TLS:
                server.starttls()
            if settings.SMTP_USER:
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_FROM, [to_email], msg.as_string())
        logger.info("Correo de recuperación enviado a %s", to_email)
    except Exception:
        logger.exception("Error al enviar correo de recuperación a %s", to_email)
