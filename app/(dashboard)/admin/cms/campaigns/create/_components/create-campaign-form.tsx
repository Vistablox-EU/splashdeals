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
import { createCampaignAction } from "@/app/(server)/actions/campaigns";

interface FacilityRow {
  id: string;
  name: string;
}

export default function CreateCampaignForm({
  facilities,
}: {
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
        const result = await createCampaignAction({
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
          toast.success("Kampanja kreirana");
          router.push("/admin/cms/campaigns");
        } else {
          toast.error(result.error || "Greška pri kreiranju");
        }
      });
    },
    [router, startTransition, facilities],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Nova kampanja</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Kreiraj novu promo kampanju sa popustom.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/cms/campaigns">
            <Icon name="arrow_back" className="size-4" />
            Nazad
          </Link>
        </Button>
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
              placeholder="npr. Letnji popust 2026"
              required
              className="max-w-md"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="code">Kod</Label>
            <Input
              id="code"
              name="code"
              placeholder="npr. LETO20"
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
                placeholder="0 = bez minimuma"
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
              <Input id="validFrom" name="validFrom" type="date" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="validTo">Važi do</Label>
              <Input id="validTo" name="validTo" type="date" required />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="usageLimit">Ograničenje korišćenja</Label>
            <Input
              id="usageLimit"
              name="usageLimit"
              type="number"
              min={0}
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
                  <Checkbox name={`facility_${facility.id}`} value="on" />
                  <span className="text-sm font-medium">{facility.name}</span>
                </Label>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={isPending}>
            <Icon name="add" className="mr-1 size-4" />
            Kreiraj kampanju
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/cms/campaigns">Odustani</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
