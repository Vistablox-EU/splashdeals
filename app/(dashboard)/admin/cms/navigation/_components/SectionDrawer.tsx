"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createSectionAction,
  updateSectionAction,
  deleteSectionAction,
} from "@/app/(server)/actions/navigation";
import type { SectionWithItems } from "./types";

const STYLE_OPTIONS = [
  { value: "LINKS", label: "Linkovi (ikona + naziv + opis)" },
  { value: "DOT_LINKS", label: "Tačkasti linkovi (bez ikona)" },
  { value: "DYNAMIC_CITIES", label: "Dinamički gradovi (API)" },
  { value: "FOOTER_BADGE", label: "Footer bedž (tekst + ikona)" },
  { value: "VISUAL", label: "Vizuelni blok (skener / kartica)" },
] as const;

const COLUMN_OPTIONS = [
  { value: 0, label: "Kolona 0 (2fr)" },
  { value: 1, label: "Kolona 1 (1fr)" },
  { value: 2, label: "Kolona 2 (1fr)" },
];

interface SectionDrawerProps {
  menuId: string;
  section?: SectionWithItems | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function SectionDrawer({ menuId, section, open, onClose, onSaved }: SectionDrawerProps) {
  const router = useRouter();
  const [heading, setHeading] = useState(section?.heading || "");
  const [column, setColumn] = useState(section?.column ?? 0);
  const [style, setStyle] = useState(section?.style || "LINKS");
  const [saving, setSaving] = useState(false);

  // Reset on open
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => {
        setHeading(section?.heading || "");
        setColumn(section?.column ?? 0);
        setStyle(section?.style || "LINKS");
      });
    }
  }, [open, section]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const data = {
        menuId,
        heading: heading.trim() || null,
        column,
        style: style as "LINKS" | "DOT_LINKS" | "DYNAMIC_CITIES" | "FOOTER_BADGE" | "VISUAL",
        config: null,
        sortOrder: section?.sortOrder ?? 0,
        isActive: true,
      };

      if (section) {
        const result = await updateSectionAction(section.id, data);
        if (result.success) {
          toast.success("Sekcija ažurirana");
          onSaved();
          onClose();
        } else {
          toast.error(result.error || "Greška");
        }
      } else {
        const result = await createSectionAction(data);
        if (result.success) {
          toast.success("Sekcija kreirana");
          onSaved();
          onClose();
        } else {
          toast.error(result.error || "Greška");
        }
      }
    } finally {
      setSaving(false);
      router.refresh();
    }
  }, [menuId, section, heading, column, style, onClose, onSaved, router]);

  const handleDelete = useCallback(async () => {
    if (!section) return;
    if (!confirm(`Obrisati sekciju "${section.heading || style}"?`)) return;
    setSaving(true);
    try {
      const result = await deleteSectionAction(section.id);
      if (result.success) {
        toast.success("Sekcija obrisana");
        onSaved();
        onClose();
      } else {
        toast.error(result.error || "Greška");
      }
    } finally {
      setSaving(false);
      router.refresh();
    }
  }, [section, style, onClose, onSaved, router]);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />
      <div className="bg-background fixed inset-y-0 right-0 z-50 w-full max-w-md border-l p-6 shadow-lg">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{section ? "Uredi sekciju" : "Nova sekcija"}</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <Icon name="close" className="size-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Naslov (opcionalno)</Label>
            <Input
              value={heading}
              onChange={(e) => setHeading(e.target.value)}
              placeholder="Kategorije"
            />
          </div>

          <div className="space-y-2">
            <Label>Kolona</Label>
            <Select value={String(column)} onValueChange={(v) => setColumn(Number(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COLUMN_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={String(opt.value)}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Stil prikaza</Label>
            <Select value={style} onValueChange={setStyle}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STYLE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-8 flex items-center gap-3">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Čuvanje..." : section ? "Sačuvaj" : "Kreiraj"}
          </Button>
          {section && (
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              Obriši
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            Odustani
          </Button>
        </div>
      </div>
    </>
  );
}
