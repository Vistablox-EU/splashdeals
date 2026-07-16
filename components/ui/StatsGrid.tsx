import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatItem {
  id: string;
  label: string;
  /** Numeric value string (e.g. "17"). */
  value?: string;
  suffix?: string;
  /** Non-numeric display (e.g. "<5s", "24/7") — preferred when set. */
  staticDisplay?: string;
  sublabel?: string;
}

interface StatsGridProps {
  stats: StatItem[];
  className?: string;
}

/**
 * Server-safe stats grid. Displays final values immediately (no zero-flash animation).
 */
export function StatsGrid({ stats, className }: StatsGridProps) {
  return (
    <div className={cn("grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4", className)}>
      {stats.map((stat) => {
        const display = stat.staticDisplay ?? `${stat.value ?? ""}${stat.suffix ?? ""}`;
        return (
          <Card
            key={stat.id}
            className="group hover:border-primary/50 relative flex h-full flex-col items-center justify-center overflow-hidden p-8 text-center transition-colors duration-150"
          >
            <div className="from-foreground to-muted-foreground group-hover:from-primary group-hover:to-primary/70 mb-2 flex items-baseline bg-gradient-to-br bg-clip-text text-4xl font-black text-transparent transition-colors md:text-5xl">
              <data value={stat.value ?? display}>{display}</data>
            </div>
            <div className="text-primary/80 mb-1 text-sm font-bold tracking-widest uppercase">
              {stat.label}
            </div>
            {stat.sublabel ? (
              <div className="text-muted-foreground max-w-[200px] text-xs leading-relaxed">
                {stat.sublabel}
              </div>
            ) : null}
          </Card>
        );
      })}
    </div>
  );
}
