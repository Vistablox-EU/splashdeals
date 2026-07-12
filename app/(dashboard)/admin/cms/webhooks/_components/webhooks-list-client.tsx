"use client";

import { useCallback, useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  testWebhookAction,
  deleteWebhookAction,
  reactivateWebhookAction,
  WEBHOOK_EVENTS,
} from "@/app/(server)/actions/webhooks";

interface WebhookRow {
  id: string;
  name: string;
  url: string;
  events: string[];
  isActive: boolean;
  consecutiveFailures: number;
  createdAt: string;
  updatedAt: string;
  latestLog: {
    id: string;
    event: string;
    status: string;
    responseCode: number | null;
    createdAt: string;
  } | null;
}

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

function truncateUrl(url: string, max = 50): string {
  return url.length > max ? url.slice(0, max) + "…" : url;
}

export function WebhooksListClient({ webhooks }: { webhooks: Array<Record<string, unknown>> }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const handleTest = useCallback(
    (id: string, name: string) => {
      startTransition(async () => {
        const result = await testWebhookAction(id);
        if (result.success) {
          toast.success(`Vebhuk "${name}" testiran — status: ${result.data?.statusCode ?? "N/A"}`);
        } else {
          toast.error(result.error || "Greška pri testiranju vebhuka");
        }
        router.refresh();
      });
    },
    [router, startTransition],
  );

  const handleDelete = useCallback(
    (id: string) => {
      startTransition(async () => {
        const result = await deleteWebhookAction(id);
        if (result.success) {
          toast.success("Vebhuk obrisan");
        } else {
          toast.error(result.error || "Greška pri brisanju");
        }
        setDeleteTarget(null);
        router.refresh();
      });
    },
    [router, startTransition],
  );

  const handleReactivate = useCallback(
    (id: string) => {
      startTransition(async () => {
        const result = await reactivateWebhookAction(id);
        if (result.success) {
          toast.success("Vebhuk reaktiviran");
        } else {
          toast.error(result.error || "Greška pri reaktivaciji");
        }
        router.refresh();
      });
    },
    [router, startTransition],
  );

  const rows = webhooks as unknown as WebhookRow[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Vebhukovi</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Upravljaj vebhukovima koji obaveštavaju spoljne servise o CMS događajima.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/cms/webhooks/create">
            <Icon name="add" className="size-4" />
            Novi vebhuk
          </Link>
        </Button>
      </div>

      {/* List */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Naziv</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>Događaji</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Poslednji status</TableHead>
              <TableHead className="w-[220px]">Akcije</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground h-24 text-center text-sm">
                  Nema vebhukova. Kreiraj prvi vebhuk.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((wh) => (
                <TableRow key={wh.id}>
                  <TableCell>
                    <span className="text-sm font-medium">{wh.name}</span>
                  </TableCell>
                  <TableCell>
                    <code className="text-muted-foreground text-xs break-all">
                      {truncateUrl(wh.url)}
                    </code>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {wh.events.map((ev) => (
                        <Badge key={ev} variant="outline" className="text-xs">
                          {EVENT_LABELS[ev] || ev}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    {wh.isActive ? (
                      <Badge
                        variant="outline"
                        className="border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-950 dark:text-green-400"
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
                  </TableCell>
                  <TableCell>
                    {wh.latestLog ? (
                      <div className="flex items-center gap-1.5">
                        <Badge
                          variant="outline"
                          className={
                            wh.latestLog.status === "success"
                              ? "border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-950 dark:text-green-400"
                              : "border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-400"
                          }
                        >
                          {wh.latestLog.status === "success" ? "OK" : "FAIL"}
                        </Badge>
                        {wh.latestLog.responseCode && (
                          <span className="text-muted-foreground text-xs">
                            {wh.latestLog.responseCode}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-xs">Nema</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => handleTest(wh.id, wh.name)}
                        disabled={isPending}
                      >
                        Testiraj
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7" asChild>
                        <Link href={`/admin/cms/webhooks/${wh.id}`}>
                          <Icon name="tune" className="size-3.5" />
                        </Link>
                      </Button>
                      {!wh.isActive && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => handleReactivate(wh.id)}
                          disabled={isPending}
                        >
                          Reaktiviraj
                        </Button>
                      )}
                      <AlertDialog
                        open={deleteTarget?.id === wh.id}
                        onOpenChange={(open) => {
                          if (!open) setDeleteTarget(null);
                        }}
                      >
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive h-7 w-7 p-0"
                            aria-label={`Obriši vebhuk ${wh.name}`}
                            onClick={() => setDeleteTarget({ id: wh.id, name: wh.name })}
                          >
                            <Icon name="delete" className="size-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Obriši vebhuk</AlertDialogTitle>
                            <AlertDialogDescription>
                              Da li ste sigurni da želite da obrišete vebhuk &quot;{wh.name}&quot;?
                              Ova akcija je nepovratna i obrisaće sve pripadajuće logove.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Odustani</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={(e) => {
                                e.preventDefault();
                                handleDelete(wh.id);
                              }}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Obriši
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
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
