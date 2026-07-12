import { requireAdmin } from "@/server/lib/auth-guards";
import { prisma } from "@/server/lib/prisma";
import { connection } from "next/server";
import CreateCampaignForm from "./_components/create-campaign-form";

export default async function CreateCampaignPage() {
  await requireAdmin();
  await connection();

  const facilities = await prisma.facility.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return <CreateCampaignForm facilities={facilities} />;
}
