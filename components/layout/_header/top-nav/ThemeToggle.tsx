"use client";

import { useTheme } from "next-themes";
import * as React from "react";
import { Icon } from "@/components/ui/Icon";
import { LiquidButton } from "@/components/ui/LiquidButton";
import type { Dict } from "@/lib/types";

interface ThemeToggleProps {
  dict?: Dict;
}

export function ThemeToggle({ dict }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <LiquidButton
        variant="ghost"
        size="sm"
        className="h-11 px-4"
        aria-label="Toggle theme"
        disabled
      >
        <span className="size-[16px]" />
      </LiquidButton>
    );
  }

  const isDark = theme === "dark";

  return (
    <LiquidButton
      variant="ghost"
      size="sm"
      className="h-11 px-4"
      aria-label={
        isDark
          ? (dict?.theme?.switch_light ?? "Prebaci na svetlu temu")
          : (dict?.theme?.switch_dark ?? "Prebaci na tamnu temu")
      }
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      <Icon name={isDark ? "light_mode" : "dark_mode"} className="text-primary text-[16px]" />
    </LiquidButton>
  );
}
