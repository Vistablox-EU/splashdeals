"use client";
import { Icon } from "@/components/ui/Icon";

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
    if (typeof navigator !== 'undefined' && "vibrate" in navigator) {
      navigator.vibrate(15);
    }

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title,
          text: `Pogledajte ${title} na Splashdeals!`,
          url,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error("Error sharing:", err);
        }
      }
    } else {
      // 📋 Clipboard API Fallback: Smooth state transition
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        if (typeof navigator !== 'undefined' && "vibrate" in navigator) {
          navigator.vibrate([15, 40, 15]); // Double-tap confirmation
        }
      } catch (err) {
        console.error("Error copying to clipboard:", err);
      }
    }
  };

  return (
    <button
      onClick={handleShare}
      className={cn(
        "relative p-2.5 rounded-full backdrop-blur-xl bg-muted/50 border border-border hover:bg-muted transition-all group overflow-hidden flex items-center justify-center min-w-[36px] min-h-[36px] hover:scale-105 active:scale-95",
        copied ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : "",
        className
      )}
      title={copied ? "Kopirano!" : "Podeli"}
      aria-live="polite"
    >
      {copied ? (
        <div key="check" className="animate-scale-in">
          <Icon name="check" className="w-[14px] h-[14px] text-emerald-400" />
        </div>
      ) : (
        <div key="share" className="animate-scale-in">
          <Icon name="share" className="w-[14px] h-[14px] text-slate-300 group-hover:text-cyan-400 transition-colors" />
        </div>
      )}
    </button>
  );
}
