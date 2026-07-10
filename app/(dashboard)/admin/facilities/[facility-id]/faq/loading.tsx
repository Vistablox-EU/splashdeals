import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function FAQLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-24 rounded-lg" />
        <Skeleton className="h-4 w-64 rounded-lg" />
      </div>
      <Card className="border-border/50 bg-muted/20 space-y-4 rounded-2xl border p-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="border-border/30 space-y-2 border-b pb-4 last:border-0">
            <Skeleton className="h-5 w-3/4 rounded-lg" />
            <Skeleton className="h-4 w-full rounded-lg" />
          </div>
        ))}
      </Card>
    </div>
  );
}
