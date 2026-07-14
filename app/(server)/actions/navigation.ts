"use server";

import { prisma } from "@/app/(server)/lib/prisma";
import { requireAdmin, requireSuperAdmin } from "@/app/(server)/lib/auth-guards";
import { handleServerActionError, type ActionResult } from "@/app/(server)/lib/server-action-error";
import { revalidatePath } from "next/cache";
import { z } from "zod/v4";
import type { City, DiscoveryMenuData } from "@/components/layout/_header/mega-menu/types";

// ─── Schemas ───────────────────────────────────────────

const menuSchema = z.object({
  label: z.string().min(1, "Naziv je obavezan"),
  icon: z.string().min(1, "Ikona je obavezna"),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export type MenuFormValues = z.infer<typeof menuSchema>;

const sectionSchema = z.object({
  menuId: z.string().uuid(),
  heading: z.string().optional().nullable(),
  column: z.number().int().min(0).max(2).default(0),
  style: z.enum(["LINKS", "DOT_LINKS", "DYNAMIC_CITIES", "FOOTER_BADGE", "VISUAL"]),
  config: z.any().optional().nullable(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export type SectionFormValues = z.infer<typeof sectionSchema>;

const itemSchema = z.object({
  sectionId: z.string().uuid(),
  label: z.string().min(1, "Naziv je obavezan"),
  href: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  desc: z.string().optional().nullable(),
  metadata: z.any().optional().nullable(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export type ItemFormValues = z.infer<typeof itemSchema>;

const reorderItemSchema = z.object({
  id: z.string().uuid(),
  sortOrder: z.number().int(),
});

// ─── Menu CRUD ─────────────────────────────────────────

export async function createMenuAction(
  data: z.infer<typeof menuSchema>,
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin();
    const validated = menuSchema.parse(data);

    const menu = await prisma.navigationMenu.create({ data: validated });

    revalidatePath("/admin/cms/navigation");
    return { success: true, data: { id: menu.id } };
  } catch (error) {
    return handleServerActionError(error, "navigation/createMenu");
  }
}

export async function updateMenuAction(
  id: string,
  data: Partial<z.infer<typeof menuSchema>>,
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const validated = menuSchema.partial().parse(data);

    await prisma.navigationMenu.update({ where: { id }, data: validated });

    revalidatePath("/admin/cms/navigation");
    return { success: true };
  } catch (error) {
    return handleServerActionError(error, "navigation/updateMenu");
  }
}

export async function deleteMenuAction(id: string): Promise<ActionResult> {
  try {
    await requireSuperAdmin();

    await prisma.navigationMenu.delete({ where: { id } });

    revalidatePath("/admin/cms/navigation");
    return { success: true };
  } catch (error) {
    return handleServerActionError(error, "navigation/deleteMenu");
  }
}

export async function reorderMenusAction(
  items: z.infer<typeof reorderItemSchema>[],
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const validated = z.array(reorderItemSchema).parse(items);

    await prisma.$transaction(
      validated.map((item) =>
        prisma.navigationMenu.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        }),
      ),
    );

    revalidatePath("/admin/cms/navigation");
    return { success: true };
  } catch (error) {
    return handleServerActionError(error, "navigation/reorderMenus");
  }
}

// ─── Section CRUD ──────────────────────────────────────

export async function createSectionAction(
  data: z.infer<typeof sectionSchema>,
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin();
    const validated = sectionSchema.parse(data);

    const section = await prisma.navigationMenuSection.create({ data: validated });

    revalidatePath("/admin/cms/navigation");
    return { success: true, data: { id: section.id } };
  } catch (error) {
    return handleServerActionError(error, "navigation/createSection");
  }
}

export async function updateSectionAction(
  id: string,
  data: Partial<z.infer<typeof sectionSchema>>,
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const validated = sectionSchema.partial().parse(data);

    await prisma.navigationMenuSection.update({ where: { id }, data: validated });

    revalidatePath("/admin/cms/navigation");
    return { success: true };
  } catch (error) {
    return handleServerActionError(error, "navigation/updateSection");
  }
}

export async function deleteSectionAction(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();

    await prisma.navigationMenuSection.delete({ where: { id } });

    revalidatePath("/admin/cms/navigation");
    return { success: true };
  } catch (error) {
    return handleServerActionError(error, "navigation/deleteSection");
  }
}

export async function reorderSectionsAction(
  items: (z.infer<typeof reorderItemSchema> & { column?: number })[],
): Promise<ActionResult> {
  try {
    await requireAdmin();

    await prisma.$transaction(
      items.map((item) =>
        prisma.navigationMenuSection.update({
          where: { id: item.id },
          data: {
            sortOrder: item.sortOrder,
            ...(item.column !== undefined ? { column: item.column } : {}),
          },
        }),
      ),
    );

    revalidatePath("/admin/cms/navigation");
    return { success: true };
  } catch (error) {
    return handleServerActionError(error, "navigation/reorderSections");
  }
}

// ─── Item CRUD ─────────────────────────────────────────

export async function createItemAction(
  data: z.infer<typeof itemSchema>,
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin();
    const validated = itemSchema.parse(data);

    const item = await prisma.navigationMenuItem.create({ data: validated });

    revalidatePath("/admin/cms/navigation");
    return { success: true, data: { id: item.id } };
  } catch (error) {
    return handleServerActionError(error, "navigation/createItem");
  }
}

export async function updateItemAction(
  id: string,
  data: Partial<z.infer<typeof itemSchema>>,
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const validated = itemSchema.partial().parse(data);

    await prisma.navigationMenuItem.update({ where: { id }, data: validated });

    revalidatePath("/admin/cms/navigation");
    return { success: true };
  } catch (error) {
    return handleServerActionError(error, "navigation/updateItem");
  }
}

export async function deleteItemAction(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();

    await prisma.navigationMenuItem.delete({ where: { id } });

    revalidatePath("/admin/cms/navigation");
    return { success: true };
  } catch (error) {
    return handleServerActionError(error, "navigation/deleteItem");
  }
}

export async function reorderItemsAction(
  items: (z.infer<typeof reorderItemSchema> & { sectionId?: string })[],
): Promise<ActionResult> {
  try {
    await requireAdmin();

    await prisma.$transaction(
      items.map((item) =>
        prisma.navigationMenuItem.update({
          where: { id: item.id },
          data: {
            sortOrder: item.sortOrder,
            ...(item.sectionId !== undefined ? { sectionId: item.sectionId } : {}),
          },
        }),
      ),
    );

    revalidatePath("/admin/cms/navigation");
    return { success: true };
  } catch (error) {
    return handleServerActionError(error, "navigation/reorderItems");
  }
}

// ─── Public data actions (replaces /api/menu/navigation) ────────

export async function getMenusAction(): Promise<ActionResult<{ menus: unknown[] }>> {
  try {
    const menus = await prisma.navigationMenu.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        sections: {
          where: { isActive: true },
          orderBy: [{ column: "asc" }, { sortOrder: "asc" }],
          include: {
            items: {
              where: { isActive: true },
              orderBy: { sortOrder: "asc" },
            },
          },
        },
      },
    });
    return { success: true, data: { menus } };
  } catch (error) {
    return handleServerActionError(error, "navigation/getMenus");
  }
}

export async function getDiscoveryAction(): Promise<ActionResult<DiscoveryMenuData>> {
  try {
    const cities = await prisma.city.findMany({
      where: { facilities: { some: {} } },
      select: { id: true, name: true, slug: true },
      orderBy: { name: "asc" },
    });

    const featuredFacility = await prisma.facility.findFirst({
      where: {
        status: "ACTIVE",
        media: { some: { isHero: true } },
        ticketCategories: {
          some: {
            isActive: true,
            types: {
              some: {
                isActive: true,
                prices: { some: { isActive: true } },
              },
            },
          },
        },
      },
      include: {
        media: { where: { isHero: true }, take: 1 },
        ticketCategories: {
          where: { isActive: true },
          include: {
            types: {
              where: { isActive: true },
              include: {
                prices: { where: { isActive: true }, orderBy: { price: "asc" }, take: 1 },
              },
              take: 1,
            },
          },
          take: 1,
        },
        marketplaceCities: { include: { city: true } },
      },
    });

    let featured = null;
    if (featuredFacility) {
      const cheapestPrice = featuredFacility.ticketCategories?.[0]?.types?.[0]?.prices?.[0];

      featured = {
        id: featuredFacility.id,
        name: featuredFacility.name,
        canonicalPath: `/${featuredFacility.slug}`,
        startingPrice: cheapestPrice ? Number(cheapestPrice.price) : null,
        description:
          featuredFacility.description?.slice(0, 100) ||
          "Doživite nezaboravnu letnju avanturu na najboljim bazenima u Srbiji.",
      };
    }

    return { success: true, data: { cities, featured } };
  } catch (error) {
    return handleServerActionError(error, "navigation/getDiscovery");
  }
}
