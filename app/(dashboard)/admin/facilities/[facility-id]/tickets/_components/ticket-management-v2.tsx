"use client";

import NextImage from "next/image";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { SerializedCategory } from "../_lib/ticket-admin-actions";
import { getTicketHierarchy } from "../_lib/ticket-admin-actions";
import { ProductImageSection } from "./product-image-section";
import { PriceCard } from "./price-card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface Props {
  facilityId: string;
  initialCategories: SerializedCategory[];
}

const DAY_LABELS: Record<string, string> = {
  ALL: "Svi dani",
  WEEKDAY: "Radni dan",
  WEEKEND: "Vikend",
};

const TIME_LABELS: Record<string, string> = {
  FULL_DAY: "Ceo dan",
  AFTER_16H: "Posle 16h",
  THREE_HOUR: "3 sata",
};

export function TicketManagementV2({ facilityId, initialCategories }: Props) {
  const [categories, setCategories] = React.useState(initialCategories);
  const [selectedCategoryId, setSelectedCategoryId] = React.useState<string | null>(
    initialCategories[0]?.id ?? null,
  );
  const [selectedProductId, setSelectedProductId] = React.useState<string | null>(null);
  const [mobileView, setMobileView] = React.useState<"cats" | "prods" | "prices">("cats");
  const [newCatTitle, setNewCatTitle] = React.useState("");
  const [newProdTitle, setNewProdTitle] = React.useState("");
  const [showNewCat, setShowNewCat] = React.useState(false);
  const [showNewProd, setShowNewProd] = React.useState(false);
  const [editingCatId, setEditingCatId] = React.useState<string | null>(null);
  const [editCatTitle, setEditCatTitle] = React.useState("");
  const [editingProductId, setEditingProductId] = React.useState<string | null>(null);
  const [editProductTitle, setEditProductTitle] = React.useState("");
  const [deleteCategoryTarget, setDeleteCategoryTarget] = React.useState<{
    id: string;
    title: string;
  } | null>(null);
  const [deleteProductTarget, setDeleteProductTarget] = React.useState<{
    id: string;
    title: string;
  } | null>(null);

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId) ?? null;
  const selectedProduct =
    selectedCategory?.products.find((p) => p.id === selectedProductId) ?? null;

  const handleAddCategory = async () => {
    if (!newCatTitle.trim()) return;
    const { createCategory } = await import("../_lib/ticket-admin-actions");
    const cat = await createCategory(facilityId, newCatTitle);
    setCategories((prev) => [
      ...prev,
      {
        id: cat.id,
        title: cat.title,
        slug: cat.slug,
        displayOrder: cat.displayOrder,
        isActive: cat.isActive,
        products: [],
      },
    ]);
    setNewCatTitle("");
    setShowNewCat(false);
    setSelectedCategoryId(cat.id);
    toast.success("Kategorija dodata", {
      description: `Kategorija "${cat.title}" je uspešno kreirana.`,
      duration: 2000,
    });
  };

  const handleAddProduct = async () => {
    if (!selectedCategoryId || !newProdTitle.trim()) return;
    const { createProduct } = await import("../_lib/ticket-admin-actions");
    const prod = await createProduct(selectedCategoryId, facilityId, { title: newProdTitle });
    setCategories((prev) =>
      prev.map((c) =>
        c.id === selectedCategoryId
          ? {
              ...c,
              products: [
                ...c.products,
                {
                  id: prod.id,
                  categoryId: prod.categoryId,
                  title: prod.title,
                  label: prod.label,
                  requiresIdentity: prod.requiresIdentity,
                  requiresPhoto: prod.requiresPhoto,
                  minPeople: prod.minPeople,
                  maxPeople: prod.maxPeople,
                  isSeasonPass: prod.isSeasonPass,
                  validityType: prod.validityType,
                  displayOrder: prod.displayOrder,
                  isActive: prod.isActive,
                  imageUrl: prod.imageUrl ?? null,
                  prices: [],
                },
              ],
            }
          : c,
      ),
    );
    setNewProdTitle("");
    setShowNewProd(false);
    setSelectedProductId(prod.id);
    toast.success("Tip dodat", {
      description: `Tip "${prod.title}" je uspešno kreiran.`,
      duration: 2000,
    });
  };

  const handleDeleteCategory = (id: string, title: string) => {
    setDeleteCategoryTarget({ id, title });
  };

  const confirmDeleteCategory = async () => {
    if (!deleteCategoryTarget) return;
    const { id, title } = deleteCategoryTarget;
    setDeleteCategoryTarget(null);
    const { deleteCategory } = await import("../_lib/ticket-admin-actions");
    await deleteCategory(id, facilityId);
    setCategories((prev) => prev.filter((c) => c.id !== id));
    if (selectedCategoryId === id) {
      setSelectedCategoryId(null);
      setSelectedProductId(null);
    }
    toast.success("Kategorija obrisana", {
      description: `Kategorija "${title}" je uspešno obrisana.`,
      duration: 2000,
    });
  };

  const handleStartEditCategory = (cat: SerializedCategory) => {
    setEditingCatId(cat.id);
    setEditCatTitle(cat.title);
  };

  const handleSaveCategory = async () => {
    if (!editingCatId || !editCatTitle.trim()) return;
    const { updateCategory } = await import("../_lib/ticket-admin-actions");
    await updateCategory(editingCatId, facilityId, { title: editCatTitle.trim() });
    setCategories((prev) =>
      prev.map((c) => (c.id === editingCatId ? { ...c, title: editCatTitle.trim() } : c)),
    );
    setEditingCatId(null);
    setEditCatTitle("");
  };

  const handleCancelEditCategory = () => {
    setEditingCatId(null);
    setEditCatTitle("");
  };

  const handleStartEditProduct = (prod: { id: string; title: string }) => {
    setEditingProductId(prod.id);
    setEditProductTitle(prod.title);
  };

  const handleSaveProduct = async () => {
    if (!editingProductId || !editProductTitle.trim()) return;
    const { updateProduct } = await import("../_lib/ticket-admin-actions");
    await updateProduct(editingProductId, facilityId, { title: editProductTitle.trim() });
    setCategories((prev) =>
      prev.map((c) => ({
        ...c,
        products: c.products.map((p) =>
          p.id === editingProductId ? { ...p, title: editProductTitle.trim() } : p,
        ),
      })),
    );
    setEditingProductId(null);
    setEditProductTitle("");
  };

  const handleCancelEditProduct = () => {
    setEditingProductId(null);
    setEditProductTitle("");
  };

  const handleMoveProduct = async (productId: string, fromCatId: string, toCatId: string) => {
    if (fromCatId === toCatId) return;
    const { updateProduct } = await import("../_lib/ticket-admin-actions");
    await updateProduct(productId, facilityId, { categoryId: toCatId });
    setCategories((prev) =>
      prev.map((c) => {
        if (c.id === fromCatId)
          return { ...c, products: c.products.filter((p) => p.id !== productId) };
        if (c.id === toCatId) {
          const product = prev
            .find((x) => x.id === fromCatId)
            ?.products.find((p) => p.id === productId);
          if (!product) return c;
          return { ...c, products: [...c.products, { ...product, categoryId: toCatId }] };
        }
        return c;
      }),
    );
  };

  const handleDeleteProduct = (id: string, title: string) => {
    setDeleteProductTarget({ id, title });
  };

  const confirmDeleteProduct = async () => {
    if (!deleteProductTarget) return;
    const { id, title } = deleteProductTarget;
    setDeleteProductTarget(null);
    const { deleteProduct } = await import("../_lib/ticket-admin-actions");
    await deleteProduct(id, facilityId);
    setCategories((prev) =>
      prev.map((c) => ({
        ...c,
        products: c.products.filter((p) => p.id !== id),
      })),
    );
    if (selectedProductId === id) setSelectedProductId(null);
    toast.success("Tip obrisan", {
      description: `Tip "${title}" je uspešno obrisan.`,
      duration: 2000,
    });
  };

  const handleAddPrice = async (productId: string) => {
    const { createPrice } = await import("../_lib/ticket-admin-actions");
    await createPrice(productId, facilityId, { price: 0 });
    // Refresh categories to get the new price
    const fresh = await getTicketHierarchy(facilityId);
    setCategories(fresh);
  };

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      {/* ─── Category Panel ─────────────────────────── */}
      <div
        className={cn(
          "lg:border-border/50 lg:flex lg:w-56 lg:shrink-0 lg:flex-col lg:border-r",
          mobileView === "cats" ? "flex flex-1 flex-col" : "hidden",
        )}
      >
        <div className="border-border/50 border-b p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-muted-foreground text-[10px] font-black tracking-widest uppercase">
              Kategorije
            </span>
            <Button
              onClick={() => setShowNewCat(!showNewCat)}
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
                onChange={(e) => setNewCatTitle(e.target.value)}
                placeholder="Naziv kategorije..."
                className="h-8 flex-1 rounded-lg text-xs"
                onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
              />
              <Button size="sm" className="h-8 px-2 text-[10px]" onClick={handleAddCategory}>
                +
              </Button>
            </div>
          )}
        </div>
        <div className="flex-1 space-y-1 overflow-y-auto p-2">
          {categories.map((cat) => (
            <Button
              key={cat.id}
              onClick={() => {
                setSelectedCategoryId(cat.id);
                setMobileView("prods");
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.style.borderColor = "hsl(var(--primary))";
              }}
              onDragLeave={(e) => {
                e.currentTarget.style.borderColor = "";
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.style.borderColor = "";
                const prodId = e.dataTransfer.getData("text/product-id");
                if (prodId) {
                  const fromCat = categories.find((c) => c.products.some((p) => p.id === prodId));
                  if (fromCat) handleMoveProduct(prodId, fromCat.id, cat.id);
                }
              }}
              variant="ghost"
              className={cn(
                "group flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-bold transition-all",
                selectedCategoryId === cat.id
                  ? "bg-primary/10 text-primary border-primary/20 border"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/20 border border-transparent",
              )}
              aria-label={cat.title}
            >
              {editingCatId === cat.id ? (
                <Input
                  value={editCatTitle}
                  onChange={(e) => setEditCatTitle(e.target.value)}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === "Enter") handleSaveCategory();
                    if (e.key === "Escape") handleCancelEditCategory();
                  }}
                  onBlur={handleSaveCategory}
                  className="h-6 flex-1 rounded text-xs font-bold"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span className="flex-1 text-left">
                  <Icon name="folder" className="mr-1" />
                  {cat.title}
                </span>
              )}
              <div className="flex items-center gap-0.5 opacity-0 transition-all group-hover:opacity-100">
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartEditCategory(cat);
                  }}
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 rounded"
                  aria-label={`Izmeni kategoriju ${cat.title}`}
                >
                  <Icon name="edit" className="text-[10px]" />
                </Button>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteCategory(cat.id, cat.title);
                  }}
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-5 w-5 rounded"
                  aria-label={`Obriši kategoriju ${cat.title}`}
                >
                  <Icon name="close" className="text-[10px]" />
                </Button>
              </div>
            </Button>
          ))}
        </div>
      </div>

      {/* ─── Product Panel ──────────────────────────── */}
      <div
        className={cn(
          "lg:border-border/50 lg:flex lg:w-64 lg:shrink-0 lg:flex-col lg:border-r",
          mobileView === "prods" ? "flex flex-1 flex-col" : "hidden",
        )}
      >
        <div className="border-border/50 border-b p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-muted-foreground text-[10px] font-black tracking-widest uppercase">
              {selectedCategory ? `${selectedCategory.title} → Tipovi` : "Tipovi"}
            </span>
            {selectedCategory && (
              <Button
                onClick={() => setShowNewProd(!showNewProd)}
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-lg"
                aria-label={showNewProd ? "Zatvori novi tip" : "Dodaj tip"}
              >
                <Icon name="add" className="text-[14px]" />
              </Button>
            )}
          </div>
          {showNewProd && selectedCategory && (
            <div className="flex gap-1">
              <Input
                value={newProdTitle}
                onChange={(e) => setNewProdTitle(e.target.value)}
                placeholder="Naziv tipa..."
                className="h-8 flex-1 rounded-lg text-xs"
                onKeyDown={(e) => e.key === "Enter" && handleAddProduct()}
              />
              <Button size="sm" className="h-8 px-2 text-[10px]" onClick={handleAddProduct}>
                +
              </Button>
            </div>
          )}
        </div>
        <div className="flex-1 space-y-2 overflow-y-auto p-2">
          {!selectedCategory && (
            <p className="text-muted-foreground p-3 text-center text-xs">Izaberite kategoriju</p>
          )}
          {selectedCategory?.products.map((prod) => (
            <div
              key={prod.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("text/product-id", prod.id);
                e.dataTransfer.effectAllowed = "move";
              }}
              onDragEnd={() => {}}
              className={cn(
                "cursor-grab rounded-xl border p-3 transition-all active:cursor-grabbing",
                selectedProductId === prod.id
                  ? "bg-primary/5 border-primary/30"
                  : "bg-muted/5 border-border hover:border-primary/20",
              )}
              onClick={() => {
                setSelectedProductId(prod.id);
                setMobileView("prices");
              }}
            >
              <div className="mb-1 flex items-center justify-between">
                {editingProductId === prod.id ? (
                  <Input
                    value={editProductTitle}
                    onChange={(e) => setEditProductTitle(e.target.value)}
                    onKeyDown={(e) => {
                      e.stopPropagation();
                      if (e.key === "Enter") handleSaveProduct();
                      if (e.key === "Escape") handleCancelEditProduct();
                    }}
                    onBlur={handleSaveProduct}
                    className="h-7 flex-1 rounded text-sm font-bold"
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span className="text-foreground text-sm font-bold">{prod.title}</span>
                )}
                <div className="flex shrink-0 items-center gap-0.5">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartEditProduct(prod);
                    }}
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 rounded"
                    aria-label={`Izmeni tip ${prod.title}`}
                  >
                    <Icon name="edit" className="text-[10px]" />
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteProduct(prod.id, prod.title);
                    }}
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-5 w-5 rounded"
                    aria-label={`Obriši tip ${prod.title}`}
                  >
                    <Icon name="close" className="text-[10px]" />
                  </Button>
                </div>
              </div>
              {prod.imageUrl && (
                <div className="relative -mx-1 mb-2 h-24">
                  <NextImage
                    src={prod.imageUrl}
                    alt={prod.title}
                    fill
                    className="border-border/50 rounded-lg border object-cover"
                    sizes="(max-width: 768px) 100vw, 200px"
                  />
                </div>
              )}
              <div className="flex flex-wrap gap-1">
                {prod.requiresPhoto && (
                  <span className="text-warning rounded bg-amber-500/10 px-1.5 py-0.5 text-[8px] font-bold">
                    📸
                  </span>
                )}
                {prod.requiresIdentity && (
                  <span className="text-warning rounded bg-amber-500/10 px-1.5 py-0.5 text-[8px] font-bold">
                    🆔
                  </span>
                )}
                <span className="text-muted-foreground text-[8px] font-bold">
                  min:{prod.minPeople}
                </span>
                {prod.maxPeople && (
                  <span className="text-muted-foreground text-[8px] font-bold">
                    max:{prod.maxPeople}
                  </span>
                )}
              </div>
              <div className="text-muted-foreground mt-1 text-[10px]">
                {prod.prices.length} cena/e
              </div>
            </div>
          ))}
          {selectedCategory && selectedCategory.products.length === 0 && !showNewProd && (
            <p className="text-muted-foreground p-3 text-center text-xs">
              Nema tipova. Dodajte prvi [+]
            </p>
          )}
        </div>
      </div>

      {/* ─── Price Panel ────────────────────────────── */}
      <div
        className={cn(
          "lg:flex lg:min-w-0 lg:flex-1 lg:flex-col",
          mobileView === "prices" ? "flex flex-1 flex-col" : "hidden",
        )}
      >
        <div className="border-border/50 flex items-center justify-between border-b p-3">
          <span className="text-muted-foreground text-[10px] font-black tracking-widest uppercase">
            {selectedProduct ? `${selectedProduct.title} → Cene` : "Cene"}
          </span>
          {selectedProduct && (
            <Button
              onClick={() => handleAddPrice(selectedProduct.id)}
              variant="outline"
              size="sm"
              className="h-7 gap-1 rounded-lg px-3 text-[10px] font-bold"
              aria-label={`Dodaj cenu za ${selectedProduct.title}`}
            >
              <Icon name="add" className="text-[12px]" /> Varijacija
            </Button>
          )}
        </div>
        {selectedProduct && (
          <ProductImageSection
            productId={selectedProduct.id}
            imageUrl={selectedProduct.imageUrl}
            productTitle={selectedProduct.title}
            onImageChange={(url: string | null) => {
              setCategories((prev) =>
                prev.map((c) => ({
                  ...c,
                  products: c.products.map((p) =>
                    p.id === selectedProduct.id ? { ...p, imageUrl: url } : p,
                  ),
                })),
              );
            }}
          />
        )}
        <div className="flex-1 overflow-y-auto p-4">
          {!selectedProduct && (
            <p className="text-muted-foreground p-8 text-center text-sm">
              Izaberite kategoriju i tip da biste videli cene
            </p>
          )}
          {selectedProduct && selectedProduct.prices.length === 0 && (
            <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-3">
              <Icon name="confirmation_number" className="text-[32px] opacity-30" />
              <p className="text-sm">Nema cena za {selectedProduct.title}</p>
              <Button
                size="sm"
                variant="outline"
                className="flex items-center gap-1 text-xs"
                onClick={() => handleAddPrice(selectedProduct.id)}
              >
                <Icon name="add" className="text-[12px]" /> Dodaj prvu cenu
              </Button>
            </div>
          )}
          {selectedProduct && selectedProduct.prices.length > 0 && (
            <div className="grid gap-3">
              {selectedProduct.prices.map((price) => (
                <PriceCard
                  key={price.id}
                  price={price}
                  _product={selectedProduct}
                  facilityId={facilityId}
                  onDeleted={() => {
                    setCategories((prev) =>
                      prev.map((c) => ({
                        ...c,
                        products: c.products.map((p) =>
                          p.id === selectedProduct.id
                            ? { ...p, prices: p.prices.filter((pr) => pr.id !== price.id) }
                            : p,
                        ),
                      })),
                    );
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── Delete Category Confirmation ──────────────── */}
      <Dialog
        open={deleteCategoryTarget !== null}
        onOpenChange={() => setDeleteCategoryTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Obriši kategoriju</DialogTitle>
            <DialogDescription>
              Da li ste sigurni da želite da obrišete kategoriju &quot;
              {deleteCategoryTarget?.title}
              &quot;? Ova radnja je nepovratna.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteCategoryTarget(null)}>
              Otkaži
            </Button>
            <Button variant="destructive" onClick={confirmDeleteCategory}>
              Obriši
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Product Confirmation ────────────────── */}
      <Dialog
        open={deleteProductTarget !== null}
        onOpenChange={() => setDeleteProductTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Obriši tip</DialogTitle>
            <DialogDescription>
              Da li ste sigurni da želite da obrišete tip &quot;
              {deleteProductTarget?.title}
              &quot;? Ova radnja je nepovratna.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteProductTarget(null)}>
              Otkaži
            </Button>
            <Button variant="destructive" onClick={confirmDeleteProduct}>
              Obriši
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mobile nav dots */}
      <div className="bg-background/80 border-border/50 fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 gap-1.5 rounded-full border px-3 py-2 shadow-lg backdrop-blur-md lg:hidden">
        {(["cats", "prods", "prices"] as const).map((v, _i) => (
          <Button
            key={v}
            variant="ghost"
            size="sm"
            onClick={() => setMobileView(v)}
            className={cn(
              "h-2 w-2 rounded-full p-0 transition-all",
              mobileView === v ? "bg-primary w-6" : "bg-muted-foreground/30",
            )}
            aria-label={v === "cats" ? "Kategorije" : v === "prods" ? "Tipovi" : "Cene"}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Product Image Section ──────────────────────────
