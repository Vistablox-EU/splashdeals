import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/(server)/lib/prisma";

// ---------------------------------------------------------------------------
// Simple in-memory rate limiter — per IP, max 100 requests per 60-second
// window.
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
// CORS headers
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
// Helpers
// ---------------------------------------------------------------------------

/** Matches UUID v4 or v7 or cuid */
function isTicketProductId(value: string): boolean {
  return (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value) ||
    /^c[a-z0-9]{24}$/.test(value)
  );
}

// ---------------------------------------------------------------------------
// OPTIONS — CORS preflight
// ---------------------------------------------------------------------------
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

// ---------------------------------------------------------------------------
// GET /api/tickets/{param}
//
// When {param} is a UUID or cuid → single ticket product with prices.
// When {param} is a facility slug        → embed-widget: facility + min price.
// ---------------------------------------------------------------------------
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ param: string }> },
) {
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

    const { param } = await params;

    // ── Ticket product lookup ──────────────────────────────────────────
    if (isTicketProductId(param)) {
      const ticket = await prisma.ticketProduct.findFirst({
        where: {
          id: param,
          isActive: true,
          category: {
            isActive: true,
            facility: { status: "ACTIVE" },
          },
        },
        include: {
          category: {
            select: {
              id: true,
              title: true,
              facility: {
                select: { name: true, slug: true },
              },
            },
          },
          prices: {
            where: { isActive: true },
            orderBy: { displayOrder: "asc" },
            select: { id: true, label: true, price: true, originalPrice: true },
          },
        },
      });

      if (!ticket) {
        return corsResponse({ error: "Ticket not found" }, 404);
      }

      const data = {
        id: ticket.id,
        title: ticket.title,
        facility: {
          name: ticket.category.facility.name,
          slug: ticket.category.facility.slug,
        },
        category: ticket.category.title,
        prices: ticket.prices.map((p) => ({
          id: p.id,
          label: p.label,
          price: Number(p.price),
          originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
        })),
      };

      return corsResponse({ data }, 200, {
        "X-RateLimit-Remaining": String(remaining),
      });
    }

    // ── Facility-slug lookup (embed widget) ────────────────────────────
    const facility = await prisma.facility.findUnique({
      where: { slug: param },
      select: { name: true, slug: true, city: true },
    });

    if (!facility) {
      return corsResponse({ error: "Not found" }, 404);
    }

    const ticketPrices = await prisma.ticketPrice.findMany({
      where: {
        isActive: true,
        ticketType: {
          isActive: true,
          category: {
            isActive: true,
            facility: { slug: param },
          },
        },
      },
      select: { price: true },
    });

    const prices = ticketPrices.map((t) => Number(t.price));
    const minPrice = prices.length > 0 ? Math.min(...prices) : null;

    return corsResponse(
      { name: facility.name, slug: facility.slug, city: facility.city, minPrice },
      200,
      { "X-RateLimit-Remaining": String(remaining) },
    );
  } catch (error) {
    console.error("[api/tickets/:param]", error);
    return corsResponse({ error: "Internal server error" }, 500);
  }
}
