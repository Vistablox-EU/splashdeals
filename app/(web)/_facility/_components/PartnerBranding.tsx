import { Icon } from "@/components/ui/Icon";
import Image from "next/image";
interface PartnerBrandingProps {
  logoUrl: string | null;
  name: string;
}

/**
 * 🛡️ PartnerBranding Module
 * High-fidelity glassmorphic branding seal to showcase verified status.
 */
export function PartnerBranding({ logoUrl, name }: PartnerBrandingProps) {
  if (!logoUrl) return null;

  return (
    <div className="glass-frost border-border bg-muted/20 hover:border-primary/20 hover:bg-muted/40 group flex items-center gap-5 rounded-[2rem] border p-6 transition-all duration-500">
      <div className="border-border bg-background/50 relative flex h-24 w-24 flex-shrink-0 items-center justify-center overflow-hidden rounded-3xl border p-2.5 shadow-2xl backdrop-blur-md transition-transform duration-500 group-hover:scale-105">
        <Image src={logoUrl} alt={`${name} Logo`} fill className="object-contain p-3" />
      </div>
      <div>
        <div className="text-primary mb-1 flex items-center gap-1.5 text-[9px] font-black tracking-[0.2em] uppercase">
          <Icon name="verified" className="fill-primary/20 text-[14px]" /> Zvanični Partner
        </div>
        <h4 className="text-foreground max-w-[160px] text-base leading-tight font-black tracking-tight uppercase">
          {name}
        </h4>
      </div>
    </div>
  );
}
