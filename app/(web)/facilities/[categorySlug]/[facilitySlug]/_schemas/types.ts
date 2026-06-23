export interface FacilitySchemaInput {
  name: string;
  slug: string;
  category: string;
  description?: string | null;
  publicPhone?: string | null;
  streetName: string;
  streetNumber: string;
  city: string;
  postalCode: string;
  lat?: number | string | null;
  lng?: number | string | null;
  createdAt?: Date | string;
  media?: { 
    url: string; 
    type?: string; 
    purpose?: string; 
    duration?: string; 
    caption?: string | null; 
    createdAt?: Date;
    isHero?: boolean;
    isCardBackground?: boolean;
    thumbnailUrl?: string | null;
  }[];
}

export const catLabelMap: Record<string, string> = {
  "akva-parkovi": "Akva Parkovi",
  "waterpark": "Akva Parkovi",
  "bazeni": "Bazeni",
  "wellness-i-spa": "Wellness i Spa",
};

/** Canonical site URL — must be set via NEXT_PUBLIC_SITE_URL env var. */
export const SITE_URL: string = process.env.NEXT_PUBLIC_SITE_URL!;
