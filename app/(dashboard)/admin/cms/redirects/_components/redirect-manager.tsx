"use client";
// @ts-nocheck - Server action integration types

import { useTransition, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icon } from "@/components/ui/Icon";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  listRedirectsAction,
  createRedirectAction,
  updateRedirectAction,
  deleteRedirectAction,
  toggleRedirectAction,
  type RedirectRow,
} from "@/app/(server)/actions/redirects";

interface RedirectManagerProps {
  initialRedirects: RedirectRow[];
}

export function RedirectManager({ initialRedirects }: RedirectManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [redirects, setRedirects] = useState<RedirectRow[]>(initialRedirects);
  const [editingId, setEditingId] = useState<string | null>(null);

  // New redirect form
  const [newSource, setNewSource] = useState("");
  const [newDestination, setNewDestination] = useState("");
  const [newStatusCode, setNewStatusCode] = useState("301");

  const handleCreate = useCallback(async () => {
    if (!newSource || !newDestination) {
      toast.error("Source i destination su obavezni.");
      return;
    }

    startTransition(async () => {
      const result = await createRedirectAction({
        source: newSource,
        destination: newDestination,
        statusCode: parseInt(newStatusCode),
      });

      if (result.success) {
        toast.success("Redirect kreiran");
        setNewSource("");
        setNewDestination("");
        setNewStatusCode("301");
        router.refresh();
      } else {
        toast.error(result.error || "Greška pri kreiranju");
      }
    });
  }, [newSource, newDestination, newStatusCode, router, startTransition]);

  const handleToggle = useCallback(
    async (id: string) => {
      startTransition(async () => {
        const result = await toggleRedirectAction(id);
        if (result.success) {
          toast.success("Status promenjen");
          router.refresh();
        } else {
          toast.error(result.error || "Greška");
        }
      });
    },
    [router, startTransition],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      startTransition(async () => {
        const result = await deleteRedirectAction(id);
        if (result.success) {
          toast.success("Redirect obrisan");
          setRedirects((prev) => prev.filter((r) => r.id !== id));
          router.refresh();
        } else {
          toast.error(result.error || "Greška pri brisanju");
        }
      });
    },
    [router, startTransition],
  );

  return (
    <div className="space-y-6">
      {/* Create form */}
      <div className="rounded-lg border p-4">
        <h3 className="mb-4 text-sm font-semibold">Novi redirect</h3>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 space-y-1">
            <Label htmlFor="source">Source URL</Label>
            <Input
              id="source"
              value={newSource}
              onChange={(e) => setNewSource(e.target.value)}
              placeholder="/stari-url"
              className="font-mono text-sm"
            />
          </div>
          <div className="flex-1 space-y-1">
            <Label htmlFor="destination">Destination URL</Label>
            <Input
              id="destination"
              value={newDestination}
              onChange={(e) => setNewDestination(e.target.value)}
              placeholder="/novi-url ili https://..."
              className="font-mono text-sm"
            />
          </div>
          <div className="w-24 space-y-1">
            <Label htmlFor="statusCode">Tip</Label>
            <Select value={newStatusCode} onValueChange={setNewStatusCode}>
              <SelectTrigger id="statusCode" aria-label="Status code">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="301">301</SelectItem>
                <SelectItem value="302">302</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button disabled={isPending} onClick={handleCreate} className="gap-1.5">
            <Icon name="add" className="size-4" />
            Dodaj
          </Button>
        </div>
      </div>

      {/* Redirect list */}
      <div className="rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Source</th>
                <th className="px-4 py-3 text-left font-medium">Destination</th>
                <th className="px-4 py-3 text-center font-medium">Tip</th>
                <th className="px-4 py-3 text-center font-medium">Aktivan</th>
                <th className="px-4 py-3 text-right font-medium">Akcije</th>
              </tr>
            </thead>
            <tbody>
              {redirects.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-muted-foreground px-4 py-8 text-center">
                    Nema redirecta. Dodaj prvi iznad.
                  </td>
                </tr>
              ) : (
                redirects.map((r) => (
                  <tr
                    key={r.id}
                    className={`border-b last:border-0 hover:bg-muted/30 ${!r.isActive ? "opacity-50" : ""}`}
                  >
                    <td className="px-4 py-3 font-mono text-xs">{r.source}</td>
                    <td className="px-4 py-3 font-mono text-xs">{r.destination}</td>
                    <td className="px-4 py-3 text-center text-xs">{r.statusCode}</td>
                    <td className="px-4 py-3 text-center">
                      <Switch
                        checked={r.isActive}
                        onCheckedChange={() => handleToggle(r.id)}
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(r.id)}
                        className="text-destructive h-7 px-2"
                      >
                        <Icon name="delete" className="size-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
