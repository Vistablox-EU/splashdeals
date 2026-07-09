import { describe, it, expect } from "vitest";
import { filenameFromBlobUrl } from "./media-utils";

describe("filenameFromBlobUrl", () => {
  it("extracts filename from a standard Vercel Blob URL", () => {
    const url = "https://public.blob.vercel-storage.com/facilities/123/photo-abc123.webp";
    expect(filenameFromBlobUrl(url)).toBe("photo-abc123");
  });

  it("strips leading timestamp numbers", () => {
    const url = "https://public.blob.vercel-storage.com/facilities/123/1734567890-photo-name.webp";
    expect(filenameFromBlobUrl(url)).toBe("photo-name");
  });

  it("handles URLs with query parameters", () => {
    const url =
      "https://public.blob.vercel-storage.com/facilities/123/video.mp4?updatedAt=1234567890";
    expect(filenameFromBlobUrl(url)).toBe("video");
  });

  it("handles filenames with multiple dots", () => {
    const url = "https://public.blob.vercel-storage.com/facilities/123/my.photo.final.webp";
    expect(filenameFromBlobUrl(url)).toBe("my.photo.final");
  });

  it("handles deeply nested paths", () => {
    const url =
      "https://public.blob.vercel-storage.com/facilities/123/videos/thumbnails/thumb-abc.webp";
    expect(filenameFromBlobUrl(url)).toBe("thumb-abc");
  });

  it("returns fallback on invalid URL", () => {
    expect(filenameFromBlobUrl("not-a-url")).toBe("fajl");
  });

  it("returns fallback on empty string", () => {
    expect(filenameFromBlobUrl("")).toBe("fajl");
  });
});
