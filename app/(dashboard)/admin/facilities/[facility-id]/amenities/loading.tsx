import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function AmenitiesLoading() {
  return (
    <Card className="rounded-2xl border border-border/50 bg-muted/40 backdrop-blur-xl p-6 space-y-6 shadow-2xl relative overflow-hidden animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="w-full max-w-md h-9 bg-background/40 rounded-lg border border-border/50" />
        <div className="flex items-center gap-3">
          <div className="h-4 w-28 bg-muted rounded" />
          <div className="h-6 w-10 bg-muted rounded-full" />
        </div>
      </div>
      <div className="border border-border/50 rounded-xl overflow-hidden bg-background/20">
        <div className="divide-y divide-border/50">
          <div className="grid grid-cols-6 gap-4 p-4 bg-background/60 border-b border-border/50">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-3 w-16 bg-muted rounded" />
            ))}
          </div>
          {[1, 2, 3, 4, 5].map((row) => (
            <div key={row} className="grid grid-cols-6 gap-4 p-4 items-center">
              <div className="h-6 w-10 bg-muted rounded-full" />
              <div className="h-4 w-32 bg-muted rounded" />
              <div className="h-5 w-16 bg-muted rounded-full" />
              <div className="h-8 w-36 bg-muted rounded-lg" />
              <div className="h-5 w-5 bg-muted rounded mx-auto" />
              <div className="h-6 w-6 bg-muted rounded-lg ml-auto" />
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
