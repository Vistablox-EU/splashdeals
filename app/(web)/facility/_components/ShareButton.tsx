"use client";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/button";

import { cn } from "@/lib/utils";
import { useState } from "react";

interface ShareButtonProps {
  title: string;
  url: string;
  className?: string;
  shareLabel?: string;
  copiedLabel?: string;
  shareText?: string;
}

/**
 * 🔗 ShareButton Island (Client)
 * Mobile: 44×44 touch target (WCAG 2.5.8) + explicit aria-label.
 */
export function ShareButton({
  title,
  url,
  className,
  shareLabel = "Podeli",
  copiedLabel = "Kopirano!",
  shareText,
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(15);
    }

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title,
          text: shareText || `Pogledajte ${title} na Splashdeals!`,
          url,
        });
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("Error sharing:", err);
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        if (typeof navigator !== "undefined" && "vibrate" in navigator) {
          navigator.vibrate([15, 40, 15]);
        }
      } catch (err) {
        console.error("Error copying to clipboard:", err);
      }
    }
  };

  const label = copied ? copiedLabel : shareLabel;

  return (
    <Button
      onClick={handleShare}
      variant="outline"
      size="icon"
      className={cn(
        "bg-muted/50 border-border hover:bg-muted group relative size-11 overflow-hidden rounded-full backdrop-blur-xl transition-colors hover:scale-105 active:scale-95",
        copied ? "border-primary/30 bg-primary/10 text-primary" : "",
        className,
      )}
      title={label}
      aria-label={label}
      aria-live="polite"
    >
      {copied ? (
        <div key="check" className="animate-scale-in">
          <Icon name="check" className="text-primary size-5" />
        </div>
      ) : (
        <div key="share" className="animate-scale-in">
          <Icon
            name="share"
            className="text-muted-foreground group-hover:text-primary size-5 transition-colors"
          />
        </div>
      )}
    </Button>
  );
}
