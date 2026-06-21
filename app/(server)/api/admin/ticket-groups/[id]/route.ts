import { NextResponse } from "next/server"
import { prisma } from "@/server/lib/prisma"
import { authenticateRequest } from "@/server/lib/api-key-auth"
import { requireSuperAdmin, validateFacilityAccess } from "@/server/lib/auth-guards"
import { ticketGroupSchema } from "@/server/lib/validations/ticket"
import { handleServerActionError } from "@/server/lib/server-action-error"

/**
 * 🎫 Ticket Group API - Get, Update, Delete
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateRequest(request).catch(() => requireSuperAdmin())
    const { id } = await params

    const group = await prisma.ticketGroup.findUnique({
      where: { id },
      include: {
        tickets: {
          orderBy: { displayOrder: "asc" }
        }
      }
    })

    if (!group) {
      return NextResponse.json({ error: "Ticket group not found" }, { status: 404 })
    }

    await validateFacilityAccess(group.facilityId, user)

    return NextResponse.json(group)
  } catch (error) {
    const result = handleServerActionError(error)
    return NextResponse.json(result, { status: result.error ? 400 : 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateRequest(request).catch(() => requireSuperAdmin())
    const { id } = await params
    const json = await request.json()
    
    // Validate with group schema (ignoring facilityId from payload if mismatch)
    const validated = ticketGroupSchema.partial().parse(json)

    const existing = await prisma.ticketGroup.findUnique({
      where: { id },
      select: { facilityId: true }
    })

    if (!existing) {
      return NextResponse.json({ error: "Ticket group not found" }, { status: 404 })
    }

    await validateFacilityAccess(existing.facilityId, user)

    const group = await prisma.ticketGroup.update({
      where: { id },
      data: validated as Record<string, unknown>,
    })

    return NextResponse.json(group)
  } catch (error) {
    const result = handleServerActionError(error)
    return NextResponse.json(result, { status: result.error ? 400 : 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateRequest(request).catch(() => requireSuperAdmin())
    const { id } = await params

    const existing = await prisma.ticketGroup.findUnique({
      where: { id },
      select: { facilityId: true }
    })

    if (!existing) {
      return NextResponse.json({ error: "Ticket group not found" }, { status: 404 })
    }

    await validateFacilityAccess(existing.facilityId, user)

    await prisma.ticketGroup.delete({
      where: { id }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    const result = handleServerActionError(error)
    return NextResponse.json(result, { status: result.error ? 400 : 500 })
  }
}
