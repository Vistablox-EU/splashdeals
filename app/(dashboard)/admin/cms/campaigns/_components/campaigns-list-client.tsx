"use client";

import { useCallback, useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import { deleteCampaignAction, updateCampaignAction } from "@/app/(server)/actions/campaigns";

interface CampaignRow {
  id: string;
  name: string;
  code: string | null;
  discountPercent: number;
  minPurchaseAmount: number | null;
  validFrom: string;
  validTo: string;
  usageLimit: number | null;
  usedCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  facilityRestrictions: { facilityId: string }[];
}

interface FacilityRow {
  id: string;
  name: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("sr-RS", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

export function CampaignsListClient({
  campaigns,
  facilities,
}: {
  campaigns: Array<Record<string, unknown>>;
  facilities: Array<Record<string, unknown>>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const rows = campaigns as unknown as CampaignRow[];
  const facilityMap = new Map(
    (facilities as unknown as FacilityRow[]).map((f) => [f.id, f.name]),
  );

  const getFacilityNames = (restrictions: { facilityId: string }[]) => {
    return restrictions
      .map((r) => facilityMap.get(r.facilityId))
      .filter(Boolean)
      .join(", ");
  };

  const handleToggleActive = useCallback(
    (campaign: CampaignRow) => {
      startTransition(async () => {
        const result = await updateCampaignAction(campaign.id, {
          name: campaign.name,
          code: campaign.code || "",
          discountPercent: campaign.discountPercent,
          validFrom: campaign.validFrom,
          validTo: campaign.validTo,
          facilityIds: campaign.facilityRestrictions.map((fr) => fr.facilityId),
          isActive: !campaign.isActive,
        });
        if (result.success) {
          toast.success(campaign.isActive ? "Kampanja deaktivirana" : "Kampanja aktivirana");
          router.refresh();
        } else {
          toast.error(result.error || "Greška pri ažuriranju");
        }
      });
    },
    [router, startTransition],
  );

  const handleDelete = useCallback(
    (id: string) => {
      startTransition(async () => {
        const result = await deleteCampaignAction(id);
        if (result.success) {
          toast.success("Kampanja obrisana");
        } else {
          toast.error(result.error || "Greška pri brisanju");
        }
        setDeleteTarget(null);
        router.refresh();
      });
    },
    [router, startTransition],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Kampanje</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Upravljaj promo kodovima i popust kampanjama.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/cms/campaigns/create">
            <Icon name="add" className="size-4" />
            Nova kampanja
          </Link>
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Naziv</TableHead>
              <TableHead>Kod</TableHead>
              <TableHead>Popust</TableHead>
              <TableHead>Važi od/do</TableHead>
              <TableHead>Korišćenje</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[180px]">Akcije</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground h-24 text-center text-sm">
                  Nema kampanja. Kreiraj prvu kampanju.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((campaign) => {
                const facilitiesStr = getFacilityNames(campaign.facilityRestrictions);
                return (
                  <TableRow key={campaign.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <span className="text-sm font-medium">{campaign.name}</span>
                        {facilitiesStr && (
                          <div className="text-muted-foreground text-xs">
                            {facilitiesStr}
                          </div>
                        )}
                        {campaign.minPurchaseAmount && (
                          <div className="text-muted-foreground text-xs">
                            Min: {campaign.minPurchaseAmount} RSD
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="bg-muted rounded px-1.5 py-0.5 text-xs font-bold">
                        {campaign.code}
                      </code>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-bold text-green-600">
                        -{campaign.discountPercent}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground text-xs">
                        {formatDate(campaign.validFrom)} — {formatDate(campaign.validTo)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {campaign.usedCount}
                        {campaign.usageLimit !== null ? ` / ${campaign.usageLimit}` : ""}
                      </span>
                    </TableCell>
                    <TableCell>
                      {campaign.isActive ? (
                        <Badge
                          variant="outline"
                          className="border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-950 dark:text-green-400"
                        >
                          Aktivna
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-gray-300 bg-gray-50 text-gray-700 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-400"
                        >
                          Neaktivna
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => handleToggleActive(campaign)}
                          disabled={isPending}
                        >
                          {campaign.isActive ? "Deaktiviraj" : "Aktiviraj"}
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7" asChild>
                          <Link href={`/admin/cms/campaigns/${campaign.id}`}>
                            <Icon name="tune" className="size-3.5" />
                          </Link>
                        </Button>
                        <AlertDialog
                          open={deleteTarget?.id === campaign.id}
                          onOpenChange={(open) => {
                            if (!open) setDeleteTarget(null);
                          }}
                        >
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive h-7 w-7 p-0"
                              aria-label={`Obriši kampanju ${campaign.name}`}
                              onClick={() =>
                                setDeleteTarget({ id: campaign.id, name: campaign.name })
                              }
                            >
                              <Icon name="delete" className="size-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Obriši kampanju</AlertDialogTitle>
                              <AlertDialogDescription>
                                Da li ste sigurni da želite da obrišete kampanju &quot;
                                {campaign.name}&quot;? Ova akcija je nepovratna.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Odustani</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleDelete(campaign.id);
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
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
