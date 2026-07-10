"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IconPicker } from "./IconPicker";
import {
  createItemAction,
  updateItemAction,
  deleteItemAction,
} from "@/app/(server)/actions/navigation";
import type { NavigationMenuItem, LinkMetadata } from "./types";

interface ItemDrawerProps {
  sectionId: string;
  item?: NavigationMenuItem | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const BADGE_OPTIONS = [
  { value: "", label: "Bez bedža" },
  { value: "new", label: "Novo" },
  { value: "sale", label: "Akcija" },
  { value: "popular", label: "Popularno" },
  { value: "soon", label: "Uskoro" },
  { value: "custom", label: "Prilagođeno..." },
] as const;

const VARIANT_OPTIONS = [
  { value: "default", label: "Podrazumevani" },
  { value: "featured", label: "Istaknuti" },
  { value: "cta", label: "Poziv na akciju" },
] as const;

export function ItemDrawer({ sectionId, item, open, onClose, onSaved }: ItemDrawerProps) {
  const router = useRouter();

  // Basic fields
  const [label, setLabel] = useState(item?.label || "");
  const [href, setHref] = useState(item?.href || "");
  const [icon, setIcon] = useState(item?.icon || "");
  const [desc, setDesc] = useState(item?.desc || "");

  // Rich metadata
  const [badgeType, setBadgeType] = useState("");
  const [badgeText, setBadgeText] = useState("");
  const [price, setPrice] = useState("");
  const [variant, setVariant] = useState("default");
  const [imageUrl, setImageUrl] = useState("");
  const [count, setCount] = useState(0);
  const [accentColor, setAccentColor] = useState("");
  const [external, setExternal] = useState(false);

  const [saving, setSaving] = useState(false);

  // Initialise from item metadata when opening
  useEffect(() => {
    if (open && item) {
      requestAnimationFrame(() => {
        setLabel(item.label);
        setHref(item.href || "");
        setIcon(item.icon || "");
        setDesc(item.desc || "");

        const md = (item.metadata as LinkMetadata | null) || {};
        setBadgeType(md.badge?.type || "");
        setBadgeText(md.badge?.text || "");
        setPrice(md.price || "");
        setVariant(md.variant || "default");
        setImageUrl(md.imageUrl || "");
        setCount(md.count || 0);
        setAccentColor(md.accentColor || "");
        setExternal(md.external || false);
      });
    } else if (open && !item) {
      requestAnimationFrame(() => {
        setLabel("");
        setHref("");
        setIcon("");
        setDesc("");
        setBadgeType("");
        setBadgeText("");
        setPrice("");
        setVariant("default");
        setImageUrl("");
        setCount(0);
        setAccentColor("");
        setExternal(false);
      });
    }
  }, [open, item]);

  const buildMetadata = useCallback((): LinkMetadata | null => {
    const hasRich =
      badgeType ||
      price ||
      variant !== "default" ||
      imageUrl ||
      count > 0 ||
      accentColor ||
      external;
    if (!hasRich) return null;

    const badge = badgeType
      ? {
          type: badgeType as "new" | "sale" | "popular" | "soon" | "custom",
          ...(badgeType === "custom" ? { text: badgeText } : {}),
        }
      : undefined;

    return {
      ...(badge ? { badge } : {}),
      ...(price ? { price } : {}),
      ...(variant !== "default" ? { variant: variant as "featured" | "cta" } : {}),
      ...(imageUrl ? { imageUrl } : {}),
      ...(count > 0 ? { count } : {}),
      ...(accentColor ? { accentColor } : {}),
      ...(external ? { external: true } : {}),
    };
  }, [badgeType, badgeText, price, variant, imageUrl, count, accentColor, external]);

  const handleSave = useCallback(async () => {
    if (!label.trim()) return;
    setSaving(true);
    try {
      const data = {
        sectionId,
        label: label.trim(),
        href: href.trim() || null,
        icon: icon || null,
        desc: desc.trim() || null,
        metadata: buildMetadata(),
        sortOrder: item?.sortOrder ?? 0,
        isActive: true,
      };

      if (item) {
        const result = await updateItemAction(item.id, data);
        if (result.success) {
          toast.success("Stavka ažurirana");
          onSaved();
          onClose();
        } else {
          toast.error(result.error || "Greška");
        }
      } else {
        const result = await createItemAction(data);
        if (result.success) {
          toast.success("Stavka kreirana");
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
  }, [item, sectionId, label, href, icon, desc, buildMetadata, onClose, onSaved, router]);

  const handleDelete = useCallback(async () => {
    if (!item) return;
    if (!confirm(`Obrisati "${item.label}"?`)) return;
    setSaving(true);
    try {
      const result = await deleteItemAction(item.id);
      if (result.success) {
        toast.success("Stavka obrisana");
        onSaved();
        onClose();
      } else {
        toast.error(result.error || "Greška");
      }
    } finally {
      setSaving(false);
      router.refresh();
    }
  }, [item, onClose, onSaved, router]);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />
      <div className="bg-background fixed inset-y-0 right-0 z-50 w-full max-w-lg overflow-y-auto border-l shadow-lg">
        <div className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold">{item ? "Uredi stavku" : "Nova stavka"}</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <Icon name="close" className="size-4" />
            </Button>
          </div>

          <Tabs defaultValue="basic">
            <TabsList className="mb-4">
              <TabsTrigger value="basic">Osnovno</TabsTrigger>
              <TabsTrigger value="rich">Bogati sadržaj</TabsTrigger>
            </TabsList>

            {/* ─── Basic Tab ─────────────────── */}
            <TabsContent value="basic" className="space-y-4">
              <div className="space-y-2">
                <Label>Naziv *</Label>
                <Input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Akva Parkovi"
                />
              </div>
              <div className="space-y-2">
                <Label>Link (URL)</Label>
                <Input
                  value={href}
                  onChange={(e) => setHref(e.target.value)}
                  placeholder="/facilities/waterpark"
                />
              </div>
              <div className="space-y-2">
                <Label>Ikona</Label>
                <IconPicker value={icon} onChange={setIcon} />
              </div>
              <div className="space-y-2">
                <Label>Opis</Label>
                <Textarea
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Kratak opis stavke"
                  rows={2}
                />
              </div>
            </TabsContent>

            {/* ─── Rich Tab ──────────────────── */}
            <TabsContent value="rich" className="space-y-5">
              {/* Badge */}
              <div className="space-y-2">
                <Label>Bedž</Label>
                <Select value={badgeType} onValueChange={setBadgeType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Bez bedža" />
                  </SelectTrigger>
                  <SelectContent>
                    {BADGE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {badgeType === "custom" && (
                  <Input
                    value={badgeText}
                    onChange={(e) => setBadgeText(e.target.value)}
                    placeholder="Tekst bedža"
                    className="mt-2"
                  />
                )}
              </div>

              {/* Price */}
              <div className="space-y-2">
                <Label>Cena (prikaz ispod naziva)</Label>
                <Input
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="od 1500 RSD"
                />
              </div>

              {/* Variant */}
              <div className="space-y-2">
                <Label>Izgled stavke</Label>
                <Select value={variant} onValueChange={setVariant}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VARIANT_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Thumbnail */}
              <div className="space-y-2">
                <Label>Slika (URL)</Label>
                <Input
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>

              {/* Count */}
              <div className="space-y-2">
                <Label>Brojčani bedž</Label>
                <Input
                  type="number"
                  min={0}
                  value={count || ""}
                  onChange={(e) => setCount(parseInt(e.target.value) || 0)}
                  placeholder="0"
                  className="w-24"
                />
              </div>

              {/* Accent color */}
              <div className="space-y-2">
                <Label>Akcent boja</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={accentColor || "#06b6d4"}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="h-9 w-12 cursor-pointer rounded-md border bg-transparent p-1"
                  />
                  <Input
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    placeholder="#06b6d4"
                    className="flex-1"
                  />
                </div>
              </div>

              {/* External link */}
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label className="text-sm font-medium">Eksterni link</Label>
                  <p className="text-muted-foreground text-xs">Otvara se u novom tabu (↗)</p>
                </div>
                <Switch checked={external} onCheckedChange={setExternal} />
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-8 flex items-center gap-3 border-t pt-4">
            <Button onClick={handleSave} disabled={saving || !label.trim()}>
              {saving ? "Čuvanje..." : item ? "Sačuvaj" : "Dodaj"}
            </Button>
            {item && (
              <Button variant="destructive" onClick={handleDelete} disabled={saving}>
                Obriši
              </Button>
            )}
            <Button variant="outline" onClick={onClose}>
              Odustani
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
