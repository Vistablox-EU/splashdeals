"use client";

import { useState, useEffect } from "react";

interface UseHeaderScrollReturn {
  isOnline: boolean;
  isTabActive: boolean;
  isReducedMotion: boolean;
  mounted: boolean;
  scrolled: boolean;
  scrollY: number;
}

export function useHeaderScroll(): UseHeaderScrollReturn {
  const [mounted, setMounted] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isTabActive, setIsTabActive] = useState(true);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const timer = requestAnimationFrame(() => setMounted(true));

    if (typeof window !== "undefined") {
      // 1. Scroll tracking
      const handleScroll = () => {
        const y = window.scrollY;
        setScrollY(y);
        setScrolled(y > 10);
      };
      handleScroll();
      window.addEventListener("scroll", handleScroll, { passive: true });

      // 2. Online/Offline Event Monitoring
      Promise.resolve().then(() => { if (!navigator.onLine) setIsOnline(false); });
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      // 3. Page Visibility API
      const handleVisibility = () => setIsTabActive(document.visibilityState === "visible");
      document.addEventListener("visibilitychange", handleVisibility);

      // 4. Network Information API (Save Data Protocol)
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      if (connection?.saveData) Promise.resolve().then(() => setIsReducedMotion(true));

      // 5. Prefers Reduced Motion Media API
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      if (mediaQuery.matches) Promise.resolve().then(() => setIsReducedMotion(true));

      return () => {
        cancelAnimationFrame(timer);
        window.removeEventListener("scroll", handleScroll);
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
        document.removeEventListener("visibilitychange", handleVisibility);
      };
    }

    return () => {
      cancelAnimationFrame(timer);
    };
  }, []);

  return {
    isOnline,
    isTabActive,
    isReducedMotion,
    mounted,
    scrolled,
    scrollY,
  };
}
