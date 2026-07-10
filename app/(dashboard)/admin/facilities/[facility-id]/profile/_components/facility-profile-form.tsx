"use client";
import { Icon } from "@/components/ui/Icon";

import { Prisma } from "@prisma/client";
import { useState, useEffect, useTransition, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { cn } from "@/lib/utils";

import {
  updateFacilityGovernanceSchema,
  type UpdateFacilityGovernanceValues,
} from "@/server/lib/validations/facility";
import { updateFacilityGovernanceAction } from "@/server/actions/governance";
import { ProfileAndSEO } from "./profile-and-seo";
import { BrandingLogoCard } from "./branding-logo-card";
import { LocationSection } from "./location-section";
import { DangerZone } from "./danger-zone";

interface FacilityProfileFormProps {
  facility: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    city: string;
    streetName: string;
    streetNumber: string;
    postalCode: string;
    status: string;
    category: string;
    hours: Array<{
      dayOfWeek: number;
      openTime: string;
      closeTime: string;
      isClosed: boolean;
    }>;
    metaTitle: string | null;
    metaDescription: string | null;
    seoArticle: string | null;
    transitGuide: string | null;
    logoUrl: string | null;
    publicPhone: string | null;
    publicEmail: string | null;
    socialLinks: Prisma.JsonValue;
    emergencyContact: string | null;
    closures: Array<{
      id: string;
      startDate: Date;
      endDate: Date;
      reason: string | null;
    }>;
    updatedAt: Date;
  };
  userRole: string;
  transactionCount: number;
}

/**
 * 🛠️ FacilityProfileForm (Refactored Phase 3)
 *
 * Consolidates secondary navigation into a high-density vertical sidebar.
 * Follows ShadCN Best Practices for complex form architecture.
 * Added dirty form warnings and responsive UI enhancements.
 */
export function FacilityProfileForm({
  facility,
  userRole,
  transactionCount,
}: FacilityProfileFormProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeSection = searchParams.get("section");

  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [logoPortalTarget, setLogoPortalTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // 🔍 Query the DOM for both portal targets on mount (portals rendered by parent)
    const loc = document.getElementById("location-portal-target");
    const logo = document.getElementById("logo-portal-target");
    if (loc) requestAnimationFrame(() => setPortalTarget(loc));
    if (logo) requestAnimationFrame(() => setLogoPortalTarget(logo));
  }, []);

  const initialHours = (facility.hours || [])
    .map((h) => ({
      dayOfWeek: h.dayOfWeek,
      openTime: h.openTime,
      closeTime: h.closeTime,
      isClosed: h.isClosed,
    }))
    .sort((a, b) => a.dayOfWeek - b.dayOfWeek) as UpdateFacilityGovernanceValues["hours"];

  const form = useForm({
    resolver: zodResolver(updateFacilityGovernanceSchema),
    defaultValues: {
      facilityId: facility.id,
      name: facility.name,
      slug: facility.slug,
      description: facility.description || "",
      city: facility.city,
      streetName: facility.streetName,
      streetNumber: facility.streetNumber,
      postalCode: facility.postalCode,
      hours: initialHours,
      metaTitle: facility.metaTitle || "",
      metaDescription: facility.metaDescription || "",
      seoArticle: facility.seoArticle || "",
      transitGuide: facility.transitGuide || "",
      logoUrl: facility.logoUrl || "",
      publicPhone: facility.publicPhone || "",
      publicEmail: facility.publicEmail || "",
      socialLinks: (facility.socialLinks as Record<string, string | null | undefined>) || {
        facebook: "",
        instagram: "",
        website: "",
      },
      emergencyContact: facility.emergencyContact || "",
    },
  });

  // 📜 Controlled Scrolling Logic
  useEffect(() => {
    if (activeSection) {
      const element = document.getElementById(activeSection);
      if (element) {
        // 🎯 Find the nearest scroll container to avoid scrolling the window or outer layouts
        const scrollContainer = element.closest(".overflow-y-auto");
        if (scrollContainer) {
          const containerRect = scrollContainer.getBoundingClientRect();
          const elementRect = element.getBoundingClientRect();
          const relativeTop = elementRect.top - containerRect.top + scrollContainer.scrollTop;

          scrollContainer.scrollTo({
            // Scroll to the relative top offset minus 16px for comfortable visual breathing room
            top: Math.max(0, relativeTop - 16),
            behavior: "smooth",
          });
        } else {
          // Fallback if no container is found
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    }
  }, [activeSection]);

  // 🛡️ Persistence Pipeline: Data Loss Prevention
  const isDirtyRef = useRef(form.formState.isDirty);

  useEffect(() => {
    isDirtyRef.current = form.formState.isDirty;
  });

  useEffect(() => {
    const handleSyncOnWake = () => {
      // FIX: Only refresh if the form is clean to avoid wiping unsaved user input
      if (document.visibilityState === "visible" && !isDirtyRef.current) {
        router.refresh();
      }
    };
    document.addEventListener("visibilitychange", handleSyncOnWake);
    return () => document.removeEventListener("visibilitychange", handleSyncOnWake);
  }, [router]);

  useEffect(() => {
    const handlePreventLoss = (e: BeforeUnloadEvent) => {
      if (isDirtyRef.current) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };
    window.addEventListener("beforeunload", handlePreventLoss);
    return () => window.removeEventListener("beforeunload", handlePreventLoss);
  }, []);

  async function onSubmit(values: UpdateFacilityGovernanceValues) {
    startTransition(async () => {
      try {
        const result = await updateFacilityGovernanceAction(values);
        if (result.success) {
          toast.success("Profile and operational settings updated");
          form.reset(values);
          router.refresh();
        } else {
          toast.error(result.error || "Failed to update settings");
        }
      } catch (error: unknown) {
        console.error("Failed to update facility:", error instanceof Error ? error.message : error);
        toast.error("A technical anomaly occurred.");
      }
    });
  }

  const publicPreviewUrl = `/facilities/${facility.category}/${facility.slug}`;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="relative space-y-6">
        {/* 🏢 CRM-Style Command Header */}
        <header className="border-border/50 flex flex-col justify-between gap-4 border-b pb-6 md:flex-row md:items-end">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <h1 className="text-foreground text-3xl font-black tracking-tighter uppercase">
                {facility.name}
              </h1>
              <div
                className={cn(
                  "rounded-full border px-2.5 py-0.5 text-[10px] font-black tracking-widest uppercase",
                  facility.status === "ACTIVE"
                    ? "border-primary/20 bg-primary/10 text-primary"
                    : "border-warning/20 bg-warning/10 text-warning",
                )}
              >
                {facility.status}
              </div>
            </div>
            <div className="text-muted-foreground flex items-center gap-3 font-mono text-[10px] tracking-widest uppercase">
              <span>Registry ID: {facility.id}</span>
              <span className="opacity-20">•</span>
              <span>Node Type: {facility.category}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="border-border/50 mr-4 flex flex-col items-end border-r pr-4">
              <span className="text-muted-foreground text-[10px] font-black tracking-widest uppercase">
                Last Synced
              </span>
              <span className="text-foreground/80 font-mono text-[11px] uppercase">
                {new Date(facility.updatedAt).toLocaleString()}
              </span>
            </div>
            <Button
              asChild
              type="button"
              variant="outline"
              className="border-border/50 bg-muted/30 hover:bg-muted/50 text-foreground h-10 rounded-xl px-6 text-[10px] font-black tracking-widest uppercase"
            >
              <a href={publicPreviewUrl} target="_blank" rel="noopener noreferrer">
                <Icon name="visibility" className="text-primary mr-2 size-3.5" />
                View Node
              </a>
            </Button>
          </div>
        </header>

        {/* 🏛️ CRM Data Grid */}
        <div className="grid grid-cols-1 gap-6 pb-32 xl:grid-cols-12">
          <div className="space-y-6 xl:col-span-8">
            {/* Identity & Discovery */}
            <section id="identity" className="scroll-mt-32 space-y-4">
              <div className="flex items-center gap-3">
                <Icon name="language" className="text-primary text-[16px]" />
                <h2 className="text-foreground/70 text-[11px] font-black tracking-[0.2em] uppercase">
                  Identity & Global Discovery
                </h2>
              </div>
              <ProfileAndSEO facilityId={facility.id} />
            </section>

            {/* Danger Zone Purge Node */}
            <section id="danger-zone" className="scroll-mt-32 space-y-4">
              <DangerZone
                facilityId={facility.id}
                facilityName={facility.name}
                userRole={userRole}
                transactionCount={transactionCount}
              />
            </section>
          </div>
        </div>

        {/* 💾 Global Save Bar (Floating Command Center) */}
        <footer className="bg-background/40 border-border animate-in fade-in slide-in-from-bottom-6 ring-border/20 fixed bottom-8 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-4 rounded-2xl border px-6 py-4 shadow-2xl ring-1 backdrop-blur-3xl duration-700">
          <div className="border-border flex items-center gap-5 border-r pr-6">
            <div className="relative">
              <div
                className={cn(
                  "size-3 rounded-full transition-all duration-500",
                  form.formState.isDirty
                    ? "bg-warning shadow-warning/30 animate-pulse"
                    : "bg-primary shadow-primary/30",
                )}
              />
              <div
                className={cn(
                  "absolute -inset-1 animate-ping rounded-full opacity-20",
                  form.formState.isDirty ? "bg-warning" : "bg-primary",
                )}
              />
            </div>
            <div className="flex min-w-[120px] flex-col">
              <span className="text-foreground text-[10px] font-black tracking-widest uppercase">
                {form.formState.isDirty ? "Unsaved Changes" : "All Changes Saved"}
              </span>
              <span className="text-muted-foreground mt-0.5 text-[8px] font-black tracking-widest uppercase opacity-60">
                {form.formState.isDirty ? "Unsaved local changes" : "Production state verified"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="submit"
              disabled={isPending || !form.formState.isDirty}
              className={cn(
                "relative h-10 overflow-hidden rounded-xl px-8 text-[9px] font-black tracking-[0.2em] uppercase transition-all",
                form.formState.isDirty
                  ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/20 shadow-lg"
                  : "bg-muted/30 text-muted-foreground border-border/50 border",
              )}
            >
              {isPending ? (
                <div className="flex items-center gap-2">
                  <Icon name="progress_activity" className="size-3 animate-spin" />
                  <span>Processing...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Icon name="save" className="size-3" />
                  <span>Commit Changes</span>
                </div>
              )}
            </Button>
          </div>
        </footer>

        {/* Geolocation Sidebar Portal */}
        {portalTarget && createPortal(<LocationSection />, portalTarget)}

        {/* Branding Logo Sidebar Portal */}
        {logoPortalTarget &&
          createPortal(
            <BrandingLogoCard facilityId={facility.id} facilityName={facility.name} />,
            logoPortalTarget,
          )}
      </form>
    </Form>
  );
}
