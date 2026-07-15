"use client";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/button";

import { cn } from "@/lib/utils";
import { useState } from "react";

interface ShareButtonProps {
  title: string;
  url: string;
  className?: string;
}

/**
 * 🔗 ShareButton Island (Client)
 * Integrates Web Share & Clipboard APIs with rich physical vibration callbacks
 * and real-time visual state mutations for absolute user confidence.
 */
export function ShareButton({ title, url, className }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    // 📳 Haptic Vibration API: Feedback confirmation
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(15);
    }

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title,
          text: `Pogledajte ${title} na Splashdeals!`,
          url,
        });
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("Error sharing:", err);
        }
      }
    } else {
      // 📋 Clipboard API Fallback: Smooth state transition
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        if (typeof navigator !== "undefined" && "vibrate" in navigator) {
          navigator.vibrate([15, 40, 15]); // Double-tap confirmation
        }
      } catch (err) {
        console.error("Error copying to clipboard:", err);
      }
    }
  };

  return (
    <Button
      onClick={handleShare}
      variant="outline"
      size="icon"
      className={cn(
        "bg-muted/50 border-border hover:bg-muted group relative overflow-hidden rounded-full p-2.5 backdrop-blur-xl transition-all hover:scale-105 active:scale-95",
        copied ? "border-primary/30 bg-primary/10 text-primary" : "",
        className,
      )}
      title={copied ? "Kopirano!" : "Podeli"}
      aria-label={copied ? "Kopirano!" : "Podeli"}
      aria-live="polite"
    >
      {copied ? (
        <div key="check" className="animate-scale-in">
          <Icon name="check" className="text-primary h-[14px] w-[14px]" />
        </div>
      ) : (
        <div key="share" className="animate-scale-in">
          <Icon
            name="share"
            className="text-muted-foreground group-hover:text-primary h-[14px] w-[14px] transition-colors"
          />
        </div>
      )}
    </Button>
  );
}
