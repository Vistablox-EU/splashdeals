import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"
export default function SupportLoading() {
  return (
    <div className="min-h-screen pb-16 sm:pb-32 pt-24 sm:pt-32 px-6 sm:px-12 max-w-5xl mx-auto animate-pulse">
      {/* 🏙️ HEADER SKELETON */}
      <header className="mb-12 sm:mb-20 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-muted border border-border text-muted-foreground/40">
            <Icon name="support" className="text-[20px]" />
          </div>
          <Skeleton className="h-4 w-32 bg-muted rounded-md" />
        </div>
        <h1 className="text-5xl sm:text-7xl font-black tracking-tighter uppercase italic leading-[0.9] text-muted-foreground/60 select-none pointer-events-none">Centar za Podršku</h1>
        <Skeleton className="h-4 w-48 bg-muted rounded-md" />
      </header>

      {/* 📜 CONTENT SKELETON */}
      <div className="space-y-12">
        <div className="space-y-3">
          <Skeleton className="h-4 w-full bg-muted rounded-md" />
          <Skeleton className="h-4 w-5/6 bg-muted rounded-md" />
        </div>

        <section className="space-y-8">
          <h2 className="text-2xl font-black uppercase italic tracking-tight text-foreground flex items-center gap-3">
            <Icon name="help" className="text-[24px] text-muted-foreground/40" />
            <Skeleton className="h-6 w-48 bg-muted rounded-md" />
          </h2>

          <div className="grid gap-6">
            {[1, 2, 3].map((idx) => (
              <Card key={idx} className="p-6 border-border bg-gradient-to-r from-muted to-transparent space-y-3">
                <Skeleton className="h-5 w-1/3 bg-muted rounded-md" />
                <Skeleton className="h-4 w-full bg-muted rounded-md" />
                <Skeleton className="h-4 w-2/3 bg-muted rounded-md" />
              </Card>
            ))}
          </div>
        </section>

        {/* 📧 CONTACT SECTION SKELETON */}
        <Card className="p-8 border-border bg-muted">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-3 flex-grow">
              <Skeleton className="h-5 w-44 bg-muted rounded-md" />
              <Skeleton className="h-4 w-64 bg-muted rounded-md" />
            </div>
            <Skeleton className="h-12 w-36 bg-muted rounded-xl flex-shrink-0" />
          </div>
        </Card>
      </div>
    </div>
  )
}
