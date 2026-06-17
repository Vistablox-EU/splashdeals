"use client";

import * as React from "react"
import type { ComponentPropsWithoutRef } from "react"
import { cn } from "@/lib/utils"

export interface GlassCardProps extends ComponentPropsWithoutRef<"div"> {
  className?: string;
  children?: React.ReactNode;
  innerClassName?: string;
}

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, children, innerClassName, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "group relative overflow-hidden rounded-2xl",
          "bg-white/[0.03] backdrop-blur-2xl",
          "border border-white/10",
          "shadow-[0_20px_50px_rgba(0,0,0,0.5)]",
          "transition-all duration-300",
          "focus-within:ring-2 focus-within:ring-cyan-500/50 outline-none",
          className
        )}
        {...props}
      >
        {/* Radial Glow (Aqua Base) — CSS hover-only approach */}
        <div className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-[radial-gradient(650px_circle_at_50%_50%,rgba(6,182,212,0.1),transparent_80%)]" />

        {/* 🏙️ Structural Reflections */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-30 group-hover:opacity-10 transition-opacity duration-700" />
        
        {/* Subtle top-light reflection */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        
        {/* Bottom Inner Shadow */}
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />

        <div className={cn("relative z-10 h-full w-full", innerClassName)}>
          {children}
        </div>
      </div>
    )
  }
)
GlassCard.displayName = "GlassCard"

