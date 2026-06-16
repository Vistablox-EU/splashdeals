import { Icon } from "@/components/ui/Icon";
import { Metadata } from "next"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Support Logs | Splashdeals Admin",
  description: "Customer support logs and escalation management.",
}

export default function SupportPage() {
  return (
    <div className="flex flex-col gap-8 p-4 md:p-6 w-full relative overflow-hidden bg-slate-950 min-h-[calc(100vh-4rem)] rounded-2xl border border-white/5">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/10 blur-[120px] rounded-full -mr-64 -mt-64 pointer-events-none" />

      <div className="relative z-10">
        <h1 className="text-2xl font-black tracking-tight text-white uppercase italic">Customer Support Logs</h1>
        <p className="text-muted-foreground mt-1.5 text-xs font-medium uppercase tracking-wider opacity-80">
          Track and manage customer support tickets and escalations.
        </p>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center py-24 text-center">
        <div className="mb-6 rounded-full bg-slate-800/50 border border-white/10 p-5">
          <Icon name="support" className="text-[40px] text-slate-500" />
        </div>
        <h2 className="text-lg font-bold text-slate-300 mb-2">Coming Soon</h2>
        <p className="text-slate-500 text-sm max-w-md">
          Customer support log management is under development. Tickets and escalations will appear here.
        </p>
        <Button asChild variant="outline" className="mt-8 border-white/10 hover:bg-white/5 text-white font-bold uppercase tracking-widest text-[11px] h-11 px-8 rounded-xl">
          <Link href="/admin">
            <Icon name="arrow_back" className="mr-2 text-[16px]" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
    </div>
  )
}
