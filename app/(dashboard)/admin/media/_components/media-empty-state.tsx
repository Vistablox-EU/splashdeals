"use client";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/Icon";

interface MediaEmptyStateProps {
  dict: Record<string, unknown>;
  onUpload: () => void;
}

export function MediaEmptyState({ dict, onUpload }: MediaEmptyStateProps) {
  const ml = dict.media_library as Record<string, unknown>;
  const empty = ml.empty as Record<string, string>;

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 rounded-[2rem] border border-dashed p-12">
      <div className="bg-muted/30 flex size-16 items-center justify-center rounded-full">
        <Icon name="auto_awesome" className="text-muted-foreground size-8" />
      </div>
      <div className="text-center">
        <h3 className="text-lg font-medium">{empty.title}</h3>
        <p className="text-muted-foreground mt-1 max-w-sm text-sm">{empty.description}</p>
      </div>
      <div className="text-muted-foreground space-y-0.5 text-center text-xs">
        <p>{empty.formats_hint}</p>
        <p>{empty.size_hint}</p>
      </div>
      <Button onClick={onUpload}>
        <Icon name="upload" className="size-4" />
        {ml.upload as string}
      </Button>
    </div>
  );
}
