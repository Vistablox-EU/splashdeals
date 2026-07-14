import type { Metadata } from "next";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { prisma } from "@/app/(server)/lib/prisma";
import { getTicketHierarchy } from "./_lib/ticket-admin-actions";
import { TicketManagementV2 } from "./_components/ticket-management-v2";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ "facility-id": string }>;
}): Promise<Metadata> {
  const { "facility-id": facilityId } = await params;
  const facility = await prisma.facility.findUnique({
    where: { id: facilityId },
    select: { name: true },
  });
  return {
    title: `${facility?.name || "Facility"} — Tickets | Splashdeals Admin`,
    description: `Manage ticket categories, products, and pricing for ${facility?.name || "this facility"}.`,
  };
}

export default async function TicketsPageV2({
  params,
}: {
  params: Promise<{ "facility-id": string }>;
}) {
  const { "facility-id": facilityId } = await params;
  await connection();

  const facility = await prisma.facility.findUnique({
    where: { id: facilityId },
    select: { id: true, name: true, slug: true },
  });
  if (!facility) return notFound();

  const hierarchy = await getTicketHierarchy(facilityId).catch((e) => {
    console.error("getTicketHierarchy failed:", e instanceof Error ? e.message : e);
    throw e;
  });

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-border/50 bg-background/60 flex shrink-0 items-center justify-between border-b px-6 py-4 backdrop-blur-md">
        <div>
          <h1 className="text-foreground text-lg font-black tracking-tight">
            Upravljanje Ulaznicama
          </h1>
          <p className="text-muted-foreground mt-0.5 text-xs">
            {facility.name} — Kategorije → Tipovi → Cene
          </p>
        </div>
      </div>

      {/* Three-panel layout */}
      <TicketManagementV2 facilityId={facilityId} initialCategories={hierarchy} />
    </div>
  );
}
