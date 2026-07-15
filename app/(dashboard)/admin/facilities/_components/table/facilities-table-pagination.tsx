"use client";

import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/button";

interface FacilitiesTablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (page: number) => void;
}

export function FacilitiesTablePagination({
  currentPage,
  totalPages,
  totalCount,
  onPageChange,
}: FacilitiesTablePaginationProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-muted-foreground text-[10px] font-black tracking-widest uppercase">
        {currentPage} / {totalPages || 1} • {totalCount} ukupno
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          className="bg-background/40 border-border/50 h-8 w-8 p-0"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label="Prethodna strana"
        >
          <Icon name="keyboard_arrow_left" className="text-[16px]" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="bg-background/40 border-border/50 h-8 w-8 p-0"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label="Sledeća strana"
        >
          <Icon name="keyboard_arrow_right" className="text-[16px]" />
        </Button>
      </div>
    </div>
  );
}
