"use client";

import { useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { updateCampaignAction } from "@/app/(server)/actions/campaigns";

interface CampaignData {
  id: string;
  name: string;
  code: string;
  discountPercent: number;
  minPurchaseAmount: number | null;
  validFrom: string;
  validTo: string;
  usageLimit: number | null;
  usedCount: number;
  isActive: boolean;
  facilityIds: string[];
}

interface FacilityRow {
  id: string;
  name: string;
}

export default function EditCampaignForm({
  campaign,
  facilities,
}: {
  campaign: CampaignData;
  facilities: FacilityRow[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = e.currentTarget;
      const formData = new FormData(form);

      const facilityIds = (facilities || [])
        .filter((f) => formData.get(`facility_${f.id}`) === "on")
        .map((f) => f.id);

      startTransition(async () => {
        const result = await updateCampaignAction(campaign.id, {
          name: formData.get("name") as string,
          code: formData.get("code") as string,
          discountPercent: Number(formData.get("discountPercent")),
          minPurchaseAmount: formData.get("minPurchaseAmount")
            ? Number(formData.get("minPurchaseAmount"))
            : null,
          validFrom: formData.get("validFrom") as string,
          validTo: formData.get("validTo") as string,
          usageLimit: formData.get("usageLimit")
            ? Number(formData.get("usageLimit"))
            : null,
          facilityIds,
        });

        if (result.success) {
          toast.success("Kampanja ažurirana");
          router.refresh();
        } else {
          toast.error(result.error || "Greška pri ažuriranju");
        }
      });
    },
    [campaign.id, facilities, router],
  );

  const handleToggleActive = useCallback(() => {
    startTransition(async () => {
      const result = await updateCampaignAction(campaign.id, {
        name: campaign.name,
        code: campaign.code,
        discountPercent: campaign.discountPercent,
        validFrom: campaign.validFrom,
        validTo: campaign.validTo,
        facilityIds: campaign.facilityIds,
        isActive: !campaign.isActive,
      });
      if (result.success) {
        toast.success(campaign.isActive ? "Kampanja deaktivirana" : "Kampanja aktivirana");
        router.refresh();
      } else {
        toast.error(result.error || "Greška");
      }
    });
  }, [campaign, router]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Izmeni kampanju</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Izmeni detalje kampanje.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleToggleActive} disabled={isPending}>
            {campaign.isActive ? "Deaktiviraj" : "Aktiviraj"}
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/cms/campaigns">
              <Icon name="arrow_back" className="size-4" />
              Nazad
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-muted-foreground text-xs">Status:</span>
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
        <span className="text-muted-foreground ml-4 text-xs">
          Korišćeno: {campaign.usedCount}
          {campaign.usageLimit !== null ? ` / ${campaign.usageLimit}` : ""}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic info */}
        <div className="space-y-4 rounded-lg border p-6">
          <h3 className="text-sm font-semibold">Osnovne informacije</h3>

          <div className="space-y-1.5">
            <Label htmlFor="name">Naziv kampanje</Label>
            <Input
              id="name"
              name="name"
              defaultValue={campaign.name}
              required
              className="max-w-md"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="code">Kod</Label>
            <Input
              id="code"
              name="code"
              defaultValue={campaign.code}
              required
              className="max-w-sm font-mono uppercase"
            />
          </div>

          <div className="grid max-w-lg grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="discountPercent">Popust (%)</Label>
              <Input
                id="discountPercent"
                name="discountPercent"
                type="number"
                min={1}
                max={100}
                defaultValue={campaign.discountPercent}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="minPurchaseAmount">Minimalni iznos (RSD)</Label>
              <Input
                id="minPurchaseAmount"
                name="minPurchaseAmount"
                type="number"
                min={0}
                defaultValue={campaign.minPurchaseAmount ?? ""}
                placeholder="Bez minimuma"
              />
            </div>
          </div>
        </div>

        {/* Validity */}
        <div className="space-y-4 rounded-lg border p-6">
          <h3 className="text-sm font-semibold">Period važenja</h3>

          <div className="grid max-w-lg grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="validFrom">Važi od</Label>
              <Input
                id="validFrom"
                name="validFrom"
                type="date"
                defaultValue={campaign.validFrom}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="validTo">Važi do</Label>
              <Input
                id="validTo"
                name="validTo"
                type="date"
                defaultValue={campaign.validTo}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="usageLimit">Ograničenje korišćenja</Label>
            <Input
              id="usageLimit"
              name="usageLimit"
              type="number"
              min={0}
              defaultValue={campaign.usageLimit ?? ""}
              placeholder="Ostavi prazno za neograničeno"
              className="max-w-sm"
            />
          </div>
        </div>

        {/* Facility restrictions */}
        <div className="space-y-4 rounded-lg border p-6">
          <h3 className="text-sm font-semibold">Ograničenja na objekte</h3>
          <p className="text-muted-foreground text-xs">
            Izaberite objekte na kojima kod važi. Ako ne izaberete nijedan, kod važi na svim
            objektima.
          </p>

          {facilities.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nema dostupnih objekata.</p>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {facilities.map((facility) => (
                <Label
                  key={facility.id}
                  className="has-[:checked]:border-primary has-[:checked]:bg-primary/5 flex cursor-pointer items-start gap-3 rounded-md border p-3"
                >
                  <Checkbox
                    name={`facility_${facility.id}`}
                    value="on"
                    defaultChecked={campaign.facilityIds.includes(facility.id)}
                  />
                  <span className="text-sm font-medium">{facility.name}</span>
                </Label>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={isPending}>
            <Icon name="save" className="mr-1 size-4" />
            Sačuvaj izmene
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/cms/campaigns">Odustani</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
