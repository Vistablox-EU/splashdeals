import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/(server)/lib/prisma";

// Track editor presence — POST stores userId + postId + timestamp
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, postId, pageId } = body as {
      userId?: string;
      postId?: string;
      pageId?: string;
    };

    if (!userId) {
      return NextResponse.json({ error: "userId je obavezan" }, { status: 400 });
    }

    // Upsert presence for the viewed entity
    if (postId) {
      await (prisma as any).editorPresence.upsert({
        where: {
          userId_postId: { userId, postId },
        },
        update: { lastSeen: new Date() },
        create: { userId, postId, lastSeen: new Date() },
      });
    } else if (pageId) {
      await (prisma as any).editorPresence.upsert({
        where: {
          userId_pageId: { userId, pageId },
        },
        update: { lastSeen: new Date() },
        create: { userId, pageId, lastSeen: new Date() },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Presence API]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET — fetch active editors for a post/page (within last 60 seconds)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("postId");
    const pageId = searchParams.get("pageId");

    const sixtySecondsAgo = new Date(Date.now() - 60_000);

    const where: Record<string, unknown> = {
      lastSeen: { gte: sixtySecondsAgo },
    };

    if (postId) where.postId = postId;
    if (pageId) where.pageId = pageId;

    const presences = await (prisma as any).editorPresence.findMany({
      where,
      select: {
        userId: true,
        lastSeen: true,
      },
      orderBy: { lastSeen: "desc" },
    });

    // Fetch user names
    const userIds = presences.map((p: { userId: string }) => p.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, image: true },
    });

    const userMap = new Map(users.map((u) => [u.id, { name: u.name, image: u.image }]));

    const result = presences.map((p: { userId: string; lastSeen: Date }) => ({
      userId: p.userId,
      name: userMap.get(p.userId)?.name || "Nepoznat",
      image: userMap.get(p.userId)?.image || null,
      lastSeen: p.lastSeen.toISOString(),
    }));

    return NextResponse.json({ editors: result });
  } catch (error) {
    console.error("[Presence API]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  // Clean up stale presences older than 5 minutes (fire-and-forget)
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60_000);
    await (prisma as any).editorPresence.deleteMany({
      where: { lastSeen: { lt: fiveMinutesAgo } },
    });
  } catch {
    // Non-critical
  }
}
