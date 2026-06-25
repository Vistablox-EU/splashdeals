"use server"

import { prisma } from "@/server/lib/prisma"
import { handleServerActionError, type ActionResult } from "@/server/lib/server-action-error"
import { requireAdmin } from "@/server/lib/auth-guards"

export interface SearchResults {
  facilities: Array<{
    id: string
    name: string
    city: string
    category: string
  }>
  tickets: Array<{
    id: string
    title: string
    facilityId: string
    facility: { name: string }
    price: number
  }>
  transactions: Array<{
    id: string
    totalAmount: number
    status: string
  }>
}

/**
 * 🔍 Admin Command Palette Search
 * Searches facilities (by name/city/category), ticket products (by title),
 * and transactions (by ID). Used by CommandPalette.tsx via SWR.
 */
export async function searchAction(
  query: string
): Promise<ActionResult<SearchResults>> {
  try {
    await requireAdmin()

    const [facilities, tickets, transactionRows] = await Promise.all([
      prisma.facility.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { city: { contains: query, mode: "insensitive" } },
            { category: { contains: query, mode: "insensitive" } },
          ],
        },
        select: { id: true, name: true, city: true, category: true },
        take: 10,
      }),

      prisma.ticketProduct.findMany({
        where: { title: { contains: query, mode: "insensitive" } },
        select: {
          id: true,
          title: true,
          category: {
            select: {
              facilityId: true,
              facility: { select: { name: true } },
            },
          },
          prices: {
            where: { isActive: true },
            take: 1,
            select: { price: true },
          },
        },
        take: 10,
      }),

      prisma.transaction.findMany({
        where: { id: { contains: query, mode: "insensitive" } },
        select: { id: true, totalAmount: true, status: true },
        take: 10,
      }),
    ])

    const formattedTickets = tickets.map((t) => ({
      id: t.id,
      title: t.title,
      facilityId: t.category.facilityId,
      facility: { name: t.category.facility.name },
      price: Number(t.prices[0]?.price ?? 0),
    }))

    const transactions = transactionRows.map((t) => ({
      id: t.id,
      totalAmount: Number(t.totalAmount),
      status: t.status,
    }))

    return {
      success: true,
      data: { facilities, tickets: formattedTickets, transactions },
    }
  } catch (error) {
    return handleServerActionError(error, "search")
  }
}
