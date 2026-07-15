"use client";

import { useCallback, useEffect, useState, startTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Icon } from "@/components/ui/Icon";

interface OrphanedMediaItem {
  id: string;
  filename: string;
  url: string;
  size: number;
  createdAt: string;
}

function formatSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

export default function OrphanedMediaPage() {
  const [items, setItems] = useState<OrphanedMediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchOrphans = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { listOrphanedMediaAction } = await import("@/app/(server)/actions/cms-media");
      const result = await listOrphanedMediaAction();
      if (result.success && result.data) {
        setItems(result.data as OrphanedMediaItem[]);
      } else {
        setError(result.error || "Greška pri učitavanju.");
      }
    } catch {
      setError("Greška pri učitavanju.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    startTransition(() => {
      fetchOrphans();
    });
  }, [fetchOrphans]);

  const handleDeleteAll = useCallback(async () => {
    if (items.length === 0) return;

    setDeleting(true);
    try {
      const { batchDeleteMediaAction } = await import("@/app/(server)/actions/cms-media");
      const result = await batchDeleteMediaAction({
        ids: items.map((i) => i.id),
        force: true,
      });
      if (result.success) {
        toast.success(`Obrisano ${result.data?.deleted || 0} medija.`);
        setItems([]);
      } else {
        toast.error(result.error || "Greška pri brisanju.");
      }
    } catch {
      toast.error("Greška pri brisanju.");
    } finally {
      setDeleting(false);
    }
  }, [items]);

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Neiskorišćeni mediji</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Mediji koji se ne koriste ni u jednoj blog objavi ili strani.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchOrphans} disabled={loading}>
            <Icon name="refresh" className="size-4" />
            Osveži
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeleteAll}
            disabled={items.length === 0 || deleting}
          >
            {deleting ? (
              <Icon name="progress_activity" className="size-4 animate-spin" />
            ) : (
              <Icon name="delete_sweep" className="size-4" />
            )}
            Obriši sve ({items.length})
          </Button>
        </div>
      </div>

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      )}

      {error && (
        <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
          <Icon name="error" className="text-destructive size-12" />
          <p className="text-muted-foreground text-sm">{error}</p>
          <Button variant="outline" onClick={fetchOrphans}>
            Pokušaj ponovo
          </Button>
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
          <Icon name="check_circle" className="text-primary size-12" />
          <p className="text-muted-foreground text-sm">
            Nema neiskorišćenih medija. Sve datoteke se koriste u objavama ili stranama.
          </p>
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Naziv datoteke</TableHead>
                <TableHead>Veličina</TableHead>
                <TableHead>Datum otpremanja</TableHead>
                <TableHead className="w-[100px]">URL</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.filename}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">
                      {formatSize(item.size)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(item.createdAt).toLocaleDateString("sr-RS", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </TableCell>
                  <TableCell>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary text-xs underline"
                    >
                      Otvori
                    </a>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
