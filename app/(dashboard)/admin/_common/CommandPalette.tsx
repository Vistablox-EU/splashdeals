"use client";
import { Icon } from "@/components/ui/Icon";

import * as React from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { searchAction } from "@/app/(server)/actions/search";
import type { SearchResults } from "@/app/(server)/actions/search";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";

export function CommandPalette() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const router = useRouter();

  const { data } = useSWR<SearchResults>(
    query.length >= 2 ? query : null,
    async (q: string) => {
      const result = await searchAction(q);
      return result.success ? result.data! : { facilities: [], tickets: [], transactions: [] };
    },
    { keepPreviousData: true },
  );

  const facilities = data?.facilities || [];
  const tickets = data?.tickets || [];
  const transactions = data?.transactions || [];

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, []);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Search facilities, tickets, or transactions..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList className="bg-background border-border/50 max-h-[450px] border-t">
        <CommandEmpty className="py-12 text-center">
          <div className="flex flex-col items-center gap-2 opacity-40">
            <Icon name="search" className="text-[32px]" />
            <p className="text-xs font-bold tracking-widest uppercase">No results found</p>
          </div>
        </CommandEmpty>

        {facilities.length > 0 && (
          <CommandGroup heading="Facilities (Governance)">
            {facilities.map((f) => (
              <CommandItem
                key={f.id}
                onSelect={() =>
                  runCommand(() => router.push(`/admin/facilities/${f.id}`, { scroll: false }))
                }
                className="flex items-center gap-3 py-3"
              >
                <Icon name="business" className="text-primary text-[16px]" />
                <div className="flex flex-col">
                  <span className="text-xs font-bold">{f.name}</span>
                  <span className="text-muted-foreground text-[9px] tracking-tighter uppercase">
                    {f.city} • {f.category}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {tickets.length > 0 && (
          <CommandGroup heading="Ticket Catalog (Variants)">
            {tickets.map((t) => (
              <CommandItem
                key={t.id}
                onSelect={() =>
                  runCommand(() => router.push(`/admin/facilities/${t.facilityId}/tickets`))
                }
                className="flex items-center gap-3 py-3"
              >
                <Icon name="confirmation_number" className="text-[16px] text-emerald-400" />
                <div className="flex flex-col">
                  <span className="text-xs font-bold">{t.title}</span>
                  <span className="text-muted-foreground text-[9px] tracking-tighter uppercase">
                    {t.facility.name} • {t.price} RSD
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {transactions.length > 0 && (
          <CommandGroup heading="Transactions (Sales Log)">
            {transactions.map((tr) => (
              <CommandItem
                key={tr.id}
                onSelect={() => runCommand(() => router.push(`/admin/dashboard`))}
                className="flex items-center gap-3 py-3 font-mono"
              >
                <Icon name="credit_card" className="text-[16px] text-amber-400" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold tracking-widest uppercase">{tr.id}</span>
                  <span className="text-muted-foreground text-[9px] tracking-tighter uppercase">
                    {tr.totalAmount} RSD • {tr.status}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandSeparator className="bg-muted/30" />

        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => runCommand(() => router.push("/admin"))}>
            <Icon name="dashboard" className="text-muted-foreground mr-2 text-[16px]" />
            <span className="text-xs font-bold">Overview Dashboard</span>
            <CommandShortcut className="text-[10px]">G H</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/admin/facilities"))}>
            <Icon name="business" className="text-muted-foreground mr-2 text-[16px]" />
            <span className="text-xs font-bold">Facilities Registry</span>
            <CommandShortcut className="text-[10px]">G F</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/admin/dashboard"))}>
            <Icon name="history" className="text-muted-foreground mr-2 text-[16px]" />
            <span className="text-xs font-bold">System Activity Logs</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator className="bg-muted/30" />

        <CommandGroup heading="Governance">
          <CommandItem onSelect={() => runCommand(() => setOpen(false))}>
            <Icon name="settings" className="text-muted-foreground mr-2 text-[16px]" />
            <span className="text-xs font-bold">System Settings</span>
            <CommandShortcut className="text-[10px]">S ,</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
