"use client";

import { useRouter } from "next/navigation";
import { startTransition, useCallback, useState } from "react";
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

interface NotFoundLog {
  id: string;
  path: string;
  referrer: string | null;
  count: number;
  firstSeen: string;
  lastSeen: string;
}

export function NotFoundLogsClient({ logs }: { logs: NotFoundLog[] }) {
  const router = useRouter();
  const [items, setItems] = useState<NotFoundLog[]>(logs);
  const [loading, setLoading] = useState(false);
  const [clearingId, setClearingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleClear = useCallback(
    (id: string) => {
      if (!confirm("Da li ste sigurni da želite da obrišete ovaj zapis?")) return;

      setClearingId(id);
      startTransition(async () => {
        try {
          const { clearNotFoundLogAction } = await import("@/app/(server)/actions/cms/tools");
          const result = await clearNotFoundLogAction(id);
          if (result.success) {
            toast.success("Zapis obrisan.");
            setItems((prev) => prev.filter((item) => item.id !== id));
            router.refresh();
          } else {
            toast.error(result.error || "Greška pri brisanju.");
          }
        } catch {
          toast.error("Greška pri brisanju.");
        } finally {
          setClearingId(null);
        }
      });
    },
    [router],
  );

  const handleRefresh = useCallback(() => {
    setLoading(true);
    setError(null);
    startTransition(async () => {
      try {
        const { getNotFoundLogsAction } = await import("@/app/(server)/actions/cms/tools");
        const result = await getNotFoundLogsAction();
        if (result.success && result.data) {
          setItems(
            (
              result.data as Array<{
                id: string;
                path: string;
                referrer: string | null;
                count: number;
                firstSeen: Date;
                lastSeen: Date;
              }>
            ).map((log) => ({
              id: log.id,
              path: log.path,
              referrer: log.referrer,
              count: log.count,
              firstSeen: log.firstSeen.toISOString(),
              lastSeen: log.lastSeen.toISOString(),
            })),
          );
        } else {
          setError(result.error || "Greška pri učitavanju.");
        }
      } catch {
        setError("Greška pri učitavanju.");
      } finally {
        setLoading(false);
      }
    });
  }, []);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("sr-RS", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <Icon name="error" className="text-destructive size-12" />
        <p className="text-muted-foreground text-sm">{error}</p>
        <Button variant="outline" onClick={handleRefresh}>
          Pokušaj ponovo
        </Button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <Icon name="check_circle" className="text-primary size-12" />
        <p className="text-muted-foreground text-sm">Nema evidentiranih 404 grešaka.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Putanja</TableHead>
            <TableHead>Referer</TableHead>
            <TableHead className="w-[80px] text-center">Broj pojavljivanja</TableHead>
            <TableHead>Prvi put viđeno</TableHead>
            <TableHead>Poslednji put viđeno</TableHead>
            <TableHead className="w-[100px]">Akcije</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((log) => (
            <TableRow key={log.id}>
              <TableCell className="max-w-[300px] truncate font-mono text-sm">{log.path}</TableCell>
              <TableCell className="text-muted-foreground max-w-[200px] truncate text-sm">
                {log.referrer ? (
                  <span className="cursor-pointer underline decoration-dotted" title={log.referrer}>
                    {log.referrer.length > 40 ? `${log.referrer.slice(0, 40)}...` : log.referrer}
                  </span>
                ) : (
                  <span className="text-xs italic opacity-60">nema</span>
                )}
              </TableCell>
              <TableCell className="text-center">
                <Badge variant={log.count > 10 ? "destructive" : "secondary"} className="text-xs">
                  {log.count}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {formatDate(log.firstSeen)}
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {formatDate(log.lastSeen)}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive h-7 text-xs"
                  onClick={() => handleClear(log.id)}
                  disabled={clearingId === log.id}
                >
                  {clearingId === log.id ? (
                    <Icon name="progress_activity" className="size-3 animate-spin" />
                  ) : (
                    <Icon name="delete" className="size-3" />
                  )}
                  Očisti
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
