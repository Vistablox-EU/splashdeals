import { requireAdmin } from "@/app/(server)/lib/auth-guards";
import { prisma } from "@/app/(server)/lib/prisma";
import { EmbedCodesClient } from "./_components/embed-codes-client";
import type { Metadata } from "next";
import { connection } from "next/server";

export const metadata: Metadata = {
  title: "Embed kodovi | CMS | Splashdeals",
  description: "Prikaži i kopiraj embed kodove za svaki objekat.",
};

export default async function EmbedCodesPage() {
  await requireAdmin();
  await connection();

  const facilities = await prisma.facility.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      city: true,
      status: true,
    },
  });

  const serialized = facilities.map((f) => ({
    id: f.id,
    name: f.name,
    slug: f.slug,
    city: f.city,
    status: f.status,
  }));

  return (
    <div className="bg-background border-border/50 relative flex min-h-[calc(100vh-4rem)] w-full flex-col gap-8 overflow-hidden rounded-2xl border p-4 md:p-6">
      <div className="bg-primary/5 pointer-events-none absolute top-0 right-0 -mt-64 -mr-64 h-[500px] w-[500px] rounded-full blur-[120px]" />
      <div className="bg-accent/5 pointer-events-none absolute bottom-0 left-0 -mb-48 -ml-48 h-[400px] w-[400px] rounded-full blur-[100px]" />

      <div className="relative z-10">
        <h1 className="text-foreground text-2xl font-black tracking-tight uppercase italic">
          Embed kodovi
        </h1>
        <p className="text-muted-foreground mt-1.5 text-xs font-medium tracking-wider uppercase opacity-80">
          Kopirajte HTML isečak za prikaz widgeta na vašem sajtu
        </p>
      </div>

      <div className="relative z-10">
        <EmbedCodesClient facilities={serialized as unknown as Array<Record<string, unknown>>} />
      </div>
    </div>
  );
}
