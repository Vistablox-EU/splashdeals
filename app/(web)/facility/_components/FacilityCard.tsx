import { Icon } from "@/components/ui/Icon";
import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { FavoriteButton } from "@/components/shared/FavoriteButton";
interface Facility {
  id: string;
  name: string;
  slug: string;
  category: string;
  city: string;
  streetName: string;
  streetNumber: string;
  postalCode: string;
  description: string | null;
  logoUrl?: string | null;
  media?: { url: string; type?: string; purpose?: string; isCardBackground?: boolean }[];
  minPrice: number | null;
}
interface FacilityCardProps {
  facility: Facility;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dict: Record<string, any>;
  fromLabel: string;
  isPriority?: boolean;
}

/**
 * 🌊 FacilityCard (Edition)
 * High-performance card featuring optimized Next.js Image delivery,
 * Aquastream design tokens, and smooth hover interactions.
 */
export function FacilityCard({ facility, dict, fromLabel, isPriority = false }: FacilityCardProps) {
  const explicitBG = facility.media?.find((m) => m.isCardBackground);
  const aerialPhoto = facility.media?.find((m) => m.purpose === "AERIAL");
  const backgroundPhoto =
    explicitBG ||
    aerialPhoto ||
    facility.media?.find((m) => m.type === "PHOTO" || !m.url?.endsWith(".mp4")) ||
    facility.media?.[0];

  return (
    <Link
      href={`/facilities/${facility.category.toLowerCase().replace(/_/g, "-")}/${facility.slug}`}
      className="block"
    >
      <Card className="group border-border hover:border-primary/30 relative flex h-[300px] flex-col justify-end overflow-hidden transition-[border-color] duration-500 sm:h-[400px]">
        {facility.logoUrl && (
          <div className="border-border bg-background/60 absolute top-4 right-4 z-20 flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl border p-2 shadow-lg backdrop-blur-md transition-transform duration-500 group-hover:scale-105 sm:top-6 sm:right-6 sm:h-14 sm:w-14">
            <div className="relative h-full w-full">
              <Image
                src={facility.logoUrl}
                alt={`${facility.name} Logo`}
                fill
                sizes="56px"
                className="object-contain"
              />
            </div>
          </div>
        )}

        <FavoriteButton facilityId={facility.id} isFavorited={false} />

        <div className="absolute inset-0 z-0">
          {backgroundPhoto?.url ? (
            <Image
              src={backgroundPhoto.url}
              alt={facility.name}
              fill
              className="object-cover transition-transform duration-1000 group-hover:scale-110"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 20vw"
              priority={isPriority}
            />
          ) : (
            <div className="bg-muted flex h-full w-full items-center justify-center">
              <Icon name="auto_awesome" className="text-foreground text-[48px]" />
            </div>
          )}
          <div className="from-background via-background/50 absolute inset-0 bg-gradient-to-t to-transparent" />
        </div>

        <div className="from-background/80 via-background/40 relative z-10 flex w-full flex-col gap-1 bg-gradient-to-t to-transparent p-4 sm:p-6">
          <span className="text-primary mb-2 flex items-center gap-2 text-[10px] font-black tracking-[0.2em] uppercase">
            <Icon name="navigation" className="text-primary rotate-45 text-[12px]" />
            {dict?.categories?.[facility.category.toLowerCase()] || facility.category}
          </span>
          <h3 className="text-foreground group-hover:text-primary mb-3 text-xl leading-none font-black tracking-tighter uppercase italic transition-colors sm:text-2xl">
            {facility.name}
          </h3>

          <div className="text-muted-foreground flex flex-col gap-2 text-[10px] font-bold tracking-widest uppercase">
            <div className="flex items-center gap-2">
              <Icon name="location_on" className="text-muted-foreground shrink-0 text-[14px]" />
              <span className="truncate">
                {facility.streetName} {facility.streetNumber}, {facility.postalCode} {facility.city}
              </span>
            </div>

            <div className="border-border mt-2 flex items-center justify-between border-t pt-4">
              {facility.minPrice ? (
                <div className="text-muted-foreground text-[10px] font-black tracking-widest uppercase">
                  {fromLabel}{" "}
                  <span className="text-primary mt-1 block text-base leading-none font-black">
                    {facility.minPrice} RSD
                  </span>
                </div>
              ) : (
                <div />
              )}

              <div className="text-primary bg-primary/10 border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary shadow-primary/10 flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-[9px] font-black tracking-[0.15em] uppercase shadow-lg transition-colors duration-300 group-hover:translate-x-1">
                <span>Detaljnije</span>
                <Icon
                  name="navigation"
                  className="rotate-90 text-[10px] transition-transform duration-300 group-hover:translate-x-0.5"
                />
              </div>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
