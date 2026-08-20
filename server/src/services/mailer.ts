import nodemailer from "nodemailer";
import { config } from "../lib/config.js";

export interface SmtpMailbox {
  email: string;
  name?: string | null;
  smtpHost?: string | null;
  smtpPort?: number;
  smtpSecure?: boolean;
  smtpUser?: string | null;
  smtpPassword?: string | null;
}

export interface SendMailOptions {
  mailbox?: SmtpMailbox;
  from?: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  html: string;
  text?: string;
}

export async function sendMail({
  mailbox,
  from,
  to,
  cc,
  bcc,
  subject,
  html,
  text,
}: SendMailOptions) {
  const smtpHost = mailbox?.smtpHost || process.env.SMTP_HOST;
  if (!smtpHost) {
    console.log("[SMTP] skipping send, no SMTP host configured");
    return;
  }

  const smtpPort =
    mailbox?.smtpPort ?? parseInt(process.env.SMTP_PORT ?? "587");
  const smtpSecure = mailbox?.smtpSecure ?? process.env.SMTP_SECURE === "true";
  const smtpUser = mailbox?.smtpUser || process.env.SMTP_USER;
  const smtpPass = mailbox?.smtpPassword || process.env.SMTP_PASS;
  const sender = from || config.email.defaultFrom || mailbox?.email;
  if (!sender) {
    throw new Error("No sender address available");
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: smtpUser ? { user: smtpUser, pass: smtpPass || "" } : undefined,
  });

  const fromHeader = mailbox?.name ? `"${mailbox.name}" <${sender}>` : sender;

  await transporter.sendMail({
    from: fromHeader,
    to: to.join(", "),
    cc: cc?.join(", "),
    bcc: bcc?.join(", "),
    subject,
    html,
    text,
  });
}
