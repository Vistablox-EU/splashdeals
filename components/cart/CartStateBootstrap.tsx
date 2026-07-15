"use client";

import * as React from "react";
import { useServerCart } from "@/hooks/use-server-cart";

/**
 * Mount once in the web shell to hydrate shared cart badge/drawer state
 * and keep BroadcastChannel subscribers live.
 */
export function CartStateBootstrap() {
  const refresh = useServerCart((state) => state.refresh);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  return null;
}
