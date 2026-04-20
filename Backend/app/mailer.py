"""
Módulo de correo electrónico para Quiniepicks.
Usa smtplib con Gmail (App Password) o cualquier servidor SMTP.

Variables de entorno requeridas para envío real:
  SMTP_HOST   — por defecto smtp.gmail.com
  SMTP_PORT   — por defecto 587
  SMTP_USER   — dirección Gmail (ej. soporte.quiniepicks@gmail.com)
  SMTP_PASS   — contraseña de aplicación Gmail (16 chars sin espacios)
  SMTP_FROM_NAME — nombre visible (por defecto "Quiniepicks")

Si SMTP_USER/SMTP_PASS están vacíos, el código se imprime en logs
(útil para desarrollo local).
"""

import os
import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

logger = logging.getLogger(__name__)


def _html_codigo_reset(codigo: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Código de recuperación</title>
</head>
<body style="margin:0;padding:0;background:#f2f2ef;font-family:'Nunito',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f2f2ef;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">

          <!-- Header -->
          <tr>
            <td style="background:#1a1a1a;border-radius:20px 20px 0 0;padding:28px 32px 24px;">
              <p style="margin:0;font-size:22px;font-weight:900;color:#3dbb78;letter-spacing:-0.5px;">
                Quiniepicks
              </p>
              <p style="margin:6px 0 0;font-size:13px;color:#a0a0a0;font-weight:600;">
                Recuperación de contraseña
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:32px 32px 24px;border-left:1px solid #e4e4e0;border-right:1px solid #e4e4e0;">
              <p style="margin:0 0 8px;font-size:16px;font-weight:800;color:#1a1a1a;">
                Hola 👋
              </p>
              <p style="margin:0 0 24px;font-size:14px;color:#6b6b6b;line-height:1.6;">
                Recibimos una solicitud para restablecer la contraseña de tu cuenta.
                Usa el siguiente código de 6 dígitos. Expira en <strong>15 minutos</strong>.
              </p>

              <!-- Code box -->
              <div style="background:#f2f2ef;border-radius:16px;padding:24px;text-align:center;margin-bottom:24px;">
                <p style="margin:0 0 6px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#6b6b6b;">
                  Tu código
                </p>
                <p style="margin:0;font-size:42px;font-weight:900;letter-spacing:12px;color:#1a1a1a;font-family:'Courier New',monospace;">
                  {codigo}
                </p>
              </div>

              <p style="margin:0;font-size:12px;color:#a0a0a0;line-height:1.6;">
                Si no solicitaste este código, puedes ignorar este correo. Tu contraseña
                actual permanecerá sin cambios.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#fafaf8;border-radius:0 0 20px 20px;padding:20px 32px;border:1px solid #e4e4e0;border-top:0;">
              <p style="margin:0;font-size:11px;color:#a0a0a0;text-align:center;">
                © 2025 Quiniepicks · Este es un correo automático, no respondas a él.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def enviar_codigo_reset(correo: str, codigo: str) -> bool:
    """Envía el código de recuperación al correo indicado. Retorna True si exitoso."""
    smtp_host = os.environ.get("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.environ.get("SMTP_PORT", "587"))
    smtp_user = os.environ.get("SMTP_USER", "")
    smtp_pass = os.environ.get("SMTP_PASS", "")
    from_name = os.environ.get("SMTP_FROM_NAME", "Quiniepicks")

    if not smtp_user or not smtp_pass:
        logger.warning("[mailer] SMTP no configurado — modo simulación (código NO se registra en logs de producción)")
        return True

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"Tu código de recuperación: {codigo} — Quiniepicks"
    msg["From"] = f"{from_name} <{smtp_user}>"
    msg["To"] = correo
    msg.attach(MIMEText(_html_codigo_reset(codigo), "html", "utf-8"))

    try:
        with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as server:
            server.ehlo()
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.sendmail(smtp_user, [correo], msg.as_string())
        logger.info("[mailer] Correo enviado a %s", correo)
        return True
    except Exception as exc:
        logger.error("[mailer] Error enviando a %s: %s", correo, exc)
        return False
