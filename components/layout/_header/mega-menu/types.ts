// ── Types for the MegaMenu component ──────────────────────────────────

export interface NavigationMenuData {
  id: string
  label: string
  icon: string
  sections: NavigationMenuSectionData[]
}

export interface NavigationMenuSectionData {
  id: string
  heading: string | null
  column: number
  style: "LINKS" | "DOT_LINKS" | "DYNAMIC_CITIES" | "FOOTER_BADGE" | "VISUAL"
  config: Record<string, unknown> | null
  items: NavigationMenuItemData[]
}

export interface NavigationMenuItemData {
  id: string
  label: string
  href: string | null
  icon: string | null
  desc: string | null
  metadata: LinkMetadata | null
}

export interface LinkMetadata {
  badge?: { type: string; text?: string }
  price?: string
  variant?: "default" | "featured" | "cta"
  imageUrl?: string
  count?: number
  accentColor?: string
  external?: boolean
}

export interface City {
  id: string
  name: string
  slug: string
}

export interface DiscoveryMenuData {
  cities: City[]
  featured: {
    id: string
    name: string
    canonicalPath: string
    startingPrice: number | null
    description: string
  } | null
}
