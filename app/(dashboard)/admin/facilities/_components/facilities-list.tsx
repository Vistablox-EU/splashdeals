import { prisma } from "@/server/lib/prisma"
import { DataTable } from "./partners-table"
import { columns } from "./columns"
import { Prisma } from "@prisma/client"
import { auth } from "@/server/lib/auth"
import { headers } from "next/headers"

interface FacilitiesListProps {
  q?: string
  page?: string
  limit?: string
}

/**
 * 🌊 Facilities Registry Extraction
 * Server-side pagination and filtering to minimize bandwidth.
 */
export async function FacilitiesList({ q, page, limit }: FacilitiesListProps) {
  const session = await auth.api.getSession({ headers: await headers() })
  const userRole = (session?.user as { role?: string })?.role?.toUpperCase()
  const currentPage = Number(page) || 1
  const pageSize = Number(limit) || 15
  const skip = (currentPage - 1) * pageSize

  // 🛡️ FACILITY_STAFF can only see their assigned facilities
  const staffFilter: Prisma.FacilityWhereInput = userRole === "FACILITY_STAFF" && session?.user?.id
    ? { staffAssignments: { some: { userId: session.user.id } } }
    : {}

  const filter: Prisma.FacilityWhereInput = {
    ...staffFilter,
    ...(q ? {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { slug: { contains: q, mode: "insensitive" } },
        { city: { contains: q, mode: "insensitive" } },
      ],
    } : {}),
  }

  // 🚀 Parallel Execution: Data + Total Count
  const [partners, totalCount] = await Promise.all([
    prisma.facility.findMany({
      where: filter,
      orderBy: { createdAt: "desc" },
      take: pageSize,
      skip: skip,
    }),
    prisma.facility.count({ where: filter })
  ])

  return (
    <DataTable 
      columns={columns} 
      data={partners} 
      totalCount={totalCount} 
      currentPage={currentPage}
      pageSize={pageSize}
      initialQ={q}
    />
  )
}
