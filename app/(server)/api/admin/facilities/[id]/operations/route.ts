/** @consumer external-agent -- called by external tools/agents via API key. Admin UI uses Server Actions instead. */
import { NextResponse } from "next/server";
import { prisma } from "@/app/(server)/lib/prisma";
import { authenticateRequest } from "@/app/(server)/lib/api-key-auth";
import { requireSuperAdmin, validateFacilityAccess } from "@/app/(server)/lib/auth-guards";
import { updateFacilityOperationsSchema } from "@/app/(server)/lib/validations/facility";
import { handleServerActionError } from "@/app/(server)/lib/server-action-error";

/**
 * 🏢 Facility Operations API - Patch Operating Hours
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // 1. Authenticate (API Key or Session)
    const user = await authenticateRequest(request).catch(() => requireSuperAdmin());
    const { id: facilityId } = await params;

    // 2. Authorize
    await validateFacilityAccess(facilityId, user);

    // 3. Validate Payload
    const json = await request.json();
    const validated = updateFacilityOperationsSchema.parse({
      ...json,
      facilityId,
    });

    // 4. Update Database
    await prisma.$transaction([
      prisma.operatingHours.deleteMany({
        where: { facilityId },
      }),
      prisma.operatingHours.createMany({
        data: validated.hours.map((h) => ({
          facilityId,
          dayOfWeek: h.dayOfWeek,
          openTime: h.openTime,
          closeTime: h.closeTime,
          isClosed: h.isClosed,
        })),
      }),
    ]);

    const updatedHours = await prisma.operatingHours.findMany({
      where: { facilityId },
      orderBy: { dayOfWeek: "asc" },
    });

    return NextResponse.json(updatedHours);
  } catch (error) {
    const result = handleServerActionError(error);
    return NextResponse.json(result, { status: result.error ? 400 : 500 });
  }
}
