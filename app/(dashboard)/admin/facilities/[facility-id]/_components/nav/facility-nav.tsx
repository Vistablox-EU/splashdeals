"use client";
import { Icon } from "@/components/ui/Icon";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { StatusToggle } from "@/app/(dashboard)/admin/_common/StatusToggle";
import { FacilityGovernanceSheet } from "./facility-governance-sheet";
import { FacilityStatus } from "@prisma/client";
interface FacilityNavProps {
  facility: {
    id: string;
    name: string;
    status: FacilityStatus;
  };
  counts?: {
    ticketCategories: number;
    media: number;
    amenities: number;
    faq: number;
  };
}

export function FacilityNav({ facility, counts }: FacilityNavProps) {
  const pathname = usePathname();

  const isActive = (href: string, exact = false) =>
    exact ? pathname === href : pathname.startsWith(href);

  const b = `/admin/facilities/${facility.id}`;

  const tabs = [
    { title: "Pregled", href: b, active: isActive(b, true), icon: "dashboard" },
    {
      title: "Ulaznice",
      href: `${b}/tickets`,
      active: isActive(`${b}/tickets`),
      icon: "confirmation_number",
      count: counts?.ticketCategories ?? 0,
    },
    {
      title: "Profil",
      href: `${b}/profile`,
      active: isActive(`${b}/profile`, true),
      icon: "account_circle",
    },
    {
      title: "FAQ",
      href: `${b}/faq`,
      active: isActive(`${b}/faq`),
      icon: "help",
      count: counts?.faq ?? 0,
    },
    {
      title: "Sadržaji",
      href: `${b}/amenities`,
      active: isActive(`${b}/amenities`),
      icon: "grid_view",
      count: counts?.amenities,
    },
    {
      title: "Radno vreme",
      href: `${b}/operations`,
      active: isActive(`${b}/operations`),
      icon: "schedule",
    },
    {
      title: "Mediji",
      href: `${b}/media`,
      active: isActive(`${b}/media`),
      icon: "photo_library",
      count: counts?.media,
    },
  ];

  return (
    <nav className="border-border bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur">
      <div className="flex h-14 items-center gap-2 px-4">
        {/* Left */}
        <div className="flex shrink-0 items-center gap-1">
          <SidebarTrigger className="hover:bg-accent hover:text-accent-foreground size-8 rounded-lg" />
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="text-muted-foreground hover:text-foreground size-8 rounded-lg"
            aria-label="Nazad na objekte"
          >
            <Link href="/admin/facilities" title="Nazad na objekte">
              <Icon name="keyboard_arrow_left" className="size-4" />
            </Link>
          </Button>
        </div>

        <Separator orientation="vertical" className="mx-1 h-5" />

        {/* Facility name */}
        <div className="mr-2 flex min-w-0 shrink-0 items-center gap-2">
          <span className="text-muted-foreground max-w-[160px] truncate text-xs font-medium tracking-wider uppercase sm:max-w-[240px]">
            {facility.name}
          </span>
          <div
            className={cn(
              "size-1.5 shrink-0 rounded-full",
              facility.status === "ACTIVE" && "bg-emerald-500",
              facility.status === "DRAFT" && "bg-yellow-500",
              (facility.status === "CLOSED" || facility.status === "EMERGENCY_SHUTDOWN") &&
                "bg-red-500",
            )}
            role="status"
            aria-label={`Facility ${facility.status.toLowerCase().replace("_", " ")}`}
          />
        </div>

        <Separator orientation="vertical" className="mr-2 hidden h-5 md:block" />

        {/* Center — Horizontal Tabs */}
        <div className="no-scrollbar flex flex-1 items-center gap-0.5 overflow-x-auto">
          {tabs.map((tab) => (
            <Button
              key={tab.href}
              variant="ghost"
              asChild
              className={cn(
                "relative h-8 rounded-none px-3 text-xs font-medium transition-colors",
                tab.active
                  ? "text-foreground after:bg-foreground after:absolute after:right-0 after:bottom-0 after:left-0 after:h-0.5 after:rounded-full"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Link href={tab.href}>
                <Icon name={tab.icon} className="mr-1.5 size-3.5 shrink-0" />
                {tab.title}
                {tab.count !== undefined && (
                  <span className="text-muted-foreground/60 ml-1.5 font-mono text-[10px]">
                    {tab.count}
                  </span>
                )}
              </Link>
            </Button>
          ))}
        </div>

        {/* Right */}
        <div className="flex shrink-0 items-center gap-2">
          <Separator orientation="vertical" className="hidden h-5 md:block" />
          <div className="hidden sm:block">
            <StatusToggle facilityId={facility.id} status={facility.status} compact />
          </div>
          <FacilityGovernanceSheet facility={facility} />
        </div>
      </div>
    </nav>
  );
}

export function FacilityNavSkeleton() {
  return (
    <div className="border-border bg-background h-14 w-full border-b">
      <div className="flex h-full items-center gap-2 px-4">
        <Skeleton className="size-8 shrink-0 rounded-lg" />
        <Skeleton className="size-8 shrink-0 rounded-lg" />
        <Skeleton className="mx-1 h-5 w-px shrink-0" />
        <Skeleton className="h-4 w-28 shrink-0" />
        <Skeleton className="mx-2 hidden h-5 w-px shrink-0 md:block" />
        <div className="flex flex-1 gap-0.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-20 rounded-none" />
          ))}
        </div>
        <Skeleton className="size-8 shrink-0 rounded-lg" />
      </div>
    </div>
  );
}
