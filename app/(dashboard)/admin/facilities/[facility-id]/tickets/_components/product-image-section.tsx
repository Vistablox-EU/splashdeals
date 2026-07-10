"use client";

import NextImage from "next/image";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/Icon";
import { toast } from "sonner";

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
      const { uploadProductImage } = await import("../_lib/ticket-image-actions");
      const result = await uploadProductImage(productId, formData);
      if (result.success && result.url) {
        onImageChange(result.url);
      } else {
        toast.error(result.error || "Upload failed");
      }
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleDelete = async () => {
    if (!imageUrl) return;
    const { deleteProductImage } = await import("../_lib/ticket-image-actions");
    const result = await deleteProductImage(productId, imageUrl);
    if (result.success) onImageChange(null);
    else toast.error(result.error || "Delete failed");
  };

  const handleRename = async () => {
    if (!imageUrl || !newName.trim()) return;
    setRenaming(true);
    try {
      const { renameProductImage } = await import("../_lib/ticket-image-actions");
      const result = await renameProductImage(productId, imageUrl, newName.trim());
      if (result.success && result.url) {
        onImageChange(result.url);
        setNewName("");
      } else {
        toast.error(result.error || "Rename failed");
      }
    } finally {
      setRenaming(false);
    }
  };

  return (
    <div className="border-border/50 space-y-2 border-b p-3">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleUpload}
      />
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-[10px] font-black tracking-widest uppercase">
          Slika
        </span>
        {!imageUrl && (
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="bg-primary/10 text-primary hover:bg-primary/20 flex h-7 items-center gap-1 rounded-lg px-3 text-[10px] font-bold transition-all disabled:opacity-50"
          >
            <Icon name="add_photo" className="text-[12px]" />
            {uploading ? "Otpremanje..." : "Dodaj sliku"}
          </button>
        )}
      </div>
      {imageUrl ? (
        <div>
          <div className="group border-border/50 relative mb-2 overflow-hidden rounded-lg border">
            <NextImage
              src={imageUrl}
              alt={productTitle}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 200px"
            />
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/0 opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100">
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="text-foreground flex h-8 w-8 items-center justify-center rounded-full bg-white/90 transition-all hover:bg-white"
              >
                <Icon name="refresh" className="text-[14px]" />
              </button>
              <button
                onClick={handleDelete}
                className="text-destructive flex h-8 w-8 items-center justify-center rounded-full bg-white/90 transition-all hover:bg-white"
              >
                <Icon name="delete" className="text-[14px]" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Novi naziv fajla..."
              className="bg-muted/30 border-border text-foreground focus:border-primary/40 h-8 flex-1 rounded-lg border px-2 text-xs outline-none"
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
