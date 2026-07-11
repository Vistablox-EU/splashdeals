"use client";

import { useEffect, useRef, useState, useCallback, startTransition } from "react";

export interface AutosaveData {
  title: string;
  content: string;
  excerpt?: string;
  coverImage?: string;
  featuredImage?: string;
  status?: string;
  categoryId?: string;
  metaTitle?: string;
  metaDescription?: string;
  savedAt: number;
}

export function useCmsAutosave(formKey: string, data: AutosaveData, isDirty: boolean) {
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isDirty) return;

    startTransition(() => {
      setStatus("saving");
    });
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      try {
        const payload: AutosaveData = { ...data, savedAt: Date.now() };
        localStorage.setItem(formKey, JSON.stringify(payload));
        setStatus("saved");
      } catch {
        // localStorage full or unavailable
      }
    }, 30000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isDirty, data, formKey]);

  const restore = useCallback((): AutosaveData | null => {
    try {
      const raw = localStorage.getItem(formKey);
      if (!raw) return null;
      return JSON.parse(raw) as AutosaveData;
    } catch {
      return null;
    }
  }, [formKey]);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(formKey);
    setStatus("idle");
  }, [formKey]);

  const migrateDraft = useCallback(
    (newKey: string) => {
      try {
        const raw = localStorage.getItem(formKey);
        if (raw) {
          localStorage.setItem(newKey, raw);
          localStorage.removeItem(formKey);
        }
      } catch {}
    },
    [formKey],
  );

  return { status, restore, clearDraft, migrateDraft };
}
