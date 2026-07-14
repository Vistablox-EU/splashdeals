import { NextResponse } from "next/server";
import { prisma } from "@/app/(server)/lib/prisma";
import { sendRecoveryEmail } from "@/app/(server)/lib/email";

/**
 * 🛒 Cron Job: Abandoned Cart Recovery
 * Runs every hour. Finds cart sessions older than 1 hour that haven't been
 * notified, and sends a recovery reminder email to the user.
 */
export async function GET() {
  try {
    const oneHourAgo = new Date(Date.now() - 3600000);
    const cartSessions = await prisma.cartSession.findMany({
      where: { updatedAt: { lte: oneHourAgo }, notified: false },
      include: { user: { select: { email: true } } },
    });

    let sentCount = 0;
    for (const session of cartSessions) {
      if (!session.user.email) continue;
      try {
        await sendRecoveryEmail(session.user.email, session.items as any[]);
        await prisma.cartSession.update({
          where: { id: session.id },
          data: { notified: true },
        });
        sentCount++;
      } catch (e) {
        console.error(`[cart-recovery] Failed to send email for session ${session.id}:`, e);
      }
    }

    return NextResponse.json({ recovered: sentCount });
  } catch (error) {
    console.error("[cart-recovery]", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
