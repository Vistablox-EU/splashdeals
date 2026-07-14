"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
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
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Icon } from "@/components/ui/Icon";
import { checkBrokenLinksAction } from "@/app/(server)/actions/cms/tools";

interface BrokenLink {
  postId: string;
  postTitle: string;
  postSlug: string;
  url: string;
  statusCode: number;
  contentType: "post" | "page";
}

const TYPE_LABELS: Record<BrokenLink["contentType"], string> = {
  post: "Post",
  page: "Strana",
};

function StatusBadge({ statusCode }: { statusCode: number }) {
  if (statusCode === 0) {
    return (
      <Badge
        variant="outline"
        className="border-gray-300 bg-gray-50 text-gray-700 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-400"
      >
        Mrežna greška
      </Badge>
    );
  }

  if (statusCode >= 500) {
    return (
      <Badge
        variant="outline"
        className="border-yellow-300 bg-yellow-50 text-yellow-700 dark:border-yellow-600 dark:bg-yellow-950 dark:text-yellow-400"
      >
        {statusCode}
      </Badge>
    );
  }

  if (statusCode >= 400) {
    return <Badge variant="destructive">{statusCode}</Badge>;
  }

  return <Badge variant="outline">{statusCode}</Badge>;
}

export function BrokenLinksClient() {
  const [links, setLinks] = useState<BrokenLink[]>([]);
  const [checked, setChecked] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleCheck = () => {
    startTransition(async () => {
      setError(null);
      setChecked(false);

      try {
        const result = await checkBrokenLinksAction();

        if (result.success && result.data) {
          setLinks(result.data);
          setChecked(true);

          if (result.data.length === 0) {
            toast.success("Nema neispravnih linkova.");
          } else {
            toast.info(`Pronađeno ${result.data.length} neispravnih linkova.`);
          }
        } else {
          setError(result.error || "Greška pri proveri linkova.");
          toast.error(result.error || "Greška pri proveri linkova.");
        }
      } catch {
        const msg = "Neočekivana greška pri proveri linkova.";
        setError(msg);
        toast.error(msg);
      }
    });
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Provera linkova</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Proveri sve eksterne linkove u objavama i stranama na neispravne veze.
          </p>
        </div>
        <Button onClick={handleCheck} disabled={isPending}>
          {isPending ? (
            <>
              <Icon name="progress_activity" className="mr-2 size-4 animate-spin" />
              Proveravam...
            </>
          ) : (
            <>
              <Icon name="link" className="mr-2 size-4" />
              Proveri linkove
            </>
          )}
        </Button>
      </div>

      {isPending && (
        <Card className="p-6">
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
          <p className="text-muted-foreground mt-4 text-center text-sm">
            Proveravam eksterne linkove...
          </p>
        </Card>
      )}

      {error && !isPending && (
        <Card className="p-6">
          <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
            <Icon name="error" className="text-destructive size-12" />
            <p className="text-muted-foreground text-sm">{error}</p>
            <Button variant="outline" onClick={handleCheck}>
              Pokušaj ponovo
            </Button>
          </div>
        </Card>
      )}

      {checked && !isPending && !error && links.length === 0 && (
        <Card className="p-6">
          <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
            <Icon name="check_circle" className="size-12 text-green-500" />
            <p className="text-muted-foreground text-sm">
              Nema neispravnih linkova. Svi eksterni linkovi su ispravni.
            </p>
          </div>
        </Card>
      )}

      {checked && !isPending && !error && links.length > 0 && (
        <Card>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Naslov</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tip</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {links.map((link, index) => (
                  <TableRow key={`${link.postId}-${link.url}-${index}`}>
                    <TableCell className="max-w-[200px] font-medium">
                      <span className="line-clamp-2">{link.postTitle}</span>
                    </TableCell>
                    <TableCell className="max-w-[300px]">
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/80 line-clamp-1 block text-sm underline"
                      >
                        {link.url}
                      </a>
                    </TableCell>
                    <TableCell>
                      <StatusBadge statusCode={link.statusCode} />
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{TYPE_LABELS[link.contentType]}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="text-muted-foreground border-t px-4 py-3 text-xs">
            Ukupno neispravnih linkova: {links.length}
          </div>
        </Card>
      )}
    </div>
  );
}
