"use server";

import { prisma } from "@/server/lib/prisma";
import { requireAdmin, requireSuperAdmin } from "@/server/lib/auth-guards";
import { handleServerActionError, type ActionResult } from "@/server/lib/server-action-error";
import { revalidatePath } from "next/cache";
import { z } from "zod/v4";
import { triggerWebhooks } from "@/app/(server)/actions/webhooks";
import { logActivity } from "@/app/(server)/actions/activity";

// ─── Zod v4 šeme ───────────────────────────────────────

const blogPostSchema = z.object({
  title: z.string().min(1, "Naslov je obavezan"),
  slug: z
    .string()
    .min(1, "Slug je obavezan")
    .regex(/^[a-z0-9-]+$/, "Samo mala slova, brojevi i crtice"),
  content: z.string().default(""),
  excerpt: z.string().optional(),
  coverImage: z.string().optional(),
  featuredImage: z.string().optional(),
  author: z.string().optional(),
  status: z.enum(["DRAFT", "REVIEW", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  categoryId: z.string().optional(),
  isFeatured: z.boolean().default(false),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional(),
  ogImage: z.string().optional(),
  canonicalUrl: z.string().optional(),
  robotsDirective: z.string().optional(),
  publishedAt: z.string().datetime().optional().nullable(),
});

export type BlogPostFormValues = z.infer<typeof blogPostSchema>;

const pageSchema = z.object({
  title: z.string().min(1, "Naslov je obavezan"),
  slug: z
    .string()
    .min(1, "Slug je obavezan")
    .regex(/^[a-z0-9-]+$/, "Samo mala slova, brojevi i crtice"),
  content: z.string().default(""),
  excerpt: z.string().optional(),
  coverImage: z.string().optional(),
  template: z.string().default("default"),
  showHeader: z.boolean().default(true),
  showFooter: z.boolean().default(true),
  status: z.enum(["DRAFT", "REVIEW", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional(),
  ogImage: z.string().optional(),
  canonicalUrl: z.string().optional(),
  robotsDirective: z.string().optional(),
  publishedAt: z.string().datetime().optional().nullable(),
});

export type PageFormValues = z.infer<typeof pageSchema>;

const categorySchema = z.object({
  name: z.string().min(1, "Naziv je obavezan"),
  slug: z
    .string()
    .min(1, "Slug je obavezan")
    .regex(/^[a-z0-9-]+$/, "Samo mala slova, brojevi i crtice"),
  description: z.string().optional(),
  color: z.string().optional(),
  displayOrder: z.number().int().default(0),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;

const tagSchema = z.object({
  name: z.string().min(1, "Naziv je obavezan"),
  slug: z
    .string()
    .min(1, "Slug je obavezan")
    .regex(/^[a-z0-9-]+$/, "Samo mala slova, brojevi i crtice"),
});

export type TagFormValues = z.infer<typeof tagSchema>;

// ─── Blog Post CRUD ────────────────────────────────────

export async function createBlogPostAction(
  data: BlogPostFormValues,
  tagIds?: string[],
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin();
    const validated = blogPostSchema.parse(data);

    // REVIEW status resets to DRAFT — items must go through approval flow
    if (validated.status === "REVIEW") validated.status = "DRAFT";

    const post = await prisma.blogPost.create({
      data: {
        ...validated,
        publishedAt: validated.publishedAt
          ? new Date(validated.publishedAt)
          : validated.status === "PUBLISHED"
            ? new Date()
            : null,
        readingTime: calculateReadingTime(validated.content),
        tags:
          tagIds && tagIds.length > 0 ? { create: tagIds.map((tagId) => ({ tagId })) } : undefined,
      },
    });

    // Save initial revision on publish
    if (validated.status === "PUBLISHED") {
      await prisma.blogPostRevision.create({
        data: {
          postId: post.id,
          title: validated.title,
          content: validated.content,
          excerpt: validated.excerpt || null,
        },
      });
    }

    revalidatePath("/admin/cms/posts");

    // Fire webhook events
    const createdEvent =
      validated.status === "PUBLISHED"
        ? "post.published"
        : validated.publishedAt
          ? "post.scheduled"
          : "post.published";
    triggerWebhooks(createdEvent, { id: post.id, title: post.title, slug: post.slug });

    // Log activity (non-blocking)
    const user = await requireAdmin().catch(() => null);
    if (user) {
      logActivity(
        user.id,
        validated.status === "PUBLISHED" ? "post.published" : "post.created",
        post.id,
        "blogPost",
        { title: post.title, slug: post.slug },
      );
    }

    return { success: true, data: { id: post.id } };
  } catch (error) {
    return handleServerActionError(error, "cms/createBlogPost");
  }
}

export async function updateBlogPostAction(
  id: string,
  data: BlogPostFormValues,
  tagIds?: string[],
  expectedVersion?: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin();
    const validated = blogPostSchema.parse(data);

    // REVIEW status resets to DRAFT — items must go through approval flow
    if (validated.status === "REVIEW") validated.status = "DRAFT";

    const where: Record<string, unknown> = { id };
    if (expectedVersion) {
      where.updatedAt = expectedVersion;
    }

    const result = await prisma.blogPost.updateMany({
      where: where as any,
      data: {
        ...validated,
        publishedAt: validated.publishedAt
          ? new Date(validated.publishedAt)
          : validated.status === "PUBLISHED"
            ? new Date()
            : undefined,
        readingTime: calculateReadingTime(validated.content),
      },
    });

    // Conflict check — if expectedVersion was provided and no rows matched
    if (expectedVersion && result.count === 0) {
      return {
        success: true,
        conflict: true,
        message: "Neko je već izmenio ovu objavu. Osveži stranicu.",
      };
    }

    // Re-fetch the post to handle tags (updateMany doesn't support nested relations)
    const post = await prisma.blogPost.update({
      where: { id },
      data: {
        tags: {
          deleteMany: {},
          create: tagIds && tagIds.length > 0 ? tagIds.map((tagId) => ({ tagId })) : [],
        },
      },
    });

    // Save revision on publish
    if (validated.status === "PUBLISHED") {
      await prisma.blogPostRevision.create({
        data: {
          postId: id,
          title: validated.title,
          content: validated.content,
          excerpt: validated.excerpt || null,
        },
      });
    }

    revalidatePath("/admin/cms/posts");
    revalidatePath(`/admin/cms/posts/${id}`);

    triggerWebhooks("post.updated", {
      id,
      title: post.title,
      slug: post.slug,
      status: validated.status,
    });

    // Log activity (non-blocking)
    const user = await requireAdmin().catch(() => null);
    if (user) {
      logActivity(
        user.id,
        validated.status === "PUBLISHED" ? "post.published" : "post.updated",
        id,
        "blogPost",
        { title: post.title, slug: post.slug, status: validated.status },
      );
    }

    return { success: true, data: { id: post.id } };
  } catch (error) {
    return handleServerActionError(error, "cms/updateBlogPost");
  }
}

export async function deleteBlogPostAction(id: string): Promise<ActionResult> {
  try {
    await requireSuperAdmin();
    await prisma.blogPost.delete({ where: { id } });
    revalidatePath("/admin/cms/posts");
    triggerWebhooks("post.deleted", { id });

    // Log activity (non-blocking)
    const user = await requireSuperAdmin().catch(() => null);
    if (user) {
      logActivity(user.id, "post.deleted", id, "blogPost", {});
    }

    return { success: true };
  } catch (error) {
    return handleServerActionError(error, "cms/deleteBlogPost");
  }
}

export async function getBlogPostAction(id: string): Promise<
  ActionResult<{
    post: Record<string, unknown>;
    tagIds: string[];
  }>
> {
  try {
    await requireAdmin();
    const post = await prisma.blogPost.findUnique({
      where: { id },
      include: { tags: true, category: true },
    });

    if (!post) {
      return { success: false, error: "Blog post nije pronađen." };
    }

    const tagIds = post.tags.map((t) => t.tagId);
    return { success: true, data: { post: post as unknown as Record<string, unknown>, tagIds } };
  } catch (error) {
    return handleServerActionError(error, "cms/getBlogPost");
  }
}

export async function listBlogPostsAction(): Promise<ActionResult<Array<Record<string, unknown>>>> {
  try {
    await requireAdmin();
    const posts = await prisma.blogPost.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        category: { select: { id: true, name: true, slug: true, color: true } },
        _count: { select: { tags: true } },
      },
    });

    return { success: true, data: posts as unknown as Array<Record<string, unknown>> };
  } catch (error) {
    return handleServerActionError(error, "cms/listBlogPosts");
  }
}

// ─── Page CRUD ─────────────────────────────────────────

export async function createPageAction(
  data: PageFormValues,
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin();
    const validated = pageSchema.parse(data);

    // REVIEW status resets to DRAFT — items must go through approval flow
    if (validated.status === "REVIEW") validated.status = "DRAFT";

    const page = await prisma.page.create({
      data: {
        ...validated,
        publishedAt: validated.publishedAt
          ? new Date(validated.publishedAt)
          : validated.status === "PUBLISHED"
            ? new Date()
            : null,
      },
    });

    revalidatePath("/admin/cms/pages");
    triggerWebhooks("page.published", { id: page.id, title: page.title, slug: page.slug });

    // Log activity (non-blocking)
    const user = await requireAdmin().catch(() => null);
    if (user) {
      logActivity(
        user.id,
        validated.status === "PUBLISHED" ? "page.published" : "page.created",
        page.id,
        "page",
        { title: page.title, slug: page.slug },
      );
    }

    return { success: true, data: { id: page.id } };
  } catch (error) {
    return handleServerActionError(error, "cms/createPage");
  }
}

export async function updatePageAction(
  id: string,
  data: PageFormValues,
  expectedVersion?: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin();
    const validated = pageSchema.parse(data);

    // REVIEW status resets to DRAFT — items must go through approval flow
    if (validated.status === "REVIEW") validated.status = "DRAFT";

    const where: Record<string, unknown> = { id };
    if (expectedVersion) {
      where.updatedAt = expectedVersion;
    }

    const result = await prisma.page.updateMany({
      where: where as any,
      data: {
        ...validated,
        publishedAt: validated.publishedAt
          ? new Date(validated.publishedAt)
          : validated.status === "PUBLISHED"
            ? new Date()
            : undefined,
      },
    });

    // Conflict check — if expectedVersion was provided and no rows matched
    if (expectedVersion && result.count === 0) {
      return {
        success: true,
        conflict: true,
        message: "Neko je već izmenio ovu objavu. Osveži stranicu.",
      };
    }

    const page = await prisma.page.findUniqueOrThrow({ where: { id } });

    revalidatePath("/admin/cms/pages");
    revalidatePath(`/admin/cms/pages/${id}`);
    triggerWebhooks("page.updated", {
      id,
      title: page.title,
      slug: page.slug,
      status: validated.status,
    });

    // Log activity (non-blocking)
    const user = await requireAdmin().catch(() => null);
    if (user) {
      logActivity(
        user.id,
        validated.status === "PUBLISHED" ? "page.published" : "page.updated",
        id,
        "page",
        { title: page.title, slug: page.slug, status: validated.status },
      );
    }

    return { success: true, data: { id: page.id } };
  } catch (error) {
    return handleServerActionError(error, "cms/updatePage");
  }
}

export async function deletePageAction(id: string): Promise<ActionResult> {
  try {
    await requireSuperAdmin();
    await prisma.page.delete({ where: { id } });
    revalidatePath("/admin/cms/pages");
    triggerWebhooks("page.deleted", { id });

    // Log activity (non-blocking)
    const user = await requireSuperAdmin().catch(() => null);
    if (user) {
      logActivity(user.id, "page.deleted", id, "page", {});
    }

    return { success: true };
  } catch (error) {
    return handleServerActionError(error, "cms/deletePage");
  }
}

export async function getPageAction(id: string): Promise<ActionResult<Record<string, unknown>>> {
  try {
    await requireAdmin();
    const page = await prisma.page.findUnique({ where: { id } });
    if (!page) return { success: false, error: "Strana nije pronađena." };
    return { success: true, data: page as unknown as Record<string, unknown> };
  } catch (error) {
    return handleServerActionError(error, "cms/getPage");
  }
}

export async function listPagesAction(): Promise<ActionResult<Array<Record<string, unknown>>>> {
  try {
    await requireAdmin();
    const pages = await prisma.page.findMany({ orderBy: { createdAt: "desc" } });
    return { success: true, data: pages as unknown as Array<Record<string, unknown>> };
  } catch (error) {
    return handleServerActionError(error, "cms/listPages");
  }
}

// ─── Category CRUD ─────────────────────────────────────

export async function createCategoryAction(
  data: CategoryFormValues,
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin();
    const validated = categorySchema.parse(data);
    const category = await prisma.blogCategory.create({ data: validated });
    revalidatePath("/admin/cms/categories");
    return { success: true, data: { id: category.id } };
  } catch (error) {
    return handleServerActionError(error, "cms/createCategory");
  }
}

export async function updateCategoryAction(
  id: string,
  data: CategoryFormValues,
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const validated = categorySchema.parse(data);
    await prisma.blogCategory.update({ where: { id }, data: validated });
    revalidatePath("/admin/cms/categories");
    return { success: true };
  } catch (error) {
    return handleServerActionError(error, "cms/updateCategory");
  }
}

export async function deleteCategoryAction(id: string): Promise<ActionResult> {
  try {
    await requireSuperAdmin();
    await prisma.blogPost.updateMany({ where: { categoryId: id }, data: { categoryId: null } });
    await prisma.blogCategory.delete({ where: { id } });
    revalidatePath("/admin/cms/categories");
    revalidatePath("/admin/cms/posts");
    return { success: true };
  } catch (error) {
    return handleServerActionError(error, "cms/deleteCategory");
  }
}

export async function listCategoriesAction(): Promise<
  ActionResult<Array<Record<string, unknown>>>
> {
  try {
    await requireAdmin();
    const categories = await prisma.blogCategory.findMany({
      orderBy: { displayOrder: "asc" },
      include: { _count: { select: { posts: true } } },
    });
    return { success: true, data: categories as unknown as Array<Record<string, unknown>> };
  } catch (error) {
    return handleServerActionError(error, "cms/listCategories");
  }
}

// ─── Tag CRUD ──────────────────────────────────────────

export async function createTagAction(data: TagFormValues): Promise<ActionResult<{ id: string }>> {
  try {
    await requireSuperAdmin();
    const validated = tagSchema.parse(data);
    const tag = await prisma.blogTag.create({ data: validated });
    revalidatePath("/admin/cms/tags");
    return { success: true, data: { id: tag.id } };
  } catch (error) {
    return handleServerActionError(error, "cms/createTag");
  }
}

export async function updateTagAction(id: string, data: TagFormValues): Promise<ActionResult> {
  try {
    await requireSuperAdmin();
    const validated = tagSchema.parse(data);
    await prisma.blogTag.update({ where: { id }, data: validated });
    revalidatePath("/admin/cms/tags");
    return { success: true };
  } catch (error) {
    return handleServerActionError(error, "cms/updateTag");
  }
}

export async function deleteTagAction(id: string): Promise<ActionResult> {
  try {
    await requireSuperAdmin();
    await prisma.blogTag.delete({ where: { id } });
    revalidatePath("/admin/cms/tags");
    return { success: true };
  } catch (error) {
    return handleServerActionError(error, "cms/deleteTag");
  }
}

export async function listTagsAction(): Promise<ActionResult<Array<Record<string, unknown>>>> {
  try {
    await requireAdmin();
    const tags = await prisma.blogTag.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { posts: true } } },
    });
    return { success: true, data: tags as unknown as Array<Record<string, unknown>> };
  } catch (error) {
    return handleServerActionError(error, "cms/listTags");
  }
}

// ─── Bulk Operations ──────────────────────────────────

export async function bulkUpdateBlogPostsAction(
  ids: string[],
  status: "DRAFT" | "REVIEW" | "PUBLISHED" | "ARCHIVED",
): Promise<ActionResult<{ count: number }>> {
  try {
    await requireSuperAdmin();

    const result = await prisma.blogPost.updateMany({
      where: { id: { in: ids } },
      data: {
        status,
        publishedAt: status === "PUBLISHED" ? new Date() : undefined,
      },
    });

    revalidatePath("/admin/cms/posts");
    return { success: true, data: { count: result.count } };
  } catch (error) {
    return handleServerActionError(error, "cms/bulkUpdate");
  }
}

export async function bulkDeleteBlogPostsAction(
  ids: string[],
): Promise<ActionResult<{ count: number }>> {
  try {
    await requireSuperAdmin();

    const result = await prisma.blogPost.deleteMany({
      where: { id: { in: ids } },
    });

    revalidatePath("/admin/cms/posts");
    return { success: true, data: { count: result.count } };
  } catch (error) {
    return handleServerActionError(error, "cms/bulkDelete");
  }
}

// ─── Stale Content ─────────────────────────────────────

export async function markAsReviewedAction(
  ids: string[],
  type: "post" | "page",
): Promise<ActionResult<{ updated: number }>> {
  try {
    await requireAdmin();

    const model = type === "post" ? (prisma as any).blogPost : (prisma as any).page;

    const result = await model.updateMany({
      where: { id: { in: ids } },
      data: { reviewedAt: new Date() },
    });

    revalidatePath("/admin/cms/posts");
    revalidatePath("/admin/cms/pages");

    return { success: true, data: { updated: result.count } };
  } catch (error) {
    return handleServerActionError(error, "cms/markAsReviewed");
  }
}

// ─── Review Workflow ────────────────────────────────

export async function submitForReviewAction(
  id: string,
  type: "post" | "page",
): Promise<ActionResult<{ status: "REVIEW" }>> {
  try {
    await requireAdmin();
    const model = type === "post" ? (prisma as any).blogPost : (prisma as any).page;
    await model.update({
      where: { id },
      data: { status: "REVIEW" },
    });
    revalidatePath("/admin/cms/posts");
    revalidatePath("/admin/cms/pages");
    return { success: true, data: { status: "REVIEW" } };
  } catch (error) {
    return handleServerActionError(error, "cms/submitForReview");
  }
}

export async function approvePostAction(
  id: string,
  type: "post" | "page",
): Promise<ActionResult<{ status: "PUBLISHED" }>> {
  try {
    await requireAdmin();
    const model = type === "post" ? (prisma as any).blogPost : (prisma as any).page;
    const existing = await model.findUnique({ where: { id } });
    await model.update({
      where: { id },
      data: {
        status: "PUBLISHED",
        publishedAt: existing?.publishedAt ?? new Date(),
        reviewedAt: new Date(),
      },
    });
    revalidatePath("/admin/cms/posts");
    revalidatePath("/admin/cms/pages");

    const approveEvent = type === "post" ? "post.published" : "page.published";
    triggerWebhooks(approveEvent, { id, type });

    // Log activity (non-blocking)
    try {
      const u = await requireAdmin();
      logActivity(u.id, `${type}.published`, id, type, {});
    } catch {}

    return { success: true, data: { status: "PUBLISHED" } };
  } catch (error) {
    return handleServerActionError(error, "cms/approvePost");
  }
}

export async function rejectPostAction(
  id: string,
  type: "post" | "page",
): Promise<ActionResult<{ status: "DRAFT" }>> {
  try {
    await requireAdmin();
    const model = type === "post" ? (prisma as any).blogPost : (prisma as any).page;
    await model.update({
      where: { id },
      data: { status: "DRAFT" },
    });
    revalidatePath("/admin/cms/posts");
    revalidatePath("/admin/cms/pages");

    // Log activity (non-blocking)
    try {
      const u = await requireAdmin();
      logActivity(u.id, `${type}.rejected`, id, type, {});
    } catch {}

    return { success: true, data: { status: "DRAFT" } };
  } catch (error) {
    return handleServerActionError(error, "cms/rejectPost");
  }
}

// ─── Helper ────────────────────────────────────────────

function calculateReadingTime(html: string): number {
  const text = html.replace(/<[^>]*>/g, "").trim();
  if (!text) return 0;
  const wordCount = text.split(/\s+/).length;
  return Math.max(1, Math.ceil(wordCount / 200));
}
