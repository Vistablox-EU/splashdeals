import { requireAdmin } from "@/app/(server)/lib/auth-guards";
import { connection } from "next/server";
import type { Metadata } from "next";
import { loadCmsCampaigns, loadCmsFacilities } from "@/app/(dashboard)/admin/cms/_data/cms-loaders";
import { CampaignsListClient } from "./_components/campaigns-list-client";

export const metadata: Metadata = {
  title: "Kuponi / kampanje | CMS | Splashdeals",
};

export default async function CampaignsPage() {
  await requireAdmin();
  await connection();
  const [campaigns, facilities] = await Promise.all([loadCmsCampaigns(), loadCmsFacilities()]);

  return (
    <CampaignsListClient
      campaigns={campaigns as unknown as Array<Record<string, unknown>>}
      facilities={facilities as unknown as Array<Record<string, unknown>>}
    />
  );
}
