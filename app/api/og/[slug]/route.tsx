import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";
import { calculateMaxDiscount } from "@/lib/utils/pricing";
import { SITE_URL, getCategoryLabel } from "@/app/(web)/_facility/_head/schemas";
import { getFacility } from "@/app/(web)/_facility/_head";

export const runtime = "nodejs";

/**
 * 🌊 Dynamic OG image generator for facility pages.
 *
 * Serves a 1200×630 PNG via Satori (@vercel/og) per facility slug.
 * Sets aggressive caching: CDN 1 day, browser 1 hour.
 *
 * Called from metadata as: /api/og/{facilitySlug}
 */

const size = { width: 1200, height: 630 };

async function loadFont(): Promise<ArrayBuffer | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/fonts/Inter-Regular.woff2`);
    if (!res.ok) return null;
    return res.arrayBuffer();
  } catch {
    return null;
  }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug: facilitySlug } = await params;
  const fontData = await loadFont();
  const fonts = fontData
    ? [{ name: "Inter", data: fontData, weight: 400 as const, style: "normal" as const }]
    : [];

  const facility = await getFacility(facilitySlug);

  const response = facility
    ? await renderFacilityImage(facility, facilitySlug, fonts)
    : renderFallback(fonts);

  // Cache: CDN for 1 day, browser for 1 hour, stale-while-revalidate 1 day
  response.headers.set(
    "Cache-Control",
    "public, s-maxage=86400, max-age=3600, stale-while-revalidate=86400",
  );
  return response;
}

async function renderFacilityImage(
  facility: NonNullable<Awaited<ReturnType<typeof getFacility>>>,
  facilitySlug: string,
  fonts: { name: string; data: ArrayBuffer; weight: 400; style: "normal" }[],
): Promise<ImageResponse> {
  // Resolve hero image
  const heroImage =
    facility.media.find((m) => m.type === "PHOTO" && m.isHero)?.url ??
    facility.media.find((m) => m.type === "PHOTO" && m.isCardBackground)?.url ??
    facility.media.find((m) => m.type === "PHOTO")?.url;

  // Compute pricing
  const tickets = (facility.ticketCategories ?? []).flatMap((cat) =>
    (cat.types ?? []).flatMap((prod) =>
      (prod.prices ?? []).map((p) => ({
        isActive: p.isActive,
        price: Number(p.price),
        originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
      })),
    ),
  );

  const minPrice =
    tickets.length > 0 ? Math.min(...tickets.filter((t) => t.isActive).map((t) => t.price)) : null;

  const maxDiscount = calculateMaxDiscount(tickets);

  let priceLine = "";
  if (minPrice !== null && maxDiscount > 0) {
    priceLine = `Ulaznice od ${minPrice} RSD • Uštedi do ${maxDiscount}%`;
  } else if (minPrice !== null) {
    priceLine = `Ulaznice od ${minPrice} RSD`;
  }

  const localizedName = facility.name
    .replace(/\bAquaPark\b/gi, "Akva park")
    .replace(/\bAqua Park\b/gi, "Akva park");

  const categoryLabel = getCategoryLabel(facility.category);

  return new ImageResponse(
    <div
      style={{
        width: size.width,
        height: size.height,
        display: "flex",
        flexDirection: "column",
        position: "relative",
        backgroundImage: heroImage
          ? `linear-gradient(135deg, rgba(2,8,23,0.88) 0%, rgba(2,8,23,0.55) 50%, rgba(2,8,23,0.25) 100%), url("${heroImage}")`
          : "linear-gradient(135deg, #020817 0%, #0f172a 50%, #1e293b 100%)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        fontFamily: fonts.length > 0 ? "Inter" : "sans-serif",
        color: "#ffffff",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          padding: "64px 72px",
        }}
      >
        {/* Top: category + city */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "#06b6d4",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            {categoryLabel}
          </span>
          <div style={{ width: 6, height: 6, borderRadius: 3, background: "#06b6d4" }} />
          <span style={{ fontSize: 16, color: "#94a3b8" }}>{facility.city}</span>
        </div>

        {/* Center: name + price */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <h1
            style={{
              fontSize: 52,
              fontWeight: 700,
              color: "#ffffff",
              lineHeight: 1.1,
              margin: 0,
              textShadow: "0 2px 12px rgba(0,0,0,0.4)",
              maxWidth: 800,
            }}
          >
            {localizedName}
          </h1>
          {priceLine && (
            <p
              style={{
                fontSize: 24,
                fontWeight: 400,
                color: "#94a3b8",
                margin: 0,
                marginTop: 8,
              }}
            >
              {priceLine}
            </p>
          )}
        </div>

        {/* Bottom: URL + brand */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
          }}
        >
          <span style={{ fontSize: 16, color: "#64748b" }}>
            {SITE_URL}/{facilitySlug}
          </span>
          <span
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: "#06b6d4",
              letterSpacing: "0.04em",
            }}
          >
            SPLASHDEALS
          </span>
        </div>
      </div>
    </div>,
    { width: size.width, height: size.height, fonts },
  );
}

function renderFallback(
  fonts: { name: string; data: ArrayBuffer; weight: 400; style: "normal" }[],
): ImageResponse {
  return new ImageResponse(
    <div
      style={{
        width: size.width,
        height: size.height,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #020817 0%, #0f172a 50%, #1e293b 100%)",
        fontFamily: fonts.length > 0 ? "Inter" : "sans-serif",
        color: "#ffffff",
      }}
    >
      <div
        style={{
          fontSize: 64,
          fontWeight: 700,
          color: "#06b6d4",
          letterSpacing: "0.04em",
          marginBottom: 16,
        }}
      >
        SPLASHDEALS
      </div>
      <div style={{ fontSize: 20, color: "#64748b" }}>www.splashdeals.rs</div>
    </div>,
    { width: size.width, height: size.height, fonts },
  );
}
