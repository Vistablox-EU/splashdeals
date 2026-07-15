"use client";

import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

interface MediaUploadDropzoneProps {
  isEmpty: boolean;
  isUploading: boolean;
  uploadProgress: Record<string, number>;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function MediaUploadDropzone({
  isEmpty,
  isUploading,
  uploadProgress,
  onUpload,
}: MediaUploadDropzoneProps) {
  return (
    <div
      className={cn(
        "group border-border/50 bg-muted/40 hover:bg-muted/60 hover:border-primary/50 relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed text-center backdrop-blur-md transition-colors",
        isEmpty && !isUploading ? "py-32" : "py-12",
      )}
    >
      {isEmpty && !isUploading ? (
        <div className="animate-in zoom-in-95 flex max-w-sm flex-col items-center duration-500">
          <div className="bg-muted/10 border-border/50 group-hover:bg-primary/5 mb-8 rounded-3xl border p-6 transition-colors duration-500 group-hover:scale-110">
            <Icon
              name="image"
              className="text-muted-foreground/80 group-hover:text-primary text-[48px] transition-colors"
            />
          </div>
          <div className="space-y-2">
            <h3 className="text-foreground text-xl font-black tracking-tighter uppercase">
              Galerija je prazna
            </h3>
            <p className="text-muted-foreground text-xs leading-relaxed font-medium tracking-widest uppercase">
              Prevucite fajlove ovde da započnete kuraciju medija.
            </p>
            <p className="text-muted-foreground/60 mt-2 text-[10px]">
              Kliknite ili prevucite za otpremanje
            </p>
          </div>
        </div>
      ) : (
        <>
          <Icon
            name="upload"
            className="text-muted-foreground group-hover:text-primary mb-4 text-[48px] transition-colors"
          />
          <div className="space-y-1">
            <p className="text-base font-semibold">Prevucite fajlove ovde ili izaberite sa diska</p>
            <p className="text-muted-foreground text-sm">
              Podržane su slike i video. WebP obrada je aktivna.
            </p>
          </div>
        </>
      )}

      <label htmlFor="media-upload" className="sr-only">
        Izaberite slike ili video za otpremanje
      </label>
      <input
        id="media-upload"
        type="file"
        multiple
        accept="image/*,video/*"
        className="absolute inset-0 cursor-pointer opacity-0"
        onChange={onUpload}
        disabled={isUploading}
      />

      {isUploading && (
        <div className="bg-background/90 animate-in fade-in absolute inset-0 z-10 flex flex-col items-center justify-center duration-300">
          <Icon name="progress_activity" className="text-primary mb-2 animate-spin text-[40px]" />
          <p className="animate-pulse text-lg font-bold">
            {Object.keys(uploadProgress).length > 0
              ? `Otpremanje ${Object.values(uploadProgress)[0].toFixed(0)}%`
              : "Optimizacija..."}
          </p>
          <p className="text-primary/60 mt-1 text-[10px] font-black tracking-[0.2em] uppercase">
            Splash Engine
          </p>
        </div>
      )}
    </div>
  );
}
