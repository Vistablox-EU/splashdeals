"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { MediaLibraryContent } from "./media-library-content";

interface MediaLibrarySheetProps {
  dict: Record<string, unknown>;
  onSelect: (url: string, altText?: string) => void;
  trigger?: React.ReactNode;
}

export function MediaLibrarySheet({ dict, onSelect, trigger }: MediaLibrarySheetProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (url: string, altText?: string) => {
    onSelect(url, altText);
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent side="right" className="w-[640px] p-0 sm:w-[720px]">
        <SheetHeader className="px-6 pt-6 pb-0">
          <SheetTitle>{(dict as Record<string, unknown>).title as string}</SheetTitle>
        </SheetHeader>
        <MediaLibraryContent dict={dict} onSelect={handleSelect} />
      </SheetContent>
    </Sheet>
  );
}
