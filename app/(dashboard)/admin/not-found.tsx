import Link from "next/link"
import { Icon } from "@/components/ui/Icon"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Page Not Found | Splashdeals Admin",
  description: "This admin sector does not exist or has been relocated.",
}

export default function AdminNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-4 text-center bg-slate-950">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-amber-500/20 blur-[60px] rounded-full" />
        <div className="relative bg-slate-900 border border-amber-500/50 p-6 rounded-2xl shadow-2xl">
          <Icon name="search" className="text-[48px] text-amber-500" />
        </div>
      </div>

      <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic mb-4">
        Page Not Found
      </h1>

      <p className="max-w-md text-slate-400 font-medium leading-relaxed mb-8">
        This admin sector does not exist or has been relocated.
        Check the navigation for available sections.
      </p>

      <div className="flex gap-3">
        <Link
          href="/admin"
          className="px-8 py-3 rounded-xl bg-slate-100 hover:bg-white text-[#020617] font-black uppercase tracking-widest text-[10px] flex items-center gap-2 transition-all"
        >
          <Icon name="arrow_back" className="text-[16px]" />
          Command Center
        </Link>
      </div>
    </div>
  )
}
