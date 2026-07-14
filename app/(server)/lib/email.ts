/**
 * 📧 Email service using AWS SES (no nodemailer dependency).
 * Avoids Turbopack Node.js builtin resolution issues.
 */
import "server-only";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { prisma } from "./prisma";
import { getDictionary } from "@/lib/dictionaries";

const sesClient = new SESClient({
  region: process.env.AWS_REGION || "eu-central-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const FROM = process.env.SMTP_FROM || "Splashdeals <noreply@splashdeals.rs>";

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  await sesClient.send(
    new SendEmailCommand({
      Source: FROM,
      Destination: { ToAddresses: [to] },
      Message: {
        Subject: { Data: subject },
        Body: { Html: { Data: html } },
      },
    }),
  );
}

export async function sendOrderConfirmation(transactionId: string): Promise<void> {
  const dict = await getDictionary();
  const e = dict.email;

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

  const html = buildTicketEmailHtml(
    transaction.facility.name,
    ticketRows,
    qrImages,
    Number(transaction.totalAmount),
    transaction.stripeSession,
    e,
  );
  const subject = e.ticket_delivery_subject.replace("{facility}", transaction.facility.name);
  await sendEmail(transaction.user.email, subject, html);
}

export async function sendRecoveryEmail(email: string, items: any[]) {
  const dict = await getDictionary();
  const e = dict.email;

  const html = `<p>${e.recovery_intro}</p>
    <ul>${items.map((i: any) => `<li>${i.quantity}x ${i.title}</li>`).join("")}</ul>
    <a href="${process.env.NEXT_PUBLIC_BASE_URL}/cart" style="display:block;padding:12px;background:#000;color:#fff;text-align:center;border-radius:8px;">${e.recovery_view_cart}</a>`;
  await sendEmail(email, e.recovery_subject, html);
}

function buildTicketEmailHtml(
  facilityName: string,
  ticketRows: any[],
  qrImages: string,
  total: number,
  sessionId: string,
  e: Record<string, any>,
): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;background:#f5f5f5;padding:24px">
  <div style="max-width:600px;margin:0 auto;background:white;border-radius:12px;padding:24px">
    <h1 style="color:#1a1a1a">${e.order_confirmation_intro}</h1>
    <p style="color:#666">${e.order_confirmation_tickets_ready}</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0">
      <tr><td style="padding:8px 0;color:#666">${e.order_confirmation_facility}</td><td style="text-align:right;font-weight:bold">${facilityName}</td></tr>
      ${ticketRows.map((t: any) => `<tr><td style="padding:8px 0;color:#666">${t.type || e.order_confirmation_ticket_default}</td><td style="text-align:right;font-weight:bold">${t.quantity}x ${Number(t.price).toLocaleString("sr-RS")} RSD</td></tr>`).join("")}
      <tr><td style="border-top:1px solid #ddd;padding:8px 0;color:#666">${e.order_confirmation_total}</td><td style="border-top:1px solid #ddd;text-align:right;font-weight:bold">${total.toLocaleString("sr-RS")} RSD</td></tr>
    </table>
    <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin:24px 0">${qrImages}</div>
    <a href="${process.env.NEXT_PUBLIC_BASE_URL}/success?session=${sessionId}" style="display:block;background:#1a1a1a;color:white;text-align:center;padding:12px;border-radius:8px;text-decoration:none;font-weight:bold">${e.order_confirmation_download}</a>
  </div>
</body></html>`;
}
