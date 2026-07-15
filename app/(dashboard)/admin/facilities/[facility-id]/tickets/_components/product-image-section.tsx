"use client";

import NextImage from "next/image";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Icon } from "@/components/ui/Icon";
import { toast } from "sonner";
import {
  uploadProductImage,
  deleteProductImage,
  renameProductImage,
} from "../_lib/ticket-image-actions";

interface Props {
  productId: string;
  imageUrl: string | null;
  productTitle: string;
  onImageChange: (url: string | null) => void;
}

export function ProductImageSection({ productId, imageUrl, productTitle, onImageChange }: Props) {
  const [uploading, setUploading] = React.useState(false);
  const [renaming, setRenaming] = React.useState(false);
  const currentFileName = imageUrl
    ? (imageUrl
        .split("/")
        .pop()
        ?.replace(/\.webp$/, "") ?? "")
    : "";
  const [newName, setNewName] = React.useState(currentFileName);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const result = await uploadProductImage(productId, formData);
      if (result.success && result.url) {
        onImageChange(result.url);
        toast.success("Slika otpremljena");
      } else {
        toast.error(result.error || "Otpremanje nije uspelo");
      }
    } catch {
      toast.error("Otpremanje nije uspelo");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleDelete = async () => {
    if (!imageUrl) return;
    try {
      const result = await deleteProductImage(productId, imageUrl);
      if (result.success) {
        onImageChange(null);
        toast.success("Slika obrisana");
      } else toast.error(result.error || "Brisanje slike nije uspelo");
    } catch {
      toast.error("Brisanje slike nije uspelo");
    }
  };

  const handleRename = async () => {
    if (!imageUrl || !newName.trim()) return;
    setRenaming(true);
    try {
      const result = await renameProductImage(productId, imageUrl, newName.trim());
      if (result.success && result.url) {
        onImageChange(result.url);
        toast.success("Slika preimenovana");
      } else {
        toast.error(result.error || "Preimenovanje nije uspelo");
      }
    } catch {
      toast.error("Preimenovanje nije uspelo");
    } finally {
      setRenaming(false);
    }
  };

  return (
    <div className="border-border/50 space-y-2 border-b p-3">
      {/* Hidden file input is the standard pattern for shadcn upload triggers */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={handleUpload}
        aria-hidden
        tabIndex={-1}
      />
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-[10px] font-black tracking-widest uppercase">
          Slika
        </span>
        {!imageUrl && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="bg-primary/10 text-primary hover:bg-primary/20 h-7 gap-1 rounded-lg px-3 text-[10px] font-bold transition-colors disabled:opacity-50"
            aria-label="Dodaj sliku"
          >
            <Icon name="add_photo" className="text-[12px]" />
            {uploading ? "Otpremanje..." : "Dodaj sliku"}
          </Button>
        )}
      </div>
      {imageUrl ? (
        <div>
          <div className="group border-border/50 relative mb-2 h-32 w-full overflow-hidden rounded-lg border">
            <NextImage
              src={imageUrl}
              alt={productTitle}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 200px"
            />
            <div className="bg-background/0 group-hover:bg-background/60 absolute inset-0 flex items-center justify-center gap-2 opacity-0 transition-colors group-hover:opacity-100">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="text-foreground bg-background/90 hover:bg-background h-8 w-8 rounded-full transition-colors"
                aria-label="Zameni sliku"
              >
                <Icon name="refresh" className="text-[14px]" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDelete}
                className="text-destructive bg-background/90 hover:bg-background h-8 w-8 rounded-full transition-colors"
                aria-label="Obriši sliku"
              >
                <Icon name="delete" className="text-[14px]" />
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Novi naziv fajla..."
              aria-label="Naziv fajla slike"
              className="bg-muted/30 border-border text-foreground focus-visible:border-primary/40 focus-visible:ring-primary/30 h-8 flex-1 rounded-lg border px-2 text-xs focus-visible:ring-2"
              onKeyDown={(e) => e.key === "Enter" && handleRename()}
            />
            <Button
              size="sm"
              className="h-8 shrink-0 px-2 text-[10px]"
              onClick={handleRename}
              disabled={renaming || !newName.trim()}
            >
              {renaming ? "..." : "Preimenuj"}
            </Button>
          </div>
        </div>
      ) : uploading ? (
        <p className="text-muted-foreground text-xs">Otpremanje slike...</p>
      ) : null}
    </div>
  );
}
