import { notFound } from "next/navigation";
import { connection } from "next/server";
import { prisma } from "@/app/(server)/lib/prisma";
import { CompactAmenitiesTableContainer } from "./_components";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import type { Metadata } from "next";

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
    title: `${facility?.name || "Facility"} — Amenities | Splashdeals Admin`,
    description: `Manage features and active amenities for ${facility?.name || "this facility"}.`,
  };
}

interface AmenitiesPageProps {
  params: Promise<{
    "facility-id": string;
  }>;
}

export default async function AmenitiesPage({ params }: AmenitiesPageProps) {
  const { "facility-id": facilityId } = await params;
  await connection();

  const [facility, allAmenities] = await Promise.all([
    prisma.facility.findUnique({
      where: { id: facilityId },
      include: {
        amenities: {
          orderBy: { displayOrder: "asc" },
        },
      },
    }),
    prisma.amenity.findMany({
      orderBy: { name: "asc" },
    }),
  ]);

  if (!facility) notFound();

  return (
    <div className="animate-in fade-in slide-in-from-right-4 flex flex-col gap-8 duration-500">
      <div className="bg-muted/40 border-border/50 flex items-center justify-between rounded-2xl border p-6 backdrop-blur-md">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="hover:bg-muted/50 h-8 w-8 rounded-lg p-0"
            >
              <Link href={`/admin/facilities/${facilityId}`}>
                <Icon name="keyboard_arrow_left" className="size-4" />
              </Link>
            </Button>
            <h1 className="text-foreground text-2xl font-black tracking-tight italic">
              Infrastructure & Features
            </h1>
          </div>
          <p className="text-muted-foreground ml-11 text-[10px] font-bold tracking-[0.2em] uppercase">
            Manage active features and amenities for {facility.name}
          </p>
        </div>
        <div className="bg-primary/5 border-primary/20 rounded-full border px-4 py-1.5">
          <span className="text-primary text-[10px] font-black tracking-widest uppercase">
            Live Editor
          </span>
        </div>
      </div>

      <div className="border-border/50 bg-muted/20 rounded-2xl border p-1">
        <CompactAmenitiesTableContainer
          facilityId={facility.id}
          allAmenities={allAmenities}
          initialFacilityAmenities={facility.amenities}
        />
      </div>
    </div>
  );
}
