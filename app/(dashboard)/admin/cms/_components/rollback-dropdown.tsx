"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Icon } from "@/components/ui/Icon";

interface Revision {
  id: string;
  title: string;
  createdAt: string;
}

interface RollbackDropdownProps {
  postId: string;
  onRestore: (title: string, content: string, excerpt: string) => void;
}

export function RollbackDropdown({ postId, onRestore }: RollbackDropdownProps) {
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [selectedRevisionId, setSelectedRevisionId] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!postId) return;

    const fetchRevisions = async () => {
      setLoading(true);
      try {
        const mod = await import("@/app/(server)/actions/cms");
        const result = await mod.getBlogPostRevisionsAction(postId);
        if (result.success && result.data) {
          setRevisions(result.data as Revision[]);
        }
      } catch {
        // Ignore
      } finally {
        setLoading(false);
      }
    };

    fetchRevisions();
  }, [postId]);

  const handleRestore = useCallback(async () => {
    if (!selectedRevisionId) return;

    const revision = revisions.find((r) => r.id === selectedRevisionId);
    if (!revision) return;

    try {
      const mod = await import("@/app/(server)/actions/cms");
      const result = await mod.getBlogPostRevisionAction(selectedRevisionId);
      if (result.success && result.data) {
        const data = result.data as { title: string; content: string; excerpt: string | null };
        onRestore(data.title, data.content, data.excerpt || "");
        toast.success("Revizija vraćena. Sačuvaj objavu da bi izmene ostale.");
        setSelectedRevisionId("");
      } else {
        toast.error(result.error || "Greška pri učitavanju revizije.");
      }
    } catch {
      toast.error("Greška pri vraćanju revizije.");
    }
  }, [selectedRevisionId, revisions, onRestore]);

  if (revisions.length === 0 && !loading) return null;

  return (
    <div className="flex items-center gap-2">
      <Icon name="history" className="size-4 text-muted-foreground" />
      <Select value={selectedRevisionId} onValueChange={setSelectedRevisionId}>
        <SelectTrigger className="h-8 w-[240px] text-xs" aria-label="Vrati na reviziju">
          <SelectValue
            placeholder={loading ? "Učitavanje..." : "Vrati na reviziju"}
          />
        </SelectTrigger>
        <SelectContent>
          {revisions.map((rev) => (
            <SelectItem key={rev.id} value={rev.id} className="text-xs">
              {rev.title.slice(0, 40)}
              {rev.title.length > 40 ? "…" : ""} —{" "}
              {new Date(rev.createdAt).toLocaleDateString("sr-RS", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={!selectedRevisionId}
        onClick={handleRestore}
        className="h-8 text-xs"
      >
        Vrati
      </Button>
    </div>
  );
}
