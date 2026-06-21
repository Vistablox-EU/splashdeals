import { NextResponse } from "next/server"
import { prisma } from "@/server/lib/prisma"
import { authenticateRequest } from "@/server/lib/api-key-auth"
import { requireSuperAdmin, validateFacilityAccess } from "@/server/lib/auth-guards"
import { updateFacilityAmenitiesSchema } from "@/server/lib/validations/facility"
import { handleServerActionError } from "@/server/lib/server-action-error"

/**
 * 🏢 Facility Amenities API - Sync Amenities
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authenticate (API Key or Session)
    const user = await authenticateRequest(request).catch(() => requireSuperAdmin())
    const { id: facilityId } = await params

    // 2. Authorize
    await validateFacilityAccess(facilityId, user)

    // 3. Validate Payload
    const json = await request.json()
    const validated = updateFacilityAmenitiesSchema.parse({
      ...json,
      facilityId,
    })

    // 4. Update Database
    await prisma.$transaction(async (tx) => {
      const targetAmenities = validated.amenities.filter(a => a.checked)
      const targetIds = new Set(targetAmenities.map(a => a.amenityId))

      // Remove amenities that are no longer checked
      await tx.facilityAmenity.deleteMany({
        where: {
          facilityId,
          amenityId: { notIn: Array.from(targetIds) }
        }
      })

      // Upsert checked amenities
      for (const amenity of targetAmenities) {
        let finalAmenityId = amenity.amenityId;

        if (amenity.isNew && amenity.name) {
          const newAmenity = await tx.amenity.create({
            data: {
              name: amenity.name,
              icon: amenity.icon || "Sparkles",
              category: amenity.category || "General",
              type: amenity.type || "BOOLEAN",
            },
          });
          finalAmenityId = newAmenity.id;
        }

        await tx.facilityAmenity.upsert({
          where: {
            facilityId_amenityId: {
              facilityId,
              amenityId: finalAmenityId,
            },
          },
          update: {
            value: amenity.value,
            isFeatured: amenity.isFeatured,
            displayOrder: amenity.displayOrder,
            imageUrl: amenity.imageUrl,
            isActive: true,
          },
          create: {
            facilityId,
            amenityId: finalAmenityId,
            value: amenity.value,
            isFeatured: amenity.isFeatured,
            displayOrder: amenity.displayOrder,
            imageUrl: amenity.imageUrl,
            isActive: true,
          },
        })
      }
    })

    const updatedAmenities = await prisma.facilityAmenity.findMany({
      where: { facilityId },
      include: { amenity: true }
    })

    return NextResponse.json(updatedAmenities)
  } catch (error) {
    const result = handleServerActionError(error)
    return NextResponse.json(result, { status: result.error ? 400 : 500 })
  }
}
