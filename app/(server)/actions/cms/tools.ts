"use server";

import { prisma } from "@/app/(server)/lib/prisma";
import { requireAdmin } from "@/app/(server)/lib/auth-guards";
import { handleServerActionError, type ActionResult } from "@/app/(server)/lib/server-action-error";
import { revalidatePath } from "next/cache";

// ─── Orphan Pages ───────────────────────────────────

export async function getOrphanPagesAction(): Promise<
  ActionResult<
    Array<{ id: string; title: string; slug: string; type: "page" | "blogPost"; createdAt: Date }>
  >
> {
  try {
    await requireAdmin();

    const [pages, blogPosts] = await Promise.all([
      prisma.page.findMany({
        where: { status: "PUBLISHED" },
        select: { id: true, title: true, slug: true, content: true, createdAt: true },
      }),
      prisma.blogPost.findMany({
        where: { status: "PUBLISHED" },
        select: { id: true, title: true, slug: true, content: true, createdAt: true },
      }),
    ]);

    // Get all slugs that are linked to in any published content
    const allLinkedSlugs = new Set<string>();

    const extractSlugs = (html: string) => {
      const hrefRegex = /href="([^"]*)"/gi;
      let match: RegExpExecArray | null;
      while ((match = hrefRegex.exec(html)) !== null) {
        const url = match[1];
        // Extract slug from URL
        const slugMatch = url.match(/\/(?:blog\/)?([a-z0-9-]+)(?:\?|#|$)/);
        if (slugMatch) {
          allLinkedSlugs.add(slugMatch[1]);
        }
      }
    };

    for (const page of pages) extractSlugs(page.content);
    for (const post of blogPosts) extractSlugs(post.content);

    // Find pages whose slugs are NOT in any linked content
    const orphanPages = pages
      .filter((p) => !allLinkedSlugs.has(p.slug))
      .map((p) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        type: "page" as const,
        createdAt: p.createdAt,
      }));

    const orphanPosts = blogPosts
      .filter((p) => !allLinkedSlugs.has(p.slug))
      .map((p) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        type: "blogPost" as const,
        createdAt: p.createdAt,
      }));

    return {
      success: true,
      data: [...orphanPages, ...orphanPosts].sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      ),
    };
  } catch (error) {
    return handleServerActionError(error, "cms/getOrphanPages");
  }
}

// ─── Broken Link Checker ────────────────────────────

export async function checkBrokenLinksAction(): Promise<
  ActionResult<
    Array<{
      postId: string;
      postTitle: string;
      postSlug: string;
      url: string;
      statusCode: number;
      contentType: "post" | "page";
    }>
  >
> {
  try {
    await requireAdmin();

    const [pages, blogPosts] = await Promise.all([
      prisma.page.findMany({
        where: { status: "PUBLISHED" },
        select: { id: true, title: true, slug: true, content: true },
      }),
      prisma.blogPost.findMany({
        where: { status: "PUBLISHED" },
        select: { id: true, title: true, slug: true, content: true },
      }),
    ]);

    const extractExternalLinks = (html: string): string[] => {
      const links: string[] = [];
      const hrefRegex = /href="(https?:\/\/[^"]+)"/gi;
      let match: RegExpExecArray | null;
      while ((match = hrefRegex.exec(html)) !== null) {
        const url = match[1];
        // Skip splashdeals internal links
        if (!url.includes("splashdeals.rs") && !url.includes("localhost")) {
          links.push(url);
        }
      }
      return [...new Set(links)];
    };

    const brokenLinks: Array<{
      postId: string;
      postTitle: string;
      postSlug: string;
      url: string;
      statusCode: number;
      contentType: "post" | "page";
    }> = [];

    for (const page of pages) {
      const links = extractExternalLinks(page.content);
      for (const url of links) {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 5000);
          const response = await fetch(url, {
            method: "HEAD",
            signal: controller.signal,
            redirect: "manual",
          });
          clearTimeout(timeout);
          const status = response.status;
          if (status >= 400) {
            brokenLinks.push({
              postId: page.id,
              postTitle: page.title,
              postSlug: page.slug,
              url,
              statusCode: status,
              contentType: "page",
            });
          }
        } catch {
          brokenLinks.push({
            postId: page.id,
            postTitle: page.title,
            postSlug: page.slug,
            url,
            statusCode: 0,
            contentType: "page",
          });
        }
      }
    }

    for (const post of blogPosts) {
      const links = extractExternalLinks(post.content);
      for (const url of links) {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 5000);
          const response = await fetch(url, {
            method: "HEAD",
            signal: controller.signal,
            redirect: "manual",
          });
          clearTimeout(timeout);
          const status = response.status;
          if (status >= 400) {
            brokenLinks.push({
              postId: post.id,
              postTitle: post.title,
              postSlug: post.slug,
              url,
              statusCode: status,
              contentType: "post",
            });
          }
        } catch {
          brokenLinks.push({
            postId: post.id,
            postTitle: post.title,
            postSlug: post.slug,
            url,
            statusCode: 0,
            contentType: "post",
          });
        }
      }
    }

    return { success: true, data: brokenLinks };
  } catch (error) {
    return handleServerActionError(error, "cms/checkBrokenLinks");
  }
}

// ─── 404 Monitoring ────────────────────────────────

export async function getNotFoundLogsAction(): Promise<
  ActionResult<
    Array<{
      id: string;
      path: string;
      referrer: string | null;
      count: number;
      firstSeen: Date;
      lastSeen: Date;
    }>
  >
> {
  try {
    await requireAdmin();
    const logs = await prisma.notFoundLog.findMany({
      orderBy: { count: "desc" },
      take: 100,
    });
    return {
      success: true,
      data: logs as unknown as Array<{
        id: string;
        path: string;
        referrer: string | null;
        count: number;
        firstSeen: Date;
        lastSeen: Date;
      }>,
    };
  } catch (error) {
    return handleServerActionError(error, "cms/getNotFoundLogs");
  }
}

export async function clearNotFoundLogAction(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await prisma.notFoundLog.delete({ where: { id } });
    revalidatePath("/admin/cms/404s");
    return { success: true };
  } catch (error) {
    return handleServerActionError(error, "cms/clearNotFoundLog");
  }
}
