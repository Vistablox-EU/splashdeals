import { prisma } from "@/app/(server)/lib/prisma";
import { DataTable } from "./table/data-table";
import { columns } from "./columns";
import { FacilityStatus, Prisma } from "@prisma/client";
import {
  facilityListOrderBy,
  parseFacilityListLimit,
  parseFacilityListOrder,
  parseFacilityListPage,
  parseFacilityListSort,
} from "@/lib/admin/facilities-list-params";

interface FacilitiesListProps {
  q?: string;
  page?: string;
  limit?: string;
  status?: string;
  sort?: string;
  order?: string;
}

const STATUS_VALUES = new Set<string>(Object.values(FacilityStatus));

/**
 * Server-side pagination + search + status filter + sort for the facilities registry.
 */
export async function FacilitiesList({ q, page, limit, status, sort, order }: FacilitiesListProps) {
  const currentPage = parseFacilityListPage(page);
  const pageSize = parseFacilityListLimit(limit);
  const sortKey = parseFacilityListSort(sort);
  const sortOrder = parseFacilityListOrder(order);
  const skip = (currentPage - 1) * pageSize;

  const and: Prisma.FacilityWhereInput[] = [];

  if (q) {
    and.push({
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { slug: { contains: q, mode: "insensitive" } },
        { city: { contains: q, mode: "insensitive" } },
      ],
    });
  }

  if (status && STATUS_VALUES.has(status)) {
    and.push({ status: status as FacilityStatus });
  }

  const filter: Prisma.FacilityWhereInput = and.length ? { AND: and } : {};

  const [facilities, totalCount] = await Promise.all([
    prisma.facility.findMany({
      where: filter,
      orderBy: facilityListOrderBy(sortKey, sortOrder),
      take: pageSize,
      skip,
    }),
    prisma.facility.count({ where: filter }),
  ]);

  return (
    <DataTable
      columns={columns}
      data={facilities}
      totalCount={totalCount}
      currentPage={currentPage}
      pageSize={pageSize}
      initialQ={q}
      initialStatus={status && STATUS_VALUES.has(status) ? status : "all"}
      initialSort={sortKey}
      initialOrder={sortOrder}
    />
  );
}
