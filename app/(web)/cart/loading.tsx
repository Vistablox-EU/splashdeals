import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"
export default function CartLoading() {
  return (
    <div className="container max-w-6xl mx-auto py-24 px-6">
      <div className="flex flex-col lg:flex-row gap-12">
        
        {/* 🛒 ITEM LIST SKELETON */}
        <div className="flex-grow space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground/40">
              <Icon name="arrow_back" className="text-[16px]" />
              <span className="text-[10px] uppercase font-black tracking-widest">Nazad na karte</span>
            </div>
            <Skeleton className="h-8 w-44 bg-muted rounded-xl" />
          </div>

          <div className="space-y-4">
            {[1, 2].map((i) => (
              <Card key={i} className="p-6 border-border bg-gradient-to-r from-muted to-transparent">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  {/* Icon/Image Placeholder */}
                  <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center flex-shrink-0" />

                  {/* Info */}
                  <div className="flex-grow space-y-3 w-full text-center md:text-left">
                    <div className="flex flex-wrap justify-center md:justify-start gap-2">
                      <Skeleton className="h-4 w-24 bg-muted rounded-full" />
                      <Skeleton className="h-4 w-20 bg-muted rounded-full" />
                    </div>
                    <Skeleton className="h-6 w-48 bg-muted rounded-lg mx-auto md:mx-0" />
                    <Skeleton className="h-4 w-32 bg-muted rounded-md mx-auto md:mx-0" />
                  </div>

                  {/* Quantity Controls */}
                  <div className="w-32 h-14 bg-muted rounded-2xl flex-shrink-0" />
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* 📋 SUMMARY SKELETON */}
        <div className="w-full lg:w-96 flex-shrink-0 space-y-6 pt-12 lg:pt-0">
          <Card className="p-8 border-primary/10 bg-slate-950/25 relative overflow-hidden space-y-8">
            <div className="space-y-4">
              <Skeleton className="h-6 w-36 bg-muted rounded-lg" />
              <Skeleton className="h-10 w-28 bg-muted rounded-xl" />
            </div>

            <div className="space-y-3 pt-6 border-t border-border">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-20 bg-muted rounded-md" />
                <Skeleton className="h-4 w-16 bg-muted rounded-md" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-4 w-24 bg-muted rounded-md" />
                <Skeleton className="h-4 w-12 bg-muted rounded-md" />
              </div>
            </div>

            <Skeleton className="h-16 w-full bg-muted rounded-2xl pt-2" />
          </Card>
        </div>

      </div>
    </div>
  )
}
