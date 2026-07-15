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
  dropTargetId: string | null;
  pending?: boolean;
  onSelect: (id: string) => void;
  onToggleNew: () => void;
  onNewTitleChange: (v: string) => void;
  onAddCategory: () => void;
  onStartEdit: (cat: SerializedCategory) => void;
  onEditTitleChange: (v: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDelete: (id: string, title: string) => void;
  onDragOverCategory: (id: string | null) => void;
  onDropProduct: (categoryId: string, productId: string) => void;
}

/** Desktop category rail for ticket management (shadcn Button/Input only). */
export function TicketCategoryRail({
  categories,
  selectedCategoryId,
  showNewCat,
  newCatTitle,
  editingCatId,
  editCatTitle,
  dropTargetId,
  pending,
  onSelect,
  onToggleNew,
  onNewTitleChange,
  onAddCategory,
  onStartEdit,
  onEditTitleChange,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  onDragOverCategory,
  onDropProduct,
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
            disabled={pending}
          >
            <Icon name="add" className="text-[14px]" />
          </Button>
        </div>
        {showNewCat && (
          <div className="flex gap-1">
            <Input
              value={newCatTitle}
              onChange={(e) => onNewTitleChange(e.target.value)}
              placeholder="Naziv kategorije..."
              className="h-8 text-xs"
              aria-label="Naziv nove kategorije"
              onKeyDown={(e) => e.key === "Enter" && onAddCategory()}
              disabled={pending}
            />
            <Button
              size="sm"
              className="h-8 px-2 text-[10px]"
              onClick={onAddCategory}
              disabled={pending}
            >
              Dodaj
            </Button>
          </div>
        )}
      </div>
      <div className="flex-1 space-y-1 overflow-y-auto p-2">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className={cn(
              "group relative rounded-xl border transition-colors",
              selectedCategoryId === cat.id
                ? "bg-primary/10 border-primary/20"
                : "hover:bg-muted/20 border-transparent",
              dropTargetId === cat.id && "border-primary bg-primary/5",
            )}
            onDragOver={(e) => {
              e.preventDefault();
              onDragOverCategory(cat.id);
            }}
            onDragLeave={() => onDragOverCategory(null)}
            onDrop={(e) => {
              e.preventDefault();
              onDragOverCategory(null);
              const prodId = e.dataTransfer.getData("text/product-id");
              if (prodId) onDropProduct(cat.id, prodId);
            }}
          >
            {editingCatId === cat.id ? (
              <div className="flex gap-1 p-1">
                <Input
                  value={editCatTitle}
                  onChange={(e) => onEditTitleChange(e.target.value)}
                  className="h-8 text-xs"
                  aria-label="Izmeni naziv kategorije"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onSaveEdit();
                    if (e.key === "Escape") onCancelEdit();
                  }}
                  autoFocus
                />
                <Button size="sm" className="h-8" onClick={onSaveEdit} aria-label="Sačuvaj">
                  <Icon name="check" className="text-[14px]" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8"
                  onClick={onCancelEdit}
                  aria-label="Otkaži"
                >
                  <Icon name="close" className="text-[14px]" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-1 px-2 py-1.5">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onSelect(cat.id)}
                  className={cn(
                    "h-auto min-w-0 flex-1 justify-start gap-1 rounded-lg px-2 py-1.5 text-left text-xs font-bold",
                    selectedCategoryId === cat.id ? "text-primary" : "text-muted-foreground",
                  )}
                  aria-current={selectedCategoryId === cat.id ? "true" : undefined}
                >
                  <Icon name="folder" className="shrink-0 text-[12px]" />
                  <span className="truncate">{cat.title}</span>
                  <span className="text-muted-foreground/60 ml-auto font-mono text-[10px]">
                    {cat.products.length}
                  </span>
                </Button>
                <div className="flex shrink-0 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={() => onStartEdit(cat)}
                    aria-label={`Izmeni kategoriju ${cat.title}`}
                  >
                    <Icon name="edit" className="text-[12px]" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-destructive h-6 w-6"
                    onClick={() => onDelete(cat.id, cat.title)}
                    aria-label={`Obriši kategoriju ${cat.title}`}
                  >
                    <Icon name="delete" className="text-[12px]" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
        {categories.length === 0 && (
          <p className="text-muted-foreground p-3 text-center text-xs">Nema kategorija</p>
        )}
      </div>
    </div>
  );
}
