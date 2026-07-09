/**
 * Extracts the display filename (without extension) from a Vercel Blob URL.
 */
export function filenameFromBlobUrl(url: string): string {
  try {
    const segments = new URL(url).pathname.split("/");
    const last = segments[segments.length - 1] ?? "fajl";
    return last.replace(/^\d+-/, "").replace(/\.[^.]+$/, "");
  } catch {
    return "fajl";
  }
}
