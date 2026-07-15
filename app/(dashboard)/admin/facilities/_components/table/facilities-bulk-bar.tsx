"use client";

import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { FacilityStatus } from "@prisma/client";

interface FacilitiesBulkBarProps {
  selectedCount: number;
  isPending: boolean;
  onConfirm: (status: FacilityStatus) => void;
  onClear: () => void;
}

export function FacilitiesBulkBar({
  selectedCount,
  isPending,
  onConfirm,
  onClear,
}: FacilitiesBulkBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="bg-primary/10 border-primary/20 flex flex-wrap items-center gap-2 rounded-lg border p-1 px-3">
      <span className="text-primary mr-2 text-[9px] font-black tracking-[0.2em] uppercase">
        {selectedCount} izabrano
      </span>
      <div className="bg-primary/20 mx-1 h-4 w-px" />

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="hover:bg-primary/20 hover:text-primary h-7 text-[10px] font-bold tracking-tight uppercase"
            disabled={isPending}
          >
            {isPending ? (
              <Icon name="progress_activity" className="mr-1 animate-spin text-[12px]" />
            ) : (
              <Icon name="check_circle" className="mr-1 text-[12px]" />
            )}
            Aktiviraj
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aktiviraj objekte?</AlertDialogTitle>
            <AlertDialogDescription>
              Status će biti postavljen na AKTIVAN za {selectedCount} izabranih objekata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Odustani</AlertDialogCancel>
            <AlertDialogAction onClick={() => onConfirm("ACTIVE")}>Aktiviraj</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="hover:bg-destructive/20 hover:text-destructive h-7 text-[10px] font-bold tracking-tight uppercase"
            disabled={isPending}
          >
            {isPending ? (
              <Icon name="progress_activity" className="mr-1 animate-spin text-[12px]" />
            ) : (
              <Icon name="archive" className="mr-1 text-[12px]" />
            )}
            Arhiviraj
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Arhiviraj objekte?</AlertDialogTitle>
            <AlertDialogDescription>
              Status će biti postavljen na ZATVOREN za {selectedCount} izabranih objekata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Odustani</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => onConfirm("CLOSED")}
            >
              Arhiviraj
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Button
        variant="ghost"
        size="sm"
        className="hover:bg-muted/50 h-7 w-7 p-0"
        onClick={onClear}
        disabled={isPending}
        aria-label="Obriši izbor"
      >
        <Icon name="cancel" className="text-muted-foreground text-[14px]" />
      </Button>
    </div>
  );
}
