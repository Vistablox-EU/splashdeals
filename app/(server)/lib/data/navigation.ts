import "server-only";
import { prisma } from "@/app/(server)/lib/prisma";

export interface NavMenuData {
  id: string;
  label: string;
  icon: string;
  placement: string;
  sections: NavSectionData[];
}

export interface NavSectionData {
  id: string;
  heading: string | null;
  column: number;
  style: "LINKS" | "DOT_LINKS" | "DYNAMIC_CITIES" | "FOOTER_BADGE" | "VISUAL";
  config: Record<string, unknown> | null;
  items: NavItemData[];
}

export interface NavItemData {
  id: string;
  label: string;
  href: string | null;
  icon: string | null;
  desc: string | null;
  metadata: Record<string, unknown> | null;
}

export async function getNavigationMenus(): Promise<NavMenuData[]> {
   
  const menus = await (prisma as any).navigationMenu.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    include: {
      sections: {
        orderBy: { sortOrder: "asc" },
        where: { isActive: true },
        include: {
          items: {
            orderBy: { sortOrder: "asc" },
            where: { isActive: true },
          },
        },
      },
    },
  });

  return menus.map(
    (menu: {
      id: string;
      label: string;
      icon: string;
      placement: string;
      sections: {
        id: string;
        heading: string | null;
        column: number;
        style: string;
        config: unknown;
        items: {
          id: string;
          label: string;
          href: string | null;
          icon: string | null;
          desc: string | null;
          metadata: unknown;
        }[];
      }[];
    }) => ({
      id: menu.id,
      label: menu.label,
      icon: menu.icon,
      placement: menu.placement,
      sections: menu.sections.map(
        (section: {
          id: string;
          heading: string | null;
          column: number;
          style: string;
          config: unknown;
          items: {
            id: string;
            label: string;
            href: string | null;
            icon: string | null;
            desc: string | null;
            metadata: unknown;
          }[];
        }) => ({
          id: section.id,
          heading: section.heading,
          column: section.column,
          style: section.style,
          config: section.config,
          items: section.items.map(
            (item: {
              id: string;
              label: string;
              href: string | null;
              icon: string | null;
              desc: string | null;
              metadata: unknown;
            }) => ({
              id: item.id,
              label: item.label,
              href: item.href,
              icon: item.icon,
              desc: item.desc,
              metadata: item.metadata,
            }),
          ),
        }),
      ),
    }),
  );
}
