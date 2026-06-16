"use client"

import { Icon } from "@/components/ui/Icon";
/* eslint-disable @typescript-eslint/no-unused-vars */

import { ColumnDef } from "@tanstack/react-table"
import { Ticket } from "@prisma/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export type SerializedAdminTicket = Omit<Ticket, "price" | "originalPrice"> & {
  price: number
  originalPrice: number | null
  label?: string // alias used when ticket is a tier within a group
}

// ─── Ticket Group types (merged from ticket-group-columns.tsx) ───────────────

export interface SerializedTicketGroup {
  id: string
  title: string
  description: string | null
  slug: string | null
  isActive: boolean
  displayOrder: number
  tickets: SerializedAdminTicket[]
  tiers: SerializedAdminTicket[] // alias — same array as tickets
}

interface CreateGroupColumnsProps {
  onEdit: (group: SerializedTicketGroup) => void
  onDelete?: (id: string) => void
}

export function createGroupColumns({ onEdit, onDelete }: CreateGroupColumnsProps): ColumnDef<SerializedTicketGroup>[] {
  return [
    {
      id: "drag",
      header: "",
      cell: () => null, // Handled in SortableRow
    },
    {
      accessorKey: "title",
      header: "Naziv Grupe",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-bold text-sm text-white group-hover:text-cyan-400 transition-colors italic">
            {row.original.title}
          </span>
          <span className="text-[10px] text-slate-500 font-mono tracking-tight mt-0.5">
            {row.original.slug || "nema-putanje"}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "tiers",
      header: "Varijante",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 text-[10px] font-bold uppercase tracking-wider">
            {row.original.tiers.length} nivoa
          </Badge>
          <div className="flex -space-x-2">
            {row.original.tiers.slice(0, 3).map((tier) => (
              <div
                key={tier.id}
                className="size-6 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-[9px] font-bold text-white shadow-xl"
                title={tier.label ?? tier.titleSr ?? tier.title}
              >
                {(tier.label ?? tier.titleSr ?? tier.title).charAt(0)}
              </div>
            ))}
            {row.original.tiers.length > 3 && (
              <div className="size-6 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center text-[9px] font-bold text-muted-foreground">
                +{row.original.tiers.length - 3}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => (
        <Badge
          className={cn(
            "text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full",
            row.original.isActive
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]"
              : "bg-slate-500/10 text-slate-400 border-white/5 opacity-50"
          )}
        >
          {row.original.isActive ? "Aktivno" : "Skica"}
        </Badge>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-9 w-9 p-0 hover:bg-white/5 rounded-xl transition-colors">
              <span className="sr-only">Opcije</span>
              <Icon name="more_horiz" className="text-[16px] text-slate-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-slate-900 border-white/10 p-2 rounded-xl shadow-2xl">
            <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 px-2 py-1.5">Upravljanje</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => onEdit(row.original)}
              className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-foreground hover:bg-white/5 transition-all cursor-pointer"
            >
              <Icon name="edit" className="text-[16px] text-cyan-400" />
              Izmeni Grupu
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/5" />
            <DropdownMenuItem
              className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-rose-400 hover:bg-rose-500/5 transition-all cursor-pointer"
              onClick={() => onDelete?.(row.original.id)}
            >
              <Icon name="delete" className="text-[16px]" />
              Obriši Grupu
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]
}

// ─── Ticket (individual variant) columns ─────────────────────────────────────

export const createColumns = ({ 
  onEdit 
}: { 
  onEdit: (ticket: SerializedAdminTicket) => void 
}): ColumnDef<SerializedAdminTicket>[] => [
  {
    id: "drag",
    header: "",
    cell: () => (
      <div className="flex justify-center text-muted-foreground/20 hover:text-primary transition-colors cursor-grab active:cursor-grabbing">
        <Icon name="more_horiz" className="rotate-90 text-[16px]" />
      </div>
    ),
  },
  {
    accessorKey: "title",
    header: "Naziv Varijante",
    cell: ({ row }) => {
      const imageUrl = row.original.imageUrl
      return (
        <div className="flex items-center gap-3">
          {imageUrl ? (
            <div className="relative aspect-[1.91/1] w-12 rounded-lg overflow-hidden border border-white/5 bg-slate-950/80 shrink-0">
              <Image 
                src={imageUrl} 
                alt={row.original.title}
                fill
                sizes="48px"
                className="object-cover transition-transform group-hover:scale-105 duration-300"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center aspect-[1.91/1] w-12 rounded-lg border border-dashed border-white/10 bg-slate-950/40 text-slate-600 shrink-0">
              <Icon name="image" className="text-[14px]" />
            </div>
          )}
          <div className="flex flex-col">
            <span className="font-bold text-slate-100 text-sm">{row.original.titleSr || row.original.title}</span>
            <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{row.original.type}</span>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "price",
    header: "Cena",
    cell: ({ row }) => {
      const price = Number(row.original.price)
      return (
        <data value={price} className="flex items-center font-bold text-sm text-white font-mono">
          {price.toLocaleString("sr-RS")} <span className="ml-1.5 text-[10px] text-slate-500 font-bold uppercase">{row.original.currency}</span>
        </data>
      )
    },
  },
  {
    accessorKey: "originalPrice",
    header: "Gate Cena",
    cell: ({ row }) => {
      const originalPrice = row.original.originalPrice
      if (originalPrice === null || originalPrice === undefined) {
        return <span className="text-slate-700 font-medium text-xs">—</span>
      }
      return (
        <del className="flex items-center font-bold text-sm text-slate-500 no-underline font-mono">
          <span className="line-through opacity-40">{originalPrice.toLocaleString("sr-RS")}</span>
          <span className="ml-1.5 text-[10px] text-slate-600 font-bold uppercase no-underline">{row.original.currency}</span>
        </del>
      )
    },
  },
  {
    accessorKey: "validityType",
    header: "Važenje",
    cell: ({ row }) => {
      const v = row.original.validityType
      return (
        <Badge variant={v === "FIXED_DATE" ? "outline" : "secondary"} className="gap-1.5 px-2 py-0.5 rounded-md border-white/10 text-[10px] font-bold uppercase tracking-wider">
          <Icon name="calendar_month" className="text-[12px] text-cyan-500" />
          {v === "FIXED_DATE" ? "Fiksno" : "Flex"}
        </Badge>
      )
    },
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) => {
      const ticket = row.original
      return (
        <div className="flex items-center gap-2">
          {ticket.isActive ? (
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
               <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Aktivno</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-500/10 border border-white/5 opacity-50">
               <div className="size-1.5 rounded-full bg-slate-500" />
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pauzirano</span>
            </div>
          )}
          {ticket.isFeatured && (
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
               <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Izdvojeno</span>
            </div>
          )}
        </div>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const ticket = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-9 w-9 p-0 hover:bg-white/5 rounded-xl transition-colors">
              <span className="sr-only">Opcije</span>
              <Icon name="more_horiz" className="text-[16px] text-slate-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-slate-900 border-white/10 rounded-xl p-2 shadow-2xl">
            <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 px-2 py-1.5">Upravljanje</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onEdit(ticket)} className="cursor-pointer text-sm font-medium rounded-lg focus:bg-white/5 gap-2">
              <Icon name="edit" className="size-4 text-cyan-400" />
              Izmeni varijantu
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
