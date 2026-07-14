import Link from "next/link";
import { FacilityProfileForm } from "./_components/facility-profile-form";
import { CityLabels } from "./_components/city-labels";
import { prisma } from "@/app/(server)/lib/prisma";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { auth } from "@/app/(server)/lib/auth";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/Icon";

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
    title: `${facility?.name || "Facility"} — Profile | Splashdeals Admin`,
    description: `Edit profile, governance, and SEO settings for ${facility?.name || "this facility"}.`,
  };
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ "facility-id": string }>;
}) {
  const { "facility-id": facilityId } = await params;
  await connection();

  const [facility, transactionCount, session] = await Promise.all([
    prisma.facility.findUnique({
      where: { id: facilityId },
      include: {
        hours: { orderBy: { dayOfWeek: "asc" } },
        closures: { orderBy: { startDate: "asc" } },
      },
    }),
    prisma.transaction.count({
      where: { facilityId },
    }),
    auth.api.getSession({
      headers: await headers(),
    }),
  ]);

  if (!facility) notFound();

  const userRole = session?.user?.role || "GUEST";

  return (
    <div className="flex flex-col gap-4">
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
      <FacilityProfileForm
        facility={facility}
        userRole={userRole}
        transactionCount={transactionCount}
      />
      <div className="border-border bg-card rounded-xl border p-6">
        <CityLabels facilityId={facilityId} />
      </div>
    </div>
  );
}
