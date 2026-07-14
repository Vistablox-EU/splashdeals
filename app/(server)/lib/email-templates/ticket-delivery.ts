import { EMAIL_THEME, EMAIL_COMMON_STYLES } from "./theme";

interface TicketDeliveryData {
  facilityName: string;
  facilityAddress: string;
  customerName: string;
  tickets: Array<{
    title: string;
    qrDataUrl: string; // base64 PNG data URL OR CID reference (e.g. cid:ticket-qr-0)
    qrHash?: string; // Optional raw QR hash for plain text fallback
    expiryDate: Date;
    usageLimit: number;
  }>;
  totalAmount: number;
  orderRef: string;
  successPageUrl: string;
}

export function buildTicketDeliveryHtml(data: TicketDeliveryData): string {
  const formattedAmount = new Intl.NumberFormat("sr-RS", {
    style: "currency",
    currency: "RSD",
    minimumFractionDigits: 2,
  }).format(data.totalAmount);

  const ticketRows = data.tickets
    .map((ticket, index) => {
      const formattedDate = new Date(ticket.expiryDate).toLocaleDateString("sr-RS", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      const usageText =
        ticket.usageLimit > 10
          ? "Season pass (Unlimited)"
          : `Maximum entries: ${ticket.usageLimit}`;

      return `
      <!-- Ticket Card -->
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 24px; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 12px; overflow: hidden; border-collapse: separate;">
        <tr>
          <td style="padding: 24px; text-align: center; font-family: sans-serif;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td align="center" style="padding-bottom: 16px;">
                  <span style="display: inline-block; padding: 4px 12px; background-color: #0e7490; color: #38bdf8; font-size: 11px; font-weight: bold; text-transform: uppercase; border-radius: 9999px; letter-spacing: 0.05em; font-family: sans-serif;">
                    Ticket #${index + 1}
                  </span>
                  <h3 style="margin: 8px 0 0 0; color: #f8fafc; font-size: 20px; font-weight: bold; letter-spacing: -0.025em; font-family: sans-serif;">
                    ${ticket.title}
                  </h3>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding: 8px 0;">
                  <!-- QR Code Container -->
                  <div style="display: inline-block; padding: 12px; background-color: #ffffff; border-radius: 8px;">
                    <img src="${ticket.qrDataUrl}" alt="QR Code for ${ticket.title}" width="180" height="180" style="display: block; border: 0;" />
                  </div>
                </td>
              </tr>
              <tr>
                <td style="padding-top: 16px; font-family: sans-serif; font-size: 14px; line-height: 20px; color: #94a3b8; text-align: center;">
                  <p style="margin: 0 0 4px 0; font-weight: 600; color: #38bdf8; font-family: sans-serif;">${usageText}</p>
                  <p style="margin: 0; font-size: 12px; color: #64748b; font-family: sans-serif;">Valid until: <strong style="color: #cbd5e1;">${formattedDate}</strong></p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `;
    })
    .join("");

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="sr">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your Splashdeals Tickets Are Ready!</title>
  <style type="text/css">${EMAIL_COMMON_STYLES}</style>
</head>
<body style="margin: 0; padding: 0; background-color: ${EMAIL_THEME.bgBody};">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #020617; min-height: 100vh; padding: 24px 0;">
    <tr>
      <td align="center" valign="top">
        <!-- Main Email Container -->
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px; background-color: #020617; border-collapse: separate;">
          
          <!-- Header (Logo) -->
          <tr>
            <td align="center" style="padding: 24px 0 32px 0;">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center">
                    <span style="font-size: 28px; font-weight: 800; letter-spacing: -0.05em; color: #06b6d4; font-family: sans-serif;">
                      🌊 splash<span style="color: #f8fafc;">deals</span>
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Hero Message Card -->
          <tr>
            <td style="padding: 32px; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 16px; margin-bottom: 24px; text-align: center; font-family: sans-serif;">
              <span style="font-size: 40px; display: inline-block; margin-bottom: 16px;">🎫</span>
              <h1 style="margin: 0 0 12px 0; color: #f8fafc; font-size: 26px; font-weight: 800; line-height: 32px; letter-spacing: -0.025em; font-family: sans-serif;">
                Your Tickets Are Ready!
              </h1>
              <p style="margin: 0; color: #94a3b8; font-size: 16px; line-height: 24px; font-family: sans-serif;">
                Thank you for your purchase through <strong>Splashdeals</strong>. Your tickets with QR codes have been created and are ready for use.
              </p>
            </td>
          </tr>

          <!-- Spacing -->
          <tr><td style="height: 24px; font-size: 0; line-height: 0;">&nbsp;</td></tr>

          <!-- Transaction Info Box -->
          <tr>
            <td style="padding: 24px; background-color: #020617; border: 1px solid #1e293b; border-radius: 12px; margin-bottom: 24px; font-family: sans-serif;">
              <h4 style="margin: 0 0 16px 0; color: #38bdf8; font-size: 14px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; font-family: sans-serif;">
                Order Details
              </h4>
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="font-size: 14px; line-height: 22px; color: #94a3b8; font-family: sans-serif;">
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-weight: 500; font-family: sans-serif;">Facility:</td>
                  <td style="padding: 6px 0; text-align: right; color: #f8fafc; font-weight: 600; font-family: sans-serif;">${data.facilityName}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-weight: 500; font-family: sans-serif;">Address:</td>
                  <td style="padding: 6px 0; text-align: right; color: #cbd5e1; font-family: sans-serif;">${data.facilityAddress}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-weight: 500; font-family: sans-serif;">Reference:</td>
                  <td style="padding: 6px 0; text-align: right; font-family: monospace; color: #cbd5e1;">#${data.orderRef}</td>
                </tr>
                <tr>
                  <td colspan="2" style="padding-top: 12px; border-bottom: 1px solid #1e293b; font-size: 0; line-height: 0;">&nbsp;</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0 0 0; color: #64748b; font-weight: bold; font-size: 15px; font-family: sans-serif;">Total paid:</td>
                  <td style="padding: 12px 0 0 0; text-align: right; color: #06b6d4; font-weight: 800; font-size: 18px; font-family: sans-serif;">${formattedAmount}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Spacing -->
          <tr><td style="height: 24px; font-size: 0; line-height: 0;">&nbsp;</td></tr>

          <!-- Header for Tickets -->
          <tr>
            <td style="padding: 0 0 12px 0; font-family: sans-serif;">
              <h2 style="margin: 0; color: #f8fafc; font-size: 18px; font-weight: bold; letter-spacing: -0.02em; font-family: sans-serif;">
                Your Tickets
              </h2>
              <p style="margin: 4px 0 0 0; color: #64748b; font-size: 13px; font-family: sans-serif;">
                Present the QR code below at the venue entrance for scanning.
              </p>
            </td>
          </tr>

          <!-- Ticket Cards List -->
          <tr>
            <td style="padding-top: 8px;">
              ${ticketRows}
            </td>
          </tr>

          <!-- CTA Button Section -->
          ${
            data.successPageUrl
              ? `
          <tr>
            <td align="center" style="padding: 16px 0 32px 0;">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="background-color: #06b6d4; border-radius: 8px;">
                    <a href="${data.successPageUrl}" target="_blank" style="display: inline-block; padding: 14px 28px; font-family: sans-serif; font-size: 15px; font-weight: bold; color: #020617; text-decoration: none; border-radius: 8px;">
                      View Tickets on Site
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          `
              : ""
          }

          <!-- Footer Section -->
          <tr>
            <td style="padding: 32px 0 16px 0; border-top: 1px solid #1e293b; text-align: center; font-size: 12px; line-height: 18px; color: #64748b; font-family: sans-serif;">
              <p style="margin: 0 0 8px 0; font-family: sans-serif;">
                This email was automatically sent after your purchase on the Splashdeals platform.
              </p>
              <p style="margin: 0 0 12px 0; font-family: sans-serif;">
                For support and questions, feel free to contact us at <a href="mailto:support@splashdeals.rs" style="color: #38bdf8; text-decoration: none;">support@splashdeals.rs</a>.
              </p>
              <p style="margin: 0; font-weight: bold; color: #475569; font-family: sans-serif;">
                &copy; ${new Date().getFullYear()} Splashdeals. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildTicketDeliveryText(data: TicketDeliveryData): string {
  const ticketsList = data.tickets
    .map((t, i) => {
      const usageText =
        t.usageLimit > 10 ? "Season pass (Unlimited)" : `Maximum entries: ${t.usageLimit}`;
      const formattedDate = new Date(t.expiryDate).toLocaleDateString("sr-RS");
      const hashText = t.qrHash ? `\n   - Code: ${t.qrHash}` : "";
      return `${i + 1}. ${t.title}${hashText}\n   - ${usageText}\n   - Valid until: ${formattedDate}`;
    })
    .join("\n\n");

  return `
Your Splashdeals tickets are ready! 🎫
=========================================

Thank you for your purchase through Splashdeals. Your tickets with QR codes have been created and are ready for use.

ORDER DETAILS
------------------
Facility: ${data.facilityName}
Address: ${data.facilityAddress}
Reference: #${data.orderRef}
Total paid: ${data.totalAmount.toFixed(2)} RSD

YOUR TICKETS
-------------
${ticketsList}

To view your QR codes and ticket details on our website, visit the following link:
${data.successPageUrl || "Splashdeals website"}

-----------------------------------------
Support: support@splashdeals.rs
(c) ${new Date().getFullYear()} Splashdeals. All rights reserved.
  `;
}
