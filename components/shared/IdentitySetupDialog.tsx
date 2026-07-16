"use client";
import { Icon } from "@/components/ui/Icon";

import * as React from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import type { IdentityDictionary } from "@/lib/types/cart";

interface IdentitySetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requiresIdentity: boolean;
  requiresPhoto: boolean;
  onComplete: (data: { holderName?: string; holderPhotoUrl?: string }) => void;
  /** Prefill holder name from session profile (D2) */
  initialHolderName?: string | null;
  /** Serbian Latin copy from dictionaries/rs.json → identity */
  dict?: IdentityDictionary | null;
}

export function IdentitySetupDialog({
  open,
  onOpenChange,
  requiresIdentity,
  requiresPhoto,
  onComplete,
  initialHolderName,
  dict,
}: IdentitySetupDialogProps) {
  const [step, setStep] = React.useState<"name" | "photo" | "review">(
    requiresIdentity ? "name" : "photo",
  );
  const [name, setName] = React.useState(initialHolderName?.trim() || "");
  const [prevInitial, setPrevInitial] = React.useState(initialHolderName?.trim() || "");
  const [file, setFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [wasOpen, setWasOpen] = React.useState(open);

  // Prefill from profile when prop arrives (render-time sync)
  const initialTrim = initialHolderName?.trim() || "";
  if (initialTrim !== prevInitial) {
    setPrevInitial(initialTrim);
    if (initialTrim && !name) {
      setName(initialTrim);
    }
  }

  // Reset when dialog closes → opens cycle (render-time on open edge)
  if (wasOpen !== open) {
    setWasOpen(open);
    if (!open) {
      setStep(requiresIdentity ? "name" : "photo");
      setName(initialTrim);
      setFile(null);
      setPreview(null);
    }
  }

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
        toast.error(dict?.name_required_error);
        return;
      }
      if (requiresPhoto) setStep("photo");
      else setStep("review");
    } else if (step === "photo") {
      if (!file) {
        toast.error(dict?.add_photo_error);
        return;
      }
      setStep("review");
    }
  };

  const handleSubmit = async () => {
    setIsUploading(true);
    let photoUrl = "";

    try {
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
    } catch (error) {
      toast.error(dict?.save_error);
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const showName = requiresIdentity && (step === "name" || step === "review");
  const showPhoto = requiresPhoto && (step === "photo" || step === "review");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border overflow-hidden p-0 sm:max-w-[425px]">
        <div className="from-primary via-accent to-primary absolute inset-x-0 top-0 h-1 bg-gradient-to-r opacity-50" />

        <div className="p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
              <span className="bg-primary/10 text-primary rounded-xl p-2">
                <Icon name="person" className="text-[20px]" />
              </span>
              {dict?.title}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {dict?.description}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-8 space-y-6">
            {step !== "review" && requiresIdentity && step === "name" && (
              <div className="animate-in fade-in slide-in-from-bottom-2 space-y-4 duration-300">
                <label
                  htmlFor="holder-name"
                  className="text-muted-foreground text-sm font-bold tracking-widest uppercase"
                >
                  {dict?.name_label}
                </label>
                <Input
                  id="holder-name"
                  className="border-border bg-muted/40 focus:ring-primary h-14 rounded-2xl text-lg"
                  placeholder={dict?.name_placeholder}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                  aria-describedby="name-desc"
                />
                <p id="name-desc" className="text-muted-foreground text-xs italic">
                  {dict?.name_hint}
                </p>
              </div>
            )}

            {step !== "review" && requiresPhoto && step === "photo" && (
              <div className="animate-in fade-in slide-in-from-bottom-2 space-y-4 text-center duration-300">
                <label
                  htmlFor="photo-upload"
                  className="text-muted-foreground block text-left text-sm font-bold tracking-widest uppercase"
                >
                  {dict?.photo_label}
                </label>

                <div
                  className="border-border bg-muted/40 group hover:border-primary/50 relative mx-auto flex aspect-square max-w-[200px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed shadow-2xl transition-colors"
                  onClick={() => document.getElementById("photo-upload")?.click()}
                  role="button"
                  aria-label={dict?.photo_upload_aria}
                  tabIndex={0}
                  onKeyDown={(e) =>
                    e.key === "Enter" && document.getElementById("photo-upload")?.click()
                  }
                >
                  {preview ? (
                    <Image
                      src={preview}
                      alt={dict?.photo_preview_alt || ""}
                      fill
                      sizes="200px"
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="text-muted-foreground group-hover:text-foreground flex flex-col items-center gap-3 transition-colors">
                      <Icon name="photo_camera" className="mb-1 text-[40px]" />
                      <span className="text-xs font-bold tracking-tighter uppercase">
                        {dict?.click_to_add_photo}
                      </span>
                    </div>
                  )}
                  {preview && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                      <Icon name="upload" className="text-[32px] text-white" />
                    </div>
                  )}
                </div>

                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  capture="user"
                  className="hidden"
                  onChange={handleFileChange}
                  aria-describedby="photo-desc"
                />

                <p id="photo-desc" className="text-muted-foreground px-4 text-xs italic">
                  {dict?.photo_hint}
                </p>
              </div>
            )}

            {step === "review" && (
              <div className="animate-in fade-in slide-in-from-bottom-2 space-y-6 duration-300">
                <div className="border-primary/20 bg-primary/10 flex items-center gap-4 rounded-2xl border p-4">
                  <div className="bg-primary/20 text-primary flex h-10 w-10 items-center justify-center rounded-full">
                    <Icon name="check" className="text-[24px]" />
                  </div>
                  <div>
                    <h4 className="text-foreground leading-tight font-bold">
                      {dict?.review_ready_title}
                    </h4>
                    <p className="text-primary/80 text-xs">{dict?.review_ready_subtitle}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 items-center gap-4 p-2">
                  {showPhoto && preview && (
                    <Image
                      src={preview}
                      width={80}
                      height={80}
                      className="border-border h-20 w-20 rounded-2xl border object-cover"
                      alt={dict?.review_alt || ""}
                      unoptimized
                    />
                  )}
                  {showName && (
                    <div className={preview && showPhoto ? "col-span-2" : "col-span-3 text-center"}>
                      <p className="text-muted-foreground mb-1 text-xs font-black tracking-widest uppercase">
                        {dict?.pass_holder}
                      </p>
                      <p className="text-foreground truncate text-xl font-bold">{name}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              {step !== (requiresIdentity ? "name" : "photo") && (
                <Button
                  variant="outline"
                  className="border-border h-14 rounded-2xl bg-transparent"
                  onClick={() =>
                    setStep(step === "review" ? (requiresPhoto ? "photo" : "name") : "name")
                  }
                >
                  {dict?.back}
                </Button>
              )}

              {step === "review" ? (
                <Button
                  className="h-14 flex-1 rounded-2xl text-sm font-black tracking-wide uppercase italic"
                  onClick={handleSubmit}
                  disabled={isUploading}
                >
                  {isUploading ? dict?.sending : dict?.confirm_and_pay}
                </Button>
              ) : (
                <Button className="h-14 flex-1 rounded-2xl font-bold" onClick={handleNext}>
                  {dict?.next}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
