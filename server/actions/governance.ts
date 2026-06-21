"use server"

import { z } from "zod"
import { prisma } from "@/server/lib/prisma"
import { revalidateAdminFacility } from "@/server/lib/revalidation"
import { 
  updateFacilityGovernanceSchema, 
  type UpdateFacilityGovernanceValues,
  updateFacilityStatusSchema,
  type UpdateFacilityStatusValues,
  updateFacilityOperationsSchema,
  type UpdateFacilityOperationsValues,
} from "@/server/lib/validations/facility"
import { validateFacilityAccess } from "@/server/lib/auth-guards"



import { handleServerActionError } from "@/server/lib/server-action-error"

const socialLinksSchema = z.object({
  facilityId: z.string(),
  socialLinks: z.object({
    facebook: z.string().url().nullish().or(z.literal("")),
    instagram: z.string().url().nullish().or(z.literal("")),
    website: z.string().url().nullish().or(z.literal("")),
  }),
})

const contactSchema = z.object({
  facilityId: z.string(),
  publicPhone: z.string().max(25).nullable(),
  publicEmail: z.string().email().nullable().or(z.literal("")),
})

const logoUrlSchema = z.object({
  facilityId: z.string(),
  logoUrl: z.string().url().nullable(),
})

export async function updateFacilityStatusAction(rawValues: UpdateFacilityStatusValues) {
  try {
    const validatedFields = updateFacilityStatusSchema.parse(rawValues)
    const { facilityId, status } = validatedFields

    await validateFacilityAccess(facilityId)
    await prisma.facility.update({
      where: { id: facilityId },
      data: { status },
    })

    revalidateAdminFacility(facilityId)
    return { success: true }
  } catch (error: unknown) {
    return handleServerActionError(error, "governance")
  }
}

export async function updateFacilityGovernanceAction(rawValues: UpdateFacilityGovernanceValues) {
  try {
    const validatedFields = updateFacilityGovernanceSchema.parse(rawValues)

    const { 
      facilityId, 
      name,
      description, 
      slug, 
      city, 
      streetName, 
      streetNumber, 
      postalCode, 
      targetCityIds,
      metaTitle,
      metaDescription,
      logoUrl,
      publicPhone,
      publicEmail,
      socialLinks,
      emergencyContact,
      status,
      hours,
      seoArticle,
      transitGuide
    } = validatedFields

    await validateFacilityAccess(facilityId)
    await prisma.$transaction(async (tx) => {
      // 1. Update basic record
      await tx.facility.update({
        where: { id: facilityId },
        data: { 
          name,
          description, 
          slug, 
          city, 
          streetName, 
          streetNumber, 
          postalCode,
          metaTitle,
          metaDescription,
          logoUrl,
          publicPhone,
          publicEmail,
          socialLinks,
          emergencyContact,
          status,
          seoArticle,
          transitGuide
        },
      })

      // 2. Update Marketplace Tags (Junction Table)
      // strategy: Wipe and rebuild the relationship for atomic consistency
      await tx.facilityCity.deleteMany({
        where: { facilityId }
      })

      if (targetCityIds.length > 0) {
        await tx.facilityCity.createMany({
          data: targetCityIds.map(cityId => ({
            facilityId,
            cityId,
            isPrimary: false // Can be extended later for prioritized sorting
          }))
        })
      }

      // 3. Clear existing hours for this facility and replace with new ones
      await tx.operatingHours.deleteMany({
        where: { facilityId }
      })

      await tx.operatingHours.createMany({
        data: hours.map(h => ({
          facilityId,
          dayOfWeek: h.dayOfWeek,
          openTime: h.openTime,
          closeTime: h.closeTime,
          isClosed: h.isClosed,
        }))
      })
    })

    revalidateAdminFacility(facilityId)
    return { success: true }
  } catch (error: unknown) {
    return handleServerActionError(error, "governance")
  }
}

export async function updateFacilityOperationsAction(rawValues: UpdateFacilityOperationsValues) {
  try {
    const validatedFields = updateFacilityOperationsSchema.parse(rawValues)
    const { facilityId, hours } = validatedFields

    await validateFacilityAccess(facilityId)
    await prisma.$transaction(async (tx) => {
      await tx.operatingHours.deleteMany({
        where: { facilityId }
      })

      await tx.operatingHours.createMany({
        data: hours.map(h => ({
          facilityId,
          dayOfWeek: h.dayOfWeek,
          openTime: h.openTime,
          closeTime: h.closeTime,
          isClosed: h.isClosed,
        }))
      })
    })

    revalidateAdminFacility(facilityId)
    return { success: true }
  } catch (error: unknown) {
    return handleServerActionError(error, "governance")
  }
}

export async function updateFacilitySocialLinksAction(facilityId: string, socialLinks: Record<string, string>) {
  try {
    const validated = socialLinksSchema.parse({ facilityId, socialLinks })
    await validateFacilityAccess(validated.facilityId)
    await prisma.facility.update({
      where: { id: validated.facilityId },
      data: { socialLinks: validated.socialLinks }
    })
    
    revalidateAdminFacility(facilityId)
    return { success: true }
  } catch (error: unknown) {
    return handleServerActionError(error, "governance")
  }
}

export async function updateFacilityContactAction(
  facilityId: string,
  contact: { publicPhone: string; publicEmail: string }
) {
  try {
    const validated = contactSchema.parse({ facilityId, publicPhone: contact.publicPhone, publicEmail: contact.publicEmail })
    await validateFacilityAccess(validated.facilityId)
    await prisma.facility.update({
      where: { id: validated.facilityId },
      data: { publicPhone: validated.publicPhone, publicEmail: validated.publicEmail }
    })

    revalidateAdminFacility(facilityId)
    return { success: true }
  } catch (error: unknown) {
    return handleServerActionError(error, "governance")
  }
}

export async function checkSlugAvailabilityAction(slug: string, excludeFacilityId: string) {
  if (!slug || slug.length < 2) return { isAvailable: true }
  
  try {
    const existing = await prisma.facility.findFirst({
      where: {
        slug: slug.toLowerCase(),
        NOT: { id: excludeFacilityId }
      },
      select: { id: true }
    })
    
    return { isAvailable: !existing }
  } catch (error) {
    console.error("[checkSlugAvailability] Error:", error)
    return { isAvailable: false, error: "Validation failure" }
  }
}

export async function updateFacilityLogoAction(facilityId: string, logoUrl: string) {
  try {
    const validated = logoUrlSchema.parse({ facilityId, logoUrl })
    await validateFacilityAccess(validated.facilityId)
    await prisma.facility.update({
      where: { id: validated.facilityId },
      data: { logoUrl: validated.logoUrl }
    })
    
    revalidateAdminFacility(facilityId)
    return { success: true }
  } catch (error) {
    return handleServerActionError(error, "governance")
  }
}
