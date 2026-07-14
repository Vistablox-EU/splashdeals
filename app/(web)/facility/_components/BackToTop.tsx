"use client";

import { Icon } from "@/components/ui/Icon";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * ⬆️ BackToTop — Floating action button
 * Appears after scrolling past the hero threshold.
 * Smooth-scrolls to the top of the page on click.
 */
export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > window.innerHeight * 0.6);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <button
      onClick={scrollToTop}
      aria-label="Nazad na vrh"
      className={cn(
        "bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/30 fixed right-5 bottom-24 z-50 flex h-11 w-11 items-center justify-center rounded-full shadow-lg transition-all duration-300 active:scale-90 md:bottom-8",
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0",
      )}
    >
      <Icon name="arrow_upward" className="text-[20px]" />
    </button>
  );
}
