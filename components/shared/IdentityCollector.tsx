"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { getClientDictionary } from "@/lib/client-dictionaries";
import type { Dict } from "@/lib/types";

interface IdentityCollectorProps {
  requiresIdentity: boolean;
  requiresPhoto: boolean;
  onComplete: (data: { holderName?: string; holderPhotoUrl?: string }) => void;
  onCancel?: () => void;
}

/**
 * 🪪 IdentityCollector
 *
 * Collects name and/or photo for tickets that require identity verification.
 * Extracted from IdentitySetupDialog for reuse across cart and checkout flows.
 */
export function IdentityCollector({
  requiresIdentity,
  requiresPhoto,
  onComplete,
  onCancel,
}: IdentityCollectorProps) {
  const [step, setStep] = React.useState<"name" | "photo" | "review">(
    requiresIdentity ? "name" : "photo",
  );
  const [name, setName] = React.useState("");
  const [file, setFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [dict, setDict] = React.useState<Dict | null>(null);

  React.useEffect(() => {
    getClientDictionary().then(setDict);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleNext = () => {
    if (step === "name") {
      if (!name.trim()) {
        toast.error(dict?.identity?.name_required_error || "Unesite ime i prezime.");
        return;
      }
      if (requiresPhoto) setStep("photo");
      else setStep("review");
    } else if (step === "photo") {
      if (!file) {
        toast.error(dict?.identity?.add_photo_error || "Dodajte fotografiju.");
        return;
      }
      setStep("review");
    }
  };

  const handleSubmit = async () => {
    setIsUploading(true);

    try {
      let photoUrl = "";
      if (file) {
        const response = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, {
          method: "POST",
          body: file,
        });
        const blob = await response.json();
        if (!response.ok) throw new Error("Upload failed");
        photoUrl = blob.url;
      }

      onComplete({
        holderName: name || undefined,
        holderPhotoUrl: photoUrl || undefined,
      });
    } catch {
      toast.error(dict?.identity?.save_error || "Greška pri čuvanju. Pokušajte ponovo.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {step === "name" && requiresIdentity && (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-white">
              {dict?.identity?.name_label || "Ime i prezime"}
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={dict?.identity?.name_placeholder || "Pera Perić"}
              className="border-white/10 bg-white/5 text-white"
            />
          </div>
          <Button
            onClick={handleNext}
            className="h-14 w-full rounded-2xl bg-white font-bold text-black hover:bg-zinc-200"
          >
            {dict?.identity?.next || "Dalje"}
          </Button>
        </div>
      )}

      {step === "photo" && requiresPhoto && (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-white">
              {dict?.identity?.photo_label || "Fotografija"}
            </label>
            {preview ? (
              <div className="relative h-40 w-full overflow-hidden rounded-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="Preview" className="h-full w-full object-cover" />
                <button
                  onClick={() => {
                    setFile(null);
                    setPreview(null);
                  }}
                  className="absolute top-2 right-2 rounded-full bg-black/60 p-2 text-white"
                >
                  ✕
                </button>
              </div>
            ) : (
              <label className="flex h-40 w-full cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed border-white/10 bg-white/5 text-sm text-white/50 transition-colors hover:border-white/20 hover:text-white/70">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {dict?.identity?.click_to_add_photo || "Kliknite za dodavanje fotografije"}
              </label>
            )}
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="h-14 flex-1 rounded-2xl border-white/10 bg-transparent hover:bg-white/5"
              onClick={() => setStep(requiresIdentity ? ("name" as const) : ("photo" as const))}
            >
              {dict?.identity?.back || "Nazad"}
            </Button>
            <Button
              onClick={file ? handleNext : handleSubmit}
              className="h-14 flex-1 rounded-2xl bg-white font-bold text-black hover:bg-zinc-200"
            >
              {file ? dict?.identity?.next || "Dalje" : dict?.identity?.skip || "Preskoči"}
            </Button>
          </div>
        </div>
      )}

      {step === "review" && (
        <div className="space-y-4">
          {name && (
            <div className="text-sm text-white/70">
              <span className="font-bold text-white">
                {dict?.identity?.name_preview_label || "Ime:"}
              </span>{" "}
              {name}
            </div>
          )}
          {preview && (
            <div className="relative h-32 w-32 overflow-hidden rounded-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Preview" className="h-full w-full object-cover" />
            </div>
          )}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="h-14 flex-1 rounded-2xl border-white/10 bg-transparent hover:bg-white/5"
              onClick={() => setStep(requiresPhoto ? "photo" : "name")}
            >
              {dict?.identity?.back || "Nazad"}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isUploading}
              className="h-14 flex-1 rounded-2xl bg-white font-bold text-black hover:bg-zinc-200"
            >
              {isUploading
                ? dict?.identity?.sending || "Slanje..."
                : dict?.identity?.confirm || "Potvrdi"}
            </Button>
          </div>
        </div>
      )}

      {onCancel && (
        <button
          onClick={onCancel}
          className="w-full text-center text-xs text-white/30 transition-colors hover:text-white/50"
        >
          {dict?.identity?.cancel || "Otkaži"}
        </button>
      )}
    </div>
  );
}
