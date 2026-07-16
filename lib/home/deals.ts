import { prisma } from "@/app/(server)/lib/prisma";
import { isOpenOnDay } from "@/lib/facility/availability";

export type HomeDeal = {
  id: string;
  title: string;
  price: number;
  originalPrice: number | null;
  currency: "RSD";
  discountPercent: number;
  pitch: string;
  imageUrl: string | null;
  facility: {
    id: string;
    name: string;
    slug: string;
    category: string | null;
    city: string | null;
    openToday: boolean;
  };
};

function discountPercent(price: number, original: number | null): number {
  if (!original || original <= price) return 0;
  return Math.round(((original - price) / original) * 100);
}

function shortPitch(
  ticketDesc: string | null,
  facilityDesc: string | null,
  city: string | null,
  pct: number,
  fallback: string,
): string {
  const base = (ticketDesc || facilityDesc || "").replace(/\s+/g, " ").trim();
  if (base.length >= 24) {
    const cut = base.slice(0, 110);
    const nicer = cut.includes(" ") ? cut.slice(0, cut.lastIndexOf(" ")) : cut;
    return nicer + (base.length > nicer.length ? "…" : "");
  }
  const bits = [city, pct > 0 ? `ušteda ${pct}%` : null].filter(Boolean);
  return bits.length ? bits.join(" · ") : fallback;
}

async function loadActiveTicketRows() {
  const now = new Date();
  return prisma.ticketPrice.findMany({
    where: {
      isActive: true,
      AND: [
        { OR: [{ saleStart: null }, { saleStart: { lte: now } }] },
        { OR: [{ saleEnd: null }, { saleEnd: { gte: now } }] },
      ],
      ticketType: {
        isActive: true,
        category: {
          isActive: true,
          facility: { status: "ACTIVE" },
        },
      },
    },
    include: {
      ticketType: {
        include: {
          category: {
            include: {
              facility: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  category: true,
                  city: true,
                  description: true,
                  media: {
                    where: { type: "PHOTO" },
                    orderBy: [{ isHero: "desc" }, { order: "asc" }],
                    take: 1,
                  },
                  hours: { select: { dayOfWeek: true, isClosed: true } },
                },
              },
            },
          },
        },
      },
    },
    orderBy: [{ displayOrder: "asc" }, { id: "asc" }],
    take: 80,
  });
}

function mapDeal(
  row: Awaited<ReturnType<typeof loadActiveTicketRows>>[number],
  fallbackPitch: string,
): HomeDeal | null {
  const facility = row.ticketType?.category?.facility;
  const ticketType = row.ticketType;
  if (!facility || !ticketType) return null;

  const price = Number(row.price);
  const originalPrice = row.originalPrice ? Number(row.originalPrice) : null;
  const pct = discountPercent(price, originalPrice);
  const imageUrl = facility.media?.[0]?.url || ticketType.imageUrl || null;

  return {
    id: row.id,
    title: ticketType.title || "Ulaznica",
    price,
    originalPrice,
    currency: "RSD",
    discountPercent: pct,
    pitch: shortPitch(
      ticketType.description,
      facility.description,
      facility.city,
      pct,
      fallbackPitch,
    ),
    imageUrl,
    facility: {
      id: facility.id,
      name: facility.name,
      slug: facility.slug,
      category: facility.category,
      city: facility.city,
      openToday: isOpenOnDay(facility.hours),
    },
  };
}

/** Featured inventory: prefer media + diversify facilities, then fill. */
export async function getHomeFeaturedDeals(fallbackPitch: string, limit = 6): Promise<HomeDeal[]> {
  const rows = await loadActiveTicketRows();
  const mapped = rows
    .map((r) => mapDeal(r, fallbackPitch))
    .filter((d): d is HomeDeal => d !== null);

  const withMedia = mapped.filter((d) => d.imageUrl);
  const withoutMedia = mapped.filter((d) => !d.imageUrl);

  const picked: HomeDeal[] = [];
  const seenFacility = new Set<string>();

  for (const pool of [withMedia, withoutMedia]) {
    for (const deal of pool) {
      if (picked.length >= limit) break;
      if (seenFacility.has(deal.facility.id)) continue;
      seenFacility.add(deal.facility.id);
      picked.push(deal);
    }
  }

  // Second pass: allow same facility different ticket types for diversity
  if (picked.length < limit) {
    for (const deal of [...withMedia, ...withoutMedia]) {
      if (picked.length >= limit) break;
      if (picked.some((p) => p.id === deal.id)) continue;
      picked.push(deal);
    }
  }

  return picked;
}

export async function getHomeBiggestSavings(fallbackPitch: string, limit = 4): Promise<HomeDeal[]> {
  const rows = await loadActiveTicketRows();
  return rows
    .map((r) => mapDeal(r, fallbackPitch))
    .filter((d): d is HomeDeal => d !== null && d.discountPercent > 0)
    .sort((a, b) => b.discountPercent - a.discountPercent || a.price - b.price)
    .slice(0, limit);
}

export async function getHomeGateProof(fallbackPitch: string): Promise<HomeDeal | null> {
  const savings = await getHomeBiggestSavings(fallbackPitch, 12);
  return (
    savings.find((d) => d.originalPrice && d.originalPrice > d.price && d.imageUrl) ||
    savings.find((d) => d.originalPrice && d.originalPrice > d.price) ||
    null
  );
}

export async function getHomeOpenToday(fallbackPitch: string, limit = 6): Promise<HomeDeal[]> {
  const featured = await getHomeFeaturedDeals(fallbackPitch, 24);
  const open = featured.filter((d) => d.facility.openToday);
  // unique facilities
  const seen = new Set<string>();
  const out: HomeDeal[] = [];
  for (const d of open) {
    if (seen.has(d.facility.id)) continue;
    seen.add(d.facility.id);
    out.push(d);
    if (out.length >= limit) break;
  }
  return out;
}

export async function getHomeMetrics(): Promise<{
  activeFacilities: number;
  activeOffers: number;
  avgDiscountPercent: number;
}> {
  const now = new Date();
  const [activeFacilities, offerRows] = await Promise.all([
    prisma.facility.count({ where: { status: "ACTIVE" } }),
    prisma.ticketPrice.findMany({
      where: {
        isActive: true,
        originalPrice: { not: null },
        AND: [
          { OR: [{ saleStart: null }, { saleStart: { lte: now } }] },
          { OR: [{ saleEnd: null }, { saleEnd: { gte: now } }] },
        ],
        ticketType: {
          isActive: true,
          category: { isActive: true, facility: { status: "ACTIVE" } },
        },
      },
      select: { price: true, originalPrice: true },
      take: 100,
    }),
  ]);

  const discounts = offerRows
    .map((r) => discountPercent(Number(r.price), r.originalPrice ? Number(r.originalPrice) : null))
    .filter((n) => n > 0);

  const avgDiscountPercent =
    discounts.length > 0 ? Math.round(discounts.reduce((a, b) => a + b, 0) / discounts.length) : 0;

  return {
    activeFacilities,
    activeOffers: offerRows.length,
    avgDiscountPercent,
  };
}

export async function getHomeBlogPosts(limit = 3) {
  try {
    return await prisma.blogPost.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      take: limit,
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        coverImage: true,
        publishedAt: true,
      },
    });
  } catch {
    return [];
  }
}
