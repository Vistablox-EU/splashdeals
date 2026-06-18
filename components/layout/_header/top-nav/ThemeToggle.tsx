"use client";

import { useTheme } from "next-themes";
import * as React from "react";
import { Icon } from "@/components/ui/Icon";
import { LiquidButton } from "@/components/ui/LiquidButton";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <LiquidButton variant="ghost" size="sm" className="px-4 h-11" aria-label="Toggle theme" disabled>
        <span className="size-[16px]" />
      </LiquidButton>
    );
  }

  const isDark = theme === "dark";

  return (
    <LiquidButton
      variant="ghost"
      size="sm"
      className="px-4 h-11"
      aria-label={isDark ? "Prebaci na svetlu temu" : "Prebaci na tamnu temu"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      <Icon
        name={isDark ? "light_mode" : "dark_mode"}
        className="text-[16px] text-primary"
      />
    </LiquidButton>
  );
}
