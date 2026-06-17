"use client"
import { Icon } from "@/components/ui/Icon";

import * as React from "react"
import { useRouter } from "next/navigation"
import useSWR from "swr"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"

interface FacilityResult {
  id: string
  name: string
  city: string
  category: string
}

interface TicketResult {
  id: string
  title: string
  facilityId: string
  facility: { name: string }
  price: number
}

interface TransactionResult {
  id: string
  totalAmount: number
  status: string
}

interface SearchResults {
  facilities: FacilityResult[]
  tickets: TicketResult[]
  transactions: TransactionResult[]
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function CommandPalette() {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const router = useRouter()

  const { data } = useSWR<SearchResults>(
    query.length >= 2 ? `/api/admin/search?q=${encodeURIComponent(query)}` : null,
    fetcher,
    { keepPreviousData: true }
  )

  const facilities = data?.facilities || []
  const tickets = data?.tickets || []
  const transactions = data?.transactions || []

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false)
    command()
  }, [])

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput 
        placeholder="Search facilities, tickets, or transactions..." 
        value={query}
        onValueChange={setQuery}
      />
      <CommandList className="bg-background border-t border-border/50 max-h-[450px]">
        <CommandEmpty className="py-12 text-center">
          <div className="flex flex-col items-center gap-2 opacity-40">
            <Icon name="search" className="text-[32px]" />
            <p className="text-xs font-bold uppercase tracking-widest">No results found</p>
          </div>
        </CommandEmpty>
        
        {facilities.length > 0 && (
          <CommandGroup heading="Facilities (Governance)">
            {facilities.map((f) => (
              <CommandItem
                key={f.id}
                onSelect={() => runCommand(() => router.push(`/admin/facilities/${f.id}`, { scroll: false }))}
                className="flex items-center gap-3 py-3"
              >
                <Icon name="business" className="text-[16px] text-primary" />
                <div className="flex flex-col">
                  <span className="font-bold text-xs">{f.name}</span>
                  <span className="text-[9px] text-muted-foreground uppercase tracking-tighter">{f.city} • {f.category}</span>
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
                onSelect={() => runCommand(() => router.push(`/admin/facilities/${t.facilityId}/tickets`))}
                className="flex items-center gap-3 py-3"
              >
                <Icon name="confirmation_number" className="text-[16px] text-emerald-400" />
                <div className="flex flex-col">
                  <span className="font-bold text-xs">{t.title}</span>
                  <span className="text-[9px] text-muted-foreground uppercase tracking-tighter">{t.facility.name} • {t.price} RSD</span>
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
                onSelect={() => runCommand(() => router.push(`/admin/support`))}
                className="flex items-center gap-3 py-3 font-mono"
              >
                <Icon name="credit_card" className="text-[16px] text-amber-400" />
                <div className="flex flex-col">
                  <span className="font-bold text-[10px] uppercase tracking-widest">{tr.id}</span>
                  <span className="text-[9px] text-muted-foreground uppercase tracking-tighter">{tr.totalAmount} RSD • {tr.status}</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandSeparator className="bg-muted/30" />
        
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => runCommand(() => router.push("/admin"))}>
            <Icon name="dashboard" className="mr-2 text-[16px] text-muted-foreground" />
            <span className="font-bold text-xs">Overview Dashboard</span>
            <CommandShortcut className="text-[10px]">G H</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/admin/facilities"))}>
            <Icon name="business" className="mr-2 text-[16px] text-muted-foreground" />
            <span className="font-bold text-xs">Facilities Registry</span>
            <CommandShortcut className="text-[10px]">G F</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/admin/support"))}>
            <Icon name="history" className="mr-2 text-[16px] text-muted-foreground" />
            <span className="font-bold text-xs">System Activity Logs</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator className="bg-muted/30" />
        
        <CommandGroup heading="Governance">
          <CommandItem onSelect={() => runCommand(() => setOpen(false))}>
            <Icon name="settings" className="mr-2 text-[16px] text-muted-foreground" />
            <span className="font-bold text-xs">System Settings</span>
            <CommandShortcut className="text-[10px]">S ,</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
