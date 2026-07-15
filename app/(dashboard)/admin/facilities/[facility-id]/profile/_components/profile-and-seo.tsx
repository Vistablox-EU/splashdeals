"use client";
import { Icon } from "@/components/ui/Icon";

import * as React from "react";
import { useFormContext } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { checkSlugAvailabilityAction } from "@/app/(server)/actions/governance";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { UpdateFacilityGovernanceValues } from "@/app/(server)/lib/validations/facility";

interface ProfileAndSEOProps {
  facilityId: string;
}

/**
 * 👤 ProfileAndSEO
 * Consolidates slug, marketing narrative, and search engine optimization.
 */
export function ProfileAndSEO({ facilityId }: ProfileAndSEOProps) {
  const { control, watch } = useFormContext<UpdateFacilityGovernanceValues>();
  const facilitySlug = watch("slug");
  const metaTitle = watch("metaTitle") || "";
  const metaDescription = watch("metaDescription") || "";
  const seoArticle = watch("seoArticle") || "";

  const [slugAvailability, setSlugAvailability] = React.useState<
    "idle" | "loading" | "available" | "collision"
  >("idle");

  const checkSlug = React.useCallback(
    async (slug: string) => {
      if (!slug || slug.length < 3) {
        setSlugAvailability("idle");
        return;
      }
      setSlugAvailability("loading");
      try {
        const { isAvailable } = await checkSlugAvailabilityAction(slug, facilityId);
        setSlugAvailability(isAvailable ? "available" : "collision");
      } catch (error: unknown) {
        console.error(
          "Failed to check slug availability:",
          error instanceof Error ? error.message : error,
        );
        toast.error("Something went wrong. Please try again.");
        setSlugAvailability("idle");
      }
    },
    [facilityId],
  );

  React.useEffect(() => {
    const timer = setTimeout(() => checkSlug(facilitySlug || ""), 500);
    return () => clearTimeout(timer);
  }, [facilitySlug, checkSlug]);

  return (
    <div className="space-y-4">
      <Card className="border-border/50 bg-background/40 space-y-4 p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] font-black tracking-widest uppercase opacity-70">
                  Facility Legal Name
                </FormLabel>
                <FormControl>
                  <Input
                    className="bg-background/40 border-border/50 focus-visible:ring-primary/50 h-10 text-sm font-black uppercase"
                    {...field}
                    value={field.value || ""}
                  />
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
                <div className="mb-1 flex items-center justify-between">
                  <FormLabel className="text-[10px] font-black tracking-widest uppercase opacity-70">
                    URL Registry Slug
                  </FormLabel>
                  <div
                    className={cn(
                      "rounded-md border px-1.5 py-0.5 text-[8px] font-black tracking-widest uppercase transition-colors duration-500",
                      slugAvailability === "loading" &&
                        "bg-muted/10 border-muted/20 text-muted-foreground",
                      slugAvailability === "available" &&
                        "border-primary/20 bg-primary/10 text-primary",
                      slugAvailability === "collision" &&
                        "border-destructive/20 bg-destructive/10 text-destructive",
                      slugAvailability === "idle" && "opacity-0",
                    )}
                  >
                    {slugAvailability === "loading" && "Analyzing..."}
                    {slugAvailability === "available" && "Available"}
                    {slugAvailability === "collision" && "Conflict"}
                  </div>
                </div>
                <FormControl>
                  <Input
                    className="bg-background/40 border-border/50 focus-visible:ring-primary/50 text-primary h-10 font-mono text-sm"
                    {...field}
                    value={field.value || ""}
                    onChange={(e) => {
                      const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-");
                      field.onChange(val);
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
              <FormLabel className="text-[10px] font-black tracking-widest uppercase opacity-70">
                Public Profile Narrative
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tell your story..."
                  className="bg-background/40 border-border/50 text-foreground/80 focus-visible:ring-primary/50 min-h-[80px] text-sm leading-relaxed font-medium"
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
      <Card className="border-border/50 bg-background/40 space-y-4 p-4">
        <header className="flex items-center justify-between">
          <h3 className="text-primary text-[10px] font-black tracking-widest uppercase">
            Search Engine Discovery (GEO)
          </h3>
          <Icon name="bar_chart" className="text-primary size-3.5 opacity-50" />
        </header>

        <div className="bg-background/80 border-border/50 group/serp hover:border-primary/20 relative overflow-hidden rounded-xl border p-4 transition-colors">
          <div className="mb-1.5 flex items-center gap-2 opacity-60">
            <Icon name="language" className="text-primary text-[12px]" />
            <span className="text-muted-foreground font-mono text-[9px]">
              splashdeals.rs <span className="text-primary/50">›</span> {facilitySlug}
            </span>
          </div>
          <h4 className="text-primary mb-1 line-clamp-1 text-sm font-bold">
            {metaTitle || "Facility Title Placeholder"}
          </h4>
          <p className="text-muted-foreground line-clamp-2 text-[11px] leading-tight">
            {metaDescription ||
              "Enter a high-intent meta description to see how your facility will materialize across generative search architectures."}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={control}
            name="metaTitle"
            render={({ field }) => (
              <FormItem>
                <div className="mb-1 flex items-center justify-between">
                  <FormLabel className="text-[10px] font-black tracking-widest uppercase opacity-70">
                    SEO Meta Title
                  </FormLabel>
                  <span
                    className={cn(
                      "font-mono text-[8px] font-black",
                      metaTitle.length > 60 ? "text-destructive" : "text-primary",
                    )}
                  >
                    {metaTitle.length}/60
                  </span>
                </div>
                <FormControl>
                  <Input
                    className="bg-background/40 border-border/50 focus-visible:ring-primary/50 h-9 text-[11px] font-bold"
                    {...field}
                    value={field.value || ""}
                    maxLength={60}
                  />
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
                <div className="mb-1 flex items-center justify-between">
                  <FormLabel className="text-[10px] font-black tracking-widest uppercase opacity-70">
                    SEO Meta Description
                  </FormLabel>
                  <span
                    className={cn(
                      "font-mono text-[8px] font-black",
                      metaDescription.length > 160 ? "text-destructive" : "text-primary",
                    )}
                  >
                    {metaDescription.length}/160
                  </span>
                </div>
                <FormControl>
                  <Input
                    className="bg-background/40 border-border/50 focus-visible:ring-primary/50 h-9 text-[11px] font-bold"
                    {...field}
                    value={field.value || ""}
                    maxLength={160}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </Card>

      <Card className="border-border/50 bg-background/40 p-4">
        <FormField
          control={control}
          name="seoArticle"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <div className="flex items-center justify-between">
                <FormLabel className="text-[10px] font-black tracking-widest uppercase opacity-70">
                  SEO Narrative Footer (GEO Content)
                </FormLabel>
                <div className="text-muted-foreground font-mono text-[9px] tracking-tighter uppercase">
                  {seoArticle.length} Chars
                </div>
              </div>
              <FormControl>
                <Textarea
                  placeholder="Comprehensive overview for AI agents..."
                  className="bg-background/40 border-border/50 text-foreground/80 focus-visible:ring-primary/50 min-h-[120px] font-mono text-sm leading-relaxed"
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
  );
}
