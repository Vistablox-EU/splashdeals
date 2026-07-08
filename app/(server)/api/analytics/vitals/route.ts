import { NextResponse } from "next/server";

/**
 * 📊 Analytics Endpoint: Web Vitals
 * Receives Core Web Vitals telemetry from the client-side WebVitals component.
 * Uses Edge Runtime for minimal latency.
 */

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Log to server console for visibility (use a structured logging service in production)


    // This is where you would integrate with Datadog, Axiom, or your internal tracking database
    // For now, we simply acknowledge the beacon signal to keep the client non-blocking.
    
    return new NextResponse("OK", { status: 200 });
  } catch {
    return new NextResponse("Invalid Payload", { status: 400 });
  }
}
