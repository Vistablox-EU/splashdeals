import { GoogleAnalytics } from "@next/third-parties/google";

/**
 * 🌊 Splashdeals Google Analytics 4 Script
 *
 * Injects the gtag script via @next/third-parties (Google's official
 * Next.js integration). Uses lazyOnload strategy — never blocks
 * rendering or interaction.
 *
 * Reads GA measurement ID from NEXT_PUBLIC_GA_MEASUREMENT_ID env var.
 * Returns null when the ID is not configured (safe for dev/preview).
 */
export function GAScript() {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  if (!gaId) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[GA] NEXT_PUBLIC_GA_MEASUREMENT_ID not set — skipping");
    }
    return null;
  }

  return <GoogleAnalytics gaId={gaId} />;
}
