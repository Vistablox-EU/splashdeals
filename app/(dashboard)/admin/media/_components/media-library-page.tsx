"use client";

import { MediaLibraryContent } from "./media-library-content";

interface MediaLibraryPageProps {
  dict: Record<string, unknown>;
}

export function MediaLibraryPage({ dict }: MediaLibraryPageProps) {
  const ml = (dict?.media_library as Record<string, unknown>) || {};

  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-6 py-4">
        <h1 className="text-xl font-semibold">{(ml.title as string) || "Media biblioteka"}</h1>
      </div>
      <div className="flex-1 overflow-hidden">
        <MediaLibraryContent
          dict={ml}
          onSelect={() => {
            // Full-page mode: selection is a no-op for the page itself.
            // Individual editors will use the Sheet/Dialog wrappers instead.
          }}
          actionLabel=""
        />
      </div>
    </div>
  );
}
