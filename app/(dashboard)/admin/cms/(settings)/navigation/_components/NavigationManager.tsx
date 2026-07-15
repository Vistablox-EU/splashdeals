"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { MenuDrawer } from "./MenuDrawer";
import { SectionDrawer } from "./SectionDrawer";
import { ItemDrawer } from "./ItemDrawer";
import { LivePreview } from "./LivePreview";
import {
  reorderMenusAction,
  reorderSectionsAction,
  getMenusAction,
  deleteSectionAction,
  deleteItemAction,
} from "@/app/(server)/actions/navigation";
import type { MenuWithSections, SectionWithItems, NavigationMenuItem } from "./types";

/* ─── Sortable wrappers ────────────────────────────── */

function SortableMenuTab({
  menu,
  isSelected,
  onSelect,
  onEdit,
}: {
  menu: MenuWithSections;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: menu.id,
  });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold tracking-wider uppercase transition-colors select-none",
        isSelected && "bg-accent text-accent-foreground shadow-sm",
        !isSelected && "text-muted-foreground hover:text-foreground hover:bg-accent/50",
        isDragging && "opacity-50 shadow-lg",
      )}
      onClick={onSelect}
    >
      <Button
        variant="ghost"
        size="sm"
        {...attributes}
        {...listeners}
        className="text-muted-foreground/40 hover:text-foreground h-auto w-auto shrink-0 cursor-grab p-0"
        onClick={(e) => e.stopPropagation()}
        aria-label="Prevuci meni"
      >
        <Icon name="drag_indicator" className="size-3" />
      </Button>
      <Icon name={menu.icon} className="size-3.5 shrink-0" />
      <span>{menu.label}</span>
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
        className="text-muted-foreground hover:text-foreground hover:bg-accent ml-0.5 h-auto w-auto rounded-full p-0.5 opacity-0 transition-opacity group-hover:opacity-100"
        aria-label="Izmeni meni"
      >
        <Icon name="settings" className="size-3" />
      </Button>
    </div>
  );
}

function SortableSection({
  section,
  children,
}: {
  section: SectionWithItems;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
  });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "bg-card/50 space-y-2 rounded-lg border p-3 transition-shadow",
        isDragging && "ring-primary/30 opacity-60 shadow-lg ring-2",
      )}
    >
      <div className="flex min-w-0 items-center gap-1.5 text-sm">
        <Button
          variant="ghost"
          size="sm"
          {...attributes}
          {...listeners}
          className="text-muted-foreground/30 hover:text-foreground h-auto w-auto shrink-0 cursor-grab p-0"
          aria-label="Prevuci sekciju"
        >
          <Icon name="drag_indicator" className="size-3.5" />
        </Button>
        {section.heading ? (
          <span className="text-foreground min-w-0 truncate font-medium">{section.heading}</span>
        ) : (
          <span className="text-muted-foreground min-w-0 text-xs italic">(bez naslova)</span>
        )}
        <span className="bg-muted text-muted-foreground ml-auto shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase">
          {section.style === "LINKS"
            ? "Link"
            : section.style === "DOT_LINKS"
              ? "Dot"
              : section.style === "DYNAMIC_CITIES"
                ? "Gradovi"
                : section.style === "FOOTER_BADGE"
                  ? "Bedž"
                  : "Vizuelni"}
        </span>
      </div>
      {children}
    </div>
  );
}

function SortableItem({
  item,
  onEdit,
  onDelete,
}: {
  item: NavigationMenuItem;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group hover:bg-accent/50 flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
        isDragging && "opacity-50",
      )}
    >
      <Button
        variant="ghost"
        size="sm"
        {...attributes}
        {...listeners}
        className="text-muted-foreground/20 group-hover:text-muted-foreground h-auto w-auto shrink-0 cursor-grab p-0"
        aria-label="Prevuci stavku"
      >
        <Icon name="drag_indicator" className="size-3" />
      </Button>
      {item.icon ? (
        <Icon name={item.icon} className="text-muted-foreground size-4 shrink-0" />
      ) : (
        <span className="bg-muted-foreground/30 size-1.5 shrink-0 rounded-full" />
      )}
      <span className="flex-1 truncate">{item.label}</span>
      {item.href && item.href !== "#" && (
        <span className="text-muted-foreground/60 hidden max-w-[100px] truncate text-xs lg:block">
          {item.href}
        </span>
      )}
      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onEdit}
                className="text-muted-foreground/50 hover:text-foreground hover:bg-accent h-auto w-auto rounded p-1"
                aria-label="Izmeni stavku"
              >
                <Icon name="edit" className="size-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Izmeni stavku</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                className="text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 h-auto w-auto rounded p-1"
                aria-label="Obriši stavku"
              >
                <Icon name="delete" className="size-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Obriši stavku</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}

/* ─── Main manager ─────────────────────────────────── */

interface NavigationManagerProps {
  initialMenus: MenuWithSections[];
}

export function NavigationManager({ initialMenus }: NavigationManagerProps) {
  const router = useRouter();
  const [menus, setMenus] = useState(initialMenus);
  const [selectedMenuId, setSelectedMenuId] = useState(menus[0]?.id || "");
  const [previewOpen, setPreviewOpen] = useState(true);

  // Drawer states
  const [menuDrawerOpen, setMenuDrawerOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<MenuWithSections | null>(null);

  const [sectionDrawerOpen, setSectionDrawerOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<SectionWithItems | null>(null);
  const [sectionDrawerMenuId, setSectionDrawerMenuId] = useState("");

  const [itemDrawerOpen, setItemDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<NavigationMenuItem | null>(null);
  const [itemDrawerSectionId, setItemDrawerSectionId] = useState("");

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const selectedMenu = useMemo(
    () => menus.find((m) => m.id === selectedMenuId) || menus[0],
    [menus, selectedMenuId],
  );

  const sectionsByColumn = useMemo(() => {
    if (!selectedMenu) return { 0: [], 1: [], 2: [] } as Record<number, SectionWithItems[]>;
    const grouped: Record<number, SectionWithItems[]> = { 0: [], 1: [], 2: [] };
    for (const section of selectedMenu.sections) {
      if (!grouped[section.column]) grouped[section.column] = [];
      grouped[section.column].push(section);
    }
    return grouped;
  }, [selectedMenu]);

  /* ─── Tab drag ─────────────────────────────────── */
  const handleMenuDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = menus.findIndex((m) => m.id === active.id);
      const newIndex = menus.findIndex((m) => m.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = [...menus];
      const [moved] = reordered.splice(oldIndex, 1);
      reordered.splice(newIndex, 0, moved);
      setMenus(reordered);

      const updates = reordered.map((m, i) => ({ id: m.id, sortOrder: i }));
      const result = await reorderMenusAction(updates);
      if (!result.success) {
        toast.error("Greška pri ređanju");
        setMenus(initialMenus);
      }
      router.refresh();
    },
    [menus, initialMenus, router],
  );

  /* ─── Section drag ─────────────────────────────── */
  const handleSectionDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      let sourceColumn = -1;
      for (const col of [0, 1, 2]) {
        if (sectionsByColumn[col].some((s) => s.id === active.id)) {
          sourceColumn = col;
          break;
        }
      }
      if (sourceColumn === -1) return;

      let targetColumn = sourceColumn;
      for (const col of [0, 1, 2]) {
        if (sectionsByColumn[col].some((s) => s.id === over.id)) {
          targetColumn = col;
          break;
        }
      }

      const sourceSections = [...sectionsByColumn[sourceColumn]];
      const sourceIdx = sourceSections.findIndex((s) => s.id === active.id);
      if (sourceIdx === -1) return;

      const [moved] = sourceSections.splice(sourceIdx, 1);
      moved.column = targetColumn;

      const newSections = { ...sectionsByColumn };
      if (sourceColumn === targetColumn) {
        const targetSections = [...newSections[targetColumn]];
        const overIdx = targetSections.findIndex((s) => s.id === over.id);
        targetSections.splice(sourceIdx, 1);
        targetSections.splice(overIdx, 0, moved);
        newSections[targetColumn] = targetSections;
      } else {
        newSections[sourceColumn] = sourceSections;
        const targetSections = [...newSections[targetColumn]];
        const overIdx = targetSections.findIndex((s) => s.id === over.id);
        targetSections.splice(overIdx, 0, moved);
        newSections[targetColumn] = targetSections;
      }

      const updatedMenu = {
        ...selectedMenu,
        sections: Object.values(newSections).flat(),
      } as MenuWithSections;

      setMenus((prev) => prev.map((m) => (m.id === selectedMenu.id ? updatedMenu : m)));

      const allSections = Object.values(newSections).flat();
      const updates = allSections.map((s, i) => ({
        id: s.id,
        sortOrder: i,
        column: s.column,
      }));
      const result = await reorderSectionsAction(updates);
      if (!result.success) {
        toast.error("Greška pri ređanju sekcija");
        setMenus(initialMenus);
      }
      router.refresh();
    },
    [sectionsByColumn, selectedMenu, initialMenus, router],
  );

  /* ─── Refresh ──────────────────────────────────── */
  const refreshMenus = useCallback(async () => {
    const result = await getMenusAction();
    if (result.success) {
      const data = result.data;
      if (data?.menus) setMenus(data.menus as MenuWithSections[]);
    }
  }, []);

  /* ─── Callbacks ────────────────────────────────── */
  const openEditSection = useCallback((section: SectionWithItems) => {
    setSectionDrawerMenuId(section.menuId);
    setEditingSection(section);
    setSectionDrawerOpen(true);
  }, []);

  const openAddItem = useCallback((sectionId: string) => {
    setItemDrawerSectionId(sectionId);
    setEditingItem(null);
    setItemDrawerOpen(true);
  }, []);

  const openEditItem = useCallback((item: NavigationMenuItem, sectionId: string) => {
    setItemDrawerSectionId(sectionId);
    setEditingItem(item);
    setItemDrawerOpen(true);
  }, []);

  /* ─── Delete helpers ───────────────────────────── */
  const handleDeleteSection = useCallback(
    async (section: SectionWithItems) => {
      if (!confirm(`Obrisati sekciju "${section.heading || "bez naslova"}"?`)) return;
      const result = await deleteSectionAction(section.id);
      if (result.success) {
        toast.success("Sekcija obrisana");
        refreshMenus();
        router.refresh();
      } else {
        toast.error(result.error || "Greška");
      }
    },
    [refreshMenus, router],
  );

  const handleDeleteItem = useCallback(
    async (item: NavigationMenuItem) => {
      if (!confirm(`Obrisati stavku "${item.label}"?`)) return;
      const result = await deleteItemAction(item.id);
      if (result.success) {
        toast.success("Stavka obrisana");
        refreshMenus();
        router.refresh();
      } else {
        toast.error(result.error || "Greška");
      }
    },
    [refreshMenus, router],
  );

  /* ─── Render ───────────────────────────────────── */
  return (
    <div className="space-y-6 p-6">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Mega Meni</h1>
          <p className="text-muted-foreground mt-1 text-sm">
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
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleMenuDragEnd}
      >
        <div className="flex flex-wrap items-center gap-1.5">
          <SortableContext items={menus.map((m) => m.id)} strategy={verticalListSortingStrategy}>
            {menus.map((menu) => (
              <SortableMenuTab
                key={menu.id}
                menu={menu}
                isSelected={selectedMenuId === menu.id}
                onSelect={() => setSelectedMenuId(menu.id)}
                onEdit={() => {
                  setEditingMenu(menu);
                  setMenuDrawerOpen(true);
                }}
              />
            ))}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingMenu(null);
                      setMenuDrawerOpen(true);
                    }}
                    className="text-muted-foreground hover:text-foreground hover:bg-accent/50 gap-1 rounded-full px-2.5 py-1.5 text-xs font-semibold tracking-wider uppercase"
                    aria-label="Dodaj novi meni"
                  >
                    <Icon name="add" className="size-3.5" />
                    Novi meni
                  </Button>
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
          <div className={cn("min-w-0 flex-1", previewOpen ? "xl:w-1/2" : "w-full")}>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleSectionDragEnd}
            >
              <div className="grid grid-cols-3 gap-6">
                {[0, 1, 2].map((column) => (
                  <div
                    key={column}
                    className={cn(
                      "overflow-hidden rounded-lg border",
                      column === 0 && "bg-muted/10",
                      column === 1 && "bg-muted/10",
                      column === 2 && "bg-muted/10",
                    )}
                  >
                    {/* Column header */}
                    <div
                      className={cn(
                        "flex items-center justify-between border-b px-3 py-2 text-xs font-semibold tracking-wider uppercase",
                        column === 0 && "border-primary/10 bg-primary/10 text-primary",
                        column === 1 && "border-primary/10 bg-primary/10 text-primary",
                        column === 2 && "border-primary/10 bg-primary/10 text-primary",
                      )}
                    >
                      <span>Kolona {column + 1}</span>
                      <span className="text-[10px] opacity-50">
                        {column === 0 ? "Šira" : "Uska"}
                      </span>
                    </div>

                    {/* Sections inside column */}
                    <div className="space-y-3 p-3">
                      {/* Sections in column */}
                      <SortableContext
                        items={sectionsByColumn[column].map((s) => s.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        {sectionsByColumn[column].length === 0 && (
                          <div className="border-muted-foreground/20 rounded-lg border border-dashed p-4 text-center">
                            <p className="text-muted-foreground/50 text-xs">Prazna kolona</p>
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
                              {section.items.length === 0 &&
                                section.style !== "DYNAMIC_CITIES" &&
                                section.style !== "VISUAL" && (
                                  <p className="text-muted-foreground/40 px-2 py-1 text-xs italic">
                                    Nema stavki
                                  </p>
                                )}
                            </div>
                            {/* Section footer actions */}
                            <div className="border-border/40 flex items-center gap-1 border-t pt-1">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => openEditSection(section)}
                                      className="text-muted-foreground bg-accent/30 hover:bg-accent hover:text-foreground h-auto gap-1 rounded px-2 py-1 text-[11px] font-medium"
                                      aria-label="Opcije sekcije"
                                    >
                                      <Icon name="settings" className="size-3.5" />
                                      Opcije
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent side="bottom">
                                    Izmeni sekciju (naziv, kolonu, stil)
                                  </TooltipContent>
                                </Tooltip>
                                {(section.style === "LINKS" || section.style === "DOT_LINKS") && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => openAddItem(section.id)}
                                        className="text-muted-foreground bg-accent/30 hover:bg-accent hover:text-foreground h-auto gap-1 rounded px-2 py-1 text-[11px] font-medium"
                                        aria-label="Dodaj stavku"
                                      >
                                        <Icon name="add" className="size-3.5" />
                                        Stavka
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom">
                                      Dodaj novu stavku u ovu sekciju
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                                <div className="ml-auto">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteSection(section)}
                                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-auto gap-1 rounded px-2 py-1 text-[11px]"
                                        aria-label="Obriši sekciju"
                                      >
                                        <Icon name="delete" className="size-3.5" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom">
                                      Obriši sekciju i sve stavke u njoj
                                    </TooltipContent>
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
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingSection(null);
                                setSectionDrawerMenuId(selectedMenu.id);
                                setSectionDrawerOpen(true);
                              }}
                              className="border-muted-foreground/20 text-muted-foreground hover:text-foreground hover:border-muted-foreground/40 hover:bg-accent/30 w-full gap-1.5 rounded-lg border border-dashed py-2 text-xs"
                              aria-label="Dodaj sekciju"
                            >
                              <Icon name="add" className="size-3.5" />
                              Dodaj sekciju
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom">
                            Dodaj novu sekciju (grupu linkova) u ovu kolonu
                          </TooltipContent>
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
            <div className="min-w-0 xl:w-1/2">
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
          <Icon name="menu_book" className="text-muted-foreground/20 mb-4 size-16" />
          <h2 className="text-muted-foreground text-lg font-semibold">Nema menija</h2>
          <p className="text-muted-foreground/60 mt-1 mb-4 text-sm">
            Dodajte prvi meni da biste počeli.
          </p>
          <Button
            onClick={() => {
              setEditingMenu(null);
              setMenuDrawerOpen(true);
            }}
          >
            <Icon name="add" className="mr-1.5 size-4" />
            Dodaj meni
          </Button>
        </div>
      )}

      {/* ─── Drawers ─── */}
      <MenuDrawer
        menu={editingMenu}
        open={menuDrawerOpen}
        onClose={() => {
          setMenuDrawerOpen(false);
          setEditingMenu(null);
        }}
        onSaved={refreshMenus}
      />

      {sectionDrawerOpen && sectionDrawerMenuId && (
        <SectionDrawer
          menuId={sectionDrawerMenuId}
          section={editingSection}
          open={sectionDrawerOpen}
          onClose={() => {
            setSectionDrawerOpen(false);
            setEditingSection(null);
          }}
          onSaved={refreshMenus}
        />
      )}

      {itemDrawerOpen && itemDrawerSectionId && (
        <ItemDrawer
          sectionId={itemDrawerSectionId}
          item={editingItem}
          open={itemDrawerOpen}
          onClose={() => {
            setItemDrawerOpen(false);
            setEditingItem(null);
          }}
          onSaved={refreshMenus}
        />
      )}
    </div>
  );
}
