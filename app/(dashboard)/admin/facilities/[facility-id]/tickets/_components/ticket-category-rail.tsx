"use client";

import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { SerializedCategory } from "../_lib/ticket-admin-actions";

interface TicketCategoryRailProps {
  categories: SerializedCategory[];
  selectedCategoryId: string | null;
  showNewCat: boolean;
  newCatTitle: string;
  editingCatId: string | null;
  editCatTitle: string;
  onSelect: (id: string) => void;
  onToggleNew: () => void;
  onNewTitleChange: (v: string) => void;
  onAddCategory: () => void;
  onStartEdit: (cat: SerializedCategory) => void;
  onEditTitleChange: (v: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDelete: (id: string, title: string) => void;
}

/** Desktop category rail for ticket management. */
export function TicketCategoryRail({
  categories,
  selectedCategoryId,
  showNewCat,
  newCatTitle,
  editingCatId,
  editCatTitle,
  onSelect,
  onToggleNew,
  onNewTitleChange,
  onAddCategory,
  onStartEdit,
  onEditTitleChange,
  onSaveEdit,
  onCancelEdit,
  onDelete,
}: TicketCategoryRailProps) {
  return (
    <div className="border-border/50 flex w-56 shrink-0 flex-col border-r">
      <div className="border-border/50 border-b p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-muted-foreground text-[10px] font-black tracking-widest uppercase">
            Kategorije
          </span>
          <Button
            onClick={onToggleNew}
            variant="ghost"
            size="icon"
            className="h-6 w-6 rounded-lg"
            aria-label={showNewCat ? "Zatvori novu kategoriju" : "Dodaj kategoriju"}
          >
            <Icon name="add" className="text-[14px]" />
          </Button>
        </div>
        {showNewCat && (
          <div className="flex gap-1">
            <Input
              value={newCatTitle}
              onChange={(e) => onNewTitleChange(e.target.value)}
              placeholder="Nova kategorija"
              className="h-8 text-xs"
              onKeyDown={(e) => e.key === "Enter" && onAddCategory()}
            />
            <Button size="sm" className="h-8" onClick={onAddCategory}>
              OK
            </Button>
          </div>
        )}
      </div>
      <div className="flex-1 space-y-1 overflow-y-auto p-2">
        {categories.map((cat) => (
          <div key={cat.id} className="group relative">
            {editingCatId === cat.id ? (
              <div className="flex gap-1 p-1">
                <Input
                  value={editCatTitle}
                  onChange={(e) => onEditTitleChange(e.target.value)}
                  className="h-8 text-xs"
                />
                <Button size="sm" className="h-8" onClick={onSaveEdit}>
                  ✓
                </Button>
                <Button size="sm" variant="ghost" className="h-8" onClick={onCancelEdit}>
                  ✕
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onSelect(cat.id)}
                className={cn(
                  "group flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-bold transition-colors",
                  selectedCategoryId === cat.id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                )}
              >
                <span className="truncate">{cat.title}</span>
                <span className="text-muted-foreground/60 font-mono text-[10px]">
                  {cat.products.length}
                </span>
              </button>
            )}
            {editingCatId !== cat.id && (
              <div className="absolute top-1 right-1 flex opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={() => onStartEdit(cat)}
                  aria-label="Izmeni"
                >
                  <Icon name="edit" className="text-[12px]" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-destructive h-6 w-6"
                  onClick={() => onDelete(cat.id, cat.title)}
                  aria-label="Obriši"
                >
                  <Icon name="delete" className="text-[12px]" />
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
