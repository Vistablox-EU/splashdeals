"use server"

import { prisma } from "@/server/lib/prisma"
import { requireAdmin, requireSuperAdmin } from "@/server/lib/auth-guards"
import { handleServerActionError, type ActionResult } from "@/server/lib/server-action-error"
import { revalidatePath } from "next/cache"
import { z } from "zod/v4"

// ─── Zod v4 šeme ───────────────────────────────────────

const blogPostSchema = z.object({
  title: z.string().min(1, "Naslov je obavezan"),
  slug: z.string().min(1, "Slug je obavezan").regex(/^[a-z0-9-]+$/, "Samo mala slova, brojevi i crtice"),
  content: z.string().default(""),
  excerpt: z.string().optional(),
  coverImage: z.string().optional(),
  featuredImage: z.string().optional(),
  author: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
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
})

export type BlogPostFormValues = z.infer<typeof blogPostSchema>

const pageSchema = z.object({
  title: z.string().min(1, "Naslov je obavezan"),
  slug: z.string().min(1, "Slug je obavezan").regex(/^[a-z0-9-]+$/, "Samo mala slova, brojevi i crtice"),
  content: z.string().default(""),
  excerpt: z.string().optional(),
  coverImage: z.string().optional(),
  template: z.string().default("default"),
  showHeader: z.boolean().default(true),
  showFooter: z.boolean().default(true),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional(),
  ogImage: z.string().optional(),
  canonicalUrl: z.string().optional(),
  robotsDirective: z.string().optional(),
  publishedAt: z.string().datetime().optional().nullable(),
})

export type PageFormValues = z.infer<typeof pageSchema>

const categorySchema = z.object({
  name: z.string().min(1, "Naziv je obavezan"),
  slug: z.string().min(1, "Slug je obavezan").regex(/^[a-z0-9-]+$/, "Samo mala slova, brojevi i crtice"),
  description: z.string().optional(),
  color: z.string().optional(),
  displayOrder: z.number().int().default(0),
})

export type CategoryFormValues = z.infer<typeof categorySchema>

const tagSchema = z.object({
  name: z.string().min(1, "Naziv je obavezan"),
  slug: z.string().min(1, "Slug je obavezan").regex(/^[a-z0-9-]+$/, "Samo mala slova, brojevi i crtice"),
})

export type TagFormValues = z.infer<typeof tagSchema>

// ─── Blog Post CRUD ────────────────────────────────────

export async function createBlogPostAction(
  data: BlogPostFormValues,
  tagIds?: string[]
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin()
    const validated = blogPostSchema.parse(data)

    const post = await prisma.blogPost.create({
      data: {
        ...validated,
        publishedAt: validated.publishedAt ? new Date(validated.publishedAt) : validated.status === "PUBLISHED" ? new Date() : null,
        readingTime: calculateReadingTime(validated.content),
        tags: tagIds && tagIds.length > 0
          ? { create: tagIds.map((tagId) => ({ tagId })) }
          : undefined,
      },
    })

    // Save initial revision on publish
    if (validated.status === "PUBLISHED") {
      await prisma.blogPostRevision.create({
        data: {
          postId: post.id,
          title: validated.title,
          content: validated.content,
          excerpt: validated.excerpt || null,
        },
      })
    }

    revalidatePath("/admin/cms/posts")
    return { success: true, data: { id: post.id } }
  } catch (error) {
    return handleServerActionError(error, "cms/createBlogPost")
  }
}

export async function updateBlogPostAction(
  id: string,
  data: BlogPostFormValues,
  tagIds?: string[]
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin()
    const validated = blogPostSchema.parse(data)

    const post = await prisma.blogPost.update({
      where: { id },
      data: {
        ...validated,
        publishedAt: validated.publishedAt
          ? new Date(validated.publishedAt)
          : validated.status === "PUBLISHED"
            ? new Date()
            : undefined,
        readingTime: calculateReadingTime(validated.content),
        tags: {
          deleteMany: {},
          create: tagIds && tagIds.length > 0
            ? tagIds.map((tagId) => ({ tagId }))
            : [],
        },
      },
    })

    // Save revision on publish
    if (validated.status === "PUBLISHED") {
      await prisma.blogPostRevision.create({
        data: {
          postId: id,
          title: validated.title,
          content: validated.content,
          excerpt: validated.excerpt || null,
        },
      })
    }

    revalidatePath("/admin/cms/posts")
    revalidatePath(`/admin/cms/posts/${id}`)
    return { success: true, data: { id: post.id } }
  } catch (error) {
    return handleServerActionError(error, "cms/updateBlogPost")
  }
}

export async function deleteBlogPostAction(id: string): Promise<ActionResult> {
  try {
    await requireSuperAdmin()
    await prisma.blogPost.delete({ where: { id } })
    revalidatePath("/admin/cms/posts")
    return { success: true }
  } catch (error) {
    return handleServerActionError(error, "cms/deleteBlogPost")
  }
}

export async function getBlogPostAction(id: string): Promise<ActionResult<{
  post: Record<string, unknown>
  tagIds: string[]
}>> {
  try {
    await requireAdmin()
    const post = await prisma.blogPost.findUnique({
      where: { id },
      include: { tags: true, category: true },
    })

    if (!post) {
      return { success: false, error: "Blog post nije pronađen." }
    }

    const tagIds = post.tags.map((t) => t.tagId)
    return { success: true, data: { post: post as unknown as Record<string, unknown>, tagIds } }
  } catch (error) {
    return handleServerActionError(error, "cms/getBlogPost")
  }
}

export async function listBlogPostsAction(): Promise<ActionResult<Array<Record<string, unknown>>>> {
  try {
    await requireAdmin()
    const posts = await prisma.blogPost.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        category: { select: { id: true, name: true, slug: true, color: true } },
        _count: { select: { tags: true } },
      },
    })

    return { success: true, data: posts as unknown as Array<Record<string, unknown>> }
  } catch (error) {
    return handleServerActionError(error, "cms/listBlogPosts")
  }
}

// ─── Page CRUD ─────────────────────────────────────────

export async function createPageAction(data: PageFormValues): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin()
    const validated = pageSchema.parse(data)

    const page = await prisma.page.create({
      data: {
        ...validated,
        publishedAt: validated.publishedAt
          ? new Date(validated.publishedAt)
          : validated.status === "PUBLISHED"
            ? new Date()
            : null,
      },
    })

    revalidatePath("/admin/cms/pages")
    return { success: true, data: { id: page.id } }
  } catch (error) {
    return handleServerActionError(error, "cms/createPage")
  }
}

export async function updatePageAction(id: string, data: PageFormValues): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin()
    const validated = pageSchema.parse(data)

    const page = await prisma.page.update({
      where: { id },
      data: {
        ...validated,
        publishedAt: validated.publishedAt
          ? new Date(validated.publishedAt)
          : validated.status === "PUBLISHED"
            ? new Date()
            : undefined,
      },
    })

    revalidatePath("/admin/cms/pages")
    revalidatePath(`/admin/cms/pages/${id}`)
    return { success: true, data: { id: page.id } }
  } catch (error) {
    return handleServerActionError(error, "cms/updatePage")
  }
}

export async function deletePageAction(id: string): Promise<ActionResult> {
  try {
    await requireSuperAdmin()
    await prisma.page.delete({ where: { id } })
    revalidatePath("/admin/cms/pages")
    return { success: true }
  } catch (error) {
    return handleServerActionError(error, "cms/deletePage")
  }
}

export async function getPageAction(id: string): Promise<ActionResult<Record<string, unknown>>> {
  try {
    await requireAdmin()
    const page = await prisma.page.findUnique({ where: { id } })
    if (!page) return { success: false, error: "Strana nije pronađena." }
    return { success: true, data: page as unknown as Record<string, unknown> }
  } catch (error) {
    return handleServerActionError(error, "cms/getPage")
  }
}

export async function listPagesAction(): Promise<ActionResult<Array<Record<string, unknown>>>> {
  try {
    await requireAdmin()
    const pages = await prisma.page.findMany({ orderBy: { createdAt: "desc" } })
    return { success: true, data: pages as unknown as Array<Record<string, unknown>> }
  } catch (error) {
    return handleServerActionError(error, "cms/listPages")
  }
}

// ─── Category CRUD ─────────────────────────────────────

export async function createCategoryAction(data: CategoryFormValues): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin()
    const validated = categorySchema.parse(data)
    const category = await prisma.blogCategory.create({ data: validated })
    revalidatePath("/admin/cms/categories")
    return { success: true, data: { id: category.id } }
  } catch (error) {
    return handleServerActionError(error, "cms/createCategory")
  }
}

export async function updateCategoryAction(id: string, data: CategoryFormValues): Promise<ActionResult> {
  try {
    await requireAdmin()
    const validated = categorySchema.parse(data)
    await prisma.blogCategory.update({ where: { id }, data: validated })
    revalidatePath("/admin/cms/categories")
    return { success: true }
  } catch (error) {
    return handleServerActionError(error, "cms/updateCategory")
  }
}

export async function deleteCategoryAction(id: string): Promise<ActionResult> {
  try {
    await requireSuperAdmin()
    await prisma.blogPost.updateMany({ where: { categoryId: id }, data: { categoryId: null } })
    await prisma.blogCategory.delete({ where: { id } })
    revalidatePath("/admin/cms/categories")
    revalidatePath("/admin/cms/posts")
    return { success: true }
  } catch (error) {
    return handleServerActionError(error, "cms/deleteCategory")
  }
}

export async function listCategoriesAction(): Promise<ActionResult<Array<Record<string, unknown>>>> {
  try {
    await requireAdmin()
    const categories = await prisma.blogCategory.findMany({
      orderBy: { displayOrder: "asc" },
      include: { _count: { select: { posts: true } } },
    })
    return { success: true, data: categories as unknown as Array<Record<string, unknown>> }
  } catch (error) {
    return handleServerActionError(error, "cms/listCategories")
  }
}

// ─── Tag CRUD ──────────────────────────────────────────

export async function createTagAction(data: TagFormValues): Promise<ActionResult<{ id: string }>> {
  try {
    await requireSuperAdmin()
    const validated = tagSchema.parse(data)
    const tag = await prisma.blogTag.create({ data: validated })
    revalidatePath("/admin/cms/tags")
    return { success: true, data: { id: tag.id } }
  } catch (error) {
    return handleServerActionError(error, "cms/createTag")
  }
}

export async function updateTagAction(id: string, data: TagFormValues): Promise<ActionResult> {
  try {
    await requireSuperAdmin()
    const validated = tagSchema.parse(data)
    await prisma.blogTag.update({ where: { id }, data: validated })
    revalidatePath("/admin/cms/tags")
    return { success: true }
  } catch (error) {
    return handleServerActionError(error, "cms/updateTag")
  }
}

export async function deleteTagAction(id: string): Promise<ActionResult> {
  try {
    await requireSuperAdmin()
    await prisma.blogTag.delete({ where: { id } })
    revalidatePath("/admin/cms/tags")
    return { success: true }
  } catch (error) {
    return handleServerActionError(error, "cms/deleteTag")
  }
}

export async function listTagsAction(): Promise<ActionResult<Array<Record<string, unknown>>>> {
  try {
    await requireAdmin()
    const tags = await prisma.blogTag.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { posts: true } } },
    })
    return { success: true, data: tags as unknown as Array<Record<string, unknown>> }
  } catch (error) {
    return handleServerActionError(error, "cms/listTags")
  }
}

// ─── Bulk Operations ──────────────────────────────────

export async function bulkUpdateBlogPostsAction(
  ids: string[],
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED"
): Promise<ActionResult<{ count: number }>> {
  try {
    await requireSuperAdmin()

    const result = await prisma.blogPost.updateMany({
      where: { id: { in: ids } },
      data: {
        status,
        publishedAt: status === "PUBLISHED" ? new Date() : undefined,
      },
    })

    revalidatePath("/admin/cms/posts")
    return { success: true, data: { count: result.count } }
  } catch (error) {
    return handleServerActionError(error, "cms/bulkUpdate")
  }
}

export async function bulkDeleteBlogPostsAction(ids: string[]): Promise<ActionResult<{ count: number }>> {
  try {
    await requireSuperAdmin()

    const result = await prisma.blogPost.deleteMany({
      where: { id: { in: ids } },
    })

    revalidatePath("/admin/cms/posts")
    return { success: true, data: { count: result.count } }
  } catch (error) {
    return handleServerActionError(error, "cms/bulkDelete")
  }
}

// ─── Helper ────────────────────────────────────────────

function calculateReadingTime(html: string): number {
  const text = html.replace(/<[^>]*>/g, "").trim()
  if (!text) return 0
  const wordCount = text.split(/\s+/).length
  return Math.max(1, Math.ceil(wordCount / 200))
}
