"use client";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  checkMediaReferencesAction,
  deleteMediaAction,
  restoreMediaAction,
} from "@/app/(server)/actions/cms-media";
import { toast } from "sonner";
import { useEffect, useState } from "react";

interface DeleteConfirmDict {
  title: string;
  description: string;
  in_use_warning: string;
  confirm: string;
  cancel: string;
  permanently: string;
}

interface MediaDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mediaId: string;
  mediaUrl: string;
  mediaFilename: string;
  dict: DeleteConfirmDict;
  onDeleted: () => void;
}

interface ReferenceInfo {
  count: number;
  posts: Array<{ id: string; title: string; status: string }>;
  pages: Array<{ id: string; title: string; status: string }>;
}

export function MediaDeleteDialog({
  open,
  onOpenChange,
  mediaId,
  mediaUrl,
  mediaFilename,
  dict,
  onDeleted,
}: MediaDeleteDialogProps) {
  const [references, setReferences] = useState<ReferenceInfo | null>(null);
  const [checkingRefs, setCheckingRefs] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPermanentDeleting, setIsPermanentDeleting] = useState(false);

  // Check references when dialog opens
  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    void (async () => {
      setCheckingRefs(true);
      setReferences(null);

      const result = await checkMediaReferencesAction(mediaUrl);
      if (cancelled) return;
      setCheckingRefs(false);

      if (result.success && result.data) {
        setReferences(result.data);
      } else {
        // If check fails, allow delete anyway
        setReferences({ count: 0, posts: [], pages: [] });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, mediaUrl]);

  // Soft delete with undo
  const handleSoftDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteMediaAction(mediaId);

      if (result.success && result.data?.deleted) {
        setIsDeleting(false);
        onOpenChange(false);
        const undoId = setTimeout(() => {
          onDeleted();
        }, 5000);
        toast(`${mediaFilename} obrisana.`, {
          action: {
            label: "Undo",
            onClick: () => {
              clearTimeout(undoId);
              restoreMediaAction(mediaId).then((r) => {
                if (r.success) {
                  toast.success(`"${mediaFilename}" vraćena.`);
                  onDeleted();
                }
              });
            },
          },
          duration: 5000,
        });
      } else if (result.success && result.data?.references) {
        toast.warning(
          dict.in_use_warning.replace("{count}", String(result.data.references.length)),
        );
        setIsDeleting(false);
      } else {
        toast.error(result.error || "Greška pri brisanju.");
        setIsDeleting(false);
      }
    } catch {
      toast.error("Greška pri brisanju.");
      setIsDeleting(false);
    }
  };

  // Permanent delete
  const handlePermanentDelete = async () => {
    setIsPermanentDeleting(true);
    try {
      const result = await deleteMediaAction(mediaId, { permanent: true });

      if (result.success && result.data?.deleted) {
        toast.success(`"${mediaFilename}" je trajno obrisana.`);
        onDeleted();
      } else {
        toast.error(result.error || "Greška pri trajnom brisanju.");
        setIsPermanentDeleting(false);
      }
    } catch {
      toast.error("Greška pri trajnom brisanju.");
      setIsPermanentDeleting(false);
    }
  };

  const hasReferences = references && references.count > 0;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{dict.title}</AlertDialogTitle>
          <AlertDialogDescription>
            {checkingRefs ? (
              <div className="flex items-center gap-2 py-2">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-3 w-48" />
              </div>
            ) : hasReferences ? (
              <div className="flex flex-col gap-2">
                <p>{dict.in_use_warning.replace("{count}", String(references!.count))}</p>
                <ul className="bg-muted/30 flex max-h-32 flex-col gap-1 overflow-y-auto rounded-md border p-2">
                  {references!.posts.map((ref) => (
                    <li
                      key={`post-${ref.id}`}
                      className="text-muted-foreground truncate text-[11px]"
                    >
                      <span className="text-muted-foreground/60 text-[10px] tracking-wider uppercase">
                        [objava]
                      </span>{" "}
                      {ref.title}
                    </li>
                  ))}
                  {references!.pages.map((ref) => (
                    <li
                      key={`page-${ref.id}`}
                      className="text-muted-foreground truncate text-[11px]"
                    >
                      <span className="text-muted-foreground/60 text-[10px] tracking-wider uppercase">
                        [strana]
                      </span>{" "}
                      {ref.title}
                    </li>
                  ))}
                </ul>
                <p className="text-muted-foreground text-xs">{dict.description}</p>
              </div>
            ) : (
              dict.description
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
          <AlertDialogCancel disabled={isDeleting || isPermanentDeleting}>
            {dict.cancel}
          </AlertDialogCancel>

          {hasReferences && (
            <Button
              variant="destructive"
              size="default"
              onClick={handlePermanentDelete}
              disabled={isDeleting || isPermanentDeleting}
            >
              {isPermanentDeleting ? (
                <>
                  <Icon name="progress_activity" className="size-4 animate-spin" />
                  {dict.permanently}...
                </>
              ) : (
                <>
                  <Icon name="delete" />
                  {dict.permanently}
                </>
              )}
            </Button>
          )}

          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleSoftDelete();
            }}
            disabled={isDeleting || isPermanentDeleting}
          >
            {isDeleting ? (
              <>
                <Icon name="progress_activity" className="size-4 animate-spin" />
                {dict.confirm}...
              </>
            ) : (
              <>
                <Icon name="delete" />
                {dict.confirm}
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
