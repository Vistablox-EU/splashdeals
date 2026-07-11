"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/Icon";
import { Separator } from "@/components/ui/separator";

type SortKey = "newest" | "oldest" | "name_asc" | "name_desc" | "largest" | "smallest";
type TypeKey = "all" | "jpg" | "png" | "webp" | "gif" | "svg";
type DateRangeKey = "all" | "7d" | "30d";
type ViewMode = "grid" | "list";
type SizeMode = "small" | "medium" | "large";

interface MediaToolbarProps {
  dict: Record<string, unknown>;
  sort: SortKey;
  onSortChange: (value: SortKey) => void;
  typeFilter: TypeKey;
  onTypeFilterChange: (value: TypeKey) => void;
  dateRange: DateRangeKey;
  onDateRangeChange: (value: DateRangeKey) => void;
  viewMode: ViewMode;
  onViewModeChange: (value: ViewMode) => void;
  sizeMode: SizeMode;
  onSizeModeChange: (value: SizeMode) => void;
  selectedCount: number;
  onBatchDelete: () => void;
}

export function MediaToolbar({
  dict,
  sort,
  onSortChange,
  typeFilter,
  onTypeFilterChange,
  dateRange,
  onDateRangeChange,
  viewMode,
  onViewModeChange,
  sizeMode,
  onSizeModeChange,
  selectedCount,
  onBatchDelete,
}: MediaToolbarProps) {
  const ml = dict.media_library as Record<string, unknown>;
  const sortLabels = ml.sort as Record<string, string>;
  const typeLabels = ml.filter_types as Record<string, string>;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Sort dropdown */}
      <Select value={sort} onValueChange={(v) => onSortChange(v as SortKey)}>
        <SelectTrigger className="h-9 w-[140px] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(Object.entries(sortLabels) as [SortKey, string][]).map(([key, label]) => (
            <SelectItem key={key} value={key} className="text-xs">
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Type filter dropdown */}
      <Select value={typeFilter} onValueChange={(v) => onTypeFilterChange(v as TypeKey)}>
        <SelectTrigger className="h-9 w-[120px] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(Object.entries(typeLabels) as [TypeKey, string][]).map(([key, label]) => (
            <SelectItem key={key} value={key} className="text-xs">
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Date range toggles */}
      <ToggleGroup
        type="single"
        value={dateRange}
        onValueChange={(v) => {
          if (v) onDateRangeChange(v as DateRangeKey);
        }}
        size="sm"
        spacing={0}
      >
        <ToggleGroupItem value="all" className="text-xs">
          {ml.all as string}
        </ToggleGroupItem>
        <ToggleGroupItem value="7d" className="text-xs">
          {ml.last_7_days as string}
        </ToggleGroupItem>
        <ToggleGroupItem value="30d" className="text-xs">
          {ml.last_30_days as string}
        </ToggleGroupItem>
      </ToggleGroup>

      <Separator orientation="vertical" className="h-8" />

      {/* View toggle */}
      <Toggle
        pressed={viewMode === "list"}
        onPressedChange={(pressed) => onViewModeChange(pressed ? "list" : "grid")}
        size="sm"
        aria-label={ml.view_grid as string}
      >
        <Icon name={viewMode === "grid" ? "table_rows" : "grid"} className="size-4" />
      </Toggle>

      {/* Size toggle */}
      <ToggleGroup
        type="single"
        value={sizeMode}
        onValueChange={(v) => {
          if (v) onSizeModeChange(v as SizeMode);
        }}
        size="sm"
        spacing={0}
      >
        <ToggleGroupItem value="small" className="text-xs">
          <Icon name="photo" className="size-3.5" />
        </ToggleGroupItem>
        <ToggleGroupItem value="medium" className="text-xs">
          <Icon name="photo" className="size-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="large" className="text-xs">
          <Icon name="photo" className="size-5" />
        </ToggleGroupItem>
      </ToggleGroup>

      {/* Batch delete */}
      {selectedCount > 0 && (
        <>
          <Separator orientation="vertical" className="h-8" />
          <span className="text-muted-foreground text-xs whitespace-nowrap">
            {(ml.items_selected as string).replace("{count}", String(selectedCount))}
          </span>
          <Button variant="destructive" size="sm" onClick={onBatchDelete}>
            <Icon name="delete" className="size-4" />
            {(ml.actions as Record<string, string>).delete_selected}
          </Button>
        </>
      )}
    </div>
  );
}
