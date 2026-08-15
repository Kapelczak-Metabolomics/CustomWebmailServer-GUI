import nodemailer from "nodemailer";
import { config } from "../lib/config.js";

export interface SendMailOptions {
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  html: string;
  text?: string;
}

export async function sendMail({
  from,
  to,
  cc,
  bcc,
  subject,
  html,
  text,
}: SendMailOptions) {
  if (!config.email.defaultFrom) {
    throw new Error("EMAIL_DEFAULT_FROM is not set");
  }
  if (!process.env.SMTP_HOST) {
    console.log("[SMTP] skipping send, SMTP_HOST not configured");
    return;
  }
  // Basic stub: replace with mailbox SMTP lookup in production
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "localhost",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  await transporter.sendMail({
    from: `"${from}" <${config.email.defaultFrom}>`,
    to: to.join(", "),
    cc: cc?.join(", "),
    bcc: bcc?.join(", "),
    subject,
    html,
    text,
  });
}
