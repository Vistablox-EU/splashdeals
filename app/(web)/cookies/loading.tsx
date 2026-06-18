import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"
export default function CookiesLoading() {
  return (
    <div className="min-h-screen pb-32 pt-32 px-6 sm:px-12 max-w-5xl mx-auto">
      {/* 🏙️ HEADER SKELETON */}
      <header className="mb-20 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-muted border border-border text-muted-foreground/40">
            <Icon name="info" className="text-[20px]" />
          </div>
          <Skeleton className="h-4 w-32 bg-muted rounded-md" />
        </div>
        <h1 className="text-5xl sm:text-7xl font-black tracking-tighter uppercase italic leading-[0.9] text-muted-foreground/60 select-none pointer-events-none">Politika Kolačića</h1>
        <Skeleton className="h-4 w-48 bg-muted rounded-md" />
      </header>

      {/* 📜 CONTENT SKELETON */}
      <div className="space-y-12">
        <div className="space-y-3">
          <Skeleton className="h-4 w-full bg-muted rounded-md" />
          <Skeleton className="h-4 w-5/6 bg-muted rounded-md" />
        </div>

        <div className="grid gap-8">
          {[1, 2, 3].map((idx) => (
            <Card key={idx} className="p-8 border-border bg-gradient-to-r from-muted to-transparent space-y-4">
              <h2 className="text-xl font-black uppercase italic tracking-tight text-foreground flex items-center gap-3">
                <Icon name="keyboard_arrow_right" className="text-[20px] text-muted-foreground/40" />
                <Skeleton className="h-6 w-52 bg-muted rounded-md" />
              </h2>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full bg-muted rounded-md" />
                <Skeleton className="h-4 w-full bg-muted rounded-md" />
                <Skeleton className="h-4 w-2/3 bg-muted rounded-md" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
