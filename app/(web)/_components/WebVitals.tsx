"use client";

import { useReportWebVitals } from "next/web-vitals";

/**
 * 🌊 Splashdeals Web Vitals Reporter
 * Automatically measures and reports performance metrics according to core-web-vitals standards.
 * Integrates directly into the Next.js 16 lifecycle via `useReportWebVitals`.
 * Reference: https://web.dev/articles/vitals
 */
export function WebVitals() {
  useReportWebVitals((metric) => {
    const { id, name, label, value } = metric;

    // Output to console in development for immediate developer feedback
    if (process.env.NODE_ENV === "development") {
      // console.log(`[Web-Vitals] ${name} (${label}):`, value, `(ID: ${id})`);
    }

    // Production tracking logic (e.g. sending to custom Analytics / GA4 / Vercel Speed Insights)
    // Safe check to ensure navigator is present before executing browser APIs
    if (process.env.NODE_ENV === "production" && typeof window !== "undefined") {
      const body = JSON.stringify({
        id,
        name,
        label,
        value: value.toString(), // Must be string for beacon payload stability
        path: window.location.pathname,
      });

      // Use native HTML5 sendBeacon API for non-blocking background telemetry dispatch
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/analytics/vitals", body);
      } else {
        fetch("/api/analytics/vitals", {
          body,
          method: "POST",
          keepalive: true,
          headers: {
            "Content-Type": "application/json",
          },
        }).catch(() => {
          // Silently catch failures to prevent tracking code from blocking main thread
        });
      }
    }
  });

  return null;
}
