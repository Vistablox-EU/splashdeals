"use client";

import { Icon } from "@/components/ui/Icon";
import { Progress } from "@/components/ui/progress";
import { useEffect, useRef, useState } from "react";

export interface UploadItem {
  id: string;
  filename: string;
  progress: number;
  size?: number;
  status: "uploading" | "done" | "error";
  error?: string;
}

interface MediaUploadProgressProps {
  uploads: UploadItem[];
}

function formatSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

export function MediaUploadProgress({ uploads }: MediaUploadProgressProps) {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-dismiss done items after 3 seconds
  useEffect(() => {
    const doneIds = uploads
      .filter((u) => u.status === "done" && !dismissedIds.has(u.id))
      .map((u) => u.id);

    if (doneIds.length === 0) return;

    timerRef.current = setTimeout(() => {
      setDismissedIds((prev) => {
        const next = new Set(prev);
        for (const id of doneIds) next.add(id);
        return next;
      });
    }, 3000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // dismissedIds in deps ensures newly dismissed items don't re-trigger old timers
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploads, dismissedIds]);

  const filtered = uploads.filter((u) => !dismissedIds.has(u.id));

  if (filtered.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed top-0 right-0 left-0 z-50 flex justify-center"
    >
      <div className="bg-background pointer-events-auto mx-auto mt-4 flex w-full max-w-lg flex-col gap-2 rounded-xl border p-3 shadow-lg">
        {filtered.map((upload) => (
          <div
            key={upload.id}
            className="bg-muted/30 flex flex-col gap-1.5 rounded-lg border px-3 py-2"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-foreground truncate text-xs font-medium">
                {upload.filename}
              </span>
              <div className="flex shrink-0 items-center gap-1.5">
                {upload.status === "uploading" && (
                  <span className="text-muted-foreground text-[10px] tabular-nums">
                    {upload.progress}%
                  </span>
                )}
                {upload.status === "done" && (
                  <Icon name="check_circle" className="size-3.5 text-green-500" />
                )}
                {upload.status === "error" && (
                  <Icon name="error" className="text-destructive size-3.5" />
                )}
              </div>
            </div>

            {upload.status === "uploading" && <Progress value={upload.progress} className="h-1" />}

            {upload.size !== undefined && (
              <span className="text-muted-foreground text-[10px]">{formatSize(upload.size)}</span>
            )}

            {upload.status === "error" && upload.error && (
              <span className="text-destructive text-[10px]">{upload.error}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
