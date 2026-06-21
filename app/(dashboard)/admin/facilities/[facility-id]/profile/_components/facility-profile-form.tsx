"use client"
import { Icon } from "@/components/ui/Icon";

import { Prisma } from "@prisma/client"
import { useState, useEffect, useTransition, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { createPortal } from "react-dom"
import { useSearchParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { cn } from "@/lib/utils"

import { updateFacilityGovernanceSchema, type UpdateFacilityGovernanceValues } from "@/server/lib/validations/facility"
import { updateFacilityGovernanceAction } from "@/server/actions/governance"
import { DistributionLogic } from "./distribution-logic"
import { ProfileAndSEO } from "./profile-and-seo"
import { BrandingLogoCard } from "./branding-logo-card"
import { LocationSection } from "./location-section"
import { DangerZone } from "./danger-zone"

interface FacilityProfileFormProps {
  facility: {
    id: string
    name: string
    slug: string
    description: string | null
    city: string
    streetName: string
    streetNumber: string
    postalCode: string
    status: string
    category: string
    hours: Array<{
      dayOfWeek: number
      openTime: string
      closeTime: string
      isClosed: boolean
    }>
    marketplaceCities: Array<{
      cityId: string
    }>
    metaTitle: string | null
    metaDescription: string | null
    seoArticle: string | null
    transitGuide: string | null
    logoUrl: string | null
    publicPhone: string | null
    publicEmail: string | null
    socialLinks: Prisma.JsonValue
    emergencyContact: string | null
    closures: Array<{
      id: string
      startDate: Date
      endDate: Date
      reason: string | null
    }>
    updatedAt: Date
  }
  availableCities: Array<{
    id: string
    name: string
    slug: string
  }>
  userRole: string
  transactionCount: number
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
  availableCities, 
  userRole,
  transactionCount
}: FacilityProfileFormProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeSection = searchParams.get('section')

  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null)
  const [logoPortalTarget, setLogoPortalTarget] = useState<HTMLElement | null>(null)

  useEffect(() => {
    // 🔍 Query the DOM for both portal targets and update state if they have changed
    const updateTargets = () => {
      const loc = document.getElementById("location-portal-target")
      const logo = document.getElementById("logo-portal-target")
      
      setPortalTarget(prev => prev !== loc ? loc : prev)
      setLogoPortalTarget(prev => prev !== logo ? logo : prev)
    }

    // ⚡ Sync immediately on client mount
    updateTargets()

    // 🔄 Set up a MutationObserver to re-sync whenever DOM mutations happen (e.g. hydration, Suspense state changes)
    const observer = new MutationObserver(() => {
      updateTargets()
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })

    return () => observer.disconnect()
  }, [])
 
  const initialHours = (facility.hours || []).map(h => ({
    dayOfWeek: h.dayOfWeek,
    openTime: h.openTime,
    closeTime: h.closeTime,
    isClosed: h.isClosed,
  })).sort((a, b) => a.dayOfWeek - b.dayOfWeek) as UpdateFacilityGovernanceValues["hours"]

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
      targetCityIds: (facility.marketplaceCities || []).map(mc => mc.cityId),
      metaTitle: facility.metaTitle || "",
      metaDescription: facility.metaDescription || "",
      seoArticle: facility.seoArticle || "",
      transitGuide: facility.transitGuide || "",
      logoUrl: facility.logoUrl || "",
      publicPhone: facility.publicPhone || "",
      publicEmail: facility.publicEmail || "",
      socialLinks: (facility.socialLinks as Record<string, string | null | undefined>) || { facebook: "", instagram: "", website: "" },
      emergencyContact: facility.emergencyContact || "",
    },
  })

  // 📜 Controlled Scrolling Logic
  useEffect(() => {
    if (activeSection) {
      const element = document.getElementById(activeSection)
      if (element) {
        // 🎯 Find the nearest scroll container to avoid scrolling the window or outer layouts
        const scrollContainer = element.closest('.overflow-y-auto')
        if (scrollContainer) {
          const containerRect = scrollContainer.getBoundingClientRect()
          const elementRect = element.getBoundingClientRect()
          const relativeTop = elementRect.top - containerRect.top + scrollContainer.scrollTop
          
          scrollContainer.scrollTo({
            // Scroll to the relative top offset minus 16px for comfortable visual breathing room
            top: Math.max(0, relativeTop - 16),
            behavior: 'smooth'
          })
        } else {
          // Fallback if no container is found
          element.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }
    }
  }, [activeSection])
 
  // 🛡️ Persistence Pipeline: Data Loss Prevention
  const isDirtyRef = useRef(form.formState.isDirty)

  useEffect(() => {
    isDirtyRef.current = form.formState.isDirty
  })

  useEffect(() => {
    const handleSyncOnWake = () => {
      // FIX: Only refresh if the form is clean to avoid wiping unsaved user input
      if (document.visibilityState === "visible" && !isDirtyRef.current) {
        router.refresh()
      }
    }
    document.addEventListener("visibilitychange", handleSyncOnWake)
    return () => document.removeEventListener("visibilitychange", handleSyncOnWake)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const handlePreventLoss = (e: BeforeUnloadEvent) => {
      if (isDirtyRef.current) {
        e.preventDefault()
        e.returnValue = ""
        return ""
      }
    }
    window.addEventListener("beforeunload", handlePreventLoss)
    return () => window.removeEventListener("beforeunload", handlePreventLoss)
     
  }, [])

  async function onSubmit(values: UpdateFacilityGovernanceValues) {
    startTransition(async () => {
      try {
        const result = await updateFacilityGovernanceAction(values)
        if (result.success) {
          toast.success("Profile and operational settings updated")
          form.reset(values)
          router.refresh()
        } else {
          toast.error(result.error || "Failed to update settings")
        }
      } catch (error: unknown) {
        console.error("Failed to update facility:", error instanceof Error ? error.message : error);
        toast.error("A technical anomaly occurred.")
      }
    })
  }

  const publicPreviewUrl = `/facilities/${facility.category}/${facility.slug}`

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="relative space-y-6">
        
        {/* 🏢 CRM-Style Command Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-border/50">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black tracking-tighter text-foreground uppercase">{facility.name}</h1>
              <div className={cn(
                "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border",
                facility.status === "ACTIVE" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-amber-500/10 border-amber-500/20 text-amber-400"
              )}>
                {facility.status}
              </div>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
              <span>Registry ID: {facility.id}</span>
              <span className="opacity-20">•</span>
              <span>Node Type: {facility.category}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
             <div className="flex flex-col items-end mr-4 pr-4 border-r border-border/50">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Last Synced</span>
                <span className="text-[11px] font-mono text-foreground/80 uppercase">{new Date(facility.updatedAt).toLocaleString()}</span>
             </div>
             <Button
                asChild
                type="button"
                variant="outline"
                className="h-10 px-6 border-border/50 bg-muted/30 hover:bg-muted/50 text-foreground font-black uppercase tracking-widest text-[10px] rounded-xl"
              >
                <a href={publicPreviewUrl} target="_blank" rel="noopener noreferrer">
                  <Icon name="visibility" className="size-3.5 mr-2 text-primary" />
                  View Node
                </a>
              </Button>
          </div>
        </header>

        {/* 🏛️ CRM Data Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 pb-32">
          
          <div className="xl:col-span-8 space-y-6">
            {/* Identity & Discovery */}
            <section id="identity" className="scroll-mt-32 space-y-4">
              <div className="flex items-center gap-3">
                <Icon name="language" className="text-[16px] text-primary" />
                <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground/70">Identity & Global Discovery</h2>
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

          <div className="xl:col-span-4 space-y-6">
            {/* Marketplace Distribution */}
            <section id="marketplace" className="scroll-mt-32 space-y-4">
              <div className="flex items-center gap-3">
                <Icon name="label" className="size-4 text-emerald-400" />
                <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground/70">Marketplace Reach</h2>
              </div>
              <DistributionLogic availableCities={availableCities} />
            </section>
          </div>
        </div>

        {/* 💾 Global Save Bar (Floating Command Center) */}
        <footer className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-4 px-6 py-4 bg-background/40 backdrop-blur-3xl border border-border rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] ring-1 ring-white/5 animate-in fade-in slide-in-from-bottom-6 duration-700">
          <div className="flex items-center gap-5 pr-6 border-r border-border">
            <div className="relative">
              <div className={cn(
                "size-3 rounded-full transition-all duration-500",
                form.formState.isDirty ? "bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.6)] animate-pulse" : "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]"
              )} />
              <div className={cn(
                "absolute -inset-1 rounded-full opacity-20 animate-ping",
                form.formState.isDirty ? "bg-amber-500" : "bg-emerald-500"
              )} />
            </div>
            <div className="flex flex-col min-w-[120px]">
              <span className="text-[10px] font-black uppercase tracking-widest text-foreground">
                 {form.formState.isDirty ? "Unsaved Changes" : "All Changes Saved"}
              </span>
              <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mt-0.5 opacity-60">
                 {form.formState.isDirty ? "Unsaved local changes" : "Production state verified"}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              asChild
              type="button"
              variant="outline"
              className="h-10 px-5 border-border/50 bg-muted/30 hover:bg-muted/50 text-foreground font-black uppercase tracking-widest text-[9px] rounded-xl transition-all"
            >
              <a href={publicPreviewUrl} target="_blank" rel="noopener noreferrer">
                <Icon name="visibility" className="size-3 mr-2 text-primary" />
                Live Preview
              </a>
            </Button>

            <Button 
              type="submit" 
              disabled={isPending || !form.formState.isDirty} 
              className={cn(
                "h-10 px-8 font-black uppercase tracking-[0.2em] text-[9px] rounded-xl transition-all relative overflow-hidden",
                form.formState.isDirty 
                  ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20" 
                  : "bg-muted/30 text-muted-foreground border border-border/50"
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
        {portalTarget && createPortal(
          <LocationSection />,
          portalTarget
        )}

        {/* Branding Logo Sidebar Portal */}
        {logoPortalTarget && createPortal(
          <BrandingLogoCard facilityId={facility.id} facilityName={facility.name} />,
          logoPortalTarget
        )}
      </form>
    </Form>
  )
}
