/** @consumer external-agent -- called by external tools/agents via API key. Admin UI uses Server Actions instead. */
import { NextResponse } from "next/server";
import { prisma } from "@/app/(server)/lib/prisma";
import { authenticateRequest } from "@/app/(server)/lib/api-key-auth";
import { requireSuperAdmin, validateFacilityAccess } from "@/app/(server)/lib/auth-guards";
import { updateFacilityGovernanceSchema } from "@/app/(server)/lib/validations/facility";
import { handleServerActionError } from "@/app/(server)/lib/server-action-error";
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // 1. Authenticate (API Key or Session)
    const user = await authenticateRequest(request).catch(() => requireSuperAdmin());
    const { id: facilityId } = await params;

    // 2. Authorize
    await validateFacilityAccess(facilityId, user);

    // 3. Validate Payload
    const json = await request.json();
    const validated = updateFacilityGovernanceSchema.parse({
      ...json,
      facilityId, // Ensure ID from URL matches
    });

    // 4. Update Database
    const facility = await prisma.$transaction(async (tx) => {
      // Update basic fields
      const updated = await tx.facility.update({
        where: { id: facilityId },
        data: {
          name: validated.name,
          slug: validated.slug,
          description: validated.description,
          city: validated.city,
          streetName: validated.streetName,
          streetNumber: validated.streetNumber,
          postalCode: validated.postalCode,
          publicPhone: validated.publicPhone,
          publicEmail: validated.publicEmail,
          socialLinks: validated.socialLinks,
          metaTitle: validated.metaTitle,
          metaDescription: validated.metaDescription,
          logoUrl: validated.logoUrl,
          emergencyContact: validated.emergencyContact,
          seoArticle: validated.seoArticle,
          transitGuide: validated.transitGuide,
          status: validated.status,
        },
      });

      // Sync operating hours if provided
      if (validated.hours) {
        await tx.operatingHours.deleteMany({
          where: { facilityId },
        });
        await tx.operatingHours.createMany({
          data: validated.hours.map((h) => ({
            facilityId,
            dayOfWeek: h.dayOfWeek,
            openTime: h.openTime,
            closeTime: h.closeTime,
            isClosed: h.isClosed,
          })),
        });
      }

      return updated;
    });

    return NextResponse.json(facility);
  } catch (error) {
    const result = handleServerActionError(error);
    return NextResponse.json(result, { status: result.error ? 400 : 500 });
  }
}
