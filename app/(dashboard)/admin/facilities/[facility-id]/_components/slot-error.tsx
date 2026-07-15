"use client";
import { Icon } from "@/components/ui/Icon";

import { Button } from "@/components/ui/button";
import Link from "next/link";

interface SlotErrorProps {
  error?: Error & { digest?: string };
  reset: () => void;
  title?: string;
}

export function SlotError({ reset, title = "Segment nije učitan" }: SlotErrorProps) {
  return (
    <div className="border-destructive/10 bg-destructive/5 flex flex-col items-center justify-center space-y-4 rounded-2xl border p-8">
      <div className="bg-destructive/10 rounded-full p-3">
        <Icon name="error" className="text-destructive text-[24px]" />
      </div>
      <div className="space-y-1 text-center">
        <h3 className="text-foreground text-sm font-black tracking-widest uppercase">{title}</h3>
        <p className="text-muted-foreground max-w-[200px] text-xs font-medium">
          Došlo je do greške prilikom učitavanja podataka.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (typeof window !== "undefined") window.location.reload();
            reset();
          }}
          className="border-destructive/20 hover:bg-destructive/10 h-8 text-[10px] font-black tracking-widest uppercase"
        >
          <Icon name="undo" className="mr-2 text-[12px]" />
          Pokušaj ponovo
        </Button>
        <Button
          variant="outline"
          size="sm"
          asChild
          className="border-border/50 h-8 text-[10px] font-black tracking-widest uppercase"
        >
          <Link href=".">
            <Icon name="keyboard_arrow_left" className="mr-2 text-[12px]" />
            Nazad na pregled
          </Link>
        </Button>
      </div>
    </div>
  );
}
