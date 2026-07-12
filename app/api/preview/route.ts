import { NextResponse } from "next/server";

/**
 * 🔍 Preview URL generator for CMS blog posts.
 * Returns a preview URL that can be opened in a new tab.
 */
export async function POST(request: Request) {
  try {
    const { slug, secret } = await request.json();

    if (secret !== process.env.PREVIEW_SECRET) {
      return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
    }

    return NextResponse.json({ url: `/blog/${slug}?preview=1` });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

/**
 * ✅ GET handler — simple health check / verification.
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    previewEnabled: !!process.env.PREVIEW_SECRET,
  });
}
