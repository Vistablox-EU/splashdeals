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
  media?: { url: string; type?: string; purpose?: string; duration?: string; caption?: string | null; createdAt?: Date }[];
}

export const catLabelMap: Record<string, string> = {
  "akva-parkovi": "Akva Parkovi",
  "waterpark": "Akva Parkovi",
  "bazeni": "Bazeni",
  "wellness-i-spa": "Wellness i Spa",
};
