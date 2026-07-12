"use client";

import { Icon } from "@/components/ui/Icon";

interface SocialSharePreviewProps {
  title: string;
  coverImage: string;
  excerpt: string;
}

export function SocialSharePreview({ title, coverImage, excerpt }: SocialSharePreviewProps) {
  const truncatedTitle = title.length > 60 ? title.slice(0, 57) + "…" : title;
  const truncatedExcerpt = excerpt
    ? excerpt.length > 120
      ? excerpt.slice(0, 117) + "…"
      : excerpt
    : "";

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold">Pregled deljenja</h3>
      <p className="text-muted-foreground text-xs">
        Kako će objava izgledati na društvenim mrežama
      </p>

      {/* Facebook */}
      <div className="overflow-hidden rounded-lg border">
        <div className="bg-muted/30 px-3 py-2">
          <span className="text-[10px] font-medium text-blue-600">Facebook</span>
        </div>
        {coverImage && (
          <div className="bg-muted aspect-[1.91/1] w-full overflow-hidden">
            <img src={coverImage} alt="" className="h-full w-full object-cover" />
          </div>
        )}
        <div className="bg-card p-3">
          <p className="text-muted-foreground truncate text-[10px] tracking-wider uppercase">
            splashdeals.rs
          </p>
          <p className="mt-1 text-sm leading-tight font-semibold">{truncatedTitle}</p>
          {truncatedExcerpt && (
            <p className="text-muted-foreground mt-1 text-xs leading-snug">{truncatedExcerpt}</p>
          )}
        </div>
      </div>

      {/* Twitter / X */}
      <div className="overflow-hidden rounded-lg border">
        <div className="bg-muted/30 px-3 py-2">
          <span className="text-[10px] font-medium text-sky-600">X (Twitter)</span>
        </div>
        <div className="bg-card p-3">
          {coverImage && (
            <div className="bg-muted mb-2 aspect-[2/1] w-full overflow-hidden rounded-lg">
              <img src={coverImage} alt="" className="h-full w-full object-cover" />
            </div>
          )}
          <p className="text-sm leading-tight font-semibold">{truncatedTitle}</p>
          {truncatedExcerpt && (
            <p className="text-muted-foreground mt-1 text-xs leading-snug">{truncatedExcerpt}</p>
          )}
          <p className="text-muted-foreground mt-1 truncate text-[10px]">splashdeals.rs/blog/...</p>
        </div>
      </div>

      {/* Telegram */}
      <div className="overflow-hidden rounded-lg border">
        <div className="bg-muted/30 px-3 py-2">
          <span className="text-[10px] font-medium text-sky-500">Telegram</span>
        </div>
        <div className="bg-card flex gap-3 p-3">
          {coverImage && (
            <div className="bg-muted size-16 shrink-0 overflow-hidden rounded-lg">
              <img src={coverImage} alt="" className="h-full w-full object-cover" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm leading-tight font-semibold">{truncatedTitle}</p>
            {truncatedExcerpt && (
              <p className="text-muted-foreground mt-0.5 text-xs leading-snug">
                {truncatedExcerpt}
              </p>
            )}
            <p className="text-muted-foreground mt-1 truncate text-[10px]">
              splashdeals.rs/blog/...
            </p>
          </div>
        </div>
      </div>

      <p className="text-muted-foreground mt-2 flex items-center gap-1 text-[10px]">
        <Icon name="info" className="size-3" />
        Prikaz zavisi od platforme i meta tagova
      </p>
    </div>
  );
}
