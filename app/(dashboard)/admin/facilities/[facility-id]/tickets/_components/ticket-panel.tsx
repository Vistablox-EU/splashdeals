"use client"
import { Icon } from "@/components/ui/Icon";

import * as React from "react"
import dynamic from "next/dynamic"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
  type Row,
  type Cell,
} from "@tanstack/react-table"
import {
  DndContext,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createColumns, SerializedAdminTicket, SerializedTicketGroup } from "./columns"
import { cn } from "@/lib/utils"
import { reorderTicketsAction } from "@/server/actions/tickets"
import { toast } from "sonner"
import { useDeepLink } from "../_hooks/use-deep-link"
import { useDnDSensors } from "../_hooks/use-dnd-sensors"
import { EmptyState } from "./empty-state"

const TicketSheet = dynamic(
  () => import("./ticket-sheet").then((mod) => mod.TicketSheet),
  { ssr: false }
)

interface TicketPanelProps {
  facilityId: string
  initialTickets: SerializedAdminTicket[]
  ticketGroups: { id: string; title: string }[]
  facilityStatus: string
  /** "ALL" or a group id — set from GroupPanel */
  activeGroupId: string
  /** The active group object (needed to show its name in header) */
  activeGroup: SerializedTicketGroup | null
}

// ─── Sortable Row ─────────────────────────────────────────────────────────────

function SortableRow({ row }: { row: Row<SerializedAdminTicket> }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: row.original.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    position: "relative" as const,
  }

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      data-state={row.getIsSelected() && "selected"}
      className={cn(
        "group hover:bg-muted/30 transition-colors",
        isDragging && "bg-muted/80 shadow-2xl ring-1 ring-primary/20 z-50"
      )}
    >
      {row.getVisibleCells().map((cell: Cell<SerializedAdminTicket, unknown>) => (
        <TableCell key={cell.id} className="py-4">
          {cell.column.id === "drag" ? (
            <div
              {...attributes}
              {...listeners}
              className="flex justify-center text-muted-foreground/20 hover:text-primary transition-colors cursor-grab active:cursor-grabbing"
            >
              <Icon name="drag_indicator" className="text-[16px]" />
            </div>
          ) : (
            flexRender(cell.column.columnDef.cell, cell.getContext())
          )}
        </TableCell>
      ))}
    </TableRow>
  )
}

// ─── Ticket Panel ─────────────────────────────────────────────────────────────

export function TicketPanel({
  facilityId,
  initialTickets,
  ticketGroups,
  facilityStatus,
  activeGroupId,
  activeGroup,
}: TicketPanelProps) {
  const [tickets, setTickets] = React.useState(initialTickets)
  const [globalFilter, setGlobalFilter] = React.useState("")
  const sensors = useDnDSensors()

  // Deep link: ?editTicketId=
  const { selectedItem: selectedTicket, setSelectedItem: setSelectedTicket, isOpen: isSheetOpen, setIsOpen: setIsSheetOpen } =
    useDeepLink(initialTickets, "editTicketId")

  // Sync with server refreshes
  React.useEffect(() => {
    setTickets(initialTickets)
  }, [initialTickets])

  // ── Group filter: client-side ───────────────────────────────────────────────
  const displayedTickets = React.useMemo(() => {
    if (activeGroupId === "ALL") return tickets
    return tickets.filter((t) => t.groupId === activeGroupId)
  }, [tickets, activeGroupId])

  const handleEdit = (ticket: SerializedAdminTicket) => {
    setSelectedTicket(ticket)
    setIsSheetOpen(true)
  }

  const handleCreateNew = () => {
    setSelectedTicket(null)
    setIsSheetOpen(true)
  }

  const columns = React.useMemo(() => createColumns({ onEdit: handleEdit }), [handleEdit])

  const table = useReactTable<SerializedAdminTicket>({
    data: displayedTickets,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = displayedTickets.findIndex((t) => t.id === active.id)
    const newIndex = displayedTickets.findIndex((t) => t.id === over.id)
    const reordered = arrayMove(displayedTickets, oldIndex, newIndex)

    // Merge back into full list preserving other groups
    setTickets((prev) => {
      const otherTickets = activeGroupId === "ALL"
        ? []
        : prev.filter((t) => t.groupId !== activeGroupId)
      return activeGroupId === "ALL"
        ? reordered
        : [...otherTickets, ...reordered].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
    })

    reorderTicketsAction({
      facilityId,
      orderedIds: reordered.map((t) => t.id),
    }).then((res) => {
      if (!res.success) toast.error("Sort synchronization failed")
    })
  }

  // Pre-fill groupId in new ticket sheet when a group is selected
  const defaultGroupId = activeGroupId !== "ALL" ? activeGroupId : undefined

  const isEmpty = displayedTickets.length === 0
  const isFiltered = globalFilter.length > 0

  return (
    <section className="flex flex-col h-full min-h-0" aria-label="Katalog Ulaznica">
      {/* Facility status warning */}
      {(facilityStatus === "EMERGENCY_SHUTDOWN" || facilityStatus === "CLOSED") && (
        <aside
          role="alert"
          className="flex items-start gap-4 p-4 mx-4 mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 shrink-0"
        >
          <Icon name="error" className="text-[16px] text-red-500 mt-0.5 shrink-0" />
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-red-400 uppercase tracking-widest">
              Prodaja je Blokirana
            </h4>
            <p className="text-[10px] text-red-200/60 font-medium">
              Objekat je u statusu <span className="font-bold text-red-400">{facilityStatus}</span>.
              Kupovina je onemogućena.
            </p>
          </div>
        </aside>
      )}

      {/* Panel header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-4 border-b border-border/50 shrink-0">
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <Icon name="confirmation_number" className="text-[14px] text-primary shrink-0" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
              {activeGroupId === "ALL"
                ? "Sve Ulaznice"
                : activeGroup?.title ?? "Ulaznice"}
            </span>
            <span className="text-[9px] font-mono text-muted-foreground/80">
              ({displayedTickets.length})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="relative">
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-[14px] text-muted-foreground" />
            <Input
              placeholder="Pretraži katalog..."
              className="pl-9 h-9 w-52 bg-muted/30 border-border rounded-xl text-xs font-medium"
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              aria-label="Pretraži katalog"
            />
          </div>
          <Button
            onClick={handleCreateNew}
            className="h-9 px-4 bg-primary text-primary-foreground font-black uppercase tracking-widest text-[10px] rounded-xl shadow-lg shadow-primary/10 hover:bg-primary/90 transition-all gap-1.5"
          >
            <Icon name="add" className="text-[14px]" />
            Nova Ulaznica
          </Button>
        </div>
      </header>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <div className="rounded-none border-0 bg-transparent overflow-hidden overflow-x-auto">
          {isEmpty ? (
            isFiltered ? (
              <EmptyState
                icon="search"
                title={`Nema rezultata za "${globalFilter}"`}
                description="Pokušajte sa drugačijim terminom."
                action={{
                  label: "Obriši pretragu",
                  onClick: () => setGlobalFilter(""),
                }}
              />
            ) : (
              <EmptyState
                icon="confirmation_number"
                title={activeGroupId === "ALL" ? "Katalog je Prazan" : "Ova Grupa je Prazna"}
                description={activeGroupId === "ALL"
                  ? "Kreirajte prvu ulaznicu za pokretanje prodaje."
                  : `Dodajte ulaznicu u grupu "${activeGroup?.title}".`
                }
                action={{ label: "Nova Ulaznica", onClick: handleCreateNew }}
              />
            )
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
              modifiers={[restrictToVerticalAxis]}
            >
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow
                      key={headerGroup.id}
                      className="bg-muted/20 hover:bg-muted/20 border-border/50"
                    >
                      {headerGroup.headers.map((header) => (
                        <TableHead
                          key={header.id}
                          className="font-bold text-muted-foreground uppercase text-[10px] tracking-[0.15em] py-3"
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  <SortableContext
                    items={displayedTickets.map((t) => t.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {table.getRowModel().rows?.length ? (
                      table.getRowModel().rows.map((row) => (
                        <SortableRow key={row.id} row={row} />
                      ))
                    ) : (
                      <TableRow className="hover:bg-transparent border-none">
                        <TableCell colSpan={columns.length} className="h-[360px] text-center">
                          <EmptyState
                            icon="confirmation_number"
                            title={activeGroupId === "ALL" ? "Katalog je Prazan" : "Ova Grupa je Prazna"}
                            description={activeGroupId === "ALL"
                              ? "Kreirajte prvu ulaznicu za pokretanje prodaje."
                              : `Dodajte ulaznicu u grupu "${activeGroup?.title}".`
                            }
                            action={{ label: "Nova Ulaznica", onClick: handleCreateNew }}
                          />
                        </TableCell>
                      </TableRow>
                    )}
                  </SortableContext>
                </TableBody>
              </Table>
            </DndContext>
          )}
        </div>
      </div>

      {/* Sheet — lazy loaded */}
      {isSheetOpen && (
        <TicketSheet
          facilityId={facilityId}
          ticket={selectedTicket}
          open={isSheetOpen}
          onOpenChange={setIsSheetOpen}
          ticketGroups={ticketGroups}
          defaultGroupId={defaultGroupId}
        />
      )}
    </section>
  )
}
