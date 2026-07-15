import { NextResponse } from "next/server";
import { prisma } from "@/app/(server)/lib/prisma";

/**
 * Prunes expired guest carts (and their items) so guestTokenHash rows do not grow unbounded.
 * Authenticated carts are never deleted here.
 */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "Configuration Error" }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const expiredGuestCarts = await prisma.cartSession.findMany({
      where: {
        guestTokenHash: { not: null },
        userId: null,
        locked: false,
        OR: [
          { expiresAt: { lte: now } },
          {
            expiresAt: null,
            updatedAt: { lt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000) },
          },
        ],
      },
      select: { id: true },
      take: 200,
    });

    let deleted = 0;
    for (const cart of expiredGuestCarts) {
      await prisma.cartSessionItem.deleteMany({ where: { cartId: cart.id } });
      await prisma.cartSession.delete({ where: { id: cart.id } });
      deleted += 1;
    }

    return NextResponse.json({
      scanned: expiredGuestCarts.length,
      deleted,
    });
  } catch (error) {
    console.error("[CRON ERROR] Guest cart prune failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
