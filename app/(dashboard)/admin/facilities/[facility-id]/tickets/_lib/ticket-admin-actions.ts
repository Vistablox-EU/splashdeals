import { prisma } from "@/server/lib/prisma"
import { revalidatePath } from "next/cache"

// ─── Types ──────────────────────────────────────────

export interface SerializedCategory {
  id: string
  title: string
  titleSr: string | null
  slug: string | null
  displayOrder: number
  isActive: boolean
  products: SerializedProduct[]
}

export interface SerializedProduct {
  id: string
  categoryId: string
  title: string
  titleSr: string | null
  label: string | null
  labelSr: string | null
  requiresIdentity: boolean
  requiresPhoto: boolean
  minPeople: number
  maxPeople: number | null
  isSeasonPass: boolean
  validityType: string
  displayOrder: number
  isActive: boolean
  prices: SerializedPrice[]
}

export interface SerializedPrice {
  id: string
  ticketProductId: string
  label: string | null
  labelSr: string | null
  price: number
  originalPrice: number | null
  dayType: string | null
  timeSlot: string | null
  validFrom: Date | null
  validTo: Date | null
  displayOrder: number
  isActive: boolean
}

// ─── Fetch ───────────────────────────────────────────

export async function getTicketHierarchy(facilityId: string): Promise<SerializedCategory[]> {
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
  })

  return categories.map((cat) => ({
    id: cat.id,
    title: cat.title,
    titleSr: cat.titleSr,
    slug: cat.slug,
    displayOrder: cat.displayOrder,
    isActive: cat.isActive,
    products: cat.types.map((prod) => ({
      id: prod.id,
      categoryId: prod.categoryId,
      title: prod.title,
      titleSr: prod.titleSr,
      label: prod.label,
      labelSr: prod.labelSr,
      requiresIdentity: prod.requiresIdentity,
      requiresPhoto: prod.requiresPhoto,
      minPeople: prod.minPeople,
      maxPeople: prod.maxPeople,
      isSeasonPass: prod.isSeasonPass,
      validityType: prod.validityType,
      displayOrder: prod.displayOrder,
      isActive: prod.isActive,
      prices: prod.prices.map((p) => ({
        id: p.id,
        ticketProductId: p.ticketTypeId,
        label: p.label,
        labelSr: p.labelSr,
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
  }))
}

// ─── CRUD: Category ──────────────────────────────────

export async function createCategory(facilityId: string, title: string, titleSr?: string) {
  const maxOrder = await prisma.ticketCategory.aggregate({
    where: { facilityId },
    _max: { displayOrder: true },
  })
  const category = await prisma.ticketCategory.create({
    data: {
      facilityId,
      title,
      titleSr: titleSr || null,
      slug: title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
      displayOrder: (maxOrder._max.displayOrder ?? -1) + 1,
    },
  })
  revalidatePath(`/admin/facilities/${facilityId}/tickets`)
  return category
}

// ─── Image Upload ─────────────────────────────────────

export async function uploadTicketImageAction(formData: FormData) {
  "use server"

  const facilityId = formData.get("facilityId") as string;
  const file = formData.get("file") as File;
  if (!file || !facilityId) return { success: false, error: "Missing file or facilityId" };

  try {
    const { put } = await import("@vercel/blob");
    const blob = await put(`tickets/${facilityId}/${file.name}`, file, {
      access: "public",
      addRandomSuffix: true,
    });
    return { success: true, url: blob.url };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Upload failed" };
  }
}

export async function renameTicketImageAction(facilityId: string, oldUrl: string, newName: string) {
  "use server"

  try {
    const { put, del } = await import("@vercel/blob");
    // Fetch existing blob, copy with new name, delete old
    const response = await fetch(oldUrl);
    const blob = await response.blob();
    const file = new File([blob], `${newName}.webp`, { type: "image/webp" });
    const newBlob = await put(`tickets/${facilityId}/${newName}.webp`, file, {
      access: "public",
      addRandomSuffix: false,
    });
    // Delete old blob (best-effort)
    await del(oldUrl).catch(() => {});
    return { success: true, url: newBlob.url };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Rename failed" };
  }
}

export async function updateCategory(id: string, data: { title?: string; titleSr?: string | null; isActive?: boolean }) {
  await prisma.ticketCategory.update({ where: { id }, data })
  revalidatePath(`/admin/facilities/*/tickets`)
}

export async function deleteCategory(id: string) {
  await prisma.ticketCategory.delete({ where: { id } })
  revalidatePath(`/admin/facilities/*/tickets`)
}

// ─── CRUD: Product ───────────────────────────────────

export async function createProduct(
  categoryId: string,
  data: {
    title: string
    titleSr?: string
    label?: string
    labelSr?: string
    requiresIdentity?: boolean
    requiresPhoto?: boolean
    minPeople?: number
    maxPeople?: number | null
    isSeasonPass?: boolean
    validityType?: string
  }
) {
  const maxOrder = await prisma.ticketProduct.aggregate({
    where: { categoryId },
    _max: { displayOrder: true },
  })
  const product = await prisma.ticketProduct.create({
    data: {
      categoryId,
      title: data.title,
      titleSr: data.titleSr || null,
      label: data.label || null,
      labelSr: data.labelSr || null,
      requiresIdentity: data.requiresIdentity ?? false,
      requiresPhoto: data.requiresPhoto ?? false,
      minPeople: data.minPeople ?? 1,
      maxPeople: data.maxPeople ?? null,
      isSeasonPass: data.isSeasonPass ?? false,
      validityType: (data.validityType as any) ?? "FLEXIBLE_30_DAY",
      displayOrder: (maxOrder._max.displayOrder ?? -1) + 1,
    },
  })
  revalidatePath(`/admin/facilities/*/tickets`)
  return product
}

export async function updateProduct(
  id: string,
  data: {
    title?: string
    titleSr?: string | null
    label?: string | null
    labelSr?: string | null
    requiresIdentity?: boolean
    requiresPhoto?: boolean
    minPeople?: number
    maxPeople?: number | null
    isActive?: boolean
  }
) {
  await prisma.ticketProduct.update({ where: { id }, data })
  revalidatePath(`/admin/facilities/*/tickets`)
}

export async function deleteProduct(id: string) {
  await prisma.ticketProduct.delete({ where: { id } })
  revalidatePath(`/admin/facilities/*/tickets`)
}

// ─── CRUD: Price ─────────────────────────────────────

export async function createPrice(
  ticketTypeId: string,
  data: {
    price: number
    originalPrice?: number | null
    label?: string
    labelSr?: string
    dayType?: string
    timeSlot?: string
    validFrom?: Date | null
    validTo?: Date | null
  }
) {
  const maxOrder = await prisma.ticketPrice.aggregate({
    where: { ticketTypeId },
    _max: { displayOrder: true },
  })
  const price = await prisma.ticketPrice.create({
    data: {
      ticketTypeId,
      price: data.price,
      originalPrice: data.originalPrice ?? null,
      label: data.label || null,
      labelSr: data.labelSr || null,
      dayType: (data.dayType as any) ?? "ALL",
      timeSlot: (data.timeSlot as any) ?? "FULL_DAY",
      validFrom: data.validFrom ?? null,
      validTo: data.validTo ?? null,
      displayOrder: (maxOrder._max.displayOrder ?? -1) + 1,
    },
  })
  revalidatePath(`/admin/facilities/*/tickets`)
  return price
}

export async function updatePrice(
  id: string,
  data: {
    price?: number
    originalPrice?: number | null
    label?: string | null
    labelSr?: string | null
    dayType?: string | null
    timeSlot?: string | null
    isActive?: boolean
  }
) {
  await prisma.ticketPrice.update({
    where: { id },
    data: {
      ...(data.price !== undefined ? { price: data.price } : {}),
      ...(data.originalPrice !== undefined ? { originalPrice: data.originalPrice } : {}),
      ...(data.label !== undefined ? { label: data.label } : {}),
      ...(data.labelSr !== undefined ? { labelSr: data.labelSr } : {}),
      ...(data.dayType !== undefined ? { dayType: data.dayType as any } : {}),
      ...(data.timeSlot !== undefined ? { timeSlot: data.timeSlot as any } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
    },
  })
  revalidatePath(`/admin/facilities/*/tickets`)
}

export async function deletePrice(id: string) {
  await prisma.ticketPrice.delete({ where: { id } })
  revalidatePath(`/admin/facilities/*/tickets`)
}
