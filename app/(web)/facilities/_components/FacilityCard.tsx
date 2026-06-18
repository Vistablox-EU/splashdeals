import { Icon } from "@/components/ui/Icon";
import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/card";
interface Facility {
  id: string;
  name: string;
  slug: string;
  category: string;
  streetName: string;
  streetNumber: string;
  postalCode: string;
  city: string;
  logoUrl?: string | null;
  media?: { url: string; type?: string; purpose?: string; isCardBackground?: boolean }[];
  tickets: { price: number; currency: string }[];
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
  const backgroundPhoto = explicitBG || aerialPhoto || facility.media?.find((m) => m.type === "PHOTO" || !m.url.endsWith(".mp4")) || facility.media?.[0];

  return (
    <Link href={`/facilities/${facility.category.toLowerCase()}/${facility.slug}`} className="block">
      <Card 
        className="h-[400px] group overflow-hidden border-border hover:border-cyan-400/30 transition-all duration-500 relative flex flex-col justify-end"
      >
        {facility.logoUrl && (
          <div className="absolute top-6 right-6 z-20 h-14 w-14 rounded-2xl overflow-hidden border border-border bg-background/60 p-2 backdrop-blur-md flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-500">
            <div className="relative w-full h-full">
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
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <Icon name="auto_awesome" className="text-[48px] text-slate-800" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
        </div>

        <div className="relative z-10 p-6 flex flex-col gap-1 w-full bg-gradient-to-t from-slate-950/80 via-slate-950/40 to-transparent">
          <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
            <Icon name="navigation" className="text-[12px] text-primary rotate-45" />
            {dict?.categories?.[facility.category.toLowerCase()] || facility.category}
          </span>
          <h3 className="text-2xl font-black text-foreground italic tracking-tighter uppercase mb-3 leading-none group-hover:text-primary transition-colors">
            {facility.name}
          </h3>
          
          <div className="flex flex-col gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            <div className="flex items-center gap-2">
              <Icon name="location_on" className="text-[14px] text-muted-foreground shrink-0" />
              <span className="truncate">{facility.streetName} {facility.streetNumber}, {facility.postalCode} {facility.city}</span>
            </div>
            
            <div className="flex items-center justify-between border-t border-border pt-4 mt-2">
              {facility.tickets[0] ? (
                <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                  {fromLabel} <span className="text-base text-primary font-black block leading-none mt-1">{Number(facility.tickets[0].price)} {facility.tickets[0].currency}</span>
                </div>
              ) : (
                <div />
              )}
              
              <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.15em] text-primary bg-cyan-400/10 border border-cyan-400/20 px-4 py-2.5 rounded-xl transition-all duration-300 group-hover:bg-cyan-400 group-hover:text-slate-950 group-hover:border-cyan-400 group-hover:translate-x-1 shadow-lg shadow-cyan-950/10">
                <span>Detaljnije</span>
                <Icon name="navigation" className="text-[10px] rotate-90 transition-transform duration-300 group-hover:translate-x-0.5" />
              </div>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
