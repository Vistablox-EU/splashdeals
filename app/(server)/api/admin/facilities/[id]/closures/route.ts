/** @consumer external-agent -- called by external tools/agents via API key. Admin UI uses Server Actions instead. */
import { NextResponse } from "next/server";
import { prisma } from "@/app/(server)/lib/prisma";
import { authenticateRequest } from "@/app/(server)/lib/api-key-auth";
import { requireSuperAdmin, validateFacilityAccess } from "@/app/(server)/lib/auth-guards";
import { handleServerActionError } from "@/app/(server)/lib/server-action-error";
import { z } from "zod";

const closureSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  reason: z.string().max(200).nullish(),
  isEmergency: z.boolean().default(false),
});

/**
 * 🏢 Facility Closures API - List & Create
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await authenticateRequest(request).catch(() => requireSuperAdmin());
    const { id: facilityId } = await params;
    await validateFacilityAccess(facilityId, user);

    const closures = await prisma.facilityClosure.findMany({
      where: { facilityId },
      orderBy: { startDate: "desc" },
    });

    return NextResponse.json(closures);
  } catch (error) {
    const result = handleServerActionError(error);
    return NextResponse.json(result, { status: result.error ? 400 : 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await authenticateRequest(request).catch(() => requireSuperAdmin());
    const { id: facilityId } = await params;
    await validateFacilityAccess(facilityId, user);

    const json = await request.json();
    const validated = closureSchema.parse(json);

    const closure = await prisma.facilityClosure.create({
      data: {
        facilityId,
        startDate: new Date(validated.startDate),
        endDate: new Date(validated.endDate),
        reason: validated.reason,
        isEmergency: validated.isEmergency,
      },
    });

    return NextResponse.json(closure, { status: 201 });
  } catch (error) {
    const result = handleServerActionError(error);
    return NextResponse.json(result, { status: result.error ? 400 : 500 });
  }
}
