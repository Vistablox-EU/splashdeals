"use server";
import { prisma } from "@/app/(server)/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ValidityType, DayType, TimeSlot } from "@prisma/client";
import { validateFacilityAccess } from "@/app/(server)/lib/auth-guards";
import { DAY_TYPE_VALUES, TIME_SLOT_VALUES, VALIDITY_TYPE_VALUES } from "./constants";

// ─── Zod Schemas ────────────────────────────────────

const createCategorySchema = z.object({
  title: z.string().min(1, "Naziv kategorije je obavezan"),
});

const updateCategorySchema = z.object({
  title: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
});

const createProductSchema = z.object({
  title: z.string().min(1, "Naziv tipa je obavezan"),
  label: z.string().optional(),
  requiresIdentity: z.boolean().optional(),
  requiresPhoto: z.boolean().optional(),
  minPeople: z.number().int().min(1).optional(),
  maxPeople: z.number().int().min(1).nullable().optional(),
  isSeasonPass: z.boolean().optional(),
  validityType: z.enum(VALIDITY_TYPE_VALUES).optional(),
});

const updateProductSchema = z.object({
  title: z.string().min(1).optional(),
  label: z.string().nullable().optional(),
  requiresIdentity: z.boolean().optional(),
  requiresPhoto: z.boolean().optional(),
  minPeople: z.number().int().min(1).optional(),
  maxPeople: z.number().int().min(1).nullable().optional(),
  isActive: z.boolean().optional(),
  categoryId: z.string().optional(),
  imageUrl: z.string().nullable().optional(),
});

const createPriceSchema = z.object({
  price: z.number().min(0, "Cena ne može biti negativna"),
  originalPrice: z.number().min(0).nullable().optional(),
  label: z.string().optional(),
  dayType: z.enum(DAY_TYPE_VALUES).optional(),
  timeSlot: z.enum(TIME_SLOT_VALUES).optional(),
  validFrom: z.date().nullable().optional(),
  validTo: z.date().nullable().optional(),
});

const updatePriceSchema = z.object({
  price: z.number().min(0).optional(),
  originalPrice: z.number().min(0).nullable().optional(),
  label: z.string().nullable().optional(),
  dayType: z.enum(DAY_TYPE_VALUES).nullable().optional(),
  timeSlot: z.enum(TIME_SLOT_VALUES).nullable().optional(),
  isActive: z.boolean().optional(),
});

// ─── Types ──────────────────────────────────────────

export interface SerializedCategory {
  id: string;
  title: string;
  slug: string | null;
  displayOrder: number;
  isActive: boolean;
  products: SerializedProduct[];
}

export interface SerializedProduct {
  id: string;
  categoryId: string;
  title: string;
  label: string | null;
  requiresIdentity: boolean;
  requiresPhoto: boolean;
  minPeople: number;
  maxPeople: number | null;
  isSeasonPass: boolean;
  validityType: string;
  displayOrder: number;
  isActive: boolean;
  imageUrl: string | null;
  prices: SerializedPrice[];
}

export interface SerializedPrice {
  id: string;
  ticketProductId: string;
  label: string | null;
  price: number;
  originalPrice: number | null;
  dayType: string | null;
  timeSlot: string | null;
  validFrom: Date | null;
  validTo: Date | null;
  displayOrder: number;
  isActive: boolean;
}

// ─── Fetch ──────────────────────────────────────────

export async function getTicketHierarchy(facilityId: string): Promise<SerializedCategory[]> {
  await validateFacilityAccess(facilityId);

  const categories = await prisma.ticketCategory.findMany({
    where: { facilityId },
    orderBy: { displayOrder: "asc" },
    include: {
      types: {
        orderBy: { displayOrder: "asc" },
        include: {
          prices: { orderBy: { displayOrder: "asc" } },
        },
      },
    },
  });

  return categories.map((cat) => ({
    id: cat.id,
    title: cat.title,
    slug: cat.slug,
    displayOrder: cat.displayOrder,
    isActive: cat.isActive,
    products: cat.types.map((prod) => ({
      id: prod.id,
      categoryId: prod.categoryId,
      title: prod.title,
      label: prod.label,
      requiresIdentity: prod.requiresIdentity,
      requiresPhoto: prod.requiresPhoto,
      minPeople: prod.minPeople,
      maxPeople: prod.maxPeople,
      isSeasonPass: prod.isSeasonPass,
      validityType: prod.validityType,
      displayOrder: prod.displayOrder,
      isActive: prod.isActive,
      imageUrl: prod.imageUrl,
      prices: prod.prices.map((p) => ({
        id: p.id,
        ticketProductId: p.ticketTypeId,
        label: p.label,
        price: Number(p.price),
        originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
        dayType: p.dayType,
        timeSlot: p.timeSlot,
        validFrom: p.validFrom,
        validTo: p.validTo,
        displayOrder: p.displayOrder,
        isActive: p.isActive,
      })),
    })),
  }));
}

function revalidate(facilityId: string) {
  revalidatePath(`/admin/facilities/${facilityId}/tickets`);
}

function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "dj")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// ─── CRUD: Category ────────────────────────────

export async function createCategory(facilityId: string, title: string) {
  await validateFacilityAccess(facilityId);
  createCategorySchema.parse({ title });
  const maxOrder = await prisma.ticketCategory.aggregate({
    where: { facilityId },
    _max: { displayOrder: true },
  });
  const category = await prisma.ticketCategory.create({
    data: {
      facilityId,
      title,
      slug: slugifyTitle(title) || `kat-${Date.now()}`,
      displayOrder: (maxOrder._max.displayOrder ?? -1) + 1,
    },
  });
  revalidate(facilityId);
  return category;
}

export async function updateCategory(
  id: string,
  facilityId: string,
  data: { title?: string; isActive?: boolean },
) {
  await validateFacilityAccess(facilityId);
  updateCategorySchema.parse(data);
  await prisma.ticketCategory.update({ where: { id }, data });
  revalidate(facilityId);
}

export async function deleteCategory(id: string, facilityId: string) {
  await validateFacilityAccess(facilityId);
  await prisma.ticketCategory.delete({ where: { id } });
  revalidate(facilityId);
}

// ─── CRUD: Product ─────────────────────────────

export async function createProduct(
  categoryId: string,
  facilityId: string,
  data: {
    title: string;
    label?: string;
    requiresIdentity?: boolean;
    requiresPhoto?: boolean;
    minPeople?: number;
    maxPeople?: number | null;
    isSeasonPass?: boolean;
    validityType?: string;
  },
) {
  await validateFacilityAccess(facilityId);
  const validated = createProductSchema.parse(data);
  const maxOrder = await prisma.ticketProduct.aggregate({
    where: { categoryId },
    _max: { displayOrder: true },
  });
  const product = await prisma.ticketProduct.create({
    data: {
      categoryId,
      title: validated.title,
      label: validated.label || null,
      requiresIdentity: validated.requiresIdentity ?? false,
      requiresPhoto: validated.requiresPhoto ?? false,
      minPeople: validated.minPeople ?? 1,
      maxPeople: validated.maxPeople ?? null,
      isSeasonPass: validated.isSeasonPass ?? false,
      validityType: (validated.validityType as ValidityType) ?? "FLEXIBLE_30_DAY",
      displayOrder: (maxOrder._max.displayOrder ?? -1) + 1,
    },
  });
  revalidate(facilityId);
  return product;
}

export async function updateProduct(
  id: string,
  facilityId: string,
  data: {
    title?: string;
    label?: string | null;
    requiresIdentity?: boolean;
    requiresPhoto?: boolean;
    minPeople?: number;
    maxPeople?: number | null;
    isActive?: boolean;
    categoryId?: string;
    imageUrl?: string | null;
  },
) {
  await validateFacilityAccess(facilityId);
  updateProductSchema.parse(data);
  await prisma.ticketProduct.update({ where: { id }, data });
  revalidate(facilityId);
}

export async function deleteProduct(id: string, facilityId: string) {
  await validateFacilityAccess(facilityId);
  await prisma.ticketProduct.delete({ where: { id } });
  revalidate(facilityId);
}

// ─── CRUD: Price ───────────────────────────────

export async function createPrice(
  ticketTypeId: string,
  facilityId: string,
  data: {
    price: number;
    originalPrice?: number | null;
    label?: string;
    dayType?: string;
    timeSlot?: string;
    validFrom?: Date | null;
    validTo?: Date | null;
  },
) {
  await validateFacilityAccess(facilityId);
  const validated = createPriceSchema.parse(data);
  const maxOrder = await prisma.ticketPrice.aggregate({
    where: { ticketTypeId },
    _max: { displayOrder: true },
  });
  const dayType = (validated.dayType as DayType) ?? "ALL";
  const timeSlot = (validated.timeSlot as TimeSlot) ?? "FULL_DAY";
  const price = await prisma.ticketPrice.create({
    data: {
      ticketTypeId,
      price: validated.price,
      originalPrice: validated.originalPrice ?? null,
      label: validated.label || null,
      dayType,
      timeSlot,
      validFrom: validated.validFrom ?? null,
      validTo: validated.validTo ?? null,
      displayOrder: (maxOrder._max.displayOrder ?? -1) + 1,
    },
  });
  revalidate(facilityId);
  return price;
}

export async function updatePrice(
  id: string,
  facilityId: string,
  data: {
    price?: number;
    originalPrice?: number | null;
    label?: string | null;
    dayType?: string | null;
    timeSlot?: string | null;
    isActive?: boolean;
  },
) {
  await validateFacilityAccess(facilityId);
  const validated = updatePriceSchema.parse(data);
  await prisma.ticketPrice.update({
    where: { id },
    data: {
      ...(validated.price !== undefined ? { price: validated.price } : {}),
      ...(validated.originalPrice !== undefined ? { originalPrice: validated.originalPrice } : {}),
      ...(validated.label !== undefined ? { label: validated.label } : {}),
      ...(validated.dayType !== undefined ? { dayType: validated.dayType as DayType } : {}),
      ...(validated.timeSlot !== undefined ? { timeSlot: validated.timeSlot as TimeSlot } : {}),
      ...(validated.isActive !== undefined ? { isActive: validated.isActive } : {}),
    },
  });
  revalidate(facilityId);
}

export async function deletePrice(id: string, facilityId: string) {
  await validateFacilityAccess(facilityId);
  await prisma.ticketPrice.delete({ where: { id } });
  revalidate(facilityId);
}
