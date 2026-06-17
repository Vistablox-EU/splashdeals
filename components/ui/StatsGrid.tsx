"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";

interface StatItem {
  id: string;
  label: string;
  value: string;
  suffix?: string;
  sublabel?: string;
}

interface StatsGridProps {
  stats: StatItem[];
}

function Counter({ value, suffix }: { value: string; suffix?: string }) {
  const ref = useRef<HTMLDataElement>(null);
  const [inView, setInView] = useState(false);
  const [displayValue, setDisplayValue] = useState("0");
  const [hasAnimated, setHasAnimated] = useState(false);

  // Parse numeric value
  const targetValue = parseFloat(value) || 0;
  const hasDecimals = value.includes(".");

  // Use IntersectionObserver for in-view detection
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "-100px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView || hasAnimated) return;
    setTimeout(() => setHasAnimated(true));

    // Defer animation start
    const timeout = setTimeout(() => {
      const duration = 2000; // ms
      const startTime = performance.now();

      function animateCount(currentTime: number) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // easeOut cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = eased * targetValue;

        setDisplayValue(
          hasDecimals ? current.toFixed(1) : Math.round(current).toString()
        );

        if (progress < 1) {
          requestAnimationFrame(animateCount);
        }
      }

      requestAnimationFrame(animateCount);
    }, 500);

    return () => clearTimeout(timeout);
  }, [inView, targetValue, hasDecimals, hasAnimated]);

  return (
    <data ref={ref} value={value}>
      <span>{displayValue}</span>
      {suffix && <span>{suffix}</span>}
    </data>
  );
}

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <div
          key={stat.id}
          className="animate-fade-in-up"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <Card className="p-8 h-full flex flex-col justify-center items-center text-center group hover:border-cyan-500/50 transition-colors duration-500 overflow-hidden">
            <div className="text-4xl md:text-5xl font-black mb-2 bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent group-hover:from-cyan-400 group-hover:to-blue-500 transition-all flex items-baseline">
              <Counter value={stat.value} suffix={stat.suffix} />
            </div>
            <div className="text-sm font-bold text-cyan-400/80 uppercase tracking-widest mb-1">
              {stat.label}
            </div>
            {stat.sublabel && (
              <div className="text-xs text-slate-400 leading-relaxed max-w-[200px]">
                {stat.sublabel}
              </div>
            )}
            
            {/* 🧪 Decorative accent */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            
            {/* 💎 Glass shine effect */}
            <div className="absolute -inset-x-full top-0 h-full w-1/2 z-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-[-25deg] group-hover:animate-shimmer transition-all" />
          </Card>
        </div>
      ))}
      <style jsx>{`
        .animate-fade-in-up {
          opacity: 0;
          transform: translateY(20px);
          animation: fadeInUp 0.5s ease-out forwards;
        }
        @keyframes fadeInUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
