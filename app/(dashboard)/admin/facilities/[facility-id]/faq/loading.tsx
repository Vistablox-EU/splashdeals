import { Card } from "@/components/ui/card"

export default function FAQLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="animate-pulse space-y-2">
        <div className="h-7 w-24 bg-muted/40 rounded-lg" />
        <div className="h-4 w-64 bg-muted/30 rounded-lg" />
      </div>
      <Card className="animate-pulse border border-border/50 bg-muted/20 p-6 space-y-4 rounded-2xl">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-2 pb-4 border-b border-border/30 last:border-0">
            <div className="h-5 w-3/4 bg-muted/40 rounded-lg" />
            <div className="h-4 w-full bg-muted/20 rounded-lg" />
          </div>
        ))}
      </Card>
    </div>
  )
}
