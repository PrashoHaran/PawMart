import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

const useSmtp = Boolean(env.smtp.host);

const transporter = useSmtp
  ? nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.secure,
      auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined,
    })
  : nodemailer.createTransport({ jsonTransport: true });

export async function verifyMailer() {
  if (!useSmtp) {
    console.info('[mail] SMTP_HOST not set — emails will be logged to the console, not sent');
    return;
  }
  try {
    await transporter.verify();
    console.info(`[mail] SMTP ready (${env.smtp.host}:${env.smtp.port})`);
  } catch (err) {
    console.error('[mail] SMTP verification failed:', err.message);
  }
}

// Sends an email and reports success instead of throwing, so a mail outage
// never fails the request or job that triggered it.
export async function sendMail({ to, subject, text, html }) {
  try {
    const info = await transporter.sendMail({ from: env.emailFrom, to, subject, text, html });
    if (!useSmtp) {
      console.info(`[mail] (not sent) to=${to} subject="${subject}"\n${text}\n`);
    }
    return { ok: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[mail] failed to send "${subject}" to ${to}:`, err.message);
    return { ok: false, error: err.message };
  }
}
