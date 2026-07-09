"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function CropModal({
  media,
  onClose,
  onSave,
}: {
  media: { id: string; url: string };
  onClose: () => void;
  onSave: (file: File) => Promise<void>;
}) {
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "4:3" | "1:1">("16:9");
  const [zoom, setZoom] = useState(1.0);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Load image programmatically — no <img> tag needed for canvas operations
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imageRef.current = img;
      setZoom(1.0001); // Trigger re-render to draw preview
    };
    img.src = media.url;
  }, [media.url]);

  // Redraw preview canvas whenever sliders or aspect ratio changes
  useEffect(() => {
    const img = imageRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions based on preset ratio
    let targetW = 400;
    let targetH = 225; // Default 16:9 preview size

    if (aspectRatio === "4:3") {
      targetW = 400;
      targetH = 300;
    } else if (aspectRatio === "1:1") {
      targetW = 350;
      targetH = 350;
    }

    canvas.width = targetW;
    canvas.height = targetH;

    // Centering calculations
    ctx.fillStyle = "#090d16";
    ctx.fillRect(0, 0, targetW, targetH);

    const imgRatio = img.naturalWidth / img.naturalHeight;
    const canvasRatio = targetW / targetH;

    let drawW = targetW;
    let drawH = targetH;

    if (imgRatio > canvasRatio) {
      drawW = targetH * imgRatio;
    } else {
      drawH = targetW / imgRatio;
    }

    drawW *= zoom;
    drawH *= zoom;

    const x = (targetW - drawW) / 2 + (offsetX * targetW) / 100;
    const y = (targetH - drawH) / 2 + (offsetY * targetH) / 100;

    ctx.drawImage(img, x, y, drawW, drawH);
  }, [aspectRatio, zoom, offsetX, offsetY]);

  const handleSave = async () => {
    const img = imageRef.current;
    if (!img) return;

    setIsSaving(true);

    try {
      // Build the high-resolution cropped image on a large canvas
      let targetW = 1200;
      let targetH = 675; // Default 16:9 high-res

      if (aspectRatio === "4:3") {
        targetW = 1000;
        targetH = 750;
      } else if (aspectRatio === "1:1") {
        targetW = 800;
        targetH = 800;
      }

      const canvas = document.createElement("canvas");
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        toast.error("Canvas nije podržan u ovom pregledaču.");
        setIsSaving(false);
        return;
      }

      ctx.fillStyle = "#090d16";
      ctx.fillRect(0, 0, targetW, targetH);

      const imgRatio = img.naturalWidth / img.naturalHeight;
      const canvasRatio = targetW / canvas.height;

      let drawW = targetW;
      let drawH = targetH;

      if (imgRatio > canvasRatio) {
        drawW = targetH * imgRatio;
      } else {
        drawH = targetW / imgRatio;
      }

      drawW *= zoom;
      drawH *= zoom;

      const x = (targetW - drawW) / 2 + (offsetX * targetW) / 100;
      const y = (targetH - drawH) / 2 + (offsetY * targetH) / 100;

      ctx.drawImage(img, x, y, drawW, drawH);

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, "image/webp", 0.85);
      });

      if (!blob) {
        toast.error("Greška pri kreiranju slike.");
        setIsSaving(false);
        return;
      }

      const file = new File([blob], `cropped-${Date.now()}.webp`, { type: "image/webp" });
      await onSave(file);
    } catch (err) {
      console.error("[CropModal]", err);
      toast.error("Došlo je do greške prilikom sečenja slike.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-background/80 animate-in fade-in fixed inset-0 z-[999] flex items-center justify-center p-4 backdrop-blur-md duration-300">
      <div className="bg-muted/90 border-border animate-in zoom-in-95 flex w-full max-w-lg flex-col gap-6 rounded-3xl border p-6 shadow-[0_0_50px_rgba(6,182,212,0.15)] duration-300">
        <div className="border-border/50 flex items-center justify-between border-b pb-4">
          <div>
            <h3 className="text-foreground text-lg font-black tracking-tighter uppercase">
              Iseci fotografiju
            </h3>
            <p className="text-muted-foreground mt-0.5 text-[10px] tracking-wider uppercase">
              Crop utility: re-encodes to high-density WebP
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="size-8 rounded-xl"
            aria-label="Close crop dialog"
          >
            <Icon name="close" className="size-4" />
          </Button>
        </div>

        {/* Live Canvas Preview */}
        <div className="bg-background/80 border-border/50 flex justify-center overflow-hidden rounded-2xl border py-4">
          <canvas
            ref={canvasRef}
            className="border-border/50 max-w-full rounded-xl border shadow-2xl"
          />
        </div>

        {/* Presets and Sliders */}
        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-muted-foreground text-[9px] font-black tracking-widest uppercase">
              Proporcija (Aspect Ratio)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "16:9", label: "16:9 (Hero/Bazen)" },
                { id: "4:3", label: "4:3 (Kartica BG)" },
                { id: "1:1", label: "1:1 (Kvadrat)" },
              ].map((ratio) => (
                <Button
                  key={ratio.id}
                  variant={aspectRatio === ratio.id ? "default" : "outline"}
                  size="sm"
                  type="button"
                  onClick={() => setAspectRatio(ratio.id as typeof aspectRatio)}
                  className={cn(
                    "rounded-lg py-1.5 text-[9px] font-black tracking-widest uppercase transition-all",
                    aspectRatio === ratio.id
                      ? "border border-cyan-500 bg-cyan-500/20 text-cyan-400"
                      : "bg-muted/10 border-border/50 text-muted-foreground hover:text-foreground border",
                  )}
                >
                  {ratio.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Slider controls */}
          <div className="border-border/50 space-y-3 rounded-xl border bg-white/[0.01] p-3">
            {/* Zoom Slider */}
            <div className="flex flex-col gap-1.5">
              <div className="text-muted-foreground flex items-center justify-between text-[9px] font-black tracking-widest uppercase">
                <span>Uvećanje (Zoom)</span>
                <span className="font-mono text-cyan-400">{zoom.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="3.0"
                step="0.1"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="bg-background h-1 w-full cursor-pointer appearance-none rounded-lg accent-cyan-500"
              />
            </div>

            {/* Horizontal Position X Slider */}
            <div className="flex flex-col gap-1.5">
              <div className="text-muted-foreground flex items-center justify-between text-[9px] font-black tracking-widest uppercase">
                <span>Vodoravno pomeranje (X osa)</span>
                <span className="font-mono text-cyan-400">{offsetX}%</span>
              </div>
              <input
                type="range"
                min="-50"
                max="50"
                step="1"
                value={offsetX}
                onChange={(e) => setOffsetX(parseInt(e.target.value))}
                className="bg-background h-1 w-full cursor-pointer appearance-none rounded-lg accent-cyan-500"
              />
            </div>

            {/* Vertical Position Y Slider */}
            <div className="flex flex-col gap-1.5">
              <div className="text-muted-foreground flex items-center justify-between text-[9px] font-black tracking-widest uppercase">
                <span>Uspravno pomeranje (Y osa)</span>
                <span className="font-mono text-cyan-400">{offsetY}%</span>
              </div>
              <input
                type="range"
                min="-50"
                max="50"
                step="1"
                value={offsetY}
                onChange={(e) => setOffsetY(parseInt(e.target.value))}
                className="bg-background h-1 w-full cursor-pointer appearance-none rounded-lg accent-cyan-500"
              />
            </div>
          </div>
        </div>

        {/* Modal CTAs */}
        <div className="border-border/50 flex items-center justify-end gap-3 border-t pt-4">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isSaving}
            className="h-9 px-4 text-[10px] font-black tracking-widest uppercase"
          >
            Otkaži
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="h-9 gap-2 bg-cyan-500 px-5 text-[10px] font-black tracking-widest text-slate-950 uppercase shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:bg-cyan-400"
          >
            {isSaving ? (
              <>
                <Icon name="progress_activity" className="size-3 animate-spin text-slate-950" />
                Sečenje...
              </>
            ) : (
              <>
                <Icon name="crop" className="size-3 text-slate-950" />
                Sačuvaj i Otpremi
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

