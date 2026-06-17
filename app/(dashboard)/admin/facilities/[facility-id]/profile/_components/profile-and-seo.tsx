"use client"
import { Icon } from "@/components/ui/Icon";

import * as React from "react"
import { useFormContext } from "react-hook-form"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { checkSlugAvailabilityAction } from "@/server/actions/governance"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import type { UpdateFacilityGovernanceValues } from "@/server/lib/validations/facility"

interface ProfileAndSEOProps {
  facilityId: string
}

/** 
 * 👤 ProfileAndSEO
 * Consolidates slug, marketing narrative, and search engine optimization.
 */
export function ProfileAndSEO({ facilityId }: ProfileAndSEOProps) {
  const { control, watch } = useFormContext<UpdateFacilityGovernanceValues>()
  const facilitySlug = watch("slug")
  const metaTitle = watch("metaTitle") || ""
  const metaDescription = watch("metaDescription") || ""
  const seoArticle = watch("seoArticle") || ""

  const [slugAvailability, setSlugAvailability] = React.useState<"idle" | "loading" | "available" | "collision">("idle")

  const checkSlug = React.useCallback(async (slug: string) => {
    if (!slug || slug.length < 3) {
      setSlugAvailability("idle")
      return
    }
    setSlugAvailability("loading")
    try {
      const { isAvailable } = await checkSlugAvailabilityAction(slug, facilityId)
      setSlugAvailability(isAvailable ? "available" : "collision")
    } catch (error: unknown) {
      console.error("Failed to check slug availability:", error instanceof Error ? error.message : error);
      toast.error("Something went wrong. Please try again.");
      setSlugAvailability("idle")
    }
  }, [facilityId])

  React.useEffect(() => {
    const timer = setTimeout(() => checkSlug(facilitySlug || ""), 500)
    return () => clearTimeout(timer)
  }, [facilitySlug, checkSlug])

  return (
    <div className="space-y-4">
      <Card className="p-4 border-border/50 bg-background/40 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] uppercase tracking-widest font-black opacity-70">Facility Legal Name</FormLabel>
                <FormControl>
                  <Input className="bg-background/40 border-border/50 focus-visible:ring-cyan-500/50 h-10 text-sm font-black uppercase" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="slug"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between mb-1">
                  <FormLabel className="text-[10px] uppercase tracking-widest font-black opacity-70">URL Registry Slug</FormLabel>
                  <div className={cn(
                    "text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md border transition-all duration-500",
                    slugAvailability === "loading" && "bg-muted/10 border-muted/20 text-muted-foreground",
                    slugAvailability === "available" && "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
                    slugAvailability === "collision" && "bg-rose-500/10 border-rose-500/20 text-rose-400",
                    slugAvailability === "idle" && "opacity-0"
                  )}>
                     {slugAvailability === "loading" && "Analyzing..."}
                     {slugAvailability === "available" && "Available"}
                     {slugAvailability === "collision" && "Conflict"}
                  </div>
                </div>
                <FormControl>
                  <Input 
                    className="bg-background/40 border-border/50 focus-visible:ring-primary/50 h-10 text-sm font-mono text-primary" 
                    {...field} 
                    value={field.value || ""} 
                    onChange={(e) => {
                      const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')
                      field.onChange(val)
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[10px] uppercase tracking-widest font-black opacity-70">Public Profile Narrative</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Tell your story..." 
                  className="bg-background/40 border-border/50 focus-visible:ring-cyan-500/50 min-h-[80px] leading-relaxed text-sm font-medium text-foreground/80" 
                  {...field} 
                  value={field.value || ""} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </Card>

      {/* SEO Discovery Module */}
      <Card className="p-4 border-border/50 bg-background/40 space-y-4">
        <header className="flex items-center justify-between">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-primary">Search Engine Discovery (GEO)</h3>
          <Icon name="bar_chart" className="size-3.5 text-primary opacity-50" />
        </header>

        <div className="bg-background/80 rounded-xl p-4 border border-border/50 group/serp relative overflow-hidden transition-all hover:border-cyan-500/20">
           <div className="flex items-center gap-2 mb-1.5 opacity-60">
             <Icon name="language" className="text-[12px] text-primary" />
             <span className="text-[9px] font-mono text-muted-foreground">splashdeals.rs <span className="text-primary/50">›</span> {facilitySlug}</span>
           </div>
           <h4 className="text-sm font-bold text-blue-400 line-clamp-1 mb-1">
             {metaTitle || "Facility Title Placeholder"}
           </h4>
           <p className="text-[11px] leading-tight text-muted-foreground line-clamp-2">
             {metaDescription || "Enter a high-intent meta description to see how your facility will materialize across generative search architectures."}
           </p>
         </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={control}
            name="metaTitle"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between mb-1">
                  <FormLabel className="text-[10px] uppercase tracking-widest font-black opacity-70">SEO Meta Title</FormLabel>
                  <span className={cn(
                    "text-[8px] font-mono font-black",
                    metaTitle.length > 60 ? "text-rose-500" : "text-emerald-500"
                  )}>{metaTitle.length}/60</span>
                </div>
                <FormControl>
                  <Input className="bg-background/40 border-border/50 focus-visible:ring-cyan-500/50 h-9 text-[11px] font-bold" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="metaDescription"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between mb-1">
                  <FormLabel className="text-[10px] uppercase tracking-widest font-black opacity-70">SEO Meta Description</FormLabel>
                  <span className={cn(
                    "text-[8px] font-mono font-black",
                    metaDescription.length > 160 ? "text-rose-500" : "text-emerald-500"
                  )}>{metaDescription.length}/160</span>
                </div>
                <FormControl>
                  <Input className="bg-background/40 border-border/50 focus-visible:ring-cyan-500/50 h-9 text-[11px] font-bold" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </Card>

      <Card className="p-4 border-border/50 bg-background/40">
        <FormField
          control={control}
          name="seoArticle"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <div className="flex items-center justify-between">
                <FormLabel className="text-[10px] uppercase tracking-widest font-black opacity-70">SEO Narrative Footer (GEO Content)</FormLabel>
                <div className="text-[9px] font-mono text-muted-foreground tracking-tighter uppercase">
                  {seoArticle.length} Chars
                </div>
              </div>
              <FormControl>
                <Textarea 
                  placeholder="Comprehensive overview for AI agents..." 
                  className="bg-background/40 border-border/50 focus-visible:ring-cyan-500/50 min-h-[120px] leading-relaxed text-sm font-mono text-foreground/80" 
                  {...field} 
                  value={field.value || ""} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </Card>
    </div>
  )
}
