import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/(server)/lib/prisma";

// ---------------------------------------------------------------------------
// Simple in-memory rate limiter — per IP, max 100 requests per 60-second
// window.  Resets on each window.  Not for production-at-scale, but suitable
// for a third-party API gate.
// ---------------------------------------------------------------------------
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 100;
const hitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  let entry = hitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };
    hitMap.set(ip, entry);
  }

  entry.count += 1;
  return {
    allowed: entry.count <= RATE_LIMIT_MAX,
    remaining: Math.max(0, RATE_LIMIT_MAX - entry.count),
  };
}

// ---------------------------------------------------------------------------
// CORS headers attached to every response
// ---------------------------------------------------------------------------
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function corsResponse(data: unknown, status = 200, extraHeaders?: Record<string, string>) {
  return NextResponse.json(data, {
    status,
    headers: { ...corsHeaders, ...extraHeaders },
  });
}

// ---------------------------------------------------------------------------
// OPTIONS — CORS preflight
// ---------------------------------------------------------------------------
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

// ---------------------------------------------------------------------------
// GET /api/tickets
//       /api/tickets?facility={slug}
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  try {
    // --- Rate limit --------------------------------------------------------
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "127.0.0.1";

    const { allowed, remaining } = checkRateLimit(ip);
    if (!allowed) {
      return corsResponse({ error: "Too many requests" }, 429, {
        "Retry-After": "60",
        "X-RateLimit-Remaining": "0",
      });
    }

    // --- Query params ------------------------------------------------------
    const { searchParams } = new URL(request.url);
    const facilitySlug = searchParams.get("facility");

    // --- Build where clause ------------------------------------------------
    const facilityWhere = facilitySlug
      ? { slug: facilitySlug, status: "ACTIVE" as const }
      : { status: "ACTIVE" as const };

    // --- Fetch tickets -----------------------------------------------------
    const tickets = await prisma.ticketProduct.findMany({
      where: {
        isActive: true,
        category: {
          isActive: true,
          facility: facilityWhere,
        },
      },
      orderBy: [{ category: { displayOrder: "asc" } }, { displayOrder: "asc" }],
      include: {
        category: {
          select: {
            id: true,
            title: true,
            facility: {
              select: {
                name: true,
                slug: true,
              },
            },
          },
        },
        prices: {
          where: { isActive: true },
          orderBy: { displayOrder: "asc" },
          select: {
            id: true,
            label: true,
            price: true,
            originalPrice: true,
          },
        },
      },
    });

    // --- Shape response ----------------------------------------------------
    const data = tickets.map((t) => ({
      id: t.id,
      title: t.title,
      facility: {
        name: t.category.facility.name,
        slug: t.category.facility.slug,
      },
      category: t.category.title,
      prices: t.prices.map((p) => ({
        id: p.id,
        label: p.label,
        price: Number(p.price),
        originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
      })),
    }));

    return corsResponse({ data }, 200, {
      "X-RateLimit-Remaining": String(remaining),
    });
  } catch (error) {
    console.error("[api/tickets]", error);
    return corsResponse({ error: "Internal server error" }, 500);
  }
}
