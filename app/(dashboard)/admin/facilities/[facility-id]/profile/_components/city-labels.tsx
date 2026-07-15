"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  searchPlaces,
  addLabel,
  removeLabel,
  updateLabel,
  setPrimaryLabel,
  getFacilityLabels,
} from "../_actions/label-actions";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PopulatedPlace {
  id: string;
  name: string;
  type: string | null;
  district: string | null;
  region: string | null;
}

interface FacilityLabel {
  id: string;
  facilityId: string;
  placeId: string;
  label: string | null;
  isPrimary: boolean;
  place: PopulatedPlace;
}

interface Props {
  facilityId: string;
}

export function CityLabels({ facilityId }: Props) {
  const [labels, setLabels] = useState<FacilityLabel[]>([]);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<PopulatedPlace[]>([]);
  const [showInput, setShowInput] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Load existing labels
  useEffect(() => {
    getFacilityLabels(facilityId).then(setLabels);
  }, [facilityId]);

  // Autocomplete
  const handleQueryChange = useCallback(
    (value: string) => {
      setQuery(value);
      clearTimeout(debounceRef.current);
      if (value.length < 2) {
        setSuggestions([]);
        return;
      }
      debounceRef.current = setTimeout(async () => {
        const results = await searchPlaces(value);
        // Filter out already added places
        const addedIds = new Set(labels.map((l) => l.placeId));
        setSuggestions(results.filter((r) => !addedIds.has(r.id)));
      }, 200);
    },
    [labels],
  );

  // Add label
  const handleSelect = useCallback(
    async (place: PopulatedPlace) => {
      const label = await addLabel(facilityId, place.id);
      setLabels((prev) => [...prev, label as unknown as FacilityLabel]);
      setQuery("");
      setSuggestions([]);
      setShowInput(false);
    },
    [facilityId],
  );

  // Remove label
  const handleRemove = useCallback(async (id: string) => {
    await removeLabel(id);
    setLabels((prev) => prev.filter((l) => l.id !== id));
  }, []);

  // Set primary
  const handleSetPrimary = useCallback(
    async (id: string) => {
      const _updated = await setPrimaryLabel(facilityId, id);
      setLabels((prev) =>
        prev.map((l) => ({
          ...l,
          isPrimary: l.id === id,
        })),
      );
    },
    [facilityId],
  );

  // Inline edit label
  const startEdit = useCallback((id: string, currentLabel: string | null) => {
    setEditingId(id);
    setEditValue(currentLabel || "");
  }, []);

  const saveEdit = useCallback(async () => {
    if (!editingId) return;
    await updateLabel(editingId, { label: editValue || undefined });
    setLabels((prev) =>
      prev.map((l) => (l.id === editingId ? { ...l, label: editValue || null } : l)),
    );
    setEditingId(null);
  }, [editingId, editValue]);

  return (
    <div className="space-y-3">
      <label className="text-foreground text-sm font-medium">Gradovi</label>

      {/* Existing pills */}
      <div className="flex min-h-[2.5rem] flex-wrap gap-2">
        {labels.map((label) => (
          <div
            key={label.id}
            className={cn(
              "group flex cursor-default items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              label.isPrimary
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border bg-muted/30 text-muted-foreground hover:border-muted-foreground/30",
            )}
          >
            {/* Star toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleSetPrimary(label.id)}
              className="size-5 transition-transform hover:scale-110"
              aria-label={label.isPrimary ? "Primarni grad" : "Postavi kao primarni"}
            >
              <Icon name={label.isPrimary ? "star" : "star_border"} className="size-3.5" />
            </Button>

            {/* Label text — inline editable */}
            {editingId === label.id ? (
              <Input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={saveEdit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveEdit();
                  if (e.key === "Escape") setEditingId(null);
                }}
                autoFocus
                className="h-6 w-32 px-1 py-0 text-xs"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span
                className="cursor-text"
                onDoubleClick={() => startEdit(label.id, label.label)}
                title={`${label.place.name} (${label.place.type || "?"}) · ${label.place.district || ""} ${label.place.region || ""}`.trim()}
              >
                {label.label || label.place.name || ""}
              </span>
            )}

            {/* Context hint */}
            {!editingId && (
              <span className="text-muted-foreground/50 hidden text-[9px] group-hover:inline">
                {label.place.district || ""}
              </span>
            )}

            {/* Delete */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleRemove(label.id)}
              className="text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 size-5 rounded-full transition-colors"
              aria-label={`Ukloni ${label.label || label.place.name}`}
            >
              <Icon name="close" className="size-3" />
            </Button>
          </div>
        ))}
      </div>

      {/* Add input */}
      {showInput ? (
        <div className="relative">
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onBlur={() =>
              setTimeout(() => {
                setShowInput(false);
                setSuggestions([]);
              }, 200)
            }
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setShowInput(false);
                setSuggestions([]);
              }
              if (e.key === "Enter" && suggestions.length > 0) handleSelect(suggestions[0]);
            }}
            placeholder="Pretraži gradove i mesta..."
            className="h-9 text-sm"
            autoFocus
          />
          {suggestions.length > 0 && (
            <div className="border-border bg-popover absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border shadow-lg">
              {suggestions.map((place) => (
                <Button
                  key={place.id}
                  variant="ghost"
                  className="w-full justify-start rounded-none px-3 py-2 text-sm"
                  role="option"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(place);
                  }}
                  aria-label={`Izaberi ${place.name}`}
                >
                  <Icon name="location_on" className="text-muted-foreground size-3.5 shrink-0" />
                  <span className="font-medium">{place.name}</span>
                  <span className="text-muted-foreground text-[10px]">
                    {place.type} · {place.district || ""} {place.region || ""}
                  </span>
                </Button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowInput(true)}
          className="h-8 text-xs"
        >
          <Icon name="add" className="mr-1 size-3.5" />
          Dodaj grad
        </Button>
      )}
    </div>
  );
}
