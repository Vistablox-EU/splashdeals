"use client"

import { Icon } from "@/components/ui/Icon";
 

import { ColumnDef } from "@tanstack/react-table"
import { Facility } from "@prisma/client"
import { Checkbox } from "@/components/ui/checkbox"

import { Button } from "@/components/ui/button"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { StatusToggle } from "@/app/(dashboard)/admin/_common/StatusToggle"

// Using a static wrapper component for rendering cells that might trigger non-deterministic behavior
function ClientCell({ children }: { children: React.ReactNode }) {
  return <div suppressHydrationWarning>{children}</div>
}

export const columns: ColumnDef<Facility>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4 h-8 data-[state=open]:bg-accent"
        >
          Facility Name
          <Icon name="swap_vert" className="ml-2 text-[16px]" />
        </Button>
      )
    },
    cell: ({ row }) => {
      return (
        <div className="flex items-center gap-2">
          <Icon name="business" className="text-[16px] text-muted-foreground" />
          <Link 
            href={`/admin/facilities/${row.original.id}`}
            className="font-semibold after:absolute after:inset-0 after:rounded-md hover:underline decoration-primary decoration-2 underline-offset-4"
          >
            {row.getValue("name")}
          </Link>
        </div>
      )
    }
  },
  {
    accessorKey: "category",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4 h-8 data-[state=open]:bg-accent"
        >
          Category
          <Icon name="swap_vert" className="ml-2 text-[16px]" />
        </Button>
      )
    },
  },
  {
    accessorKey: "city",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4 h-8 data-[state=open]:bg-accent"
        >
          Location
          <Icon name="swap_vert" className="ml-2 text-[16px]" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const city = row.original.city
      const street = row.original.streetName
      return (
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5 text-foreground font-medium">
            <Icon name="location_on" className="text-[14px] text-primary/70" />
            <span className="text-xs">{city}</span>
          </div>
          <span className="text-[10px] text-muted-foreground font-mono pl-5">
            {street || "No street data"}
          </span>
        </div>
      )
    }
  },

  {
    accessorKey: "status",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4 h-8 data-[state=open]:bg-accent"
        >
          Status
          <Icon name="swap_vert" className="ml-2 text-[16px]" />
        </Button>
      )
    },
    cell: ({ row }) => {
      return (
        <StatusToggle 
          facilityId={row.original.id} 
          status={row.original.status} 
          compact 
        />
      )
    }
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4 h-8 data-[state=open]:bg-accent"
        >
          Onboarded
          <Icon name="swap_vert" className="ml-2 text-[16px]" />
        </Button>
      )
    },
    cell: ({ row }) => {
      return (
        <ClientCell>
          <span className="font-mono text-[10px]">
            {new Date(row.getValue("createdAt")).toISOString().split('T')[0]}
          </span>
        </ClientCell>
      )
    }
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const facility = row.original

      return (
        <div className="relative z-30">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0" aria-label="Open menu">
              <span className="sr-only">Open menu</span>
              <Icon name="more_horiz" className="text-[16px]" />
            </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => {
                  if (typeof navigator !== 'undefined') {
                    navigator.clipboard.writeText(facility.id)
                  }
                }}
              >
                Copy Facility ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={`/admin/facilities/${facility.id}`}>
                  <Icon name="arrow_forward" className="mr-2 text-[16px]" />
                  Governance Portal
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    },
  },
]
