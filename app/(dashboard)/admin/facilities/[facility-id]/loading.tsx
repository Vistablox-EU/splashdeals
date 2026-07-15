export default function OverviewLoading() {
  return (
    <div className="animate-pulse space-y-8">
      <div className="border-border/50 flex flex-col justify-between gap-4 border-b pb-8 md:flex-row md:items-center">
        <div className="space-y-3">
          <div className="bg-muted/30 h-4 w-28 rounded" />
          <div className="bg-muted/30 h-8 w-64 rounded" />
          <div className="bg-muted/30 h-4 w-48 rounded" />
        </div>
        <div className="flex gap-3">
          <div className="bg-muted/30 h-10 w-32 rounded-lg" />
          <div className="bg-muted/30 h-10 w-36 rounded-lg" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-muted/20 border-border/50 h-32 rounded-2xl border" />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-muted/20 border-border/50 h-72 rounded-2xl border" />
        <div className="bg-muted/20 border-border/50 h-72 rounded-2xl border" />
      </div>
    </div>
  );
}
