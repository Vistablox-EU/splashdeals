"use client";
import { Icon } from "@/components/ui/Icon";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface AmenitiesErrorProps {
  error: Error & { digest?: string };
  resetErrorBoundary: () => void;
}

export function AmenitiesError({ error, resetErrorBoundary }: AmenitiesErrorProps) {
  React.useEffect(() => {
    // Proactively log to error tracking infrastructure
    console.error("Amenities Registry Component Boundary Exception:", error);
  }, [error]);

  return (
    <Card className="border-destructive/20 bg-background/60 relative flex flex-col items-center justify-center space-y-4 overflow-hidden rounded-2xl border p-6 py-12 text-center shadow-2xl backdrop-blur-xl">
      <div className="relative">
        <div className="bg-destructive/10 absolute inset-0 scale-150 animate-pulse rounded-full blur-xl" />
        <div className="border-destructive/30 bg-destructive/10 text-destructive relative flex size-12 items-center justify-center rounded-full border">
          <Icon name="gpp_maybe" className="animate-in zoom-in size-6" />
        </div>
      </div>

      <div className="max-w-sm space-y-1.5">
        <h3 className="text-foreground/90 text-xs font-black tracking-widest uppercase">
          Infrastructure Registry Failure
        </h3>
        <p className="text-muted-foreground text-[11px] leading-relaxed">
          A runtime database boundary exception or edge serialization error occurred while loading
          active assets.
        </p>
      </div>
      <Button
        type="button"
        onClick={resetErrorBoundary}
        className="bg-muted border-border text-foreground/80 hover:text-foreground hover:bg-muted flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border px-4 text-[10px] font-black tracking-widest uppercase transition-colors"
      >
        <Icon name="undo" className="size-3" />
        <span>Reset & Retry</span>
      </Button>
    </Card>
  );
}

export default AmenitiesError;
