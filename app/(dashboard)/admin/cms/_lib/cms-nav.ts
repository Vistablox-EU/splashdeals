/**
 * Single source of truth for CMS secondary nav + hub quick links.
 * Labels intentionally distinguish coupon/facility campaigns from email campaigns (listmonk).
 */
export type CmsNavItem = {
  href: string;
  label: string;
  icon: string;
  /** Show as hub quick-link card */
  hub?: boolean;
  /** Hub stat key when count is available */
  statKey?:
    | "posts"
    | "pages"
    | "campaigns"
    | "webhooks"
    | "categories"
    | "tags"
    | "reviews"
    | "redirects"
    | "scheduled";
};

export const CMS_NAV: readonly CmsNavItem[] = [
  { href: "/admin/cms/posts", label: "Objave", icon: "article", hub: true, statKey: "posts" },
  { href: "/admin/cms/pages", label: "Strane", icon: "description", hub: true, statKey: "pages" },
  {
    href: "/admin/cms/categories",
    label: "Kategorije",
    icon: "category",
    hub: true,
    statKey: "categories",
  },
  { href: "/admin/cms/tags", label: "Oznake", icon: "sell", hub: true, statKey: "tags" },
  {
    href: "/admin/cms/campaigns",
    label: "Kuponi / kampanje",
    icon: "local_offer",
    hub: true,
    statKey: "campaigns",
  },
  {
    href: "/admin/cms/reviews",
    label: "Recenzije",
    icon: "rate_review",
    hub: true,
    statKey: "reviews",
  },
  { href: "/admin/cms/activity", label: "Aktivnost", icon: "history", hub: true },
  { href: "/admin/cms/navigation", label: "Navigacija", icon: "menu", hub: true },
  {
    href: "/admin/cms/redirects",
    label: "Preusmeravanja",
    icon: "alt_route",
    hub: true,
    statKey: "redirects",
  },
  {
    href: "/admin/cms/webhooks",
    label: "Vebhukovi",
    icon: "webhook",
    hub: true,
    statKey: "webhooks",
  },
  { href: "/admin/cms/tools", label: "Alati", icon: "build", hub: true },
] as const;

export function isCmsNavActive(pathname: string, href: string): boolean {
  if (href === "/admin/cms") return pathname === "/admin/cms";
  return pathname === href || pathname.startsWith(`${href}/`);
}
