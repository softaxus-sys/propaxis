/**
 * Transactional email — SMTP-based (via nodemailer) rather than tied to a specific
 * provider's HTTP API, matching this project's existing "bring your own credentials"
 * pattern (see Qasro AI's AI_BASE_URL). Any SMTP-capable provider works — currently
 * configured with ZeptoMail (qasro.com verified sender), but SES, Postmark, SendGrid,
 * Office365, Google Workspace etc. all work the same way — set
 * EMAIL_SMTP_HOST/PORT/USER/PASSWORD.
 *
 * Fails safe: with no SMTP configured, sendEmail logs a warning and returns
 * { sent: false } instead of throwing — callers (lead routing, etc.) must not let a
 * missing/broken email config block the action that triggered the email.
 */

import nodemailer, { type Transporter } from "nodemailer";

let cachedTransporter: Transporter | null | undefined;

function getTransporter(): Transporter | null {
  if (cachedTransporter !== undefined) return cachedTransporter;

  const host = process.env.EMAIL_SMTP_HOST;
  const user = process.env.EMAIL_SMTP_USER;
  const pass = process.env.EMAIL_SMTP_PASSWORD;
  const port = Number(process.env.EMAIL_SMTP_PORT) || 587;

  if (!host || !user || !pass) {
    cachedTransporter = null;
    return null;
  }

  cachedTransporter = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });
  return cachedTransporter;
}

export const CONTACT_EMAIL = process.env.CONTACT_EMAIL || "hello@softaxis.ae";
const DEFAULT_FROM = process.env.EMAIL_FROM || "Qasro <noreply@qasro.com>";

export type SendEmailInput = {
  to: string | string[];
  cc?: string | string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
};

export type SendEmailResult = { sent: boolean; reason?: "not_configured" | "send_failed" };

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn(
      `[email] SMTP not configured (EMAIL_SMTP_HOST/USER/PASSWORD) — not sent: "${input.subject}" to ${
        Array.isArray(input.to) ? input.to.join(", ") : input.to
      }`,
    );
    return { sent: false, reason: "not_configured" };
  }

  try {
    await transporter.sendMail({
      from: DEFAULT_FROM,
      to: input.to,
      cc: input.cc,
      replyTo: input.replyTo || CONTACT_EMAIL,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });
    return { sent: true };
  } catch (err) {
    console.error("[email] send failed:", err instanceof Error ? err.message : err);
    return { sent: false, reason: "send_failed" };
  }
}
