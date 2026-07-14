"use client";
import { Icon } from "@/components/ui/Icon";

import * as React from "react";
import { useTransition, useState, useDeferredValue } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import {
  updateFacilityAmenitiesAction,
  deleteGlobalAmenityAction,
} from "@/app/(server)/actions/amenity-actions";

// 🎨 Icon Resolver for premium, curated visual styling
const AMENITY_MATERIAL_ICON_MAP: Record<string, string> = {
  Waves: "waves",
  Droplets: "water_drop",
  Sun: "wb_sunny",
  Flame: "local_fire_department",
  ShieldAlert: "verified_user",
  Clock: "schedule",
  Utensils: "restaurant",
  Wifi: "wifi",
  Coffee: "local_cafe",
  Wind: "air",
  wind: "air",
  Car: "directions_car",
  car: "directions_car",
};

function AmenityIcon({ iconName, className }: { iconName: string; className?: string }) {
  const symbol = AMENITY_MATERIAL_ICON_MAP[iconName] || "circle";
  return <Icon name={symbol} className={className} />;
}

interface AmenityItem {
  id: string;
  name: string;
  icon: string;
  category: string;
  type: "BOOLEAN" | "QUANTIFIABLE" | "TEXT";
  checked: boolean;
  value: string;
  isFeatured: boolean;
  isSeeded: boolean;
  displayOrder: number;
}

interface CompactAmenitiesTableProps {
  facilityId: string;
  allAmenities: Array<{
    id: string;
    name: string;
    icon: string;
    category: string | null;
    isSeeded: boolean;
    type: "BOOLEAN" | "QUANTIFIABLE" | "TEXT";
  }>;
  initialFacilityAmenities: Array<{
    facilityId: string;
    amenityId: string;
    value: string | null;
    imageUrl: string | null;
    displayOrder: number;
    isActive: boolean;
    isFeatured: boolean;
    scheduledAt: Date | null;
  }>;
}

export function CompactAmenitiesTable({
  facilityId,
  allAmenities,
  initialFacilityAmenities,
}: CompactAmenitiesTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // 🔍 Search & Filtering States
  const [searchQuery, setSearchQuery] = useState("");
  const deferredQuery = useDeferredValue(searchQuery);

  // 📋 Core Amenities State mapping
  const [items, setItems] = useState<AmenityItem[]>(() => {
    return allAmenities
      .map((a) => {
        const existing = initialFacilityAmenities.find((fa) => fa.amenityId === a.id);
        return {
          id: a.id,
          name: a.name,
          icon: a.icon,
          category: a.category || "General Features",
          type: a.type,
          checked: !!existing && existing.isActive,
          value: existing?.value || "",
          isFeatured: existing?.isFeatured || false,
          isSeeded: a.isSeeded,
          displayOrder: existing?.displayOrder ?? 999,
        };
      })
      .sort((a, b) => {
        // Show checked first, then alphabetical or display order
        if (a.checked !== b.checked) return a.checked ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
  });

  // 📝 New Amenity Row States
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [newRow, setNewRow] = useState({
    name: "",
    type: "BOOLEAN" as "BOOLEAN" | "QUANTIFIABLE" | "TEXT",
    category: "General Features",
    icon: "CircleDot",
  });
  const [isCreating, setIsCreating] = useState(false);

  // 🟡 Dirty tracking — items with unsaved local changes
  const [dirtyIds, setDirtyIds] = useState<Set<string>>(new Set());
  const [isBatchSaving, setIsBatchSaving] = useState(false);

  // 🔄 Mark item as dirty (local change, not yet persisted)
  const markDirty = (id: string) => {
    setDirtyIds((prev) => new Set(prev).add(id));
  };

  // 💾 Batch save all dirty changes
  const handleBatchSave = async () => {
    if (dirtyIds.size === 0) return;
    setIsBatchSaving(true);
    const dirtyItems = items.filter((i) => dirtyIds.has(i.id));
    const payload = dirtyItems.map((item) => ({
      amenityId: item.id,
      checked: item.checked,
      value: item.value,
      isFeatured: item.isFeatured,
      displayOrder: item.displayOrder,
      name: item.name,
      icon: item.icon,
      type: item.type,
    }));

    try {
      const result = await updateFacilityAmenitiesAction(facilityId, payload);
      if (result && !result.success) {
        throw new Error("Batch save rejected");
      }
      setDirtyIds(new Set());
      toast.success("Promene sačuvane", {
        description: `${payload.length} izmena je sačuvano za amenitije.`,
        duration: 2000,
      });
      router.refresh();
    } catch (error) {
      console.error("Failed to batch save amenities", error);
      toast.error("Greška pri čuvanju", {
        description: "Došlo je do greške prilikom čuvanja promena.",
      });
    } finally {
      setIsBatchSaving(false);
    }
  };

  // 🖱️ Event Handlers
  const handleToggleActive = (id: string, checked: boolean) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, checked } : item)));
    markDirty(id);
  };

  const handleToggleFeatured = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isFeatured: !item.isFeatured } : item)),
    );
    markDirty(id);
  };

  const handleValueChange = (id: string, value: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return { ...item, value };
        }
        return item;
      }),
    );
  };

  const handleValueBlur = (id: string) => {
    markDirty(id);
  };

  const handleValueKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.currentTarget.blur();
    }
  };

  // 🗑️ Delete Custom Amenity
  const handleDeleteCustom = async (id: string, name: string) => {
    setDeleteTarget({ id, name });
  };

  const confirmDeleteCustom = async () => {
    if (!deleteTarget) return;
    const { id, name } = deleteTarget;
    setDeleteTarget(null);

    startTransition(async () => {
      try {
        const res = await deleteGlobalAmenityAction(id, facilityId);
        if (res && res.success) {
          setItems((prev) => prev.filter((item) => item.id !== id));
          toast.success("Amenity Deleted", {
            description: `Permanently removed ${name} from registry.`,
          });
          router.refresh();
        } else {
          throw new Error("Failed to delete custom amenity");
        }
      } catch (error) {
        console.error("Failed to save amenities", error);
        toast.error("Deletion Rejected", {
          description: "This custom asset is still tied to operational dependencies.",
        });
      }
    });
  };

  // ➕ Inline Ingest / Row Creation
  const handleCreateAmenity = async () => {
    if (!newRow.name.trim()) {
      toast.error("Validation Error", { description: "Name is required to register an asset." });
      return;
    }

    setIsCreating(true);
    try {
      const tempId = crypto.randomUUID();
      const payload = [
        {
          amenityId: tempId,
          checked: true,
          value: "",
          displayOrder: items.length,
          isFeatured: false,
          isNew: true,
          name: newRow.name.trim(),
          category: newRow.category,
          icon: newRow.icon,
          type: newRow.type,
        },
      ];

      const result = await updateFacilityAmenitiesAction(facilityId, payload);

      if (result && result.success) {
        toast.success("Asset Created & Registered", {
          description: `Custom infrastructure "${newRow.name}" is now live.`,
        });

        // Refresh local state lists gracefully
        const newItem: AmenityItem = {
          id: tempId,
          name: newRow.name.trim(),
          icon: newRow.icon,
          category: newRow.category,
          type: newRow.type,
          checked: true,
          value: "",
          isFeatured: false,
          isSeeded: false,
          displayOrder: items.length,
        };

        setItems((prev) => [newItem, ...prev]);
        setNewRow({
          name: "",
          type: "BOOLEAN",
          category: "General Features",
          icon: "CircleDot",
        });
        router.refresh();
      } else {
        throw new Error("API rejection");
      }
    } catch (error) {
      console.error("Failed to save amenities", error);
      toast.error("Registration Failed", {
        description: "Verify name uniqueness and schema limits.",
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Filter items matching search
  const filteredItems = items.filter((item) => {
    const term = deferredQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(term) ||
      item.category.toLowerCase().includes(term) ||
      item.type.toLowerCase().includes(term)
    );
  });

  return (
    <TooltipProvider>
      <div className="border-border/50 bg-muted/40 relative space-y-6 overflow-hidden rounded-2xl border p-6 shadow-2xl backdrop-blur-xl">
        {/* Table Action Controls */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="relative max-w-md flex-1">
            <Icon
              name="search"
              className="text-muted-foreground absolute top-1/2 left-3.5 -translate-y-1/2 text-[16px]"
            />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search facility infrastructure, slides, features..."
              className="bg-background/40 border-border/50 text-foreground/80 focus-visible:ring-primary h-10 rounded-xl pl-10"
            />
          </div>

          {dirtyIds.size > 0 ? (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground shrink-0 text-[10px] font-bold tracking-widest uppercase">
                {dirtyIds.size} izmena
              </span>
              <Button
                onClick={handleBatchSave}
                disabled={isBatchSaving}
                className="flex h-10 shrink-0 items-center gap-1.5 rounded-xl px-4 text-xs font-black tracking-widest uppercase"
              >
                {isBatchSaving ? (
                  <Icon name="progress_activity" className="animate-spin text-[14px]" />
                ) : (
                  <Icon name="save" className="text-[14px]" />
                )}
                <span>Sačuvaj</span>
              </Button>
            </div>
          ) : isPending ? (
            <div className="text-primary bg-primary/10 border-primary/20 flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold tracking-widest uppercase">
              <Icon name="progress_activity" className="animate-spin text-[14px]" />
              Synchronizing...
            </div>
          ) : null}
        </div>

        {/* Grid Container */}
        <div className="border-border/50 bg-background/20 no-scrollbar max-h-[500px] overflow-x-auto overflow-y-auto rounded-xl border">
          <Table>
            <TableHeader className="bg-background/80 border-border/50 sticky top-0 z-10 border-b backdrop-blur-md">
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="text-muted-foreground w-[80px] text-[10px] font-black tracking-widest uppercase">
                  Active
                </TableHead>
                <TableHead className="text-muted-foreground text-[10px] font-black tracking-widest uppercase">
                  Infrastructure Asset
                </TableHead>
                <TableHead className="text-muted-foreground w-[120px] text-[10px] font-black tracking-widest uppercase">
                  Type
                </TableHead>
                <TableHead className="text-muted-foreground w-[200px] text-[10px] font-black tracking-widest uppercase">
                  Operational Value
                </TableHead>
                <TableHead className="text-muted-foreground w-[80px] text-center text-[10px] font-black tracking-widest uppercase">
                  Featured
                </TableHead>
                <TableHead className="text-muted-foreground w-[80px] text-right text-[10px] font-black tracking-widest uppercase">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <TableRow
                    key={item.id}
                    className="hover:bg-muted/10 border-border/50 group transition-colors"
                  >
                    {/* Toggle Switch */}
                    <TableCell>
                      <Switch
                        checked={item.checked}
                        onCheckedChange={(val) => handleToggleActive(item.id, val)}
                        className="data-[state=checked]:bg-primary cursor-pointer"
                        aria-label="Toggle amenity active"
                      />
                    </TableCell>

                    {/* Amenity Name with Icon Dynamic Resolver */}
                    <TableCell className="text-foreground/90 font-medium">
                      <div className="flex items-center gap-3">
                        <div className="bg-muted/30 border-border text-primary flex size-7 shrink-0 items-center justify-center rounded-lg border">
                          <AmenityIcon iconName={item.icon} className="text-[14px]" />
                        </div>
                        <div className="flex min-w-0 flex-col">
                          <span className="truncate text-xs font-bold">{item.name}</span>
                          <span className="text-muted-foreground truncate text-[9px] tracking-widest uppercase">
                            {item.category}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Value Type Badge */}
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="border-border text-muted-foreground py-0.5 text-[9px] font-black tracking-widest uppercase"
                      >
                        {item.type}
                      </Badge>
                    </TableCell>

                    {/* Inline Value Form Editing */}
                    <TableCell>
                      {item.checked && (item.type === "QUANTIFIABLE" || item.type === "TEXT") ? (
                        <Input
                          value={item.value}
                          onChange={(e) => handleValueChange(item.id, e.target.value)}
                          onBlur={() => handleValueBlur(item.id)}
                          onKeyDown={(e) => handleValueKeyDown(e)}
                          placeholder={
                            item.type === "QUANTIFIABLE"
                              ? "e.g. 5 slides"
                              : "e.g. Wi-Fi speed, extra details"
                          }
                          className="bg-background/40 border-border/50 text-foreground/90 focus-visible:ring-primary h-8 max-w-[180px] rounded-lg text-xs"
                          aria-label={`${item.name} value`}
                        />
                      ) : item.checked ? (
                        <div className="text-primary flex items-center gap-1.5 text-xs font-bold">
                          <Icon name="check" className="text-[14px]" />
                          <span>Enabled</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground/80 text-xs font-medium">
                          Inactive
                        </span>
                      )}
                    </TableCell>

                    {/* Toggle Featured Star */}
                    <TableCell className="text-center">
                      {item.checked ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              type="button"
                              onClick={() => handleToggleFeatured(item.id)}
                              className="focus:ring-primary group cursor-pointer rounded p-1 outline-none focus:ring-1"
                              aria-label={item.isFeatured ? "Unfeature amenity" : "Feature amenity"}
                            >
                              <Icon
                                name="star"
                                className={`text-[16px] transition-all duration-200 ${
                                  item.isFeatured
                                    ? "text-primary fill-primary drop-shadow-warning/30 scale-110"
                                    : "text-muted-foreground/60 hover:text-muted-foreground"
                                }`}
                              />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="bg-background border-border text-foreground/90 border text-[10px] font-medium tracking-wide">
                            {item.isFeatured
                              ? "Unfeature amenity on landing"
                              : "Feature amenity on landing"}
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <span className="text-muted-foreground/40 text-xs">-</span>
                      )}
                    </TableCell>

                    {/* Delete Button (Only Custom Core Amenities) */}
                    <TableCell className="text-right">
                      {!item.isSeeded ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              type="button"
                              onClick={() => handleDeleteCustom(item.id, item.name)}
                              className="text-muted-foreground/80 hover:text-destructive hover:bg-destructive/10 animate-in fade-in zoom-in-95 cursor-pointer rounded-lg p-1.5 transition-colors duration-100"
                              aria-label="Delete custom amenity permanently"
                            >
                              <Icon name="delete" className="text-[14px]" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="bg-background border-border text-foreground/90 border text-[10px] font-medium tracking-wide">
                            Delete custom amenity permanently
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              tabIndex={-1}
                              variant="ghost"
                              size="icon"
                              className="cursor-help"
                              aria-label="Core infrastructure, cannot delete"
                            >
                              <Icon
                                name="help"
                                className="text-muted-foreground/40 mr-2 ml-auto text-[14px]"
                              />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="bg-background border-border text-foreground/90 border text-[10px] font-medium tracking-wide">
                            Core Infrastructure (Cannot Delete)
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-muted-foreground h-32 text-center text-xs font-medium tracking-widest uppercase"
                  >
                    No matching assets found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* ➕ Space-Efficient Table Footer Add Row */}
        <div className="border-border/50 border-t pt-4">
          <h3 className="text-muted-foreground mb-3 text-[10px] font-black tracking-[0.2em] uppercase">
            Add Custom Facility Infrastructure
          </h3>
          <div className="bg-background/40 border-border/50 flex flex-col items-center gap-3 rounded-xl border p-4 md:flex-row">
            <Input
              value={newRow.name}
              onChange={(e) => setNewRow((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Infrastructure Asset Name (e.g. Wave Generator)"
              className="bg-muted border-border/50 text-foreground/80 focus-visible:ring-primary h-9 flex-1 rounded-lg text-xs"
            />

            <Select
              value={newRow.type}
              onValueChange={(val: string) =>
                setNewRow((prev) => ({ ...prev, type: val as "BOOLEAN" | "QUANTIFIABLE" | "TEXT" }))
              }
            >
              <SelectTrigger className="bg-muted border-border/50 text-foreground/80 h-9 w-[140px] rounded-lg text-xs">
                <SelectValue placeholder="Value Type" />
              </SelectTrigger>
              <SelectContent className="bg-background border-border text-foreground/80">
                <SelectItem value="BOOLEAN">BOOLEAN</SelectItem>
                <SelectItem value="QUANTIFIABLE">QUANTIFIABLE</SelectItem>
                <SelectItem value="TEXT">TEXT</SelectItem>
              </SelectContent>
            </Select>

            <Input
              value={newRow.category}
              onChange={(e) => setNewRow((prev) => ({ ...prev, category: e.target.value }))}
              placeholder="Category (e.g. Attractions)"
              className="bg-muted border-border/50 text-foreground/80 focus-visible:ring-primary h-9 w-[160px] rounded-lg text-xs"
            />

            <Button
              type="button"
              onClick={handleCreateAmenity}
              disabled={isCreating || !newRow.name.trim()}
              className="bg-primary hover:bg-primary/90 disabled:bg-muted/30 disabled:text-muted-foreground/80 text-primary-foreground flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-4 text-xs font-black tracking-widest uppercase"
            >
              {isCreating ? (
                <Icon name="progress_activity" className="animate-spin text-[14px]" />
              ) : (
                <Icon name="add" className="text-[14px]" />
              )}
              <span>Register Asset</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteTarget !== null} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Amenity</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete custom amenity &quot;{deleteTarget?.name}
              &quot; from the global registry?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteCustom}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
