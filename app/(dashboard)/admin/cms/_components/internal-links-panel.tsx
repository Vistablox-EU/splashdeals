"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/Icon";
import { getFacilityNamesAction } from "@/app/(server)/actions/cms";

interface Facility {
  name: string;
  slug: string;
}

interface InternalLinksPanelProps {
  content?: string;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

export function InternalLinksPanel({ content }: InternalLinksPanelProps) {
  const { watch } = useFormContext();
  const contentHtml = content || watch("content") || "";
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFacilityNamesAction().then((result) => {
      if (result.success && result.data) {
        setFacilities(result.data);
      }
      setLoading(false);
    });
  }, []);

  const text = useMemo(() => stripHtml(contentHtml).toLowerCase(), [contentHtml]);

  const suggestions = useMemo(() => {
    if (!text || facilities.length === 0) return [];

    return facilities
      .filter((f) => {
        const name = f.name.toLowerCase();
        // Check if facility name appears in text
        return text.includes(name) && name.length > 2;
      })
      .slice(0, 10); // Max 10 suggestions
  }, [text, facilities]);

  const insertLink = useCallback((facilitySlug: string, facilityName: string) => {
    // Get the editor element and insert a link
    const editorEl = document.querySelector(".ProseMirror");
    if (editorEl) {
      // We can't directly manipulate Tiptap from here, but we can provide
      // the link markup that the user can paste. We'll set a clipboard
      // approach: copy the link to clipboard
      const link = `https://splashdeals.rs/akva-park/${facilitySlug}`;
      const html = `<a href="${link}" target="_blank" rel="noopener noreferrer">${facilityName}</a>`;

      navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([`${facilityName} (${link})`], { type: "text/plain" }),
        }),
      ]);

      toast(`${facilityName} link kopiran. Zalepi ga u editor (Ctrl+V).`);
    }
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        <h4 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
          Predlozi linkova
        </h4>
        <p className="text-muted-foreground text-xs">Učitavanje objekata...</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h4 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
        Predlozi linkova
      </h4>

      {suggestions.length === 0 ? (
        <p className="text-muted-foreground text-xs">
          Nema pronađenih objekata u tekstu. Dodaj ime objekta pa će se link pojaviti ovde.
        </p>
      ) : (
        <div className="space-y-1.5">
          {suggestions.map((facility) => (
            <div
              key={facility.slug}
              className="flex items-center justify-between rounded-md border p-2 text-xs"
            >
              <span className="truncate font-medium">{facility.name}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 shrink-0 gap-1 text-xs"
                onClick={() => insertLink(facility.slug, facility.name)}
              >
                <Icon name="link" className="size-3" />
                Ubaci link
              </Button>
            </div>
          ))}
        </div>
      )}

      {facilities.length > 0 && suggestions.length === 0 && (
        <p className="text-muted-foreground text-xs">{facilities.length} objekata u bazi.</p>
      )}
    </div>
  );
}

// Simple toast helper to avoid import overhead
function toast(message: string) {
  // Use the DOM to dispatch a custom event that sonner can pick up
  const event = new CustomEvent("sonner-toast", {
    detail: { message, type: "info" },
  });
  window.dispatchEvent(event);
}
