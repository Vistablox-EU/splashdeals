"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/Icon"
import { cn } from "@/lib/utils"
import type { SerializedCategory } from "../_lib/ticket-admin-actions"

interface Props {
  facilityId: string
  initialCategories: SerializedCategory[]
}

const DAY_LABELS: Record<string, string> = {
  ALL: "Svi dani",
  WEEKDAY: "Radni dan",
  WEEKEND: "Vikend",
}

const TIME_LABELS: Record<string, string> = {
  FULL_DAY: "Ceo dan",
  AFTER_16H: "Posle 16h",
  THREE_HOUR: "3 sata",
}

export function TicketManagementV2({ facilityId, initialCategories }: Props) {
  const [categories, setCategories] = React.useState(initialCategories)
  const [selectedCategoryId, setSelectedCategoryId] = React.useState<string | null>(
    initialCategories[0]?.id ?? null
  )
  const [selectedProductId, setSelectedProductId] = React.useState<string | null>(null)
  const [mobileView, setMobileView] = React.useState<"cats" | "prods" | "prices">("cats")
  const [newCatTitle, setNewCatTitle] = React.useState("")
  const [newProdTitle, setNewProdTitle] = React.useState("")
  const [showNewCat, setShowNewCat] = React.useState(false)
  const [showNewProd, setShowNewProd] = React.useState(false)

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId) ?? null
  const selectedProduct = selectedCategory?.products.find((p) => p.id === selectedProductId) ?? null

  const handleAddCategory = async () => {
    if (!newCatTitle.trim()) return
    const { createCategory } = await import("../_lib/ticket-admin-actions")
    const cat = await createCategory(facilityId, newCatTitle)
    setCategories((prev) => [
      ...prev,
      {
        id: cat.id,
        title: cat.title,
        titleSr: cat.titleSr,
        slug: cat.slug,
        displayOrder: cat.displayOrder,
        isActive: cat.isActive,
        products: [],
      },
    ])
    setNewCatTitle("")
    setShowNewCat(false)
    setSelectedCategoryId(cat.id)
  }

  const handleAddProduct = async () => {
    if (!selectedCategoryId || !newProdTitle.trim()) return
    const { createProduct } = await import("../_lib/ticket-admin-actions")
    const prod = await createProduct(selectedCategoryId, { title: newProdTitle })
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
                  titleSr: prod.titleSr,
                  label: prod.label,
                  labelSr: prod.labelSr,
                  requiresIdentity: prod.requiresIdentity,
                  requiresPhoto: prod.requiresPhoto,
                  minPeople: prod.minPeople,
                  maxPeople: prod.maxPeople,
                  isSeasonPass: prod.isSeasonPass,
                  validityType: prod.validityType,
                  displayOrder: prod.displayOrder,
                  isActive: prod.isActive,
                  prices: [],
                },
              ],
            }
          : c
      )
    )
    setNewProdTitle("")
    setShowNewProd(false)
    setSelectedProductId(prod.id)
  }

  const handleDeleteCategory = async (id: string) => {
    const { deleteCategory } = await import("../_lib/ticket-admin-actions")
    await deleteCategory(id)
    setCategories((prev) => prev.filter((c) => c.id !== id))
    if (selectedCategoryId === id) {
      setSelectedCategoryId(null)
      setSelectedProductId(null)
    }
  }

  const handleDeleteProduct = async (id: string) => {
    const { deleteProduct } = await import("../_lib/ticket-admin-actions")
    await deleteProduct(id)
    setCategories((prev) =>
      prev.map((c) => ({
        ...c,
        products: c.products.filter((p) => p.id !== id),
      }))
    )
    if (selectedProductId === id) setSelectedProductId(null)
  }

  const handleAddPrice = async (productId: string) => {
    const { createPrice } = await import("../_lib/ticket-admin-actions")
    await createPrice(productId, { price: 0 })
    // Refresh categories to get the new price
    const { getTicketHierarchy } = await import("../_lib/ticket-admin-actions")
    const fresh = await getTicketHierarchy(facilityId)
    setCategories(fresh)
  }

  return (
    <div className="flex-1 min-h-0 flex overflow-hidden">
      {/* ─── Category Panel ─────────────────────────── */}
      <div
        className={cn(
          "lg:flex lg:w-56 lg:flex-col lg:shrink-0 lg:border-r lg:border-border/50",
          mobileView === "cats" ? "flex flex-col flex-1" : "hidden"
        )}
      >
        <div className="p-3 border-b border-border/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              Kategorije
            </span>
            <button
              onClick={() => setShowNewCat(!showNewCat)}
              className="w-6 h-6 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 flex items-center justify-center transition-all"
            >
              <Icon name="add" className="text-[14px]" />
            </button>
          </div>
          {showNewCat && (
            <div className="flex gap-1">
              <input
                value={newCatTitle}
                onChange={(e) => setNewCatTitle(e.target.value)}
                placeholder="Naziv kategorije..."
                className="flex-1 h-8 px-2 rounded-lg bg-muted/30 border border-border text-xs text-foreground outline-none focus:border-primary/40"
                onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
              />
              <Button size="sm" className="h-8 text-[10px] px-2" onClick={handleAddCategory}>
                +
              </Button>
            </div>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => { setSelectedCategoryId(cat.id); setMobileView("prods") }}
              className={cn(
                "w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between group",
                selectedCategoryId === cat.id
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/20 border border-transparent"
              )}
            >
              <span>📁 {cat.title}</span>
              <button
                onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat.id) }}
                className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
              >
                <Icon name="close" className="text-[10px]" />
              </button>
            </button>
          ))}
        </div>
      </div>

      {/* ─── Product Panel ──────────────────────────── */}
      <div
        className={cn(
          "lg:flex lg:w-64 lg:flex-col lg:shrink-0 lg:border-r lg:border-border/50",
          mobileView === "prods" ? "flex flex-col flex-1" : "hidden"
        )}
      >
        <div className="p-3 border-b border-border/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              {selectedCategory ? `${selectedCategory.title} → Tipovi` : "Tipovi"}
            </span>
            {selectedCategory && (
              <button
                onClick={() => setShowNewProd(!showNewProd)}
                className="w-6 h-6 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 flex items-center justify-center transition-all"
              >
                <Icon name="add" className="text-[14px]" />
              </button>
            )}
          </div>
          {showNewProd && selectedCategory && (
            <div className="flex gap-1">
              <input
                value={newProdTitle}
                onChange={(e) => setNewProdTitle(e.target.value)}
                placeholder="Naziv tipa..."
                className="flex-1 h-8 px-2 rounded-lg bg-muted/30 border border-border text-xs text-foreground outline-none focus:border-primary/40"
                onKeyDown={(e) => e.key === "Enter" && handleAddProduct()}
              />
              <Button size="sm" className="h-8 text-[10px] px-2" onClick={handleAddProduct}>
                +
              </Button>
            </div>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {!selectedCategory && (
            <p className="text-xs text-muted-foreground p-3 text-center">Izaberite kategoriju</p>
          )}
          {selectedCategory?.products.map((prod) => (
            <div
              key={prod.id}
              className={cn(
                "rounded-xl border p-3 transition-all cursor-pointer",
                selectedProductId === prod.id
                  ? "bg-primary/5 border-primary/30"
                  : "bg-muted/5 border-border hover:border-primary/20"
              )}
              onClick={() => { setSelectedProductId(prod.id); setMobileView("prices") }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold text-foreground">{prod.title}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteProduct(prod.id) }}
                  className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                >
                  <Icon name="close" className="text-[10px]" />
                </button>
              </div>
              <div className="flex flex-wrap gap-1">
                {prod.requiresPhoto && (
                  <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400">📸</span>
                )}
                {prod.requiresIdentity && (
                  <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400">🆔</span>
                )}
                <span className="text-[8px] font-bold text-muted-foreground">min:{prod.minPeople}</span>
                {prod.maxPeople && (
                  <span className="text-[8px] font-bold text-muted-foreground">max:{prod.maxPeople}</span>
                )}
              </div>
              <div className="text-[10px] text-muted-foreground mt-1">
                {prod.prices.length} cena/e
              </div>
            </div>
          ))}
          {selectedCategory && selectedCategory.products.length === 0 && !showNewProd && (
            <p className="text-xs text-muted-foreground p-3 text-center">
              Nema tipova. Dodajte prvi [+]
            </p>
          )}
        </div>
      </div>

      {/* ─── Price Panel ────────────────────────────── */}
      <div
        className={cn(
          "lg:flex lg:flex-col lg:flex-1 lg:min-w-0",
          mobileView === "prices" ? "flex flex-col flex-1" : "hidden"
        )}
      >
        <div className="p-3 border-b border-border/50 flex items-center justify-between">
          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
            {selectedProduct ? `${selectedProduct.title} → Cene` : "Cene"}
          </span>
          {selectedProduct && (
            <button
              onClick={() => handleAddPrice(selectedProduct.id)}
              className="h-7 px-3 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 flex items-center gap-1 text-[10px] font-bold transition-all"
            >
              <Icon name="add" className="text-[12px]" /> Varijacija
            </button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {!selectedProduct && (
            <p className="text-sm text-muted-foreground p-8 text-center">Izaberite kategoriju i tip da biste videli cene</p>
          )}
          {selectedProduct && selectedProduct.prices.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
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
                            : p
                        ),
                      }))
                    )
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile nav dots */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex lg:hidden gap-1.5 bg-background/80 backdrop-blur-md border border-border/50 px-3 py-2 rounded-full shadow-lg z-50">
        {(['cats', 'prods', 'prices'] as const).map((v, _i) => (
          <button
            key={v}
            onClick={() => setMobileView(v)}
            className={cn(
              "w-2 h-2 rounded-full transition-all",
              mobileView === v ? "bg-primary w-6" : "bg-muted-foreground/30"
            )}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Price Card ─────────────────────────────────────

function PriceCard({
  price,
  _product,
  facilityId,
  onDeleted,
}: {
  price: SerializedCategory["products"][number]["prices"][number]
  _product: SerializedCategory["products"][number]
  facilityId: string
  onDeleted: () => void
}) {
  const [editing, setEditing] = React.useState(false)
  const [form, setForm] = React.useState({
    label: price.label ?? "",
    labelSr: price.labelSr ?? "",
    price: price.price.toString(),
    originalPrice: price.originalPrice?.toString() ?? "",
    dayType: price.dayType ?? "ALL",
    timeSlot: price.timeSlot ?? "FULL_DAY",
  })

  const handleSave = async () => {
    const { updatePrice } = await import("../_lib/ticket-admin-actions")
    await updatePrice(price.id, {
      label: form.label || null,
      labelSr: form.labelSr || null,
      price: parseFloat(form.price) || 0,
      originalPrice: form.originalPrice ? parseFloat(form.originalPrice) : null,
      dayType: form.dayType,
      timeSlot: form.timeSlot,
    })
    // Reload
    const { getTicketHierarchy } = await import("../_lib/ticket-admin-actions")
    await getTicketHierarchy(facilityId)
    // Find and update
    setEditing(false)
  }

  const dayLabel = DAY_LABELS[form.dayType] ?? form.dayType
  const timeLabel = TIME_LABELS[form.timeSlot] ?? form.timeSlot

  return (
    <div className="rounded-xl border border-border bg-muted/5 p-4 hover:border-primary/20 transition-all">
      {editing ? (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Labela</label>
              <input value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                className="w-full h-8 px-2 rounded-lg bg-muted/20 border border-border text-xs outline-none focus:border-primary/40" />
            </div>
            <div>
              <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Labela (SR)</label>
              <input value={form.labelSr} onChange={(e) => setForm((f) => ({ ...f, labelSr: e.target.value }))}
                className="w-full h-8 px-2 rounded-lg bg-muted/20 border border-border text-xs outline-none focus:border-primary/40" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Cena (RSD)</label>
              <input value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                className="w-full h-8 px-2 rounded-lg bg-muted/20 border border-border text-xs outline-none focus:border-primary/40" type="number" />
            </div>
            <div>
              <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Originalna cena</label>
              <input value={form.originalPrice} onChange={(e) => setForm((f) => ({ ...f, originalPrice: e.target.value }))}
                className="w-full h-8 px-2 rounded-lg bg-muted/20 border border-border text-xs outline-none focus:border-primary/40" type="number" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Tip dana</label>
              <select value={form.dayType} onChange={(e) => setForm((f) => ({ ...f, dayType: e.target.value }))}
                className="w-full h-8 px-2 rounded-lg bg-muted/20 border border-border text-xs outline-none focus:border-primary/40">
                <option value="ALL">Svi dani</option>
                <option value="WEEKDAY">Radni dan</option>
                <option value="WEEKEND">Vikend</option>
              </select>
            </div>
            <div>
              <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Termin</label>
              <select value={form.timeSlot} onChange={(e) => setForm((f) => ({ ...f, timeSlot: e.target.value }))}
                className="w-full h-8 px-2 rounded-lg bg-muted/20 border border-border text-xs outline-none focus:border-primary/40">
                <option value="FULL_DAY">Ceo dan</option>
                <option value="AFTER_16H">Posle 16h</option>
                <option value="THREE_HOUR">3 sata</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button size="sm" variant="outline" className="h-8 text-[10px]" onClick={() => setEditing(false)}>
              Otkaži
            </Button>
            <Button size="sm" className="h-8 text-[10px]" onClick={handleSave}>
              Sačuvaj
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg font-black text-foreground">{price.price.toLocaleString("sr-RS")}</span>
              <span className="text-xs font-bold text-primary">RSD</span>
              {price.originalPrice && price.originalPrice > price.price && (
                <>
                  <span className="text-xs text-muted-foreground line-through ml-1">
                    {price.originalPrice.toLocaleString("sr-RS")} RSD
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-destructive/10 text-destructive">
                    -{Math.round((1 - price.price / price.originalPrice) * 100)}%
                  </span>
                </>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setEditing(true)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-all">
                <Icon name="edit" className="text-[12px]" />
              </button>
              <button onClick={async () => { const { deletePrice } = await import("../_lib/ticket-admin-actions"); await deletePrice(price.id); onDeleted() }}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all">
                <Icon name="delete" className="text-[12px]" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-1">
            {price.label && <span className="text-xs font-bold text-foreground/80">{price.label}</span>}
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-primary/5 text-primary">
              {dayLabel}
            </span>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-primary/5 text-primary">
              {timeLabel}
            </span>
          </div>
        </>
      )}
    </div>
  )
}
