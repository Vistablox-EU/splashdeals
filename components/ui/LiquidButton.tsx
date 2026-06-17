"use client";

import * as React from "react";
import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

interface LiquidButtonProps extends ComponentPropsWithoutRef<"button"> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const LiquidButton = React.forwardRef<HTMLButtonElement, LiquidButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, children, ...props }, ref) => {
    
    // Liquid Base
    const baseClasses = "relative inline-flex items-center justify-center font-bold tracking-wide rounded-full overflow-hidden transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed";
    
    // Variants
    const variants = {
      primary: "bg-[var(--color-primary)] text-black shadow-[var(--shadow-neon)] hover:shadow-[var(--shadow-neon-hover)]",
      secondary: "bg-[var(--color-surface)] text-white border border-[var(--color-glass-border)] hover:bg-[var(--color-surface-hover)]",
      ghost: "bg-transparent text-[var(--color-primary)] hover:bg-[var(--color-surface)]",
      danger: "bg-red-500/20 text-red-400 border border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.2)] hover:bg-red-500/30"
    };

    // Sizes
    const sizes = {
      sm: "px-4 py-2 text-sm",
      md: "px-6 py-3 text-base",
      lg: "px-8 py-4 text-lg"
    };

    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        className={cn(baseClasses, variants[variant], sizes[size], "hover:scale-[1.02] active:scale-[0.98] transition-transform", className)}
        disabled={isLoading || props.disabled}
        {...(props as React.ComponentPropsWithoutRef<"button">)}
      >
        {/* Glow Overlay effect */}
        {variant === 'primary' && (
          <div className="absolute inset-0 bg-white/20 opacity-0 hover:opacity-100 transition-opacity duration-300" />
        )}

        <span className={cn("relative z-10 flex items-center gap-2", isLoading && "opacity-0")}>
          {children as React.ReactNode}
        </span>

        {/* Loading Spinner */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <svg
              className="animate-spin h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )}
      </button>
    );
  }
);

LiquidButton.displayName = "LiquidButton";
