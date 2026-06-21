import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { prisma } from "@/server/lib/prisma";
import { getNextSubscriptionExpiry } from "@/server/lib/utils/seasonal";
import { after } from "next/server";
import { TicketStatus } from "@prisma/client";
import crypto from "node:crypto";
import { sendEmail } from "@/server/lib/email";
import { buildTicketDeliveryHtml, buildTicketDeliveryText } from "@/server/lib/email-templates/ticket-delivery";
import QRCode from "qrcode";

/**
 * 🌊 Hardened Stripe Webhook Handler
 */
export async function POST(req: Request) {
  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSecret || !endpointSecret) {
    console.error("Missing Stripe configuration.");
    return NextResponse.json(
      { error: "Configuration Error" },
      { 
        status: 200,
        headers: { 'Cache-Control': 'no-store, must-revalidate' }
      }
    );
  }

  const body = await req.text();
  const signature = (await headers()).get("Stripe-Signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing signature" },
      { 
        status: 400,
        headers: { 'Cache-Control': 'no-store, must-revalidate' }
      }
    );
  }

  const stripe = new Stripe(stripeSecret, {
    apiVersion: "2026-05-27.dahlia",
  });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`⚠️ Signature verification failed: ${message}`);
    return NextResponse.json(
      { error: "Invalid signature" },
      { 
        status: 400,
        headers: { 'Cache-Control': 'no-store, must-revalidate' }
      }
    );
  }

  // ⚡ Return 200 immediately to Stripe to prevent timeouts
  // Use waitUntil (Next.js 15+) for background processing
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    
    // Fire-and-forget with after (Next.js 15+)
    after(() => fulfillOrder(session));
    
    return NextResponse.json(
      { received: true },
      { headers: { 'Cache-Control': 'no-store, must-revalidate' } }
    );
  }

  return NextResponse.json(
    { received: true },
    { headers: { 'Cache-Control': 'no-store, must-revalidate' } }
  );
}

/**
 * 🛠️ Order Fulfillment logic with partial failure protection and atomicity
 */
export async function fulfillOrder(session: Stripe.Checkout.Session) {
  const metadata = session.metadata;
  if (!metadata || !metadata.orderDetails) {
    console.error(`[FULFILLMENT ERROR] No metadata for session ${session.id}`);
    return;
  }

  try {
    const orderDetails: { ticketPriceId: string; quantity: number; facilityId: string; ticketTypeTitle: string; priceLabel: string | null; unitPrice: number; dayType: string | null; timeSlot: string | null }[] = JSON.parse(metadata.orderDetails);
    const { fulfillmentEmail, holderName, holderPhotoUrl } = metadata;
    const targetEmail = fulfillmentEmail || session.customer_details?.email;
    
    // 1. Resolve User
    let userId = "";
    if (targetEmail) {
      const user = await prisma.user.upsert({
        where: { email: targetEmail },
        update: { name: session.customer_details?.name || "Customer" },
        create: { email: targetEmail, name: session.customer_details?.name || "Customer" }
      });
      userId = user.id;
    }

    // 2. Atomic Fulfillment Transaction
    const transaction = await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.upsert({
        where: { stripeSession: session.id },
        update: {
          status: "SUCCESS",
          userId: userId || "",
        },
        create: {
          stripeSession: session.id,
          facilityId: orderDetails[0].facilityId,
          totalAmount: (session.amount_total || 0) / 100,
          currency: "RSD",
          status: "SUCCESS",
          userId: userId || "",
        }
      });

      const existingTickets = await tx.issuedTicket.count({
        where: { transactionId: transaction.id }
      });
      if (existingTickets > 0) {
        console.log(`[FULFILLMENT] Tickets already exist for session ${session.id}. Skipping.`);
        return null;
      }

      const partialFailures: { ticketId: string; error: string }[] = [];

      for (const item of orderDetails) {
        const ticketPrice = await tx.ticketPrice.findUnique({
          where: { id: item.ticketPriceId },
          include: { ticketType: true }
        });

        if (!ticketPrice) {
          console.error(`[FULFILLMENT WARNING] TicketPrice ${item.ticketPriceId} missing!`);
          partialFailures.push({ ticketId: item.ticketPriceId, error: "TICKET_PRICE_MISSING" });
          
          for (let i = 0; i < item.quantity; i++) {
            await tx.issuedTicket.create({
              data: {
                qrHash: crypto.randomUUID().replace(/-/g, ""),
                ticketPriceId: item.ticketPriceId,
                ticketId: item.ticketPriceId,
                ticketGroupId: item.facilityId,
                transactionId: transaction.id,
                expiryDate: new Date(),
                status: TicketStatus.HOLD,
                holderName: holderName || null,
                holderPhotoUrl: holderPhotoUrl || null,
              }
            });
          }
          continue;
        }

        const isSeason = ticketPrice.ticketType.validityType === "SUMMER_SEASON";
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30);

        const tickets = [];
        for (let i = 0; i < item.quantity; i++) {
          tickets.push({
            qrHash: crypto.randomUUID().replace(/-/g, ""),
            ticketPriceId: ticketPrice.id,
            ticketId: ticketPrice.id,
            ticketGroupId: item.facilityId,
            transactionId: transaction.id,
            expiryDate: isSeason 
              ? getNextSubscriptionExpiry(new Date().getFullYear(), new Date()) 
              : expiryDate,
            usageLimit: isSeason ? 999 : 1,
            status: TicketStatus.ACTIVE,
            holderName: holderName || null,
            holderPhotoUrl: holderPhotoUrl || null,
          });
        }
        
        await tx.issuedTicket.createMany({ data: tickets });
      }

      if (partialFailures.length > 0) {
        return await tx.transaction.update({
          where: { id: transaction.id },
          data: { fulfillmentError: partialFailures }
        });
      }

      return transaction;
    });

    if (transaction && targetEmail) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await sendTicketConfirmationEmail(targetEmail, transaction as any, session.id).catch(err => {
        console.error("[FULFILLMENT] Email sending failed, tickets still created successfully:", err);
      });
    }

    console.log(`[FULFILLMENT SUCCESS] Processed session ${session.id}`);
  } catch (error) {
    console.error(`[FULFILLMENT CRITICAL ERROR] session ${session.id}:`, error);
  }
}

/**
 * 📧 Sends an elegant post-purchase ticket email containing QR codes
 */
async function sendTicketConfirmationEmail(
  email: string,
  transaction: { id: string; totalAmount: number },
  sessionId: string
) {
  // 1. Fetch all issued tickets with their ticketPrice + ticketType + facility data
  const issuedTickets = await prisma.issuedTicket.findMany({
    where: { transactionId: transaction.id },
    include: {
      ticketPrice: {
        include: {
          ticketType: {
            include: {
              category: {
                include: { facility: true }
              }
            }
          }
        }
      },
    },
  });

  if (issuedTickets.length === 0) {
    console.warn(`[FULFILLMENT EMAIL] No issued tickets found for transaction ${transaction.id}. Skipping email.`);
    return;
  }

  // 2. Generate QR Codes and prepare attachments
  const attachments: Array<{ filename: string; content: string; encoding: string; cid: string }> = [];
  const ticketData = await Promise.all(
    issuedTickets.map(async (it, index) => {
      const ticketType = it.ticketPrice?.ticketType;
      const productTitle = ticketType?.title || "Ulaznica";
      const priceLabel = it.ticketPrice?.label;
      const title = priceLabel ? `${productTitle} (${priceLabel})` : productTitle;
      const qrDataUrl = await QRCode.toDataURL(it.qrHash, { width: 200, margin: 1 });
      
      const cid = `ticket-qr-${index}`;
      const base64Data = qrDataUrl.split(",")[1];
      
      attachments.push({
        filename: `ticket-qr-${index}.png`,
        content: base64Data,
        encoding: "base64",
        cid: cid,
      });

      return {
        title,
        qrDataUrl: `cid:${cid}`, // Reference the attachment via CID
        qrHash: it.qrHash,      // Include the raw hash for the plain text template
        expiryDate: it.expiryDate,
        usageLimit: it.usageLimit,
      };
    })
  );

  // 3. Get facility info from the first ticket's category
  const firstTicketWithFacility = issuedTickets.find((it) => it.ticketPrice?.ticketType?.category?.facility);
  const facility = firstTicketWithFacility?.ticketPrice?.ticketType?.category?.facility;
  const facilityName = facility?.name || "Objekat";
  const facilityAddress = facility
    ? `${facility.streetName} ${facility.streetNumber}, ${facility.city}`
    : "Srbija";

  // 4. Create site/success page link
  const successPageUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://splashdeals.rs"}/success?session_id=${sessionId}`;

  // 5. Build HTML & Text content
  const html = buildTicketDeliveryHtml({
    facilityName,
    facilityAddress,
    customerName: "",
    tickets: ticketData,
    totalAmount: Number(transaction.totalAmount),
    orderRef: transaction.id.slice(0, 8),
    successPageUrl,
  });

  const text = buildTicketDeliveryText({
    facilityName,
    facilityAddress,
    customerName: "",
    tickets: ticketData,
    totalAmount: Number(transaction.totalAmount),
    orderRef: transaction.id.slice(0, 8),
    successPageUrl,
  });

  // 6. Send the email using lib/email.ts
  await sendEmail({
    to: email,
    subject: "Vaše Splashdeals karte su spremne! 🎫",
    html,
    text,
    attachments,
  });
}
