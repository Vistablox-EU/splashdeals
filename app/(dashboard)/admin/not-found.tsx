import Link from "next/link"
import { Icon } from "@/components/ui/Icon"
import { Button } from "@/components/ui/button"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Stranica nije pronađena | Splashdeals Admin",
  description: "This admin sector does not exist or has been relocated.",
}

export default function AdminNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-4 text-center bg-background">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-amber-500/20 blur-[60px] rounded-full" />
        <div className="relative bg-muted border border-amber-500/50 p-6 rounded-2xl shadow-2xl">
          <Icon name="search" className="size-12 text-amber-500" />
        </div>
      </div>

      <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase italic mb-4">
        Stranica nije pronađena
      </h1>

      <p className="max-w-md text-muted-foreground font-medium leading-relaxed mb-8">
        This admin sector does not exist or has been relocated.
        Check the navigation for available sections.
      </p>

      <Button asChild variant="secondary" size="lg" className="font-black uppercase tracking-widest text-[10px] rounded-xl">
        <Link href="/admin">
          <Icon name="arrow_back" className="size-4" />
          Kontrolna tabla
        </Link>
      </Button>
    </div>
  )
}
