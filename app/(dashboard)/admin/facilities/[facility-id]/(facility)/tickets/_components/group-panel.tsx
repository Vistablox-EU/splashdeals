"use client"
import { Icon } from "@/components/ui/Icon";

import * as React from "react"
import dynamic from "next/dynamic"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { reorderTicketGroupsAction } from "@/server/actions/tickets"
import { SerializedTicketGroup } from "./columns"
import { toast } from "sonner"

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
            ? "bg-cyan-500/10 border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.12)]"
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
          <div className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-cyan-500" />
        )}

        {/* Group info */}
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              "text-xs font-bold truncate transition-colors",
              isActive ? "text-cyan-300" : "text-foreground/90 group-hover:text-foreground"
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
            className="size-6 rounded-md bg-muted/50 hover:bg-cyan-500/20 hover:text-cyan-400 flex items-center justify-center text-muted-foreground transition-colors"
            title="Izmeni grupu"
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
  const [isSheetOpen, setIsSheetOpen] = React.useState(false)
  const [selectedGroup, setSelectedGroup] = React.useState<SerializedTicketGroup | null>(null)
  const [groupToDelete, setGroupToDelete] = React.useState<string | null>(null)

  // Sync when server refreshes data
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGroups(initialGroups)
  }, [initialGroups])

  // Deep link: ?editGroupId=
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const targetGroupId = params.get("editGroupId")
    if (targetGroupId) {
      const target = initialGroups.find((g) => g.id === targetGroupId)
      if (target) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSelectedGroup(target)
        setIsSheetOpen(true)
      }
    }
  }, [initialGroups])

  React.useEffect(() => {
    const currentUrl = new URL(window.location.href)
    if (isSheetOpen && selectedGroup?.id) {
      currentUrl.searchParams.set("editGroupId", selectedGroup.id)
    } else if (!isSheetOpen) {
      currentUrl.searchParams.delete("editGroupId")
    }
    window.history.replaceState({ ...window.history.state }, "", currentUrl.toString())
  }, [isSheetOpen, selectedGroup])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

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
    } catch {
      toast.error("Doslo je do greške")
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

  const confirmDelete = () => {
    if (!groupToDelete) return
    setGroups((prev) => prev.filter((g) => g.id !== groupToDelete))
    toast.success("Grupa obrisana")
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
          <Icon name="dashboard" className="text-[14px] text-cyan-500" />
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
          className="h-7 w-7 p-0 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400"
          title="Nova Grupa"
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
              ? "bg-cyan-500/10 border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.12)]"
              : "bg-muted/40 border-border/50 hover:bg-white/[0.04] hover:border-border"
          )}
        >
          {activeGroupId === "ALL" && (
            <div className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-cyan-500" />
          )}
          <div className="flex-1 min-w-0">
            <p className={cn(
              "text-xs font-bold",
              activeGroupId === "ALL" ? "text-cyan-300" : "text-foreground/80"
            )}>
              Sve Ulaznice
            </p>
            <p className="text-[10px] text-muted-foreground/80 font-mono mt-0.5">
              {groups.reduce((sum, g) => sum + g.tiers.length, 0)} ukupno
            </p>
          </div>
          <div className="size-1.5 rounded-full bg-cyan-500" />
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
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="p-4 rounded-2xl bg-cyan-500/5 border border-cyan-500/10 mb-4">
              <Icon name="dashboard" className="text-[32px] text-cyan-900" />
            </div>
            <p className="text-xs font-black text-muted-foreground uppercase tracking-tight italic mb-1">
              Nema Grupa
            </p>
            <p className="text-[10px] text-muted-foreground/80 font-medium leading-relaxed">
              Kreirajte grupu za organizovanje cenovnih nivoa.
            </p>
          </div>
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
      <Dialog open={groupToDelete !== null} onOpenChange={() => setGroupToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Group</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this group? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGroupToDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  )
}
