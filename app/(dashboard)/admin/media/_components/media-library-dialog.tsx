"use client";

import { useCallback, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/Icon";
import { MediaLibraryContent } from "./media-library-content";

interface MediaLibraryDialogProps {
  dict: Record<string, unknown>;
  onInsert: (url: string, altText?: string) => void;
  trigger?: React.ReactNode;
}

export function MediaLibraryDialog({ dict, onInsert, trigger }: MediaLibraryDialogProps) {
  const ml = dict as Record<string, unknown>;
  const actions = (ml.actions as Record<string, string>) || {};
  const [open, setOpen] = useState(false);

  const handleInsert = useCallback(
    (url: string, altText?: string) => {
      onInsert(url, altText);
      setOpen(false);
    },
    [onInsert],
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button type="button" variant="outline" size="sm" className="gap-1.5">
            <Icon name="photo_library" className="size-4" />
            {(ml.title as string) || "Media biblioteka"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="flex max-h-[85vh] max-w-5xl flex-col p-0">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle>{(ml.title as string) || "Media biblioteka"}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-hidden">
          <MediaLibraryContent
            dict={ml}
            onSelect={handleInsert}
            actionLabel={actions.insert || "Ubaci"}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
