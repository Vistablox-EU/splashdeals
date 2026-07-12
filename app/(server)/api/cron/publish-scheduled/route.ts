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

    // Unpublish expired blog posts
    const expiredPosts = await prisma.blogPost.updateMany({
      where: { status: "PUBLISHED", expiresAt: { lte: now, not: null } },
      data: { status: "ARCHIVED" },
    });

    if (expiredPosts.count > 0) {
      revalidatePath("/blog");
    }

    // Unpublish expired pages
    const expiredPages = await prisma.page.updateMany({
      where: { status: "PUBLISHED", expiresAt: { lte: now, not: null } },
      data: { status: "ARCHIVED" },
    });

    return NextResponse.json({
      published: posts.count,
      unpublishedPosts: expiredPosts.count,
      unpublishedPages: expiredPages.count,
    });
  } catch (error) {
    console.error("[publish-scheduled]", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
