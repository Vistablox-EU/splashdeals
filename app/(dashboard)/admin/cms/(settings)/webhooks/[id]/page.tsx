"use client";

import { useCallback, useTransition, useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getWebhookAction,
  updateWebhookAction,
  testWebhookAction,
  WEBHOOK_EVENTS,
} from "@/app/(server)/actions/webhooks";

const EVENT_LABELS: Record<string, string> = {
  "post.created": "Objava kreirana",
  "post.updated": "Objava ažurirana",
  "post.deleted": "Objava obrisana",
  "page.created": "Strana kreirana",
  "page.updated": "Strana ažurirana",
  "page.deleted": "Strana obrisana",
  "category.created": "Kategorija kreirana",
  "category.updated": "Kategorija ažurirana",
  "category.deleted": "Kategorija obrisana",
};

interface WebhookData {
  id: string;
  name: string;
  url: string;
  events: string[];
  isActive: boolean;
  consecutiveFailures: number;
  createdAt: string;
  updatedAt: string;
}

interface LogEntry {
  id: string;
  event: string;
  status: string;
  responseCode: number | null;
  responseBody: string | null;
  createdAt: string;
}

export default function EditWebhookPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [isPending, startTransition] = useTransition();
  const [webhook, setWebhook] = useState<WebhookData | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    startTransition(async () => {
      const result = await getWebhookAction(id);
      if (result.success && result.data) {
        setWebhook(result.data.webhook as unknown as WebhookData);
        setLogs(result.data.logs as unknown as LogEntry[]);
      } else {
        toast.error(result.error || "Vebhuk nije pronađen.");
        router.push("/admin/cms/webhooks");
      }
      setLoading(false);
    });
  }, [id, router]);

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = e.currentTarget;
      const formData = new FormData(form);

      const name = formData.get("name") as string;
      const url = formData.get("url") as string;
      const events = WEBHOOK_EVENTS.filter((ev) => formData.get(`event_${ev}`) === "on");

      startTransition(async () => {
        const result = await updateWebhookAction(id, { name, url, events });
        if (result.success) {
          toast.success("Vebhuk ažuriran");
          router.refresh();
        } else {
          toast.error(result.error || "Greška pri ažuriranju");
        }
      });
    },
    [id, router],
  );

  const handleTest = useCallback(() => {
    startTransition(async () => {
      const result = await testWebhookAction(id);
      if (result.success) {
        toast.success(`Vebhuk testiran — status: ${result.data?.statusCode ?? "N/A"}`);
      } else {
        toast.error(result.error || "Greška pri testiranju");
      }
      // Refresh logs after test
      const refreshed = await getWebhookAction(id);
      if (refreshed.success && refreshed.data) {
        setLogs(refreshed.data.logs as unknown as LogEntry[]);
      }
    });
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="text-muted-foreground text-sm">Učitavanje...</span>
      </div>
    );
  }

  if (!webhook) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Izmeni vebhuk</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Izmeni podešavanja vebhuka i pregledaj istoriju poziva.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleTest} disabled={isPending}>
            <Icon name="play_arrow" className="mr-1 size-4" />
            Testiraj
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/cms/webhooks">
              <Icon name="arrow_back" className="size-4" />
              Nazad
            </Link>
          </Button>
        </div>
      </div>

      {/* Edit form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4 rounded-lg border p-6">
          <h3 className="text-sm font-semibold">Osnovne informacije</h3>

          <div className="space-y-1.5">
            <Label htmlFor="name">Naziv</Label>
            <Input
              id="name"
              name="name"
              defaultValue={webhook.name}
              required
              className="max-w-md"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              name="url"
              type="url"
              defaultValue={webhook.url}
              required
              className="max-w-lg"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-xs">Status:</span>
            {webhook.isActive ? (
              <Badge
                variant="outline"
                className="border-primary/30 bg-primary/5 text-primary dark:border-primary/40 dark:bg-primary/10 dark:text-primary"
              >
                Aktivan
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-400"
              >
                Deaktiviran zbog grešaka
              </Badge>
            )}
          </div>
        </div>

        {/* Events */}
        <div className="space-y-4 rounded-lg border p-6">
          <h3 className="text-sm font-semibold">Događaji</h3>
          <p className="text-muted-foreground text-xs">
            Izaberite događaje za koje želite da primate obaveštenja.
          </p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {WEBHOOK_EVENTS.map((event) => (
              <Label
                key={event}
                className="has-[:checked]:border-primary has-[:checked]:bg-primary/5 flex cursor-pointer items-start gap-3 rounded-md border p-3"
              >
                <Checkbox
                  name={`event_${event}`}
                  value="on"
                  defaultChecked={webhook.events.includes(event)}
                />
                <div>
                  <span className="text-sm font-medium">{EVENT_LABELS[event]}</span>
                  <p className="text-muted-foreground text-xs">{event}</p>
                </div>
              </Label>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={isPending}>
            <Icon name="save" className="mr-1 size-4" />
            Sačuvaj izmene
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/cms/webhooks">Odustani</Link>
          </Button>
        </div>
      </form>

      {/* Log history */}
      <div className="rounded-lg border">
        <div className="border-b px-6 py-4">
          <h3 className="text-sm font-semibold">Istorija poziva</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Događaj</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>HTTP kod</TableHead>
              <TableHead>Vreme</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground h-24 text-center text-sm">
                  Nema zabeleženih poziva.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <span className="text-sm">{EVENT_LABELS[log.event] || log.event}</span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        log.status === "success"
                          ? "border-primary/30 bg-primary/5 text-primary dark:border-primary/40 dark:bg-primary/10 dark:text-primary"
                          : "border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-400"
                      }
                    >
                      {log.status === "success" ? "Uspešno" : "Neuspešno"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <code className="text-muted-foreground text-xs">{log.responseCode ?? "-"}</code>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground text-xs">
                      {new Date(log.createdAt).toLocaleString("sr-RS")}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
