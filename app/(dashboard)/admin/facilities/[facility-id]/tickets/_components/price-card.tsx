"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Icon } from "@/components/ui/Icon";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { SerializedCategory } from "../_lib/ticket-admin-actions";
import { updatePrice, deletePrice } from "../_lib/ticket-admin-actions";
import { DAY_LABELS, TIME_LABELS } from "../_lib/constants";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface PriceCardProps {
  price: SerializedCategory["products"][number]["prices"][number];
  product: SerializedCategory["products"][number];
  facilityId: string;
  onDeleted: () => void;
  onSaved: (next: SerializedCategory["products"][number]["prices"][number]) => void;
}

export function PriceCard({ price, facilityId, onDeleted, onSaved }: PriceCardProps) {
  const [editing, setEditing] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [form, setForm] = React.useState({
    label: price.label ?? "",
    price: price.price.toString(),
    originalPrice: price.originalPrice?.toString() ?? "",
    dayType: price.dayType ?? "ALL",
    timeSlot: price.timeSlot ?? "FULL_DAY",
  });

  const handleSave = async () => {
    const parsedPrice = parseFloat(form.price);
    const parsedOriginal = form.originalPrice ? parseFloat(form.originalPrice) : null;
    if (isNaN(parsedPrice) || parsedPrice < 0) return;
    if (parsedOriginal !== null && (isNaN(parsedOriginal) || parsedOriginal < 0)) return;
    try {
      await updatePrice(price.id, facilityId, {
        label: form.label || null,
        price: parsedPrice,
        originalPrice: parsedOriginal,
        dayType: form.dayType,
        timeSlot: form.timeSlot,
      });
      onSaved({
        ...price,
        label: form.label || null,
        price: parsedPrice,
        originalPrice: parsedOriginal,
        dayType: form.dayType,
        timeSlot: form.timeSlot,
      });
      setEditing(false);
      toast.success("Cena sačuvana");
    } catch {
      toast.error("Greška pri čuvanju cene");
    }
  };

  const dayLabel = DAY_LABELS[form.dayType] ?? form.dayType;
  const timeLabel = TIME_LABELS[form.timeSlot] ?? form.timeSlot;

  return (
    <div className="border-border bg-muted/5 hover:border-primary/20 rounded-xl border p-4 transition-colors">
      {editing ? (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-muted-foreground text-[9px] font-bold tracking-wider uppercase">
                Labela
              </label>
              <Input
                value={form.label}
                onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                className="bg-muted/20 border-border focus-visible:border-primary/40 focus-visible:ring-primary/30 h-8 w-full rounded-lg border px-2 text-xs focus-visible:ring-2"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-muted-foreground text-[9px] font-bold tracking-wider uppercase">
                Cena (RSD)
              </label>
              <Input
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                className="bg-muted/20 border-border focus-visible:border-primary/40 focus-visible:ring-primary/30 h-8 w-full rounded-lg border px-2 text-xs focus-visible:ring-2"
                type="number"
                min="0"
              />
            </div>
            <div>
              <label className="text-muted-foreground text-[9px] font-bold tracking-wider uppercase">
                Originalna cena
              </label>
              <Input
                value={form.originalPrice}
                onChange={(e) => setForm((f) => ({ ...f, originalPrice: e.target.value }))}
                className="bg-muted/20 border-border focus-visible:border-primary/40 focus-visible:ring-primary/30 h-8 w-full rounded-lg border px-2 text-xs focus-visible:ring-2"
                type="number"
                min="0"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-muted-foreground text-[9px] font-bold tracking-wider uppercase">
                Tip dana
              </label>
              <Select
                value={form.dayType}
                onValueChange={(val) => setForm((f) => ({ ...f, dayType: val }))}
              >
                <SelectTrigger className="bg-muted/20 border-border focus-visible:border-primary/40 focus-visible:ring-primary/30 h-8 w-full rounded-lg border px-2 text-xs focus-visible:ring-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border-border">
                  <SelectItem value="ALL" className="text-xs">
                    Svi dani
                  </SelectItem>
                  <SelectItem value="WEEKDAY" className="text-xs">
                    Radni dan
                  </SelectItem>
                  <SelectItem value="WEEKEND" className="text-xs">
                    Vikend
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-muted-foreground text-[9px] font-bold tracking-wider uppercase">
                Termin
              </label>
              <Select
                value={form.timeSlot}
                onValueChange={(val) => setForm((f) => ({ ...f, timeSlot: val }))}
              >
                <SelectTrigger className="bg-muted/20 border-border focus-visible:border-primary/40 focus-visible:ring-primary/30 h-8 w-full rounded-lg border px-2 text-xs focus-visible:ring-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border-border">
                  <SelectItem value="FULL_DAY" className="text-xs">
                    Ceo dan
                  </SelectItem>
                  <SelectItem value="AFTER_16H" className="text-xs">
                    Posle 16h
                  </SelectItem>
                  <SelectItem value="THREE_HOUR" className="text-xs">
                    3 sata
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-[10px]"
              onClick={() => setEditing(false)}
            >
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
              <span className="text-foreground text-lg font-black">
                {price.price.toLocaleString("sr-RS")}
              </span>
              <span className="text-primary text-xs font-bold">RSD</span>
              {price.originalPrice && price.originalPrice > price.price && (
                <>
                  <span className="text-muted-foreground ml-1 text-xs line-through">
                    {price.originalPrice.toLocaleString("sr-RS")} RSD
                  </span>
                  <span className="bg-destructive/10 text-destructive rounded px-1.5 py-0.5 text-[9px] font-bold">
                    -{Math.round((1 - price.price / price.originalPrice) * 100)}%
                  </span>
                </>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEditing(true)}
                className="text-muted-foreground hover:text-foreground hover:bg-muted/20 h-7 w-7 rounded-lg transition-colors"
                aria-label="Izmeni cenu"
              >
                <Icon name="edit" className="text-[12px]" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-7 w-7 rounded-lg transition-colors"
                aria-label="Obriši cenu"
              >
                <Icon name="delete" className="text-[12px]" />
              </Button>
            </div>
          </div>
          <div className="mt-1 flex items-center gap-2">
            {price.label && (
              <span className="text-foreground/80 text-xs font-bold">{price.label}</span>
            )}
            <span className="bg-primary/5 text-primary rounded-full px-2 py-0.5 text-[9px] font-bold">
              {dayLabel}
            </span>
            <span className="bg-primary/5 text-primary rounded-full px-2 py-0.5 text-[9px] font-bold">
              {timeLabel}
            </span>
          </div>
        </>
      )}

      {/* ─── Delete Confirmation Dialog ──────────────────── */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Obriši cenu</DialogTitle>
            <DialogDescription>
              Da li ste sigurni da želite da obrišete ovu cenu od{" "}
              {price.price.toLocaleString("sr-RS")} RSD? Ova radnja je nepovratna.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Otkaži
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                await deletePrice(price.id, facilityId);
                setShowDeleteConfirm(false);
                toast.success("Cena obrisana", {
                  description: `Cena od ${price.price.toLocaleString("sr-RS")} RSD je uspešno obrisana.`,
                  duration: 2000,
                });
                onDeleted();
              }}
            >
              Obriši
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
