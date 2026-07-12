import { NextResponse } from "next/server";
import QRCode from "qrcode";

export async function GET(_request: Request, { params }: { params: Promise<{ hash: string }> }) {
  const { hash } = await params;
  const url = `${process.env.NEXT_PUBLIC_BASE_URL || "https://splashdeals.rs"}/verify/${hash}`;
  const qrBuffer = await QRCode.toBuffer(url, {
    type: "png",
    width: 300,
    margin: 2,
    color: { dark: "#1a1a1a", light: "#ffffff" },
  });
  return new NextResponse(qrBuffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
