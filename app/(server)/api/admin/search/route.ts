import { NextResponse } from "next/server"
import { prisma } from "@/server/lib/prisma"
import { authenticateRequest } from "@/server/lib/api-key-auth"
import { requireSuperAdmin } from "@/server/lib/auth-guards"

export async function GET(request: Request) {
  await authenticateRequest(request).catch(() => requireSuperAdmin())
  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q") || ""

  if (q.length < 2) {
    return NextResponse.json({ facilities: [], tickets: [], transactions: [] })
  }

  const [facilities, tickets, transactions] = await Promise.all([
    prisma.facility.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { city: { contains: q, mode: 'insensitive' } },
        ]
      },
      select: { id: true, name: true, city: true, category: true, slug: true },
      take: 5,
    }),
    prisma.ticket.findMany({
      where: {
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ]
      },
      include: { facility: { select: { name: true } } },
      take: 5,
    }),
    prisma.transaction.findMany({
      where: {
        OR: [
          { id: { contains: q, mode: 'insensitive' } },
          { stripeSession: { contains: q, mode: 'insensitive' } },
        ]
      },
      select: { id: true, totalAmount: true, status: true, createdAt: true },
      take: 3,
    })
  ])

  return NextResponse.json({ facilities, tickets, transactions })
}
