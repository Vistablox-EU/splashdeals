"use client";

import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import type { Table } from "@tanstack/react-table";

interface FacilitiesTableToolbarProps<TData> {
  search: string;
  onSearchChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  totalCount: number;
  density: "comfortable" | "compact";
  onToggleDensity: () => void;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  table: Table<TData>;
}

const COLUMN_LABELS: Record<string, string> = {
  name: "Naziv",
  category: "Kategorija",
  city: "Lokacija",
  status: "Status",
  createdAt: "Kreirano",
};

export function FacilitiesTableToolbar<TData>({
  search,
  onSearchChange,
  status,
  onStatusChange,
  totalCount,
  density,
  onToggleDensity,
  pageSize,
  onPageSizeChange,
  table,
}: FacilitiesTableToolbarProps<TData>) {
  return (
    <div className="bg-background/40 border-border/50 flex flex-col items-stretch justify-between gap-3 rounded-xl border p-2 backdrop-blur-md lg:flex-row lg:items-center">
      <div className="flex flex-1 flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Icon
            name="search"
            className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2 text-[14px]"
          />
          <Input
            placeholder="Pretraži registar..."
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            aria-label="Pretraži objekte"
            className="bg-background/40 border-border/50 focus-visible:ring-primary/30 placeholder:text-muted-foreground h-9 pl-9 text-xs font-semibold focus-visible:ring-1"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={status || "all"} onValueChange={onStatusChange}>
            <SelectTrigger className="bg-background/40 border-border/50 hover:bg-background/60 relative h-9 flex-1 text-[10px] font-black tracking-wider uppercase transition-colors sm:w-[160px]">
              <SelectValue placeholder="Status" />
              <Badge
                variant="outline"
                className="bg-primary/10 border-primary/20 text-primary pointer-events-none ml-2 h-5 px-1.5 text-[9px] font-black"
              >
                {totalCount}
              </Badge>
            </SelectTrigger>
            <SelectContent className="bg-muted border-border">
              <SelectItem value="all">Svi statusi</SelectItem>
              <SelectItem value="ACTIVE">Aktivni</SelectItem>
              <SelectItem value="DRAFT">Nacrti</SelectItem>
              <SelectItem value="CLOSED">Zatvoreni</SelectItem>
              <SelectItem value="EMERGENCY_SHUTDOWN">Vanredno</SelectItem>
            </SelectContent>
          </Select>

          <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v))}>
            <SelectTrigger className="bg-background/40 border-border/50 h-9 w-[100px] text-[10px] font-black tracking-wider uppercase">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-muted border-border">
              <SelectItem value="15">15 / str</SelectItem>
              <SelectItem value="25">25 / str</SelectItem>
              <SelectItem value="50">50 / str</SelectItem>
            </SelectContent>
          </Select>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 text-[10px] font-bold uppercase">
                Kolone
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuLabel>Prikaz kolona</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {COLUMN_LABELS[column.id] || column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground hover:bg-muted/50 h-9 w-9 shrink-0 rounded-lg"
            onClick={onToggleDensity}
            title={density === "comfortable" ? "Kompaktan prikaz" : "Udoban prikaz"}
            aria-label={density === "comfortable" ? "Kompaktan prikaz" : "Udoban prikaz"}
          >
            {density === "comfortable" ? (
              <Icon name="table_rows" className="text-[16px]" />
            ) : (
              <Icon name="menu" className="text-[16px]" />
            )}
          </Button>

          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-9 text-[10px] font-bold uppercase"
          >
            <Link href="/admin/facilities/cities">Gradovi</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
