"use client";
import { Icon } from "@/components/ui/Icon";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ShareButtonProps {
  title: string;
  text?: string;
  url?: string;
}

export function ShareButton({ title, text }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    // 📳 HTML5 Vibration API: Feedback loop
    if ("vibrate" in navigator) {
      navigator.vibrate(20);
    }

    const shareData = {
      title: title,
      text: text || `Pogledajte ovu ulaznicu na Splashdeals!`,
      url: window.location.href,
    };

    const isShareable = typeof window !== "undefined" && !!navigator.share;

    if (isShareable) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // User aborted or failed, ignore silently
        if ((err as Error).name !== "AbortError") {
           console.error("Share failure:", err);
        }
      }
    } else {
      // 📋 HTML5 Clipboard API: Strict fallback
      try {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        toast.success("Link kopiran u clipboard!");
        setTimeout(() => setCopied(false), 2000);
      } catch {
        toast.error("Nije moguće kopirati link.");
      }
    }
  };

  return (
    <Button
      onClick={handleShare}
      variant="ghost"
      size="icon"
      className="rounded-full bg-white/5 hover:bg-cyan-500/20 hover:text-cyan-400 border border-white/10 transition-all duration-300 group shrink-0"
      aria-label="Podeli ulaznicu"
    >
      {copied ? (
        <Icon name="check" className="text-[16px] text-emerald-400 animate-in zoom-in duration-200" />
      ) : (
        <Icon name="share" className="text-[16px] opacity-70 group-hover:opacity-100 transition-all group-hover:scale-110" />
      )}
    </Button>
  );
}
