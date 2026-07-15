import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/button";
import { AdminMetricCard } from "./AdminMetricCard";
import Link from "next/link";
import type { ReactNode } from "react";

export interface StatItem {
  label: string;
  value: number;
  color: string;
  glow: string;
  href?: string;
}

interface AdminPageShellProps {
  title: string;
  subtitle: string;
  cta?: { label: string; href: string; icon: string };
  stats: StatItem[];
  statsGridCols?: string;
  glowColor?: string;
  children: ReactNode;
}

export function AdminPageShell({
  title,
  subtitle,
  cta,
  stats,
  statsGridCols = "md:grid-cols-2 lg:grid-cols-4",
  glowColor = "bg-primary/5",
  children,
}: AdminPageShellProps) {
  return (
    <div className="bg-background border-border/50 relative flex min-h-[calc(100vh-4rem)] w-full flex-col gap-8 overflow-hidden rounded-2xl border p-4 md:p-6">
      {/* Immersive Ambient Glow */}
      <div
        className={`pointer-events-none absolute top-0 right-0 -mt-64 -mr-64 h-[500px] w-[500px] rounded-full blur-[120px] ${glowColor}`}
      />
      <div className="bg-accent/5 pointer-events-none absolute bottom-0 left-0 -mb-48 -ml-48 h-[400px] w-[400px] rounded-full blur-[100px]" />

      <div className="relative z-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-foreground text-2xl font-black tracking-tight uppercase italic">
            {title}
          </h1>
          <p className="text-muted-foreground mt-1.5 text-xs font-medium tracking-wider uppercase opacity-80">
            {subtitle}
          </p>
        </div>
        {cta && (
          <Button
            asChild
            size="lg"
            className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/25 hover:shadow-primary/40 h-11 shrink-0 rounded-xl px-6 text-[11px] font-black tracking-widest uppercase shadow-lg transition-all duration-300 hover:shadow-xl"
          >
            <Link href={cta.href}>
              <Icon name={cta.icon} className="mr-2 text-[16px]" />
              {cta.label}
            </Link>
          </Button>
        )}
      </div>

      <div className={`relative z-10 grid gap-4 ${statsGridCols}`}>
        {stats.map((stat) => (
          <AdminMetricCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            color={stat.color}
            glow={stat.glow}
            href={stat.href}
          />
        ))}
      </div>

      <div className="relative z-10 mt-4">{children}</div>
    </div>
  );
}
