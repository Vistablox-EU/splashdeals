"use client";

import NextImage from "next/image";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { SerializedCategory } from "../_lib/ticket-admin-actions";
import {
  createCategory,
  createProduct,
  createPrice,
  updateCategory,
  updateProduct,
  deleteCategory,
  deleteProduct,
} from "../_lib/ticket-admin-actions";
import { ProductImageSection } from "./product-image-section";
import { PriceCard } from "./price-card";
import { TicketCategoryRail } from "./ticket-category-rail";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Props {
  facilityId: string;
  initialCategories: SerializedCategory[];
}

export function TicketManagementV2({ facilityId, initialCategories }: Props) {
  const [categories, setCategories] = React.useState(initialCategories);
  const [selectedCategoryId, setSelectedCategoryId] = React.useState<string | null>(
    initialCategories[0]?.id ?? null,
  );
  const [selectedProductId, setSelectedProductId] = React.useState<string | null>(null);
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
  const [dropTargetId, setDropTargetId] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId) ?? null;
  const selectedProduct =
    selectedCategory?.products.find((p) => p.id === selectedProductId) ?? null;

  const handleAddCategory = async () => {
    if (!newCatTitle.trim() || pending) return;
    setPending(true);
    try {
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
    } catch {
      toast.error("Dodavanje kategorije nije uspelo");
    } finally {
      setPending(false);
    }
  };

  const handleAddProduct = async () => {
    if (!selectedCategoryId || !newProdTitle.trim() || pending) return;
    setPending(true);
    try {
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
    } catch {
      toast.error("Dodavanje tipa nije uspelo");
    } finally {
      setPending(false);
    }
  };

  const confirmDeleteCategory = async () => {
    if (!deleteCategoryTarget) return;
    const { id, title } = deleteCategoryTarget;
    setDeleteCategoryTarget(null);
    setPending(true);
    try {
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
    } catch {
      toast.error("Brisanje kategorije nije uspelo");
    } finally {
      setPending(false);
    }
  };

  const handleSaveCategory = async () => {
    if (!editingCatId || !editCatTitle.trim()) return;
    try {
      await updateCategory(editingCatId, facilityId, { title: editCatTitle.trim() });
      setCategories((prev) =>
        prev.map((c) => (c.id === editingCatId ? { ...c, title: editCatTitle.trim() } : c)),
      );
      setEditingCatId(null);
      setEditCatTitle("");
      toast.success("Kategorija sačuvana");
    } catch {
      toast.error("Čuvanje kategorije nije uspelo");
    }
  };

  const handleSaveProduct = async () => {
    if (!editingProductId || !editProductTitle.trim()) return;
    try {
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
      toast.success("Tip sačuvan");
    } catch {
      toast.error("Čuvanje tipa nije uspelo");
    }
  };

  const handleMoveProduct = async (productId: string, fromCatId: string, toCatId: string) => {
    if (fromCatId === toCatId) return;
    try {
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
      toast.success("Tip premešten");
    } catch {
      toast.error("Premeštanje tipa nije uspelo");
    }
  };

  const confirmDeleteProduct = async () => {
    if (!deleteProductTarget) return;
    const { id, title } = deleteProductTarget;
    setDeleteProductTarget(null);
    setPending(true);
    try {
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
    } catch {
      toast.error("Brisanje tipa nije uspelo");
    } finally {
      setPending(false);
    }
  };

  const handleAddPrice = async (productId: string) => {
    if (pending) return;
    setPending(true);
    try {
      const newPrice = await createPrice(productId, facilityId, {
        price: 0,
        dayType: "ALL",
        timeSlot: "FULL_DAY",
      });
      setCategories((prev) =>
        prev.map((c) => ({
          ...c,
          products: c.products.map((p) =>
            p.id === productId
              ? {
                  ...p,
                  prices: [
                    ...p.prices,
                    {
                      id: newPrice.id,
                      ticketProductId: productId,
                      label: null,
                      price: 0,
                      originalPrice: null,
                      dayType: "ALL",
                      timeSlot: "FULL_DAY",
                      validFrom: null,
                      validTo: null,
                      displayOrder: newPrice.displayOrder,
                      isActive: true,
                    },
                  ],
                }
              : p,
          ),
        })),
      );
      toast.success("Cena dodata");
    } catch {
      toast.error("Dodavanje cene nije uspelo");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <TicketCategoryRail
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        showNewCat={showNewCat}
        newCatTitle={newCatTitle}
        editingCatId={editingCatId}
        editCatTitle={editCatTitle}
        dropTargetId={dropTargetId}
        pending={pending}
        onSelect={(id) => {
          setSelectedCategoryId(id);
          setSelectedProductId(null);
        }}
        onToggleNew={() => setShowNewCat((v) => !v)}
        onNewTitleChange={setNewCatTitle}
        onAddCategory={handleAddCategory}
        onStartEdit={(cat) => {
          setEditingCatId(cat.id);
          setEditCatTitle(cat.title);
        }}
        onEditTitleChange={setEditCatTitle}
        onSaveEdit={handleSaveCategory}
        onCancelEdit={() => {
          setEditingCatId(null);
          setEditCatTitle("");
        }}
        onDelete={(id, title) => setDeleteCategoryTarget({ id, title })}
        onDragOverCategory={setDropTargetId}
        onDropProduct={(categoryId, productId) => {
          const fromCat = categories.find((c) => c.products.some((p) => p.id === productId));
          if (fromCat) void handleMoveProduct(productId, fromCat.id, categoryId);
        }}
      />

      {/* ─── Product Panel ──────────────────────────── */}
      <div
        className={cn(
          "lg:border-border/50 lg:flex lg:w-64 lg:shrink-0 lg:flex-col lg:border-r",
          "flex",
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
                disabled={pending}
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
                disabled={pending}
              />
              <Button
                size="sm"
                className="h-8 px-2 text-[10px]"
                onClick={handleAddProduct}
                disabled={pending}
              >
                Dodaj
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
              className={cn(
                "cursor-grab rounded-xl border p-3 transition-colors active:cursor-grabbing",
                selectedProductId === prod.id
                  ? "bg-primary/5 border-primary/30"
                  : "bg-muted/5 border-border hover:border-primary/20",
              )}
              onClick={() => setSelectedProductId(prod.id)}
            >
              <div className="mb-1 flex items-center justify-between gap-1">
                {editingProductId === prod.id ? (
                  <Input
                    value={editProductTitle}
                    onChange={(e) => setEditProductTitle(e.target.value)}
                    onKeyDown={(e) => {
                      e.stopPropagation();
                      if (e.key === "Enter") handleSaveProduct();
                      if (e.key === "Escape") {
                        setEditingProductId(null);
                        setEditProductTitle("");
                      }
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
                      setEditingProductId(prod.id);
                      setEditProductTitle(prod.title);
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
                      setDeleteProductTarget({ id: prod.id, title: prod.title });
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
                  <span className="text-warning bg-warning/10 rounded px-1.5 py-0.5 text-[8px] font-bold">
                    Foto
                  </span>
                )}
                {prod.requiresIdentity && (
                  <span className="text-warning bg-warning/10 rounded px-1.5 py-0.5 text-[8px] font-bold">
                    ID
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
      <div className={cn("lg:flex lg:min-w-0 lg:flex-1 lg:flex-col", "flex")}>
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
              disabled={pending}
            >
              <Icon name="add" className="text-[12px]" /> Varijacija
            </Button>
          )}
        </div>
        {selectedProduct && (
          <ProductImageSection
            key={selectedProduct.imageUrl ?? `empty-${selectedProduct.id}`}
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
                disabled={pending}
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
                  product={selectedProduct}
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
                  onSaved={(next) => {
                    setCategories((prev) =>
                      prev.map((c) => ({
                        ...c,
                        products: c.products.map((p) =>
                          p.id === selectedProduct.id
                            ? {
                                ...p,
                                prices: p.prices.map((pr) =>
                                  pr.id === next.id ? { ...pr, ...next } : pr,
                                ),
                              }
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

      <AlertDialog
        open={deleteCategoryTarget !== null}
        onOpenChange={(open) => !open && setDeleteCategoryTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Obriši kategoriju</AlertDialogTitle>
            <AlertDialogDescription>
              Da li ste sigurni da želite da obrišete kategoriju &quot;
              {deleteCategoryTarget?.title}
              &quot;? Ova radnja je nepovratna.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Otkaži</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDeleteCategory}
            >
              Obriši
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={deleteProductTarget !== null}
        onOpenChange={(open) => !open && setDeleteProductTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Obriši tip</AlertDialogTitle>
            <AlertDialogDescription>
              Da li ste sigurni da želite da obrišete tip &quot;
              {deleteProductTarget?.title}
              &quot;? Ova radnja je nepovratna.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Otkaži</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDeleteProduct}
            >
              Obriši
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
