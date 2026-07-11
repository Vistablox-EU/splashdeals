"use client";

import { useCallback, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { MediaLibraryContent } from "./media-library-content";

interface MediaLibrarySheetProps {
  dict: Record<string, unknown>;
  onSelect: (url: string, altText?: string) => void;
  trigger?: React.ReactNode;
}

export function MediaLibrarySheet({ dict, onSelect, trigger }: MediaLibrarySheetProps) {
  const [open, setOpen] = useState(false);
  const [showGuard, setShowGuard] = useState(false);
  const [uploadsActive, setUploadsActive] = useState(false);

  const ml = dict as Record<string, unknown>;

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen && uploadsActive) {
        setShowGuard(true);
        return;
      }
      setOpen(nextOpen);
    },
    [uploadsActive],
  );

  const confirmClose = useCallback(() => {
    setShowGuard(false);
    setOpen(false);
  }, []);

  const cancelClose = useCallback(() => {
    setShowGuard(false);
  }, []);

  const handleSelect = (url: string, altText?: string) => {
    onSelect(url, altText);
    setOpen(false);
  };

  const actions = (ml.actions as Record<string, string>) || {};
  const unsavedDict = (ml.unsaved_upload as Record<string, string>) || {};

  return (
    <>
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetTrigger asChild>{trigger}</SheetTrigger>
        <SheetContent side="right" className="w-[640px] p-0 sm:w-[720px]">
          <SheetHeader className="px-6 pt-6 pb-0">
            <SheetTitle>{ml.title as string}</SheetTitle>
          </SheetHeader>
          <MediaLibraryContent
            dict={dict}
            onSelect={handleSelect}
            onUploadsActiveChange={setUploadsActive}
          />
        </SheetContent>
      </Sheet>

      <AlertDialog open={showGuard} onOpenChange={setShowGuard}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{unsavedDict.title || "Upload je u toku"}</AlertDialogTitle>
            <AlertDialogDescription>
              {unsavedDict.description ||
                "Upload datoteka još uvek traje. Da li ste sigurni da želite da zatvorite?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelClose}>
              {actions.cancel || "Otkaži"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmClose}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {actions.close || "Zatvori"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
