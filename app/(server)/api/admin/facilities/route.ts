import { NextResponse } from "next/server"
import { prisma } from "@/server/lib/prisma"
import { authenticateRequest } from "@/server/lib/api-key-auth"
import { requireSuperAdmin } from "@/server/lib/auth-guards"
import { facilitySchema } from "@/server/lib/validations/facility"
import { handleServerActionError } from "@/server/lib/server-action-error"

/**
 * 🏢 Facilities API - List & Create
 */
export async function GET(request: Request) {
  try {
    await authenticateRequest(request).catch(() => requireSuperAdmin())
    const facilities = await prisma.facility.findMany({
      orderBy: { updatedAt: "desc" },
    })
    // Attach counts manually (old Ticket relation is gone)
    const facilitiesWithCounts = await Promise.all(
      facilities.map(async (f) => ({
        ...f,
        _count: {
          tickets: await prisma.ticketPrice.count({
            where: { ticketType: { category: { facilityId: f.id } } }
          }),
        }
      }))
    )
    return NextResponse.json(facilitiesWithCounts)
  } catch (error) {
    const result = handleServerActionError(error)
    return NextResponse.json(result, { status: result.error ? 400 : 500 })
  }
}

export async function POST(request: Request) {
  try {
    await authenticateRequest(request).catch(() => requireSuperAdmin())
    const json = await request.json()
    const validated = facilitySchema.parse(json)
    
    const facility = await prisma.facility.create({
      data: {
        ...validated,
        cityId: validated.cityId || validated.city,
      }
    })
    
    return NextResponse.json(facility, { status: 201 })
  } catch (error) {
    const result = handleServerActionError(error)
    return NextResponse.json(result, { status: result.error ? 400 : 500 })
  }
}
