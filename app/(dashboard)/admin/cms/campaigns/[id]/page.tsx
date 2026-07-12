import { requireAdmin } from "@/server/lib/auth-guards";
import { prisma } from "@/server/lib/prisma";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import EditCampaignForm from "./_components/edit-campaign-form";

export default async function EditCampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  await connection();

  const { id } = await params;

  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: { facilityRestrictions: true },
  });

  if (!campaign) {
    notFound();
  }

  const facilities = await prisma.facility.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <EditCampaignForm
      campaign={{
        id: campaign.id,
        name: campaign.name,
        code: campaign.code || "",
        discountPercent: Number(campaign.discountPercent),
        minPurchaseAmount: campaign.minPurchaseAmount
          ? Number(campaign.minPurchaseAmount)
          : null,
        validFrom: campaign.validFrom.toISOString().slice(0, 10),
        validTo: campaign.validTo.toISOString().slice(0, 10),
        usageLimit: campaign.usageLimit,
        usedCount: campaign.usedCount,
        isActive: campaign.isActive,
        facilityIds: campaign.facilityRestrictions.map((fr) => fr.facilityId),
      }}
      facilities={facilities}
    />
  );
}
