import { requireAdmin } from "@/app/(server)/lib/auth-guards";
import { prisma } from "@/app/(server)/lib/prisma";
import { CampaignsListClient } from "./_components/campaigns-list-client";
import type { Metadata } from "next";
import { connection } from "next/server";

export const metadata: Metadata = {
  title: "Kampanje | CMS | Splashdeals",
};

export default async function CampaignsPage() {
  await requireAdmin();
  await connection();

  const campaigns = await prisma.campaign.findMany({
    orderBy: { createdAt: "desc" },
    include: { facilityRestrictions: true },
  });

  const facilities = await prisma.facility.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  const serialized = campaigns.map((c) => ({
    id: c.id,
    name: c.name,
    code: c.code,
    discountPercent: Number(c.discountPercent),
    minPurchaseAmount: c.minPurchaseAmount ? Number(c.minPurchaseAmount) : null,
    validFrom: c.validFrom.toISOString(),
    validTo: c.validTo.toISOString(),
    usageLimit: c.usageLimit,
    usedCount: c.usedCount,
    isActive: c.isActive,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    facilityRestrictions: c.facilityRestrictions.map((fr) => ({ facilityId: fr.facilityId })),
  }));

  return (
    <CampaignsListClient
      campaigns={serialized as unknown as Array<Record<string, unknown>>}
      facilities={facilities as unknown as Array<Record<string, unknown>>}
    />
  );
}
