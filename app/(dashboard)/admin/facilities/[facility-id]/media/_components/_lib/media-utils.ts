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

/**
 * Captures the first frame of a video file as a WebP blob.
 * Uses HTMLVideoElement + canvas, zero external dependencies.
 */
export async function captureVideoFrame(file: File, signal?: AbortSignal): Promise<Blob | null> {
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.crossOrigin = "anonymous";
  video.src = url;

  try {
    if (signal?.aborted) return null;

    await new Promise<void>((resolve, reject) => {
      const onAbort = () => {
        reject(new DOMException("Aborted", "AbortError"));
      };
      signal?.addEventListener("abort", onAbort, { once: true });
      video.onloadedmetadata = () => {
        video.currentTime = Math.min(0.5, (video.duration || 1) / 2);
      };
      video.onseeked = () => resolve();
      video.onerror = () => reject(new Error("Video load failed"));
    });

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 360;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    return await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/webp", 0.85);
    });
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}
