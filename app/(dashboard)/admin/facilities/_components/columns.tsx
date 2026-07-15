"use client";

import { Icon } from "@/components/ui/Icon";
import { ColumnDef } from "@tanstack/react-table";
import { Facility } from "@prisma/client";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { StatusToggle } from "@/app/(dashboard)/admin/_common/StatusToggle";
import { buildPublicFacilityPath } from "@/lib/routing/public-facility-path";
import type { FacilityListSortKey } from "@/lib/admin/facilities-list-params";

function SortHeader({
  label,
  columnId,
  activeSort,
  activeOrder,
}: {
  label: string;
  columnId: FacilityListSortKey;
  activeSort?: FacilityListSortKey;
  activeOrder?: "asc" | "desc";
}) {
  const router = useRouter();
  const isActive = activeSort === columnId;
  const nextOrder: "asc" | "desc" = isActive && activeOrder === "asc" ? "desc" : "asc";

  return (
    <Button
      variant="ghost"
      type="button"
      onClick={() => {
        const params = new URLSearchParams(window.location.search);
        params.set("sort", columnId);
        params.set("order", nextOrder);
        params.set("page", "1");
        router.push(`?${params.toString()}`, { scroll: false });
      }}
      className="data-[state=open]:bg-accent -ml-4 h-8"
      aria-sort={isActive ? (activeOrder === "asc" ? "ascending" : "descending") : "none"}
    >
      {label}
      <Icon
        name={isActive ? (activeOrder === "asc" ? "arrow_upward" : "arrow_downward") : "swap_vert"}
        className="ml-2 text-[16px]"
      />
    </Button>
  );
}

export function createFacilityColumns(
  sort: FacilityListSortKey = "createdAt",
  order: "asc" | "desc" = "desc",
): ColumnDef<Facility>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Izaberi sve"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Izaberi red"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: () => (
        <SortHeader label="Naziv objekta" columnId="name" activeSort={sort} activeOrder={order} />
      ),
      cell: ({ row }) => (
        <div className="relative flex items-center gap-2">
          <Icon name="business" className="text-muted-foreground text-[16px]" />
          <Link
            href={`/admin/facilities/${row.original.id}`}
            className="decoration-primary relative z-10 font-semibold decoration-2 underline-offset-4 hover:underline"
          >
            {row.getValue("name")}
          </Link>
        </div>
      ),
    },
    {
      accessorKey: "category",
      header: () => (
        <SortHeader label="Kategorija" columnId="category" activeSort={sort} activeOrder={order} />
      ),
    },
    {
      accessorKey: "city",
      header: () => (
        <SortHeader label="Lokacija" columnId="city" activeSort={sort} activeOrder={order} />
      ),
      cell: ({ row }) => {
        const city = row.original.city;
        const street = row.original.streetName;
        return (
          <div className="flex flex-col gap-0.5">
            <div className="text-foreground flex items-center gap-1.5 font-medium">
              <Icon name="location_on" className="text-primary/70 text-[14px]" />
              <span className="text-xs">{city}</span>
            </div>
            <span className="text-muted-foreground pl-5 font-mono text-[10px]">
              {street || "Nema adrese"}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: () => (
        <SortHeader label="Status" columnId="status" activeSort={sort} activeOrder={order} />
      ),
      cell: ({ row }) => (
        <StatusToggle facilityId={row.original.id} status={row.original.status} compact />
      ),
    },
    {
      accessorKey: "createdAt",
      header: () => (
        <SortHeader label="Kreirano" columnId="createdAt" activeSort={sort} activeOrder={order} />
      ),
      cell: ({ row }) => (
        <span className="font-mono text-[10px]">
          {new Date(row.getValue("createdAt")).toLocaleDateString("sr-Latn")}
        </span>
      ),
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const facility = row.original;
        return (
          <div className="relative z-30">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0" aria-label="Otvori meni">
                  <span className="sr-only">Otvori meni</span>
                  <Icon name="more_horiz" className="text-[16px]" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Akcije</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(facility.id);
                      toast.success("ID objekta kopiran");
                    } catch {
                      toast.error("Kopiranje nije uspelo");
                    }
                  }}
                >
                  Kopiraj ID objekta
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={`/admin/facilities/${facility.id}`}>
                    <Icon name="arrow_forward" className="mr-2 text-[16px]" />
                    Otvori upravljanje
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={buildPublicFacilityPath(facility.slug)} target="_blank">
                    <Icon name="open_in_new" className="mr-2 text-[16px]" />
                    Prikaz na sajtu
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];
}

/** Default export for static import sites that don't pass sort (back-compat). */
export const columns = createFacilityColumns();
