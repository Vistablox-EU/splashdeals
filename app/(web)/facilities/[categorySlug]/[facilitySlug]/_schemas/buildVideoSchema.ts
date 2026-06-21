import { FacilitySchemaInput } from "./types";

export function buildVideoSchema(facility: FacilitySchemaInput, facilitySlug: string, heroMedia: Record<string, unknown> | null, videoThumbnail: string) {
  if (heroMedia?.type !== "VIDEO") return null;
  
  // VideoObject requires `duration` (ISO 8601) for Google video rich results.
  // We suppress the schema until duration is stored in the DB to avoid GSC warnings.
  // To re-enable: add a `duration` field to FacilityMedia and pass it here.
  if (!heroMedia?.duration) return null;

  return {
    "@type": "VideoObject",
    "@id": `https://www.splashdeals.rs/${facilitySlug}#video`,
    name: `${facility.name} - Promotional Video`,
    description: heroMedia.caption || `Promotional video for ${facility.name}`,
    contentUrl: heroMedia.url,
    thumbnailUrl: videoThumbnail,
    duration: heroMedia.duration, // ISO 8601, e.g. "PT1M30S"
    uploadDate: heroMedia.createdAt || facility.createdAt || undefined,
  };
}
