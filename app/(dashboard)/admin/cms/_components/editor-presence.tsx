"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";

interface EditorInfo {
  userId: string;
  name: string;
  image: string | null;
  lastSeen: string;
}

interface EditorPresenceProps {
  postId?: string;
  pageId?: string;
  currentUserId: string;
}

export function EditorPresence({ postId, pageId, currentUserId }: EditorPresenceProps) {
  const [editors, setEditors] = useState<EditorInfo[]>([]);

  useEffect(() => {
    if (!postId && !pageId) return;

    const fetchPresence = async () => {
      try {
        const params = new URLSearchParams();
        if (postId) params.set("postId", postId);
        if (pageId) params.set("pageId", pageId);

        const res = await fetch(`/api/cms/presence?${params.toString()}`);
        if (!res.ok) return;

        const data = await res.json();
        const filtered = (data.editors || []).filter((e: EditorInfo) => e.userId !== currentUserId);
        setEditors(filtered);
      } catch {
        // Ignore
      }
    };

    // Initial fetch + poll every 15 seconds
    fetchPresence();

    // Also send heartbeat every 15 seconds
    const heartbeat = setInterval(async () => {
      try {
        await fetch("/api/cms/presence", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: currentUserId,
            postId,
            pageId,
          }),
        });
      } catch {
        // Ignore
      }
    }, 15_000);

    const fetchInterval = setInterval(fetchPresence, 15_000);

    return () => {
      clearInterval(heartbeat);
      clearInterval(fetchInterval);
    };
  }, [postId, pageId, currentUserId]);

  if (editors.length === 0) return null;

  return (
    <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
      <div className="flex items-center gap-2">
        <Icon name="group" className="size-4 text-blue-600" />
        <span className="text-xs font-medium text-blue-700">Ko još uređuje</span>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {editors.map((editor) => (
          <div
            key={editor.userId}
            className="flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs text-blue-700 shadow-sm"
          >
            <span className="relative flex size-3 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex size-3 rounded-full bg-green-500" />
            </span>
            {editor.image ? (
              <img
                src={editor.image}
                alt={editor.name}
                className="size-4 rounded-full object-cover"
              />
            ) : (
              <Icon name="person" className="size-3.5" />
            )}
            <span>{editor.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
