"use server";

import { prisma } from "@/server/lib/prisma";
import { requireAdmin, requireSuperAdmin } from "@/server/lib/auth-guards";
import { handleServerActionError, type ActionResult } from "@/server/lib/server-action-error";
import { put, del, list } from "@vercel/blob";
import sharp from "sharp";
import { revalidatePath } from "next/cache";
import { z } from "zod/v4";

// ─── Schemas ───────────────────────────────────────────────

const listMediaSchema = z.object({
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(50),
  search: z.string().optional(),
  sort: z
    .enum(["newest", "oldest", "name_asc", "name_desc", "largest", "smallest"])
    .default("newest"),
  type: z.enum(["all", "jpg", "png", "webp", "gif", "svg"]).default("all"),
  dateRange: z.enum(["all", "7d", "30d"]).default("all"),
});

const updateMediaSchema = z.object({
  id: z.string(),
  altText: z.string().optional(),
  filename: z.string().optional(),
});

const batchDeleteMediaSchema = z.object({
  ids: z.array(z.string()).min(1).max(50),
  force: z.boolean().default(false),
});

// ─── 1. List Media ─────────────────────────────────────────

export async function listMediaAction(input: z.infer<typeof listMediaSchema>): Promise<
  ActionResult<{
    items: Array<{
      id: string;
      url: string;
      filename: string;
      size: number;
      mimeType: string;
      altText: string | null;
      createdAt: string;
    }>;
    nextCursor: string | null;
  }>
> {
  try {
    await requireAdmin();
    const params = listMediaSchema.parse(input);

    const where: Record<string, unknown> = { deletedAt: null };

    // Search filter
    if (params.search) {
      where.filename = { contains: params.search, mode: "insensitive" };
    }

    // Type filter
    if (params.type !== "all") {
      const mimePrefix = params.type === "jpg" ? "image/jpeg" : `image/${params.type}`;
      where.mimeType = { startsWith: mimePrefix };
    }

    // Date range
    if (params.dateRange === "7d") {
      where.createdAt = { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
    } else if (params.dateRange === "30d") {
      where.createdAt = { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
    }

    // Sort
    const orderBy: Record<string, string> =
      params.sort === "oldest"
        ? { createdAt: "asc" }
        : params.sort === "name_asc"
          ? { filename: "asc" }
          : params.sort === "name_desc"
            ? { filename: "desc" }
            : params.sort === "largest"
              ? { size: "desc" }
              : params.sort === "smallest"
                ? { size: "asc" }
                : { createdAt: "desc" };

    const items = await (prisma as any).cmsMedia.findMany({
      where,
      orderBy,
      take: params.limit + 1,
      ...(params.cursor ? { cursor: { id: params.cursor }, skip: 1 } : {}),
    });

    const hasMore = items.length > params.limit;
    const results = hasMore ? items.slice(0, params.limit) : items;

    return {
      success: true,
      data: {
        items: results.map(
          (m: {
            id: string;
            url: string;
            filename: string;
            size: number;
            mimeType: string;
            altText: string | null;
            createdAt: Date;
          }) => ({
            id: m.id,
            url: m.url,
            filename: m.filename,
            size: m.size,
            mimeType: m.mimeType,
            altText: m.altText,
            createdAt: m.createdAt.toISOString(),
          }),
        ),
        nextCursor: hasMore ? results[results.length - 1].id : null,
      },
    };
  } catch (error) {
    return handleServerActionError(error, "cms/listMedia");
  }
}

// ─── 2. Upload Media ───────────────────────────────────────

export async function uploadMediaAction(
  formData: FormData,
): Promise<ActionResult<{ id: string; url: string }>> {
  try {
    await requireAdmin();

    const file = formData.get("file") as File;
    if (!file) return { success: false, error: "Nema datoteke." };
    if (file.size > 25 * 1024 * 1024)
      return { success: false, error: "Datoteka je prevelika. Maksimalna veličina je 25MB." };

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
    if (!allowedTypes.includes(file.type))
      return { success: false, error: `Nepodržan format: ${file.type}.` };

    // Compute file hash for duplicate detection
    const buffer = Buffer.from(await file.arrayBuffer());
    const { createHash } = await import("node:crypto");
    const fileHash = createHash("sha256").update(buffer).digest("hex");

    // Check for existing duplicate
    const existing = await (prisma as any).cmsMedia.findFirst({
      where: { fileHash, deletedAt: null },
      select: { id: true, filename: true, url: true },
    });

    // Convert to WebP (client-side via canvas is preferred, but we do server-side as fallback)
    let webpBuffer: Buffer;
    let useOriginal = false;

    if (file.type === "image/svg+xml" || file.type === "image/gif") {
      // SVG and GIF: keep original format
      webpBuffer = buffer;
      useOriginal = true;
    } else {
      try {
        webpBuffer = await sharp(buffer).webp({ quality: 85 }).toBuffer();
      } catch {
        webpBuffer = buffer;
        useOriginal = true;
      }
    }

    const ext = useOriginal ? file.name.split(".").pop() || "bin" : "webp";
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const pathname = `cms/${Date.now()}-${safeName}`;

    const blob = await put(pathname, webpBuffer, {
      access: "public",
      contentType: useOriginal ? file.type : "image/webp",
      addRandomSuffix: true,
    });

    const media = await (prisma as any).cmsMedia.create({
      data: {
        url: blob.url,
        filename: file.name,
        size: webpBuffer.length,
        mimeType: useOriginal ? file.type : "image/webp",
        fileHash,
      },
    });

    return {
      success: true,
      data: { id: media.id, url: media.url },
      ...(existing ? { warning: `Datoteka "${existing.filename}" već postoji u biblioteci.` } : {}),
    };
  } catch (error) {
    return handleServerActionError(error, "cms/uploadMedia");
  }
}

// ─── 3. Upload via URL ─────────────────────────────────────

export async function uploadMediaFromUrlAction(
  url: string,
): Promise<ActionResult<{ id: string; url: string }>> {
  try {
    await requireAdmin();

    const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!response.ok)
      return { success: false, error: "URL ne vraća važeću sliku. Proverite link." };

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.startsWith("image/"))
      return { success: false, error: "URL ne vodi do slike." };

    const buffer = Buffer.from(await response.arrayBuffer());
    const filename = url.split("/").pop() || "imported-image";

    // Create a FormData-like upload via existing action
    const formData = new FormData();
    const blob = new Blob([buffer], { type: contentType });
    formData.append("file", blob, filename);

    return uploadMediaAction(formData);
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      return { success: false, error: "URL nije odgovorio u roku od 15 sekundi." };
    }
    return handleServerActionError(error, "cms/uploadMediaFromUrl");
  }
}

// ─── 4. Get Single Media ───────────────────────────────────

export async function getMediaAction(id: string): Promise<
  ActionResult<{
    id: string;
    url: string;
    filename: string;
    size: number;
    mimeType: string;
    altText: string | null;
    createdAt: string;
    usageCount: number;
    usedIn: Array<{ type: "post" | "page"; id: string; title: string }>;
  }>
> {
  try {
    await requireAdmin();

    const media = await (prisma as any).cmsMedia.findUnique({ where: { id } });
    if (!media) return { success: false, error: "Medija nije pronađena." };

    const [postRefs, pageRefs] = await Promise.all([
      (prisma as any).$queryRawUnsafe(
        `SELECT id, title FROM marketing.blog_posts WHERE content LIKE $1 OR "coverImage" = $2 OR "featuredImage" = $3 OR "ogImage" = $4`,
        `%${media.url}%`,
        media.url,
        media.url,
        media.url,
      ) as Promise<Array<{ id: string; title: string }>>,
      (prisma as any).$queryRawUnsafe(
        `SELECT id, title FROM marketing.pages WHERE content LIKE $1 OR "coverImage" = $2 OR "ogImage" = $3`,
        `%${media.url}%`,
        media.url,
        media.url,
      ) as Promise<Array<{ id: string; title: string }>>,
    ]);

    const usedIn = [
      ...postRefs.map((r: { id: string; title: string }) => ({
        type: "post" as const,
        id: r.id,
        title: r.title,
      })),
      ...pageRefs.map((r: { id: string; title: string }) => ({
        type: "page" as const,
        id: r.id,
        title: r.title,
      })),
    ];

    return {
      success: true,
      data: {
        id: media.id,
        url: media.url,
        filename: media.filename,
        size: media.size,
        mimeType: media.mimeType,
        altText: media.altText,
        createdAt: media.createdAt.toISOString(),
        usageCount: usedIn.length,
        usedIn,
      },
    };
  } catch (error) {
    return handleServerActionError(error, "cms/getMedia");
  }
}

// ─── 5. Update Media ───────────────────────────────────────

export async function updateMediaAction(
  input: z.infer<typeof updateMediaSchema>,
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const params = updateMediaSchema.parse(input);

    await (prisma as any).cmsMedia.update({
      where: { id: params.id },
      data: {
        ...(params.altText !== undefined && { altText: params.altText }),
        ...(params.filename !== undefined && { filename: params.filename }),
      },
    });

    return { success: true };
  } catch (error) {
    return handleServerActionError(error, "cms/updateMedia");
  }
}

// ─── 6. Check References ───────────────────────────────────

export async function checkMediaReferencesAction(url: string): Promise<
  ActionResult<{
    count: number;
    posts: Array<{ id: string; title: string; status: string }>;
    pages: Array<{ id: string; title: string; status: string }>;
  }>
> {
  try {
    await requireAdmin();

    const [posts, pages] = await Promise.all([
      (prisma as any).$queryRawUnsafe(
        `SELECT id, title, status FROM marketing.blog_posts WHERE content LIKE $1 OR "coverImage" = $2 OR "featuredImage" = $3 OR "ogImage" = $4`,
        `%${url}%`,
        url,
        url,
        url,
      ) as Promise<Array<{ id: string; title: string; status: string }>>,
      (prisma as any).$queryRawUnsafe(
        `SELECT id, title, status FROM marketing.pages WHERE content LIKE $1 OR "coverImage" = $2 OR "ogImage" = $3`,
        `%${url}%`,
        url,
        url,
      ) as Promise<Array<{ id: string; title: string; status: string }>>,
    ]);

    return {
      success: true,
      data: { count: posts.length + pages.length, posts, pages },
    };
  } catch (error) {
    return handleServerActionError(error, "cms/checkMediaReferences");
  }
}

// ─── 7. Delete Media (soft or hard) ─────────────────────────

export async function deleteMediaAction(
  id: string,
  options?: { force?: boolean; permanent?: boolean },
): Promise<
  ActionResult<{
    deleted: boolean;
    references?: Array<{ type: string; id: string; title: string }>;
  }>
> {
  try {
    await requireAdmin();
    const isHardDelete = options?.permanent === true || options?.force === true;
    if (isHardDelete) await requireSuperAdmin();

    const media = await (prisma as any).cmsMedia.findUnique({ where: { id } });
    if (!media) return { success: false, error: "Medija nije pronađena." };

    // Check references for hard delete
    if (isHardDelete || options?.force) {
      // Hard delete: remove from Blob + DB
      await del(media.url);
      await (prisma as any).cmsMedia.delete({ where: { id } });
      revalidatePath("/admin/media");

      return { success: true, data: { deleted: true } };
    }
    // Soft delete
    const refCheck = await checkMediaReferencesAction(media.url);
    if (!refCheck.success || !refCheck.data) {
      return { success: false, error: refCheck?.error || "Nepoznata greška" };
    }

    const references = [
      ...refCheck.data.posts.map((p: { id: string; title: string }) => ({
        type: "post" as const,
        id: p.id,
        title: p.title,
      })),
      ...refCheck.data.pages.map((p: { id: string; title: string }) => ({
        type: "page" as const,
        id: p.id,
        title: p.title,
      })),
    ];

    if (references.length > 0) {
      return {
        success: true,
        data: { deleted: false, references },
      };
    }

    // No references → safe to soft delete
    await (prisma as any).cmsMedia.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    revalidatePath("/admin/media");
    return { success: true, data: { deleted: true } };
  } catch (error) {
    return handleServerActionError(error, "cms/deleteMedia");
  }
}

// ─── 8. Batch Media Usage ──────────────────────────────────

export async function batchMediaUsageAction(
  mediaIds: string[],
): Promise<ActionResult<Record<string, { count: number; posts: string[]; pages: string[] }>>> {
  try {
    await requireAdmin();

    if (mediaIds.length === 0 || mediaIds.length > 100) {
      return { success: false, error: "Između 1 i 100 medija po zahtevu." };
    }

    const mediaItems = await (prisma as any).cmsMedia.findMany({
      where: { id: { in: mediaIds } },
      select: { id: true, url: true },
    });

    const urls: string[] = mediaItems.map((m: { url: string }) => m.url);

    if (urls.length === 0) return { success: true, data: {} };

    const [postRefs, pageRefs] = await Promise.all([
      (prisma as any).$queryRawUnsafe(
        `SELECT id, title, "ogImage" as ref_url FROM marketing.blog_posts WHERE "ogImage" = ANY($1::text[])
         UNION
         SELECT id, title, "coverImage" as ref_url FROM marketing.blog_posts WHERE "coverImage" = ANY($1::text[])
         UNION
         SELECT id, title, "featuredImage" as ref_url FROM marketing.blog_posts WHERE "featuredImage" = ANY($1::text[])`,
        urls,
      ) as Promise<Array<{ id: string; title: string; ref_url: string }>>,
      (prisma as any).$queryRawUnsafe(
        `SELECT id, title, "ogImage" as ref_url FROM marketing.pages WHERE "ogImage" = ANY($1::text[])
         UNION
         SELECT id, title, "coverImage" as ref_url FROM marketing.pages WHERE "coverImage" = ANY($1::text[])`,
        urls,
      ) as Promise<Array<{ id: string; title: string; ref_url: string }>>,
    ]);

    const urlToId = new Map<string, string>(
      mediaItems.map((m: { id: string; url: string }) => [m.url, m.id]),
    );
    const result: Record<string, { count: number; posts: string[]; pages: string[] }> = {};

    for (const id of mediaIds) {
      result[id] = { count: 0, posts: [], pages: [] };
    }

    for (const ref of postRefs as Array<{ id: string; title: string; ref_url: string }>) {
      const idVal = urlToId.get(ref.ref_url) as string | undefined;
      if (idVal && result[idVal]) {
        result[idVal].count++;
        result[idVal].posts.push(ref.title);
      }
    }

    for (const ref of pageRefs as Array<{ id: string; title: string; ref_url: string }>) {
      const idVal = urlToId.get(ref.ref_url) as string | undefined;
      if (idVal && result[idVal]) {
        result[idVal].count++;
        result[idVal].pages.push(ref.title);
      }
    }

    return { success: true, data: result };
  } catch (error) {
    return handleServerActionError(error, "cms/batchMediaUsage");
  }
}

// ─── 9. Batch Delete ───────────────────────────────────────

export async function batchDeleteMediaAction(
  input: z.infer<typeof batchDeleteMediaSchema>,
): Promise<
  ActionResult<{
    deleted: number;
    skipped: Array<{ id: string; filename: string; reason: string }>;
    errors: Array<{ id: string; filename: string; error: string }>;
  }>
> {
  try {
    await requireSuperAdmin();
    const params = batchDeleteMediaSchema.parse(input);

    const mediaItems = await (prisma as any).cmsMedia.findMany({
      where: { id: { in: params.ids } },
    });

    const deleted: string[] = [];
    const skipped: Array<{ id: string; filename: string; reason: string }> = [];
    const errors: Array<{ id: string; filename: string; error: string }> = [];

    for (const media of mediaItems) {
      try {
        const refResult = await checkMediaReferencesAction(media.url);
        const hasRefs = refResult.success && (refResult.data?.count ?? 0) > 0;

        if (hasRefs && !params.force) {
          const data = refResult.data;
          skipped.push({
            id: media.id,
            filename: media.filename,
            reason: `Koristi se u ${data?.count ?? 0} objava/strana.`,
          });
          continue;
        }

        await del(media.url);
        await (prisma as any).cmsMedia.delete({ where: { id: media.id } });
        deleted.push(media.id);
      } catch (err) {
        errors.push({
          id: media.id,
          filename: media.filename,
          error: err instanceof Error ? err.message : "Nepoznata greška",
        });
      }
    }

    revalidatePath("/admin/media");
    return {
      success: true,
      data: { deleted: deleted.length, skipped, errors },
    };
  } catch (error) {
    return handleServerActionError(error, "cms/batchDeleteMedia");
  }
}

// ─── 10. Reconcile Media ───────────────────────────────────

export async function reconcileMediaAction(): Promise<
  ActionResult<{
    orphanedRecords: Array<{ id: string; filename: string; url: string; createdAt: string }>;
    untrackedBlobs: Array<{ pathname: string; url: string; size: number; uploadedAt: string }>;
  }>
> {
  try {
    await requireSuperAdmin();

    const dbRecords = await (prisma as any).cmsMedia.findMany({
      orderBy: { createdAt: "desc" },
    });
    const dbUrls = new Set(dbRecords.map((r: { url: string }) => r.url));

    let cursor: string | undefined;
    const blobUrls = new Map<string, { pathname: string; size: number; uploadedAt: string }>();

    do {
      const result = await list({ prefix: "cms/", cursor, limit: 100 });
      for (const blob of result.blobs) {
        blobUrls.set(blob.url, {
          pathname: blob.pathname,
          size: blob.size,
          uploadedAt: blob.uploadedAt.toISOString(),
        });
      }
      cursor = result.cursor;
    } while (cursor);

    const orphanedRecords = dbRecords
      .filter((r: { url: string }) => !blobUrls.has(r.url))
      .map((r: { id: string; filename: string; url: string; createdAt: Date }) => ({
        id: r.id,
        filename: r.filename,
        url: r.url,
        createdAt: r.createdAt.toISOString(),
      }));

    const untrackedBlobs = Array.from(blobUrls.entries())
      .filter(([url]) => !dbUrls.has(url))
      .map(([url, info]) => ({
        pathname: info.pathname,
        url,
        size: info.size,
        uploadedAt: info.uploadedAt,
      }));

    return {
      success: true,
      data: { orphanedRecords, untrackedBlobs },
    };
  } catch (error) {
    return handleServerActionError(error, "cms/reconcileMedia");
  }
}

// ─── 11. Purge Old Trashed Media (cron) ────────────────────

export async function purgeTrashedMediaAction(): Promise<ActionResult<{ purged: number }>> {
  try {
    await requireSuperAdmin();

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const expired = await (prisma as any).cmsMedia.findMany({
      where: {
        deletedAt: { not: null, lte: thirtyDaysAgo },
      },
      select: { id: true, url: true },
    });

    for (const media of expired) {
      try {
        await del(media.url);
      } catch {
        // Blob may already be gone — ignore, delete the record anyway
      }
      await (prisma as any).cmsMedia.delete({ where: { id: media.id } });
    }

    if (expired.length > 0) revalidatePath("/admin/media");

    return { success: true, data: { purged: expired.length } };
  } catch (error) {
    return handleServerActionError(error, "cms/purgeTrashedMedia");
  }
}
