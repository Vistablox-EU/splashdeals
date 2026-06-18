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
     <div className="glass-frost p-6 rounded-[2rem] border border-border bg-muted/20 flex items-center gap-5 transition-all hover:border-primary/20 hover:bg-muted/40 duration-500 group">
        <div className="relative h-24 w-24 rounded-3xl overflow-hidden border border-border bg-background/50 p-2.5 backdrop-blur-md flex items-center justify-center flex-shrink-0 shadow-2xl group-hover:scale-105 transition-transform duration-500">
          <Image 
             src={logoUrl} 
             alt={`${name} Logo`}
             fill
             className="object-contain p-3"
          />
        </div>
        <div>
           <div className="text-[9px] font-black text-cyan-400 tracking-[0.2em] uppercase mb-1 flex items-center gap-1.5">
              <Icon name="verified" className="text-[14px] fill-cyan-500/20" /> Zvanični Partner
           </div>
           <h4 className="text-base font-black uppercase tracking-tight text-white leading-tight max-w-[160px]">{name}</h4>
        </div>
     </div>
  );
}
