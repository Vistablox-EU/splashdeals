import { NextResponse } from "next/server";
import { processScheduledAmenitiesAction } from "@/app/(server)/actions/amenity-actions";

/**
 * 🛰️ Infrastructure Pulse: Scheduled Amenity Activation
 * This endpoint is called by Vercel Cron or a similar system pulse to flip
 * amenities from 'Scheduled' to 'Active' status once their time has come.
 */
export async function GET(request: Request) {
  // 🔐 Simple internal security check
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized Infrastructure Access", { status: 401 });
  }

  try {
    const result = await processScheduledAmenitiesAction();
    return NextResponse.json({
      success: true,
      count: result.count,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Critical failure during infrastructure pulse:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Infrastructure activation failure",
      },
      { status: 500 },
    );
  }
}
