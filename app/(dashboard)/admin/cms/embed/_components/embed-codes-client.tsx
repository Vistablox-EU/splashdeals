"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Icon } from "@/components/ui/Icon";
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

interface Facility {
  id: string;
  name: string;
  slug: string;
  city: string;
  status: string;
}

export function EmbedCodesClient({ facilities }: { facilities: Array<Record<string, unknown>> }) {
  const rows = facilities as unknown as Facility[];
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://splashdeals.rs";

  const getEmbedCode = (slug: string) => {
    const widgetUrl = `${baseUrl}/api/embed/facility/${slug}`;
    return `<div id="splashdeals-widget" data-facility="${slug}">
  <script src="${baseUrl}/embed.js" defer></script>
  <a href="${baseUrl}/${slug}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:10px 24px;background:#06b6d4;color:#fff;font-size:14px;font-weight:700;border-radius:8px;text-decoration:none;">
    Kupi kartu za ${slug.replace(/-/g, " ")}
  </a>
</div>`;
  };

  const getIframeCode = (slug: string) => {
    return `<iframe src="${baseUrl}/api/embed/facility/${slug}" width="100%" height="180" frameborder="0" style="border:none;overflow:hidden;" title="Splashdeals Widget"></iframe>`;
  };

  const handleCopy = async (slug: string) => {
    const code = getEmbedCode(slug);
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(slug);
      toast.success("Embed kod kopiran!");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error("Greška pri kopiranju");
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return (
          <Badge
            variant="outline"
            className="border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-950 dark:text-green-400"
          >
            Aktivan
          </Badge>
        );
      case "DRAFT":
        return (
          <Badge
            variant="outline"
            className="border-yellow-300 bg-yellow-50 text-yellow-700 dark:border-yellow-700 dark:bg-yellow-950 dark:text-yellow-400"
          >
            Nacrt
          </Badge>
        );
      default:
        return (
          <Badge
            variant="outline"
            className="border-gray-300 bg-gray-50 text-gray-700 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-400"
          >
            {status}
          </Badge>
        );
    }
  };

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Objekat</TableHead>
            <TableHead>Grad</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[500px]">Embed kod</TableHead>
            <TableHead className="w-[100px]">Akcije</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-muted-foreground h-24 text-center text-sm">
                Nema objekata.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((facility) => (
              <TableRow key={facility.id}>
                <TableCell>
                  <div className="space-y-1">
                    <span className="text-sm font-medium">{facility.name}</span>
                    <div className="text-muted-foreground text-xs">/{facility.slug}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{facility.city}</span>
                </TableCell>
                <TableCell>{statusBadge(facility.status)}</TableCell>
                <TableCell>
                  <div className="relative">
                    <pre className="bg-muted max-h-24 overflow-auto rounded p-2 text-[10px] leading-tight">
                      <code>{getEmbedCode(facility.slug)}</code>
                    </pre>
                    {copiedId === facility.slug && (
                      <span className="text-primary absolute top-1 right-1 text-[10px] font-medium">
                        Kopirano!
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => handleCopy(facility.slug)}
                    >
                      <Icon name="content_copy" className="mr-1 size-3" />
                      Kopiraj
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
