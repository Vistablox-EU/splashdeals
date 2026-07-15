import { cn } from "@/lib/utils";
import Link from "next/link";

interface AdminMetricCardProps {
  label: string;
  value: number;
  color: string;
  glow: string;
  href?: string;
}

export function AdminMetricCard({ label, value, color, glow, href }: AdminMetricCardProps) {
  const body = (
    <>
      <p className="text-muted-foreground text-[9px] font-black tracking-[0.25em] uppercase">
        {label}
      </p>
      <p className={cn("text-3xl font-black tracking-tight italic", color)}>{value}</p>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          "focus-visible:ring-primary/40 block space-y-1.5 rounded-2xl border p-5 shadow-lg backdrop-blur-md transition-colors hover:brightness-110 focus-visible:ring-2 focus-visible:outline-none",
          glow,
        )}
        aria-label={`Filtriraj: ${label}`}
      >
        {body}
      </Link>
    );
  }

  return (
    <div className={cn("space-y-1.5 rounded-2xl border p-5 shadow-lg backdrop-blur-md", glow)}>
      {body}
    </div>
  );
}
