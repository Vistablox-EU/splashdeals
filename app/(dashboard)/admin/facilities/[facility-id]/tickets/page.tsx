import type { Metadata } from "next";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { getFacilityAdminShell } from "../_lib/get-facility-admin";
import { getTicketHierarchy } from "./_lib/ticket-admin-actions";
import { TicketManagementV2 } from "./_components/ticket-management-v2";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ "facility-id": string }>;
}): Promise<Metadata> {
  const { "facility-id": facilityId } = await params;
  const facility = await getFacilityAdminShell(facilityId);
  return {
    title: `${facility?.name || "Objekat"} — Ulaznice | Splashdeals Admin`,
    description: `Kategorije, tipovi i cene za ${facility?.name || "ovaj objekat"}.`,
  };
}

export default async function TicketsPageV2({
  params,
}: {
  params: Promise<{ "facility-id": string }>;
}) {
  const { "facility-id": facilityId } = await params;
  await connection();

  const facility = await getFacilityAdminShell(facilityId);
  if (!facility) return notFound();

  const hierarchy = await getTicketHierarchy(facilityId);

  return (
    <div className="flex h-full flex-col">
      <div className="border-border/50 bg-background/60 flex shrink-0 items-center justify-between border-b px-6 py-4 backdrop-blur-md">
        <div>
          <h1 className="text-foreground text-lg font-black tracking-tight">
            Upravljanje ulaznicama
          </h1>
          <p className="text-muted-foreground mt-0.5 text-xs">
            {facility.name} — Kategorije → Tipovi → Cene
          </p>
        </div>
      </div>

      <TicketManagementV2 facilityId={facilityId} initialCategories={hierarchy} />
    </div>
  );
}
