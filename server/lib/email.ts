import "server-only";
import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { prisma } from "./prisma";

/**
 * Hook for external error reporting (e.g. Sentry, DataDog).
 * Set via configureEmailReporter() before sending emails.
 */
let reportEmailError: ((error: unknown, subject: string) => void) | null = null;

export function configureEmailReporter(reporter: (error: unknown, subject: string) => void): void {
  reportEmailError = reporter;
}

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

export type EmailAttachment = {
  filename: string;
  content: string | Buffer;
  encoding?: string;
  cid?: string;
};

export type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: EmailAttachment[];
};

/**
 * 📧 Splashdeals Email Service
 * Uses Nodemailer with SMTP transport.
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
  attachments,
}: EmailPayload): Promise<void> {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    const log = process.env.NODE_ENV === "production" ? console.error : console.warn;
    log("[Email] SMTP not configured. Skipping email send.");
    log("[Email] Required: SMTP_USER, SMTP_PASS. Optional: SMTP_HOST, SMTP_PORT, SMTP_FROM.");

    // In dev, we might want to log the content if SMTP is missing
    if (process.env.NODE_ENV === "development") {
      console.log("--- DEVELOPMENT EMAIL LOG ---");
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Content: ${text || "HTML provided"}`);
      if (attachments && attachments.length > 0) {
        console.log(
          `Attachments: ${attachments.map((a) => `${a.filename} (CID: ${a.cid})`).join(", ")}`,
        );
      }
      console.log("----------------------------");
    }
    return;
  }

  try {
    await getTransporter().sendMail({
      from: process.env.SMTP_FROM || "Splashdeals <noreply@splashdeals.rs>",
      to,
      subject,
      html,
      text: text || undefined,
      attachments: attachments || [],
    });
    console.log(`[Email] ✅ Sent "${subject}" to ${to}`);
  } catch (error) {
    console.error(`[Email] ❌ Failed to send "${subject}" to ${to}:`, error);
    reportEmailError?.(error, subject);
    throw error;
  }
}

/**
 * 🎫 Sends an order confirmation email with QR codes for tickets.
 * Used both for initial delivery (webhook) and resend (success page).
 */
export async function sendOrderConfirmation(transactionId: string): Promise<void> {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: {
      user: { select: { email: true } },
      facility: { select: { name: true, slug: true } },
      issuedTickets: true,
    },
  });
  if (!transaction || !transaction.user.email) return;

  const ticketRows = (transaction.ticketDetails as any[]) || [];
  const qrImages = transaction.issuedTickets
    .map(
      (t) =>
        `<img src="${process.env.NEXT_PUBLIC_BASE_URL}/api/qr/${t.qrHash}.png" width="150" height="150" alt="QR kod" />`,
    )
    .join("");

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;background:#f5f5f5;padding:24px">
  <div style="max-width:600px;margin:0 auto;background:white;border-radius:12px;padding:24px">
    <h1 style="color:#1a1a1a">Hvala na kupovini!</h1>
    <p style="color:#666">Tvoje karte su spremne.</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0">
      <tr><td style="padding:8px 0;color:#666">Objekat:</td><td style="text-align:right;font-weight:bold">${transaction.facility.name}</td></tr>
      ${ticketRows
        .map(
          (t: any) => `
        <tr><td style="padding:8px 0;color:#666">${t.type || "Ulaznica"}</td><td style="text-align:right;font-weight:bold">${t.quantity}x ${t.price} RSD</td></tr>
      `,
        )
        .join("")}
      <tr><td style="border-top:1px solid #ddd;padding:8px 0;color:#666">Ukupno:</td><td style="border-top:1px solid #ddd;text-align:right;font-weight:bold">${Number(transaction.totalAmount).toLocaleString("sr-RS")} RSD</td></tr>
    </table>
    <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin:24px 0">${qrImages}</div>
    <a href="${process.env.NEXT_PUBLIC_BASE_URL}/success?session=${transaction.stripeSession}" 
       style="display:block;background:#1a1a1a;color:white;text-align:center;padding:12px;border-radius:8px;text-decoration:none;font-weight:bold">
      Preuzmi svoje karte
    </a>
  </div>
</body>
</html>`;

  await sendEmail({
    to: transaction.user.email,
    subject: `Tvoje karte za ${transaction.facility.name} su spremne!`,
    html,
  });
}
