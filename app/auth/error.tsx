"use client"
import { Icon } from "@/components/ui/Icon"
import { useEffect } from "react"
import Link from "next/link"

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Auth Error:", error)
  }, [error])

  return (
    <div className="text-center space-y-6">
      <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20">
        <Icon name="gpp_maybe" className="text-[40px] text-red-400" />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-black uppercase tracking-tighter italic">
          Auth <span className="text-slate-500">Error</span>
        </h1>
        <p className="text-sm text-slate-400 max-w-sm mx-auto">
          Something went wrong during authentication.
        </p>
      </div>
      <div className="flex flex-col gap-3">
        <button
          onClick={reset}
          className="w-full px-8 py-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all"
        >
          <Icon name="refresh" className="text-[16px]" />
          Try Again
        </button>
        <Link
          href="/auth/login"
          className="w-full px-8 py-4 rounded-xl bg-slate-100 hover:bg-white text-[#020617] font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all"
        >
          <Icon name="login" className="text-[16px]" />
          Go to Login
        </Link>
      </div>
    </div>
  )
}
