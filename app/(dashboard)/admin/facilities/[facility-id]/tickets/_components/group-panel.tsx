"use client"
import { Icon } from "@/components/ui/Icon";

import * as React from "react"
import dynamic from "next/dynamic"
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
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { reorderTicketGroupsAction, deleteTicketGroupAction } from "@/server/actions/tickets"
import { SerializedTicketGroup } from "./columns"
import { toast } from "sonner"
import { useDeepLink } from "../_hooks/use-deep-link"
import { useDnDSensors } from "../_hooks/use-dnd-sensors"
import { EmptyState } from "./empty-state"
import { ConfirmDialog } from "./confirm-dialog"

const TicketGroupSheet = dynamic(
  () => import("./ticket-group-sheet").then((mod) => mod.TicketGroupSheet),
  { ssr: false }
)

interface GroupPanelProps {
  facilityId: string
  initialGroups: SerializedTicketGroup[]
  activeGroupId: string
  onGroupSelect: (id: string) => void
}

// ─── Sortable Group Card ──────────────────────────────────────────────────────

function SortableGroupCard({
  group,
  isActive,
  onSelect,
  onEdit,
  onDelete,
}: {
  group: SerializedTicketGroup
  isActive: boolean
  onSelect: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: group.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : undefined,
    position: "relative" as const,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <div
        className={cn(
          "group relative flex items-center gap-3 px-3 py-3 rounded-xl border transition-all duration-200 cursor-pointer select-none",
          isActive
            ? "bg-primary/10 border-primary/30 shadow-primary/12"
            : "bg-muted/40 border-border/50 hover:bg-white/[0.04] hover:border-border"
        )}
        onClick={onSelect}
      >
        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          className="shrink-0 flex items-center text-muted-foreground/80 hover:text-muted-foreground transition-colors cursor-grab active:cursor-grabbing"
        >
          <Icon name="drag_indicator" className="text-[14px]" />
        </div>

        {/* Active indicator bar */}
        {isActive && (
          <div className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-primary" />
        )}

        {/* Group info */}
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              "text-xs font-bold truncate transition-colors",
              isActive ? "text-primary/80" : "text-foreground/90 group-hover:text-foreground"
            )}
          >
            {group.title}
          </p>
          <p className="text-[10px] text-muted-foreground/80 font-mono mt-0.5">
            {group.tiers.length} {group.tiers.length === 1 ? "varijanta" : "varijante"}
          </p>
        </div>

        {/* Status dot */}
        <div
          className={cn(
            "shrink-0 size-1.5 rounded-full",
            group.isActive ? "bg-emerald-500" : "bg-muted"
          )}
          title={group.isActive ? "Aktivno" : "Skica"}
          aria-label={group.isActive ? "Active" : "Inactive"}
        />

        {/* Hover action buttons */}
        <div
          className="absolute right-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="ghost"
            size="icon"
            type="button"
            onClick={onEdit}
            className="size-6 rounded-md bg-muted/50 hover:bg-primary/20 hover:text-primary flex items-center justify-center text-muted-foreground transition-colors"
            title="Izmeni grupu"
            aria-label="Izmeni grupu"
          >
            <Icon name="edit" className="text-[12px]" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            type="button"
            onClick={onDelete}
            className="size-6 rounded-md bg-muted/50 hover:bg-rose-500/20 hover:text-rose-400 flex items-center justify-center text-muted-foreground transition-colors"
            title="Obriši grupu"
            aria-label="Obriši grupu"
          >
            <Icon name="delete" className="text-[12px]" />
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Group Panel ──────────────────────────────────────────────────────────────

export function GroupPanel({
  facilityId,
  initialGroups,
  activeGroupId,
  onGroupSelect,
}: GroupPanelProps) {
  const [groups, setGroups] = React.useState(initialGroups)
  const [groupToDelete, setGroupToDelete] = React.useState<string | null>(null)
  const sensors = useDnDSensors()

  // Deep link: ?editGroupId=
  const { selectedItem: selectedGroup, setSelectedItem: setSelectedGroup, isOpen: isSheetOpen, setIsOpen: setIsSheetOpen } =
    useDeepLink(initialGroups, "editGroupId")

  // Sync when server refreshes data
  React.useEffect(() => {
    setGroups(initialGroups)
  }, [initialGroups])

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = groups.findIndex((g) => g.id === active.id)
    const newIndex = groups.findIndex((g) => g.id === over.id)
    const reordered = arrayMove(groups, oldIndex, newIndex)
    setGroups(reordered)

    try {
      const result = await reorderTicketGroupsAction({
        facilityId,
        orderedIds: reordered.map((g) => g.id),
      })
      if (!result.success) {
        toast.error("Greška pri čuvanju redosleda")
        setGroups(initialGroups)
      }
    } catch (error: unknown) {
      console.error("Failed to reorder ticket groups:", error instanceof Error ? error.message : error);
      toast.error("Doslo je do greske")
      setGroups(initialGroups)
    }
  }

  const handleEdit = (group: SerializedTicketGroup) => {
    setSelectedGroup(group)
    setIsSheetOpen(true)
  }

  const handleDelete = (id: string) => {
    setGroupToDelete(id)
  }

  const confirmDelete = async () => {
    if (!groupToDelete) return
    const deletedId = groupToDelete

    try {
      const result = await deleteTicketGroupAction(deletedId, facilityId)
      if (!result.success) {
        toast.error(result.error || "Greška pri brisanju grupe")
        return
      }
    } catch {
      toast.error("Greška pri brisanju grupe")
      return
    }

    setGroups((prev) => prev.filter((g) => g.id !== deletedId))
    toast.success("Grupa obrisana")

    // Reset active group if the deleted one was selected
    if (activeGroupId === deletedId) {
      onGroupSelect("ALL")
    }

    setGroupToDelete(null)
  }

  return (
    <aside
      aria-label="Grupe Ulaznica"
      className="flex flex-col h-full bg-background/60 border-r border-border/50"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-border/50 shrink-0">
        <div className="flex items-center gap-2">
          <Icon name="dashboard" className="text-[14px] text-primary" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
            Grupe
          </span>
          <span className="text-[9px] font-mono text-muted-foreground/80 ml-1">
            ({groups.length})
          </span>
        </div>
        <Button
          onClick={() => { setSelectedGroup(null); setIsSheetOpen(true) }}
          size="sm"
          className="h-7 w-7 p-0 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary"
          title="Nova Grupa"
          aria-label="Nova Grupa"
        >
          <Icon name="add" className="text-[14px]" />
        </Button>
      </div>

      {/* Scrollable List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5 no-scrollbar">
        {/* "All Tickets" sentinel — always first, not draggable */}
        <div
          onClick={() => onGroupSelect("ALL")}
          className={cn(
            "flex items-center gap-3 px-3 py-3 rounded-xl border cursor-pointer transition-all duration-200",
            activeGroupId === "ALL"
              ? "bg-primary/10 border-primary/30 shadow-primary/12"
              : "bg-muted/40 border-border/50 hover:bg-white/[0.04] hover:border-border"
          )}
        >
          {activeGroupId === "ALL" && (
            <div className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-primary" />
          )}
          <div className="flex-1 min-w-0">
            <p className={cn(
              "text-xs font-bold",
              activeGroupId === "ALL" ? "text-primary/80" : "text-foreground/80"
            )}>
              Sve Ulaznice
            </p>
            <p className="text-[10px] text-muted-foreground/80 font-mono mt-0.5">
              {groups.reduce((sum, g) => sum + g.tiers.length, 0)} ukupno
            </p>
          </div>
          <div className="size-1.5 rounded-full bg-primary" />
        </div>

        {/* Draggable group cards */}
        {groups.length > 0 ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToVerticalAxis]}
          >
            <SortableContext
              items={groups.map((g) => g.id)}
              strategy={verticalListSortingStrategy}
            >
              {groups.map((group) => (
                <SortableGroupCard
                  key={group.id}
                  group={group}
                  isActive={activeGroupId === group.id}
                  onSelect={() => onGroupSelect(group.id)}
                  onEdit={() => handleEdit(group)}
                  onDelete={() => handleDelete(group.id)}
                />
              ))}
            </SortableContext>
          </DndContext>
        ) : (
          <EmptyState
            icon="dashboard"
            title="Nema Grupa"
            description="Kreirajte grupu za organizovanje cenovnih nivoa."
            compact
          />
        )}
      </div>

      {/* Sheet */}
      {isSheetOpen && (
        <TicketGroupSheet
          facilityId={facilityId}
          group={selectedGroup}
          open={isSheetOpen}
          onOpenChange={setIsSheetOpen}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={groupToDelete !== null}
        onOpenChange={() => setGroupToDelete(null)}
        title="Obriši grupu"
        description="Da li ste sigurni da želite da obrišete ovu grupu? Ova radnja se ne može poništiti."
        confirmLabel="Obriši"
        variant="destructive"
        onConfirm={confirmDelete}
      />
    </aside>
  )
}
