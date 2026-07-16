import { prisma } from "@/app/(server)/lib/prisma";
import { getDictionary } from "@/lib/dictionaries";
import { requireAccountSession } from "@/lib/auth/require-account-session";
import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/Icon";
import { FavoriteButton } from "@/components/shared/FavoriteButton";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Omiljeni objekti",
  robots: { index: false, follow: false },
};

async function getUserFavorites(userId: string) {
  return prisma.userFavorite.findMany({
    where: { userId },
    include: {
      facility: {
        select: {
          id: true,
          name: true,
          slug: true,
          city: true,
          category: true,
          media: {
            where: { type: "PHOTO", isHero: true },
            take: 1,
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export default async function OmiljeniPage() {
  const session = await requireAccountSession("/omiljeni");
  const dict = await getDictionary();
  const t = dict.account;

  const favorites = await getUserFavorites(session.user.id);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-black tracking-tighter uppercase italic">{t.omiljeni}</h1>

      {favorites.length === 0 ? (
        <Card className="border-border flex flex-col items-center gap-4 p-12 text-center">
          <Icon name="favorite" className="text-muted-foreground size-12" />
          <p className="text-muted-foreground text-sm font-medium">{t.no_favorites}</p>
          <Link
            href="/akva-parkovi"
            className="bg-primary text-primary-foreground inline-flex h-11 min-h-11 items-center rounded-full px-6 text-sm font-bold"
          >
            {t.browse_facilities}
          </Link>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {favorites.map((fav) => {
            const image = fav.facility.media[0];
            return (
              <Card
                key={fav.facility.id}
                className="border-border group relative flex flex-col overflow-hidden transition-colors"
              >
                <div className="absolute top-2 right-2 z-20">
                  <FavoriteButton
                    facilityId={fav.facility.id}
                    facilitySlug={fav.facility.slug}
                    isFavorited
                    variant="default"
                    className="bg-background/90 relative top-0 left-0"
                  />
                </div>
                <Link href={`/${fav.facility.slug}`}>
                  <div className="relative h-32 w-full overflow-hidden">
                    {image ? (
                      <Image
                        src={image.url}
                        alt={fav.facility.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="bg-muted flex h-full items-center justify-center">
                        <Icon name="auto_awesome" className="text-muted-foreground/50 size-8" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 p-4">
                    <h3 className="group-hover:text-primary text-sm font-black uppercase transition-colors">
                      {fav.facility.name}
                    </h3>
                    {fav.facility.city && (
                      <span className="text-muted-foreground flex items-center gap-1 text-[10px] font-medium">
                        <Icon name="location_on" className="text-primary/70 size-[10px]" />
                        {fav.facility.city}
                      </span>
                    )}
                  </div>
                </Link>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
