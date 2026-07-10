"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/Icon";
import type { SerializedCategory } from "../_lib/ticket-admin-actions";
import { updatePrice, getTicketHierarchy, deletePrice } from "../_lib/ticket-admin-actions";

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

interface PriceCardProps {
  price: SerializedCategory["products"][number]["prices"][number];
  _product: SerializedCategory["products"][number];
  facilityId: string;
  onDeleted: () => void;
}

export function PriceCard({ price, _product, facilityId, onDeleted }: PriceCardProps) {
  const [editing, setEditing] = React.useState(false);
  const [form, setForm] = React.useState({
    label: price.label ?? "",
    price: price.price.toString(),
    originalPrice: price.originalPrice?.toString() ?? "",
    dayType: price.dayType ?? "ALL",
    timeSlot: price.timeSlot ?? "FULL_DAY",
  });

  const handleSave = async () => {
    const { updatePrice } = await import("../_lib/ticket-admin-actions");
    await updatePrice(price.id, facilityId, {
      label: form.label || null,
      price: parseFloat(form.price) || 0,
      originalPrice: form.originalPrice ? parseFloat(form.originalPrice) : null,
      dayType: form.dayType,
      timeSlot: form.timeSlot,
    });
    // Reload
    await getTicketHierarchy(facilityId);
    // Find and update
    setEditing(false);
  };

  const dayLabel = DAY_LABELS[form.dayType] ?? form.dayType;
  const timeLabel = TIME_LABELS[form.timeSlot] ?? form.timeSlot;

  return (
    <div className="border-border bg-muted/5 hover:border-primary/20 rounded-xl border p-4 transition-all">
      {editing ? (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-muted-foreground text-[9px] font-bold tracking-wider uppercase">
                Labela
              </label>
              <input
                value={form.label}
                onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                className="bg-muted/20 border-border focus:border-primary/40 h-8 w-full rounded-lg border px-2 text-xs outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-muted-foreground text-[9px] font-bold tracking-wider uppercase">
                Cena (RSD)
              </label>
              <input
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                className="bg-muted/20 border-border focus:border-primary/40 h-8 w-full rounded-lg border px-2 text-xs outline-none"
                type="number"
              />
            </div>
            <div>
              <label className="text-muted-foreground text-[9px] font-bold tracking-wider uppercase">
                Originalna cena
              </label>
              <input
                value={form.originalPrice}
                onChange={(e) => setForm((f) => ({ ...f, originalPrice: e.target.value }))}
                className="bg-muted/20 border-border focus:border-primary/40 h-8 w-full rounded-lg border px-2 text-xs outline-none"
                type="number"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-muted-foreground text-[9px] font-bold tracking-wider uppercase">
                Tip dana
              </label>
              <select
                value={form.dayType}
                onChange={(e) => setForm((f) => ({ ...f, dayType: e.target.value }))}
                className="bg-muted/20 border-border focus:border-primary/40 h-8 w-full rounded-lg border px-2 text-xs outline-none"
              >
                <option value="ALL">Svi dani</option>
                <option value="WEEKDAY">Radni dan</option>
                <option value="WEEKEND">Vikend</option>
              </select>
            </div>
            <div>
              <label className="text-muted-foreground text-[9px] font-bold tracking-wider uppercase">
                Termin
              </label>
              <select
                value={form.timeSlot}
                onChange={(e) => setForm((f) => ({ ...f, timeSlot: e.target.value }))}
                className="bg-muted/20 border-border focus:border-primary/40 h-8 w-full rounded-lg border px-2 text-xs outline-none"
              >
                <option value="FULL_DAY">Ceo dan</option>
                <option value="AFTER_16H">Posle 16h</option>
                <option value="THREE_HOUR">3 sata</option>
              </select>
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
              <button
                onClick={() => setEditing(true)}
                className="text-muted-foreground hover:text-foreground hover:bg-muted/20 flex h-7 w-7 items-center justify-center rounded-lg transition-all"
              >
                <Icon name="edit" className="text-[12px]" />
              </button>
              <button
                onClick={async () => {
                  const { deletePrice } = await import("../_lib/ticket-admin-actions");
                  await deletePrice(price.id, facilityId);
                  onDeleted();
                }}
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex h-7 w-7 items-center justify-center rounded-lg transition-all"
              >
                <Icon name="delete" className="text-[12px]" />
              </button>
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
    </div>
  );
}
