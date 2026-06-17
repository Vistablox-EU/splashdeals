import { prisma } from "@/server/lib/prisma"
import { DataTable } from "./data-table"
import { columns } from "./columns"
import { Prisma } from "@prisma/client"
import { Suspense } from "react"
import { TableSkeleton } from "@/components/admin/TableSkeleton"

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
  const currentPage = Number(page) || 1
  const pageSize = Number(limit) || 15
  const skip = (currentPage - 1) * pageSize

  const filter: Prisma.FacilityWhereInput = q ? {
    OR: [
      { name: { contains: q, mode: "insensitive" } },
      { slug: { contains: q, mode: "insensitive" } },
      { city: { contains: q, mode: "insensitive" } },
    ],
  } : {}

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
    <Suspense fallback={<TableSkeleton />}>
      <DataTable 
        columns={columns} 
        data={partners} 
        totalCount={totalCount} 
        currentPage={currentPage}
        pageSize={pageSize}
        initialQ={q}
      />
    </Suspense>
  )
}
