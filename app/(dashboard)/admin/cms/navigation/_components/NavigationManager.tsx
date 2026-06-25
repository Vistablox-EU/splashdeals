"use client"

import { useState, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Icon } from "@/components/ui/Icon"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { cn } from "@/lib/utils"
import { MenuDrawer } from "./MenuDrawer"
import { SectionDrawer } from "./SectionDrawer"
import { ItemDrawer } from "./ItemDrawer"
import { LivePreview } from "./LivePreview"
import {
  reorderMenusAction,
  reorderSectionsAction,
  getMenusAction,
} from "@/app/(server)/actions/navigation"
import type { MenuWithSections, SectionWithItems, NavigationMenuItem } from "./types"

/* ─── Sortable wrappers ────────────────────────────── */

function SortableMenuTab({
  menu,
  isSelected,
  onSelect,
  onEdit,
}: {
  menu: MenuWithSections
  isSelected: boolean
  onSelect: () => void
  onEdit: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: menu.id })
  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer select-none",
        isSelected && "bg-accent text-accent-foreground shadow-sm",
        !isSelected && "text-muted-foreground hover:text-foreground hover:bg-accent/50",
        isDragging && "opacity-50 shadow-lg"
      )}
      onClick={onSelect}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab text-muted-foreground/40 hover:text-foreground shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <Icon name="drag_indicator" className="size-3" />
      </button>
      <Icon name={menu.icon} className="size-3.5 shrink-0" />
      <span>{menu.label}</span>
      <button
        onClick={(e) => { e.stopPropagation(); onEdit() }}
        className="ml-0.5 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-opacity rounded-full hover:bg-accent p-0.5"
      >
        <Icon name="settings" className="size-3" />
      </button>
    </div>
  )
}

function SortableSection({
  section,
  children,
}: {
  section: SectionWithItems
  children: React.ReactNode
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id })
  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-lg border bg-card/50 p-3 space-y-2 transition-shadow",
        isDragging && "opacity-60 shadow-lg ring-2 ring-primary/30"
      )}
    >
      <div className="flex items-center gap-1.5 text-sm min-w-0">
        <button {...attributes} {...listeners} className="cursor-grab text-muted-foreground/30 hover:text-foreground shrink-0">
          <Icon name="drag_indicator" className="size-3.5" />
        </button>
        {section.heading ? (
          <span className="font-medium text-foreground truncate min-w-0">{section.heading}</span>
        ) : (
          <span className="text-muted-foreground italic text-xs min-w-0">(bez naslova)</span>
        )}
        <span className="ml-auto shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
          {section.style === "LINKS" ? "Link" : section.style === "DOT_LINKS" ? "Dot" : section.style === "DYNAMIC_CITIES" ? "Gradovi" : section.style === "FOOTER_BADGE" ? "Bedž" : "Vizuelni"}
        </span>
      </div>
      {children}
    </div>
  )
}

function SortableItem({
  item,
  onEdit,
  onDelete,
}: {
  item: NavigationMenuItem
  onEdit: () => void
  onDelete: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })
  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent/50",
        isDragging && "opacity-50"
      )}
    >
      <button {...attributes} {...listeners} className="cursor-grab text-muted-foreground/20 group-hover:text-muted-foreground shrink-0">
        <Icon name="drag_indicator" className="size-3" />
      </button>
      {item.icon ? (
        <Icon name={item.icon} className="size-4 shrink-0 text-muted-foreground" />
      ) : (
        <span className="size-1.5 rounded-full bg-muted-foreground/30 shrink-0" />
      )}
      <span className="truncate flex-1">{item.label}</span>
      {item.href && item.href !== "#" && (
        <span className="hidden lg:block text-xs text-muted-foreground/60 truncate max-w-[100px]">{item.href}</span>
      )}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={onEdit} className="p-1 text-muted-foreground/50 hover:text-foreground rounded hover:bg-accent">
                <Icon name="edit" className="size-3" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">Izmeni stavku</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={onDelete} className="p-1 text-muted-foreground/50 hover:text-destructive rounded hover:bg-destructive/10">
                <Icon name="delete" className="size-3" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">Obriši stavku</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  )
}

/* ─── Main manager ─────────────────────────────────── */

interface NavigationManagerProps {
  initialMenus: MenuWithSections[]
}

export function NavigationManager({ initialMenus }: NavigationManagerProps) {
  const router = useRouter()
  const [menus, setMenus] = useState(initialMenus)
  const [selectedMenuId, setSelectedMenuId] = useState(menus[0]?.id || "")
  const [previewOpen, setPreviewOpen] = useState(true)

  // Drawer states
  const [menuDrawerOpen, setMenuDrawerOpen] = useState(false)
  const [editingMenu, setEditingMenu] = useState<MenuWithSections | null>(null)

  const [sectionDrawerOpen, setSectionDrawerOpen] = useState(false)
  const [editingSection, setEditingSection] = useState<SectionWithItems | null>(null)
  const [sectionDrawerMenuId, setSectionDrawerMenuId] = useState("")

  const [itemDrawerOpen, setItemDrawerOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<NavigationMenuItem | null>(null)
  const [itemDrawerSectionId, setItemDrawerSectionId] = useState("")

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const selectedMenu = useMemo(
    () => menus.find((m) => m.id === selectedMenuId) || menus[0],
    [menus, selectedMenuId]
  )

  const sectionsByColumn = useMemo(() => {
    if (!selectedMenu) return { 0: [], 1: [], 2: [] } as Record<number, SectionWithItems[]>
    const grouped: Record<number, SectionWithItems[]> = { 0: [], 1: [], 2: [] }
    for (const section of selectedMenu.sections) {
      if (!grouped[section.column]) grouped[section.column] = []
      grouped[section.column].push(section)
    }
    return grouped
  }, [selectedMenu])

  /* ─── Tab drag ─────────────────────────────────── */
  const handleMenuDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = menus.findIndex((m) => m.id === active.id)
    const newIndex = menus.findIndex((m) => m.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = [...menus]
    const [moved] = reordered.splice(oldIndex, 1)
    reordered.splice(newIndex, 0, moved)
    setMenus(reordered)

    const updates = reordered.map((m, i) => ({ id: m.id, sortOrder: i }))
    const result = await reorderMenusAction(updates)
    if (!result.success) {
      toast.error("Greška pri ređanju")
      setMenus(initialMenus)
    }
    router.refresh()
  }, [menus, initialMenus, router])

  /* ─── Section drag ─────────────────────────────── */
  const handleSectionDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    let sourceColumn = -1
    for (const col of [0, 1, 2]) {
      if (sectionsByColumn[col].some((s) => s.id === active.id)) {
        sourceColumn = col
        break
      }
    }
    if (sourceColumn === -1) return

    let targetColumn = sourceColumn
    for (const col of [0, 1, 2]) {
      if (sectionsByColumn[col].some((s) => s.id === over.id)) {
        targetColumn = col
        break
      }
    }

    const sourceSections = [...sectionsByColumn[sourceColumn]]
    const sourceIdx = sourceSections.findIndex((s) => s.id === active.id)
    if (sourceIdx === -1) return

    const [moved] = sourceSections.splice(sourceIdx, 1)
    moved.column = targetColumn

    const newSections = { ...sectionsByColumn }
    if (sourceColumn === targetColumn) {
      const targetSections = [...newSections[targetColumn]]
      const overIdx = targetSections.findIndex((s) => s.id === over.id)
      targetSections.splice(sourceIdx, 1)
      targetSections.splice(overIdx, 0, moved)
      newSections[targetColumn] = targetSections
    } else {
      newSections[sourceColumn] = sourceSections
      const targetSections = [...newSections[targetColumn]]
      const overIdx = targetSections.findIndex((s) => s.id === over.id)
      targetSections.splice(overIdx, 0, moved)
      newSections[targetColumn] = targetSections
    }

    const updatedMenu = {
      ...selectedMenu,
      sections: Object.values(newSections).flat(),
    } as MenuWithSections

    setMenus((prev) =>
      prev.map((m) => (m.id === selectedMenu.id ? updatedMenu : m))
    )

    const allSections = Object.values(newSections).flat()
    const updates = allSections.map((s, i) => ({
      id: s.id,
      sortOrder: i,
      column: s.column,
    }))
    const result = await reorderSectionsAction(updates)
    if (!result.success) {
      toast.error("Greška pri ređanju sekcija")
      setMenus(initialMenus)
    }
    router.refresh()
  }, [sectionsByColumn, selectedMenu, initialMenus, router])

  /* ─── Refresh ──────────────────────────────────── */
  const refreshMenus = useCallback(async () => {
    const result = await getMenusAction()
    if (result.success) {
      const data = result.data
      if (data?.menus) setMenus(data.menus as MenuWithSections[])
    }
  }, [])

  /* ─── Callbacks ────────────────────────────────── */
  const openEditSection = useCallback((section: SectionWithItems) => {
    setSectionDrawerMenuId(section.menuId)
    setEditingSection(section)
    setSectionDrawerOpen(true)
  }, [])

  const openAddItem = useCallback((sectionId: string) => {
    setItemDrawerSectionId(sectionId)
    setEditingItem(null)
    setItemDrawerOpen(true)
  }, [])

  const openEditItem = useCallback((item: NavigationMenuItem, sectionId: string) => {
    setItemDrawerSectionId(sectionId)
    setEditingItem(item)
    setItemDrawerOpen(true)
  }, [])

  /* ─── Delete helpers ───────────────────────────── */
  const handleDeleteSection = useCallback(async (section: SectionWithItems) => {
    const { deleteSectionAction } = await import("@/app/(server)/actions/navigation")
    if (!confirm(`Obrisati sekciju "${section.heading || "bez naslova"}"?`)) return
    const result = await deleteSectionAction(section.id)
    if (result.success) {
      toast.success("Sekcija obrisana")
      refreshMenus()
      router.refresh()
    } else {
      toast.error(result.error || "Greška")
    }
  }, [refreshMenus, router])

  const handleDeleteItem = useCallback(async (item: NavigationMenuItem) => {
    const { deleteItemAction } = await import("@/app/(server)/actions/navigation")
    if (!confirm(`Obrisati stavku "${item.label}"?`)) return
    const result = await deleteItemAction(item.id)
    if (result.success) {
      toast.success("Stavka obrisana")
      refreshMenus()
      router.refresh()
    } else {
      toast.error(result.error || "Greška")
    }
  }, [refreshMenus, router])

  /* ─── Render ───────────────────────────────────── */
  return (
    <div className="p-6 space-y-6">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Mega Meni</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Upravljajte navigacionim menijem na prednjoj strani sajta.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setPreviewOpen(!previewOpen)}
                >
                  <Icon name={previewOpen ? "visibility_off" : "visibility"} className="size-4" />
                  {previewOpen ? "Sakrij pregled" : "Prikaži pregled"}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">Uključi/isključi live preview</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* ─── Tab bar ─── */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleMenuDragEnd}>
        <div className="flex items-center gap-1.5 flex-wrap">
          <SortableContext items={menus.map((m) => m.id)} strategy={verticalListSortingStrategy}>
            {menus.map((menu) => (
              <SortableMenuTab
                key={menu.id}
                menu={menu}
                isSelected={selectedMenuId === menu.id}
                onSelect={() => setSelectedMenuId(menu.id)}
                onEdit={() => { setEditingMenu(menu); setMenuDrawerOpen(true) }}
              />
            ))}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => { setEditingMenu(null); setMenuDrawerOpen(true) }}
                    className="flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all"
                  >
                    <Icon name="add" className="size-3.5" />
                    Novi meni
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Dodaj novi navigacioni meni</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </SortableContext>
        </div>
      </DndContext>

      {/* ─── Main content ─── */}
      {selectedMenu && (
        <div className={cn("flex gap-6", previewOpen ? "flex-col xl:flex-row" : "")}>
          {/* Editor */}
          <div className={cn("flex-1 min-w-0", previewOpen ? "xl:w-1/2" : "w-full")}>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSectionDragEnd}>
              <div className="grid grid-cols-3 gap-6">
                {[0, 1, 2].map((column) => (
                  <div key={column} className={cn(
                    "rounded-lg border overflow-hidden",
                    column === 0 && "bg-cyan-500/[0.02]",
                    column === 1 && "bg-blue-500/[0.02]",
                    column === 2 && "bg-violet-500/[0.02]",
                  )}>
                    {/* Column header */}
                    <div className={cn(
                      "flex items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider border-b",
                      column === 0 && "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/10",
                      column === 1 && "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/10",
                      column === 2 && "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/10",
                    )}>
                      <span>Kolona {column + 1}</span>
                      <span className="text-[10px] opacity-50">{
                        column === 0 ? "Šira" : "Uska"
                      }</span>
                    </div>

                    {/* Sections inside column */}
                    <div className="p-3 space-y-3">

                    {/* Sections in column */}
                    <SortableContext
                      items={sectionsByColumn[column].map((s) => s.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {sectionsByColumn[column].length === 0 && (
                        <div className="rounded-lg border border-dashed border-muted-foreground/20 p-4 text-center">
                          <p className="text-xs text-muted-foreground/50">Prazna kolona</p>
                        </div>
                      )}
                      {sectionsByColumn[column].map((section) => (
                        <SortableSection key={section.id} section={section}>
                          {/* Items */}
                          <div className="space-y-0.5">
                            {section.items.map((item) => (
                              <SortableItem
                                key={item.id}
                                item={item}
                                onEdit={() => openEditItem(item, section.id)}
                                onDelete={() => handleDeleteItem(item)}
                              />
                            ))}
                            {section.items.length === 0 && section.style !== "DYNAMIC_CITIES" && section.style !== "VISUAL" && (
                              <p className="text-xs text-muted-foreground/40 px-2 py-1 italic">Nema stavki</p>
                            )}
                          </div>
                          {/* Section footer actions */}
                          <div className="flex items-center gap-1 pt-1 border-t border-border/40">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={() => openEditSection(section)}
                                    className="flex items-center gap-1 rounded px-2 py-1 text-[11px] text-muted-foreground bg-accent/30 hover:bg-accent hover:text-foreground transition-colors font-medium"
                                  >
                                    <Icon name="settings" className="size-3.5" />
                                    Opcije
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom">Izmeni sekciju (naziv, kolonu, stil)</TooltipContent>
                              </Tooltip>
                              {(section.style === "LINKS" || section.style === "DOT_LINKS") && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      onClick={() => openAddItem(section.id)}
                                      className="flex items-center gap-1 rounded px-2 py-1 text-[11px] text-muted-foreground bg-accent/30 hover:bg-accent hover:text-foreground transition-colors font-medium"
                                    >
                                      <Icon name="add" className="size-3.5" />
                                      Stavka
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent side="bottom">Dodaj novu stavku u ovu sekciju</TooltipContent>
                                </Tooltip>
                              )}
                              <div className="ml-auto">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      onClick={() => handleDeleteSection(section)}
                                      className="flex items-center gap-1 rounded px-2 py-1 text-[11px] text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                    >
                                      <Icon name="delete" className="size-3.5" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent side="bottom">Obriši sekciju i sve stavke u njoj</TooltipContent>
                                </Tooltip>
                              </div>
                            </TooltipProvider>
                          </div>
                        </SortableSection>
                      ))}
                    </SortableContext>

                    {/* Add section button */}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => {
                              setEditingSection(null)
                              setSectionDrawerMenuId(selectedMenu.id)
                              setSectionDrawerOpen(true)
                            }}
                            className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-muted-foreground/20 py-2 text-xs text-muted-foreground hover:text-foreground hover:border-muted-foreground/40 hover:bg-accent/30 transition-all"
                          >
                            <Icon name="add" className="size-3.5" />
                            Dodaj sekciju
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">Dodaj novu sekciju (grupu linkova) u ovu kolonu</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
                ))}
              </div>
            </DndContext>
          </div>

          {/* Live Preview */}
          {previewOpen && (
            <div className="xl:w-1/2 min-w-0">
              <div className="sticky top-24">
                <LivePreview menu={selectedMenu} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Empty state ─── */}
      {!selectedMenu && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Icon name="menu_book" className="size-16 text-muted-foreground/20 mb-4" />
          <h2 className="text-lg font-semibold text-muted-foreground">Nema menija</h2>
          <p className="text-sm text-muted-foreground/60 mt-1 mb-4">
            Dodajte prvi meni da biste počeli.
          </p>
          <Button onClick={() => { setEditingMenu(null); setMenuDrawerOpen(true) }}>
            <Icon name="add" className="size-4 mr-1.5" />
            Dodaj meni
          </Button>
        </div>
      )}

      {/* ─── Drawers ─── */}
      <MenuDrawer
        menu={editingMenu}
        open={menuDrawerOpen}
        onClose={() => { setMenuDrawerOpen(false); setEditingMenu(null) }}
        onSaved={refreshMenus}
      />

      {sectionDrawerOpen && sectionDrawerMenuId && (
        <SectionDrawer
          menuId={sectionDrawerMenuId}
          section={editingSection}
          open={sectionDrawerOpen}
          onClose={() => { setSectionDrawerOpen(false); setEditingSection(null) }}
          onSaved={refreshMenus}
        />
      )}

      {itemDrawerOpen && itemDrawerSectionId && (
        <ItemDrawer
          sectionId={itemDrawerSectionId}
          item={editingItem}
          open={itemDrawerOpen}
          onClose={() => { setItemDrawerOpen(false); setEditingItem(null) }}
          onSaved={refreshMenus}
        />
      )}
    </div>
  )
}
