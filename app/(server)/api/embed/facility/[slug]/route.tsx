import { NextRequest } from "next/server";
import { prisma } from "@/app/(server)/lib/prisma";

/**
 * 🌊 Embed widget API endpoint for facility pages.
 *
 * Returns an HTML snippet that facility owners can copy-paste into their own
 * websites to display a "Kupi kartu" ticket purchase button.
 *
 * GET /api/embed/facility/{slug}
 */

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || "https://splashdeals.rs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const facility = await prisma.facility.findUnique({
    where: { slug, status: "ACTIVE" },
    select: {
      id: true,
      name: true,
      slug: true,
      city: true,
      logoUrl: true,
    },
  });

  if (!facility) {
    return new Response(JSON.stringify({ error: "Facility not found or inactive" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const facilityUrl = `${BASE_URL}/${facility.slug}`;
  const logoHtml = facility.logoUrl
    ? `<img src="${facility.logoUrl}" alt="${facility.name}" style="height:32px;width:auto;margin-bottom:8px;" />`
    : "";

  const html = `<div id="splashdeals-widget" data-facility="${facility.slug}" style="display:flex;flex-direction:column;align-items:center;gap:8px;padding:16px;background:linear-gradient(135deg,#0f172a,#1e293b);border-radius:12px;font-family:Inter,system-ui,sans-serif;max-width:280px;text-align:center;">
  ${logoHtml}
  <p style="margin:0;color:#f8fafc;font-size:14px;font-weight:600;">${facility.name} — ${facility.city}</p>
  <a href="${facilityUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:10px 24px;background:#06b6d4;color:#fff;font-size:14px;font-weight:700;border-radius:8px;text-decoration:none;letter-spacing:0.02em;transition:background 0.2s;" onmouseover="this.style.background='#0891b2'" onmouseout="this.style.background='#06b6d4'">
    Kupi kartu
  </a>
  <p style="margin:0;color:#94a3b8;font-size:11px;">Powered by <a href="${BASE_URL}" target="_blank" rel="noopener noreferrer" style="color:#06b6d4;text-decoration:none;">Splashdeals</a></p>
</div>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, s-maxage=3600, max-age=300, stale-while-revalidate=3600",
    },
  });
}
