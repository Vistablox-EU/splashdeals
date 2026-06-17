import { cn } from "@/lib/utils"

interface AdminMetricCardProps {
  label: string
  value: number
  color: string
  glow: string
}

export function AdminMetricCard({ label, value, color, glow }: AdminMetricCardProps) {
  return (
    <div className={cn("p-5 rounded-2xl border backdrop-blur-md space-y-1.5 shadow-lg", glow)}>
      <p className="text-[9px] font-black uppercase tracking-[0.25em] text-muted-foreground">{label}</p>
      <p className={cn("text-3xl font-black italic tracking-tight", color)}>{value}</p>
    </div>
  )
}
