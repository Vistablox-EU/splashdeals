"use client";

import { useTheme } from "next-themes";
import * as React from "react";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/button";
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

  const toggleAria = dict?.theme?.toggle_aria ?? "Prebaci temu";

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-11 min-h-11 px-4 transition-colors"
        aria-label={toggleAria}
        disabled
      >
        <span className="size-[16px]" />
      </Button>
    );
  }

  const isDark = theme === "dark";

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-11 min-h-11 px-4 transition-colors"
      aria-label={
        isDark
          ? (dict?.theme?.switch_light ?? "Prebaci na svetlu temu")
          : (dict?.theme?.switch_dark ?? "Prebaci na tamnu temu")
      }
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      <Icon name={isDark ? "light_mode" : "dark_mode"} className="text-primary text-[16px]" />
    </Button>
  );
}
