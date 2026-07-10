"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

const COMMON_ICONS = [
  "explore",
  "waves",
  "auto_awesome",
  "local_fire_department",
  "business_center",
  "smartphone",
  "article",
  "login",
  "verified_user",
  "qr_code",
  "help",
  "help_outline",
  "rss_feed",
  "book",
  "newspaper",
  "star",
  "arrow_forward",
  "shopping_bag",
  "check_circle",
  "qr_code_scanner",
  "menu_book",
  "travel_explore",
  "pool",
  "water",
  "spa",
  "celebration",
  "confirmation_number",
  "discount",
  "percent",
  "flash_on",
  "whatshot",
  "favorite",
  "thumb_up",
  "info",
  "announcement",
  "campaign",
  "bolt",
  "rocket_launch",
  "diamond",
];

interface IconPickerProps {
  value?: string | null;
  onChange: (icon: string) => void;
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = COMMON_ICONS.filter((name) => name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        {value && (
          <div className="bg-muted/30 flex size-8 items-center justify-center rounded-md border">
            <Icon name={value} className="size-4" />
          </div>
        )}
        <Button type="button" onClick={() => setOpen(!open)} variant="outline" className="flex-1">
          {value ? (
            <span className="flex items-center gap-2">
              <Icon name={value} className="size-4" />
              {value}
            </span>
          ) : (
            "Izaberite ikonu..."
          )}
        </Button>
      </div>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="bg-popover absolute top-full left-0 z-50 mt-1 w-72 rounded-lg border p-3 shadow-lg">
            <Input
              placeholder="Pretraži ikone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mb-2 h-8 text-xs"
              autoFocus
            />
            <ScrollArea className="h-48">
              <div className="grid grid-cols-6 gap-1">
                {filtered.map((name) => (
                  <Button
                    key={name}
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      onChange(name);
                      setOpen(false);
                      setSearch("");
                    }}
                    className={`p-1.5 ${value === name ? "bg-accent ring-primary ring-1" : ""}`}
                    title={name}
                  >
                    <Icon name={name} className="size-4" />
                  </Button>
                ))}
                {filtered.length === 0 && (
                  <div className="text-muted-foreground col-span-6 py-4 text-center text-xs">
                    Nema rezultata
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </>
      )}
    </div>
  );
}
