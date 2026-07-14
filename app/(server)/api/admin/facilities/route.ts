/** @consumer external-agent -- called by external tools/agents via API key. Admin UI uses Server Actions instead. */
import { NextResponse } from "next/server";
import { prisma } from "@/app/(server)/lib/prisma";
import { authenticateRequest } from "@/app/(server)/lib/api-key-auth";
import { requireSuperAdmin } from "@/app/(server)/lib/auth-guards";
import { facilitySchema } from "@/app/(server)/lib/validations/facility";
import { handleServerActionError } from "@/app/(server)/lib/server-action-error";

/**
 * 🏢 Facilities API - List & Create
 */
export async function GET(request: Request) {
  try {
    await authenticateRequest(request).catch(() => requireSuperAdmin());
    const facilities = await prisma.facility.findMany({
      orderBy: { updatedAt: "desc" },
    });
    // Attach counts manually (old Ticket relation is gone)
    const facilitiesWithCounts = await Promise.all(
      facilities.map(async (f) => ({
        ...f,
        _count: {
          tickets: await prisma.ticketPrice.count({
            where: { ticketType: { category: { facilityId: f.id } } },
          }),
        },
      })),
    );
    return NextResponse.json(facilitiesWithCounts);
  } catch (error) {
    const result = handleServerActionError(error);
    return NextResponse.json(result, { status: result.error ? 400 : 500 });
  }
}

export async function POST(request: Request) {
  try {
    await authenticateRequest(request).catch(() => requireSuperAdmin());
    const json = await request.json();
    const validated = facilitySchema.parse(json);

    const facility = await prisma.facility.create({
      data: {
        ...validated,
        cityId: validated.cityId || validated.city,
      },
    });

    return NextResponse.json(facility, { status: 201 });
  } catch (error) {
    const result = handleServerActionError(error);
    return NextResponse.json(result, { status: result.error ? 400 : 500 });
  }
}
