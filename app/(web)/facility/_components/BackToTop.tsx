"use client";

import { Icon } from "@/components/ui/Icon";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useServerCart } from "@/hooks/use-server-cart";

/**
 * ⬆️ BackToTop — Floating action button
 * Appears after scrolling past the hero threshold.
 * Hidden while sticky mini-cart is visible (totalItems > 0) to avoid FAB collision.
 * Mobile offset clears BottomNav (+ safe-area).
 */
export function BackToTop() {
  const [visible, setVisible] = useState(false);
  const totalItems = useServerCart((s) => s.totalItems);

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

  // Avoid stacking FABs above BottomNav when sticky cart is up
  const show = visible && totalItems === 0;

  return (
    <Button
      type="button"
      onClick={scrollToTop}
      aria-label="Nazad na vrh"
      size="icon"
      className={cn(
        "bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/30 fixed right-5 bottom-[calc(6rem+env(safe-area-inset-bottom,0px))] z-50 size-11 rounded-full shadow-lg transition-[opacity,transform] duration-300 motion-reduce:transition-none active:scale-90 md:bottom-8",
        show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0",
      )}
    >
      <Icon name="arrow_upward" className="text-[20px]" />
    </Button>
  );
}
