import { NextResponse } from "next/server"
import { prisma } from "@/server/lib/prisma"
import { requireSuperAdmin } from "@/server/lib/auth-guards"
import { handleServerActionError } from "@/server/lib/server-action-error"

/**
 * 🔑 API Key Revocation
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin()
    const { id } = await params

    await prisma.apiKey.delete({
      where: { id }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    const result = handleServerActionError(error)
    return NextResponse.json(result, { status: result.error ? 400 : 500 })
  }
}
