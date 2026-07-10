"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IconPicker } from "./IconPicker";
import {
  createMenuAction,
  updateMenuAction,
  deleteMenuAction,
} from "@/app/(server)/actions/navigation";
import type { MenuWithSections } from "./types";

interface MenuDrawerProps {
  menu?: MenuWithSections | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function MenuDrawer({ menu, open, onClose, onSaved }: MenuDrawerProps) {
  const router = useRouter();
  const [label, setLabel] = useState(menu?.label || "");
  const [icon, setIcon] = useState(menu?.icon || "menu_book");
  const [saving, setSaving] = useState(false);

  // Reset form when menu changes
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => {
        setLabel(menu?.label || "");
        setIcon(menu?.icon || "menu_book");
      });
    }
  }, [open, menu]);

  const handleSave = useCallback(async () => {
    if (!label.trim()) return;
    setSaving(true);
    try {
      if (menu) {
        const result = await updateMenuAction(menu.id, { label: label.trim(), icon });
        if (result.success) {
          toast.success("Meni ažuriran");
          onSaved();
          onClose();
        } else {
          toast.error(result.error || "Greška");
        }
      } else {
        const result = await createMenuAction({
          label: label.trim(),
          icon,
          sortOrder: 0,
          isActive: true,
        });
        if (result.success) {
          toast.success("Meni kreiran");
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
  }, [menu, label, icon, onClose, onSaved, router]);

  const handleDelete = useCallback(async () => {
    if (!menu) return;
    if (!confirm(`Da li ste sigurni da želite da obrišete meni "${menu.label}"?`)) return;
    setSaving(true);
    try {
      const result = await deleteMenuAction(menu.id);
      if (result.success) {
        toast.success("Meni obrisan");
        onSaved();
        onClose();
      } else {
        toast.error(result.error || "Greška");
      }
    } finally {
      setSaving(false);
      router.refresh();
    }
  }, [menu, onClose, onSaved, router]);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />
      <div className="bg-background fixed inset-y-0 right-0 z-50 w-full max-w-md border-l p-6 shadow-lg">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{menu ? "Uredi meni" : "Novi meni"}</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <Icon name="close" className="size-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Naziv</Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Istraži" />
          </div>

          <div className="space-y-2">
            <Label>Ikona</Label>
            <IconPicker value={icon} onChange={setIcon} />
          </div>
        </div>

        <div className="mt-8 flex items-center gap-3">
          <Button onClick={handleSave} disabled={saving || !label.trim()}>
            {saving ? "Čuvanje..." : menu ? "Sačuvaj" : "Kreiraj"}
          </Button>
          {menu && (
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
