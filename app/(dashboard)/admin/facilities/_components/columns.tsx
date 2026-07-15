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
import { StatusToggle } from "@/app/(dashboard)/admin/_common/StatusToggle";
import { buildPublicFacilityPath } from "@/lib/routing/public-facility-path";

export const columns: ColumnDef<Facility>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")
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
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="data-[state=open]:bg-accent -ml-4 h-8"
      >
        Naziv objekta
        <Icon name="swap_vert" className="ml-2 text-[16px]" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Icon name="business" className="text-muted-foreground text-[16px]" />
        <Link
          href={`/admin/facilities/${row.original.id}`}
          className="decoration-primary font-semibold decoration-2 underline-offset-4 after:absolute after:inset-0 after:rounded-md hover:underline"
        >
          {row.getValue("name")}
        </Link>
      </div>
    ),
  },
  {
    accessorKey: "category",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="data-[state=open]:bg-accent -ml-4 h-8"
      >
        Kategorija
        <Icon name="swap_vert" className="ml-2 text-[16px]" />
      </Button>
    ),
  },
  {
    accessorKey: "city",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="data-[state=open]:bg-accent -ml-4 h-8"
      >
        Lokacija
        <Icon name="swap_vert" className="ml-2 text-[16px]" />
      </Button>
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
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="data-[state=open]:bg-accent -ml-4 h-8"
      >
        Status
        <Icon name="swap_vert" className="ml-2 text-[16px]" />
      </Button>
    ),
    cell: ({ row }) => (
      <StatusToggle facilityId={row.original.id} status={row.original.status} compact />
    ),
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="data-[state=open]:bg-accent -ml-4 h-8"
      >
        Kreirano
        <Icon name="swap_vert" className="ml-2 text-[16px]" />
      </Button>
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
                onClick={() => {
                  if (typeof navigator !== "undefined") {
                    navigator.clipboard.writeText(facility.id);
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
