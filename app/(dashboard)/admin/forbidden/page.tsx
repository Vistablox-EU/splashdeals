import { Icon } from "@/components/ui/Icon";
import Link from "next/link"
import { Button } from "@/components/ui/button"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Access Restricted | Splashdeals Admin",
  description: "Your administrative clearance does not permit access to this sector.",
}

export default function ForbiddenPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-4 text-center bg-slate-950">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-red-500/20 blur-[60px] rounded-full" />
        <div className="relative bg-slate-900 border border-red-500/50 p-6 rounded-2xl shadow-2xl">
          <Icon name="gpp_maybe" className="text-[48px] text-red-500" />
        </div>
      </div>
      
      <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic mb-4">
        Access Restricted
      </h1>
      
      <p className="max-w-md text-slate-400 font-medium leading-relaxed mb-8">
        Your current administrative clearance does not permit access to this sector. 
        Please contact a Super Admin if you believe this is an error.
      </p>

      <Button asChild variant="outline" className="border-white/10 hover:bg-white/5 text-white font-bold uppercase tracking-widest text-[11px] h-11 px-8 rounded-xl transition-all">
        <Link href="/admin">
          <Icon name="arrow_back" className="mr-2 text-[16px]" />
          Return to Command Center
        </Link>
      </Button>
    </div>
  )
}
