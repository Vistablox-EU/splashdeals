import "server-only";
import { prisma } from "@/app/(server)/lib/prisma";
import type { PostRow } from "@/app/(dashboard)/admin/cms/(content)/posts/_components/post-types";

export type { PostRow };
export type PostsListFilter = "all" | "review" | "stale" | "scheduled";

function staleThresholdDate() {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 1);
  return d;
}

const postInclude = {
  category: { select: { id: true, name: true, slug: true, color: true } },
  _count: { select: { tags: true } },
} as const;

export async function loadCmsPosts(filter: PostsListFilter = "all"): Promise<PostRow[]> {
  const staleThreshold = staleThresholdDate();
  const now = new Date();

  let posts;
  if (filter === "review") {
    posts = await prisma.blogPost.findMany({
      where: { status: "REVIEW" },
      orderBy: { updatedAt: "desc" },
      include: postInclude,
    });
  } else if (filter === "stale") {
    posts = await prisma.blogPost.findMany({
      where: {
        status: "PUBLISHED",
        updatedAt: { lt: staleThreshold },
        OR: [{ reviewedAt: null }, { reviewedAt: { lt: staleThreshold } }],
      },
      orderBy: { updatedAt: "desc" },
      include: postInclude,
    });
  } else if (filter === "scheduled") {
    posts = await prisma.blogPost.findMany({
      where: {
        status: "DRAFT",
        publishedAt: { gt: now },
      },
      orderBy: { publishedAt: "asc" },
      include: postInclude,
    });
  } else {
    posts = await prisma.blogPost.findMany({
      orderBy: { createdAt: "desc" },
      include: postInclude,
    });
  }

  return posts.map((post) => {
    const lastDate = post.reviewedAt
      ? new Date(Math.max(post.updatedAt.getTime(), post.reviewedAt.getTime()))
      : post.updatedAt;
    const isStale = post.status === "PUBLISHED" && lastDate < staleThreshold;
    const isScheduled =
      post.status === "DRAFT" && !!post.publishedAt && post.publishedAt.getTime() > now.getTime();

    return {
      id: post.id,
      title: post.title,
      slug: post.slug,
      status: post.status,
      category: post.category,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
      reviewedAt: post.reviewedAt?.toISOString() ?? null,
      publishedAt: post.publishedAt?.toISOString() ?? null,
      isFeatured: post.isFeatured,
      readingTime: post.readingTime,
      isStale,
      isScheduled,
      _count: post._count,
    };
  });
}

export async function loadCmsWebhooks() {
  const webhooks = await prisma.webhook.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      logs: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  return webhooks.map((w) => ({
    id: w.id,
    name: w.name,
    url: w.url,
    events: w.events,
    isActive: w.isActive,
    consecutiveFailures: w.consecutiveFailures,
    createdAt: w.createdAt.toISOString(),
    updatedAt: w.updatedAt.toISOString(),
    latestLog: w.logs[0]
      ? {
          id: w.logs[0].id,
          event: w.logs[0].event,
          status: w.logs[0].status,
          responseCode: w.logs[0].responseCode,
          createdAt: w.logs[0].createdAt.toISOString(),
        }
      : null,
  }));
}

export async function loadCmsWebhookDetail(id: string) {
  const webhook = await prisma.webhook.findUnique({ where: { id } });
  if (!webhook) return null;

  const logs = await prisma.webhookLog.findMany({
    where: { webhookId: id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return {
    webhook: {
      id: webhook.id,
      name: webhook.name,
      url: webhook.url,
      events: webhook.events,
      isActive: webhook.isActive,
      consecutiveFailures: webhook.consecutiveFailures,
      createdAt: webhook.createdAt.toISOString(),
      updatedAt: webhook.updatedAt.toISOString(),
    },
    logs: logs.map((log) => ({
      id: log.id,
      event: log.event,
      status: log.status,
      responseCode: log.responseCode,
      responseBody: log.responseBody,
      createdAt: log.createdAt.toISOString(),
    })),
  };
}

export async function loadCmsCampaigns() {
  const campaigns = await prisma.campaign.findMany({
    orderBy: { createdAt: "desc" },
    include: { facilityRestrictions: true },
  });

  return campaigns.map((c) => ({
    id: c.id,
    name: c.name,
    code: c.code,
    discountPercent: Number(c.discountPercent),
    minPurchaseAmount: c.minPurchaseAmount ? Number(c.minPurchaseAmount) : null,
    validFrom: c.validFrom.toISOString(),
    validTo: c.validTo.toISOString(),
    usageLimit: c.usageLimit,
    usedCount: c.usedCount,
    isActive: c.isActive,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    facilityRestrictions: c.facilityRestrictions.map((fr) => ({ facilityId: fr.facilityId })),
  }));
}

export async function loadCmsFacilities() {
  return prisma.facility.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}

export async function loadCmsCampaign(id: string) {
  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: { facilityRestrictions: true },
  });
  if (!campaign) return null;

  return {
    id: campaign.id,
    name: campaign.name,
    code: campaign.code || "",
    discountPercent: Number(campaign.discountPercent),
    minPurchaseAmount: campaign.minPurchaseAmount ? Number(campaign.minPurchaseAmount) : null,
    validFrom: campaign.validFrom.toISOString().slice(0, 10),
    validTo: campaign.validTo.toISOString().slice(0, 10),
    usageLimit: campaign.usageLimit,
    usedCount: campaign.usedCount,
    isActive: campaign.isActive,
    facilityIds: campaign.facilityRestrictions.map((fr) => fr.facilityId),
  };
}

export type PagesListFilter = "all" | "review" | "stale";

export async function loadCmsPages(filter: PagesListFilter = "all") {
  const staleThreshold = staleThresholdDate();
  const now = new Date();

  let pages;
  if (filter === "review") {
    pages = await prisma.page.findMany({
      where: { status: "REVIEW" },
      orderBy: { updatedAt: "desc" },
    });
  } else if (filter === "stale") {
    pages = await prisma.page.findMany({
      where: {
        status: "PUBLISHED",
        updatedAt: { lt: staleThreshold },
        OR: [{ reviewedAt: null }, { reviewedAt: { lt: staleThreshold } }],
      },
      orderBy: { updatedAt: "desc" },
    });
  } else {
    pages = await prisma.page.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  return pages.map((page) => {
    const lastDate = page.reviewedAt
      ? new Date(Math.max(page.updatedAt.getTime(), page.reviewedAt.getTime()))
      : page.updatedAt;
    const isStale = page.status === "PUBLISHED" && lastDate < staleThreshold;
    const isScheduled =
      page.status === "DRAFT" && !!page.publishedAt && page.publishedAt.getTime() > now.getTime();

    return {
      ...page,
      createdAt: page.createdAt.toISOString(),
      updatedAt: page.updatedAt.toISOString(),
      publishedAt: page.publishedAt?.toISOString() ?? null,
      reviewedAt: page.reviewedAt?.toISOString() ?? null,
      expiresAt: page.expiresAt?.toISOString() ?? null,
      isStale,
      isScheduled,
    };
  });
}

export async function loadCmsPage(id: string) {
  const page = await prisma.page.findUnique({ where: { id } });
  if (!page) return null;
  return {
    ...page,
    createdAt: page.createdAt.toISOString(),
    updatedAt: page.updatedAt.toISOString(),
    publishedAt: page.publishedAt?.toISOString() ?? null,
    reviewedAt: page.reviewedAt?.toISOString() ?? null,
    expiresAt: page.expiresAt?.toISOString() ?? null,
  };
}

export async function loadCmsCategories() {
  const categories = await prisma.blogCategory.findMany({
    orderBy: { displayOrder: "asc" },
    include: { _count: { select: { posts: true } } },
  });
  return categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    color: c.color,
    displayOrder: c.displayOrder,
    _count: c._count,
  }));
}

export async function loadCmsTags() {
  const tags = await prisma.blogTag.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { posts: true } } },
  });
  return tags.map((t) => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
    postCount: t._count.posts,
  }));
}

export async function loadCmsReviews() {
  const reviews = await prisma.review.findMany({
    orderBy: [{ isApproved: "asc" }, { createdAt: "desc" }],
    include: {
      user: { select: { id: true, name: true, email: true } },
      facility: { select: { id: true, name: true, slug: true } },
    },
  });
  return reviews.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));
}

export async function loadCmsHubStats() {
  const now = new Date();
  const [posts, pages, campaigns, webhooks, categories, tags, reviews, redirects, scheduled] =
    await Promise.all([
      prisma.blogPost.count(),
      prisma.page.count(),
      prisma.campaign.count().catch(() => 0),
      prisma.webhook.count().catch(() => 0),
      prisma.blogCategory.count(),
      prisma.blogTag.count(),
      prisma.review.count().catch(() => 0),
      prisma.redirect.count().catch(() => 0),
      prisma.blogPost.count({
        where: { status: "DRAFT", publishedAt: { gt: now } },
      }),
    ]);

  return {
    posts,
    pages,
    campaigns,
    webhooks,
    categories,
    tags,
    reviews,
    redirects,
    scheduled,
  };
}

export async function loadCmsPostEditorData(postId?: string) {
  const [categories, tags, post] = await Promise.all([
    prisma.blogCategory.findMany({ orderBy: { displayOrder: "asc" } }),
    prisma.blogTag.findMany({ orderBy: { name: "asc" } }),
    postId
      ? prisma.blogPost.findUnique({
          where: { id: postId },
          include: { tags: true },
        })
      : Promise.resolve(null),
  ]);

  return {
    categories: categories.map((c) => ({ ...c })),
    tags: tags.map((t) => ({ ...t })),
    post: post
      ? {
          ...post,
          createdAt: post.createdAt.toISOString(),
          updatedAt: post.updatedAt.toISOString(),
          publishedAt: post.publishedAt?.toISOString() ?? null,
          reviewedAt: post.reviewedAt?.toISOString() ?? null,
          expiresAt: post.expiresAt?.toISOString() ?? null,
        }
      : null,
    postTagIds: post?.tags.map((t) => t.tagId) ?? [],
  };
}
