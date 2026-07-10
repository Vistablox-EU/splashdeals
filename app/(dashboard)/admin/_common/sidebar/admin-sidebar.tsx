"use client";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/skeleton";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { SearchForm } from "./search-form";
import { APP_VERSION, BUILD_YEAR } from "@/lib/constants";

import { adminNavData as data } from "@/config/admin-nav";

function SidebarNavItems({ userRole }: { userRole?: string | null }) {
  const pathname = usePathname() || "/";
  const sidebarId = "admin-sidebar-state";

  const getStoredOpen = React.useCallback((title: string): boolean | undefined => {
    try {
      const stored = localStorage.getItem(`${sidebarId}-${title}`);
      if (stored !== null) return JSON.parse(stored);
    } catch (error: unknown) {
      console.warn(
        "Failed to read sidebar state from localStorage:",
        error instanceof Error ? error.message : error,
      );
    }
    return undefined;
  }, []);

  const setStoredOpen = React.useCallback((title: string, open: boolean) => {
    try {
      localStorage.setItem(`${sidebarId}-${title}`, JSON.stringify(open));
    } catch (error: unknown) {
      console.warn(
        "Failed to save sidebar state to localStorage:",
        error instanceof Error ? error.message : error,
      );
    }
  }, []);

  const [openGroups, setOpenGroups] = React.useState<Record<string, boolean | undefined>>({});
  const [initialized, setInitialized] = React.useState(false);

  React.useEffect(() => {
    const initial: Record<string, boolean | undefined> = {};
    for (const item of data.navMain) {
      initial[item.title] = getStoredOpen(item.title);
    }
    requestAnimationFrame(() => {
      setOpenGroups(initial);
      setInitialized(true);
    });
  }, [getStoredOpen]);

  // Detect facility context from URL
  const facilityMatch = pathname.match(/\/admin\/facilities\/([a-f0-9-]+)\/?/);
  const currentFacilityId = facilityMatch ? facilityMatch[1] : null;
  const isOnFacilityNew = pathname === "/admin/facilities/new";
  const isInsideFacility = !!currentFacilityId && currentFacilityId !== "new" && !isOnFacilityNew;

  return (
    <>
      {data.navMain.map((item) => {
        const visibleSubItems =
          item.items?.filter(
            (subItem) => !subItem.requiredRole || subItem.requiredRole === userRole,
          ) || [];

        if (visibleSubItems.length === 0) return null;

        const isFlat = visibleSubItems.length === 1;
        const checkUrl = isFlat ? visibleSubItems[0].url : item.url;
        const isActive =
          checkUrl === "/admin" ? pathname === "/admin" : pathname.startsWith(checkUrl);

        const isFacilityManagement = item.title === "Facilities Registry";

        const isGroupOpen = initialized
          ? (openGroups[item.title] ?? (isActive || isInsideFacility))
          : isActive || isInsideFacility;

        const mainGroup = (
          <Collapsible
            key={item.title}
            title={item.title}
            open={isGroupOpen}
            onOpenChange={(open) => {
              setOpenGroups((prev) => ({ ...prev, [item.title]: open }));
              setStoredOpen(item.title, open);
            }}
            className="group/collapsible"
          >
            <SidebarGroup>
              <SidebarGroupLabel
                asChild
                className="group/label text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sm"
              >
                <CollapsibleTrigger>
                  {item.icon && <Icon name={item.icon} className="mr-2 size-4" />}
                  {item.title}
                  <Icon
                    name="keyboard_arrow_right"
                    className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90"
                  />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {isFacilityManagement && (
                      <>
                        <SidebarMenuItem className="px-2 py-1">
                          <SearchForm />
                        </SidebarMenuItem>
                        {isInsideFacility && (
                          <>
                            <SidebarMenuItem>
                              <div className="bg-sidebar-accent border-sidebar-border mx-2 flex items-center gap-2 rounded-md border px-2 py-1.5">
                                <Icon name="business" className="text-primary size-3 shrink-0" />
                                <span className="text-primary/80 truncate text-xs font-bold">
                                  {currentFacilityId?.split("-")[0]}
                                </span>
                              </div>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                              <SidebarMenuButton asChild isActive={pathname.endsWith("/tickets")}>
                                <Link href={`/admin/facilities/${currentFacilityId}/tickets`}>
                                  <Icon name="confirmation_number" className="size-3.5" />
                                  Tickets
                                </Link>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                              <SidebarMenuButton asChild isActive={pathname.endsWith("/profile")}>
                                <Link href={`/admin/facilities/${currentFacilityId}/profile`}>
                                  <Icon name="settings" className="size-3.5" />
                                  Profile
                                </Link>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                              <SidebarMenuButton
                                asChild
                                isActive={pathname.endsWith("/operations")}
                              >
                                <Link href={`/admin/facilities/${currentFacilityId}/operations`}>
                                  <Icon name="schedule" className="size-3.5" />
                                  Operations
                                </Link>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                              <SidebarMenuButton asChild isActive={pathname.endsWith("/amenities")}>
                                <Link href={`/admin/facilities/${currentFacilityId}/amenities`}>
                                  <Icon name="auto_awesome" className="size-3.5" />
                                  Amenities
                                </Link>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                              <SidebarMenuButton asChild isActive={pathname.endsWith("/media")}>
                                <Link href={`/admin/facilities/${currentFacilityId}/media`}>
                                  <Icon name="photo_library" className="size-3.5" />
                                  Media
                                </Link>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          </>
                        )}
                      </>
                    )}
                    {visibleSubItems.map((subItem) => (
                      <SidebarMenuItem key={subItem.title}>
                        <SidebarMenuButton
                          asChild
                          isActive={
                            subItem.url === "/admin"
                              ? pathname === "/admin"
                              : pathname.startsWith(subItem.url)
                          }
                        >
                          <Link href={subItem.url}>
                            {subItem.icon && <Icon name={subItem.icon} className="size-4" />}
                            {subItem.title}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        );

        return mainGroup;
      })}
    </>
  );
}

interface AdminSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user?: {
    name?: string | null;
    role?: string | null;
  };
}

export function AdminSidebar({ user, ...props }: AdminSidebarProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const userRole = user?.role;
  const pathname = usePathname();
  const { toggleSidebar, isMobile, setOpenMobile } = useSidebar();

  React.useEffect(() => {
    if (isMobile) {
      setOpenMobile(false);
    }
  }, [pathname, isMobile, setOpenMobile]);

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "b") {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggleSidebar]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            router.push("/auth/login");
          },
        },
      });
    } catch (error: unknown) {
      console.error("Failed to sign out:", error instanceof Error ? error.message : error);
      toast.error("Something went wrong. Please try again.");
      setIsLoggingOut(false);
    }
  };

  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
    : "AD";
  const userRoleDisplay =
    userRole === "SUPER_ADMIN"
      ? "Super Admin"
      : userRole === "FACILITY_STAFF"
        ? "Facility Staff"
        : "Administrator";

  return (
    <Sidebar {...props}>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="bg-sidebar-accent border-sidebar-border text-primary flex aspect-square size-8 items-center justify-center rounded-lg border">
            <span className="text-lg font-bold tracking-tight">SD</span>
          </div>
          <div className="flex flex-col gap-0.5 leading-none">
            <span className="text-sidebar-foreground text-sm font-bold tracking-tight uppercase">
              Splashdeals
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-primary text-[10px] font-black tracking-widest uppercase">
                Admin
              </span>
              <div className="bg-sidebar-border size-1 rounded-full" />
              <span className="text-sidebar-foreground/50 font-mono text-[10px] tracking-tighter uppercase">
                v{APP_VERSION}
              </span>
            </div>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="gap-0">
        <React.Suspense
          fallback={
            <div className="space-y-4 p-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          }
        >
          <SidebarNavItems userRole={userRole} />
        </React.Suspense>
      </SidebarContent>
      <SidebarRail />
      <SidebarFooter className="border-sidebar-border space-y-4 border-t p-4">
        <div className="bg-sidebar-accent/30 border-sidebar-border hover:bg-sidebar-accent/50 flex items-center gap-3 rounded-xl border px-2 py-2 transition-all">
          <div className="relative shrink-0">
            <div className="text-foreground flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 text-xs font-black shadow-lg shadow-cyan-500/20">
              {userInitials}
            </div>
            <div className="border-sidebar absolute -right-0.5 -bottom-0.5 size-2.5 animate-pulse rounded-full border-2 bg-emerald-500" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="text-sidebar-foreground truncate text-xs font-black tracking-tight uppercase">
              {user?.name || "Administrator"}
            </span>
            <span className="text-sidebar-foreground/50 truncate font-mono text-[10px] uppercase">
              {userRoleDisplay}
            </span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="text-sidebar-foreground/50 shrink-0 rounded-lg hover:bg-red-500/10 hover:text-red-400"
            title="Sign Out"
          >
            {isLoggingOut ? (
              <Icon name="progress_activity" className="size-3 animate-spin" />
            ) : (
              <Icon name="logout" className="size-3.5" />
            )}
          </Button>
        </div>

        <div className="text-sidebar-foreground/50 flex items-center justify-between px-2 py-1.5 font-mono text-xs tracking-tight uppercase">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "size-1.5 animate-pulse rounded-full shadow-[0_0_8px_rgba(6,182,212,0.5)]",
                userRole === "SUPER_ADMIN" ? "bg-primary" : "bg-primary/60",
              )}
            />
            {userRole === "SUPER_ADMIN" ? "Mode: Master" : "Mode: Operator"}
          </div>
          <span className="text-sidebar-foreground/40">SD-RSA-{BUILD_YEAR}</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
