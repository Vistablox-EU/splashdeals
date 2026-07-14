import { NextResponse } from "next/server";
import { getActiveCities } from "@/app/(server)/lib/data/discovery";

/**
 * 🏙️ Active Cities Discovery API
 * Returns regional hubs that have live aquatic inventory.
 * Leverages Next.js 16 caching for ultra-fast response.
 */
export async function GET() {
  try {
    const cities = await getActiveCities();
    return NextResponse.json(cities);
  } catch (error) {
    console.error("🏙️ Cities Discovery Error:", error);
    return NextResponse.json({ error: "Failed to fetch active cities" }, { status: 500 });
  }
}
