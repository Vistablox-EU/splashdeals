import { prisma } from "@/server/lib/prisma";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const now = new Date();
    // Find drafts with future publishedAt that are now due
    const posts = await prisma.blogPost.updateMany({
      where: {
        status: "DRAFT",
        publishedAt: { lte: now, not: null },
      },
      data: { status: "PUBLISHED" },
    });

    if (posts.count > 0) {
      revalidatePath("/blog");
    }

    return NextResponse.json({ published: posts.count });
  } catch (error) {
    console.error("[publish-scheduled]", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
