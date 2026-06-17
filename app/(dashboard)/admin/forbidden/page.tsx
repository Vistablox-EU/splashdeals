import { Icon } from "@/components/ui/Icon";
import Link from "next/link"
import { Button } from "@/components/ui/button"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Ograničen pristup | Splashdeals Admin",
  description: "Your administrative clearance does not permit access to this sector.",
}

export default function ForbiddenPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-4 text-center bg-background">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-red-500/20 blur-[60px] rounded-full" />
        <div className="relative bg-muted border border-red-500/50 p-6 rounded-2xl shadow-2xl">
          <Icon name="gpp_maybe" className="size-12 text-red-500" />
        </div>
      </div>
      
      <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase italic mb-4">
        Ograničen pristup
      </h1>
      
      <p className="max-w-md text-muted-foreground font-medium leading-relaxed mb-8">
        Your current administrative clearance does not permit access to this sector. 
        Please contact a Super Admin if you believe this is an error.
      </p>

      <Button asChild variant="outline" size="lg" className="rounded-xl">
        <Link href="/admin/dashboard">
          <Icon name="arrow_back" className="mr-2 size-4" />
          Nazad na kontrolnu tablu
        </Link>
      </Button>
    </div>
  )
}
