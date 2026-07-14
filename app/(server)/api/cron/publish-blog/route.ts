import { NextResponse } from "next/server";
import { prisma } from "@/app/(server)/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * 📅 CMS Scheduled Publishing Cron
 * Called by Vercel Cron every 10 minutes.
 * Publishes any DRAFT posts whose `publishedAt` has passed.
 */
export async function GET(request: Request) {
  // 🔐 Auth check
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const now = new Date();

    const result = await prisma.blogPost.updateMany({
      where: {
        status: "DRAFT",
        publishedAt: { lte: now },
      },
      data: {
        status: "PUBLISHED",
      },
    });

    // Revalidate blog pages
    revalidatePath("/blog");

    return NextResponse.json({
      success: true,
      published: result.count,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error("[CMS Cron] Scheduled publishing error:", error);
    return NextResponse.json(
      { success: false, error: "Scheduled publishing failed" },
      { status: 500 },
    );
  }
}
