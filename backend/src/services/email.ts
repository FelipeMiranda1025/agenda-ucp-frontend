import nodemailer, { Transporter } from "nodemailer";

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (transporter) return transporter;
  const port = Number(process.env.SMTP_PORT ?? 587);
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "smtp.gmail.com",
    port,
    secure: process.env.SMTP_SECURE === "true" || port === 465,
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
  });
  return transporter;
}

const FROM =
  process.env.SMTP_FROM ?? '"Agenda Docente UCP" <no-reply@ucp.edu.co>';

/** Envía el correo de recuperación de contraseña con plantilla institucional UCP */
export async function sendPasswordResetEmail(
  to: string,
  firstName: string,
  resetUrl: string
): Promise<void> {
  const html = `
  <!doctype html>
  <html lang="es">
    <body style="margin:0;padding:0;background:#f4f6f9;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f4f6f9;padding:32px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 6px rgba(0,0,0,0.05);">
              <tr>
                <td style="background:#0a4d8c;padding:24px 32px;color:#ffffff;font-size:18px;font-weight:bold;">
                  Agenda Docente — Universidad Católica de Pereira
                </td>
              </tr>
              <tr>
                <td style="padding:32px;">
                  <h2 style="margin:0 0 16px;font-size:20px;color:#0a4d8c;">Hola, ${firstName}</h2>
                  <p style="margin:0 0 16px;line-height:1.5;">
                    Recibimos una solicitud para restablecer tu contraseña en el Sistema de Agenda Docente.
                  </p>
                  <p style="margin:0 0 24px;line-height:1.5;">
                    Haz clic en el botón para crear una nueva contraseña.
                    El enlace es válido por <strong>30 minutos</strong>.
                  </p>
                  <p style="text-align:center;margin:32px 0;">
                    <a href="${resetUrl}"
                       style="background:#0a4d8c;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:6px;font-weight:bold;display:inline-block;">
                      Restablecer contraseña
                    </a>
                  </p>
                  <p style="margin:24px 0 0;font-size:13px;color:#6b7280;line-height:1.5;">
                    Si no solicitaste este cambio, puedes ignorar este correo.
                    Tu contraseña actual permanecerá sin cambios.
                  </p>
                  <hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0;" />
                  <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
                    Sistema de Agenda Docente · Universidad Católica de Pereira
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>`;

  await getTransporter().sendMail({
    from: FROM,
    to,
    subject: "Recuperación de contraseña — Agenda Docente UCP",
    html,
  });
}

/** Verifica conectividad SMTP (no bloquea el arranque si falla) */
export async function verifyEmailConnection(): Promise<void> {
  try {
    await getTransporter().verify();
    console.log("✅ Conexión SMTP verificada correctamente");
  } catch (err) {
    console.warn(
      "⚠️  No se pudo verificar SMTP (el servidor arrancó igual):",
      err
    );
  }
}
