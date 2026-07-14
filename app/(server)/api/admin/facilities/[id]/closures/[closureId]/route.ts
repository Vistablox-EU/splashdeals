/** @consumer external-agent -- called by external tools/agents via API key. Admin UI uses Server Actions instead. */
import { NextResponse } from "next/server";
import { prisma } from "@/app/(server)/lib/prisma";
import { authenticateRequest } from "@/app/(server)/lib/api-key-auth";
import { requireSuperAdmin, validateFacilityAccess } from "@/app/(server)/lib/auth-guards";
import { handleServerActionError } from "@/app/(server)/lib/server-action-error";

/**
 * 🏢 Facility Closures API - Delete
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; closureId: string }> },
) {
  try {
    const user = await authenticateRequest(request).catch(() => requireSuperAdmin());
    const { id: facilityId, closureId } = await params;
    await validateFacilityAccess(facilityId, user);

    await prisma.facilityClosure.delete({
      where: {
        id: closureId,
        facilityId, // Ensure closure belongs to this facility
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const result = handleServerActionError(error);
    return NextResponse.json(result, { status: result.error ? 400 : 500 });
  }
}
