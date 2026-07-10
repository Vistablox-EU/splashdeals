/**
 * 🔄 Spinner (deprecated)
 *
 * Legacy spinner component. New code should use the shadcn pattern directly:
 *   <Icon name="refresh" className="animate-spin size-4" />
 *
 * This wrapper delegates to <Icon> for backward compatibility.
 * The style prop is accepted but not forwarded — use className for sizing.
 */

import { Icon } from "@/components/ui/Icon";
import type { CSSProperties } from "react";

interface SpinnerProps {
  className?: string;
  /** @deprecated Use className for sizing (e.g. `size-4`) */
  style?: CSSProperties;
}

export function Spinner({ className = "" }: SpinnerProps) {
  return <Icon name="refresh" className={`text-primary animate-spin ${className}`} />;
}
