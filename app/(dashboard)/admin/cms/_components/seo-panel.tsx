"use client"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import type { Control } from "react-hook-form"
import { useFormContext } from "react-hook-form"

interface SEOPanelProps {
  control: Control<any>
  previewUrl?: string
}

export function SEOPanel({ control, previewUrl }: SEOPanelProps) {
  const { register, watch } = useFormContext()
  const title = watch("title")
  const metaTitle = watch("metaTitle")
  const metaDescription = watch("metaDescription")

  const serpTitle = metaTitle || title || "—"
  const serpDesc = metaDescription || "Dodaj meta opis za prikaz u pretrazi..."

  return (
    <div className="space-y-6">
      {/* SERP Preview */}
      <div>
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Google SERP Preview
        </h4>
        <div className="rounded-lg border bg-card p-3 space-y-1">
          <p className="text-xs text-green-700 dark:text-green-400 truncate">
            {previewUrl || "splashdeals.rs/blog/..."}
          </p>
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400 leading-tight truncate">
            {serpTitle.length > 60 ? serpTitle.slice(0, 57) + "..." : serpTitle}
          </p>
          <p className="text-xs text-muted-foreground leading-tight line-clamp-2">
            {serpDesc.length > 160 ? serpDesc.slice(0, 157) + "..." : serpDesc}
          </p>
        </div>
      </div>

      <Separator />

      {/* Meta naslov */}
      <div className="space-y-2">
        <Label htmlFor="metaTitle">Meta naslov</Label>
        <Input
          id="metaTitle"
          {...register("metaTitle")}
          placeholder={title ? `${title} | Splashdeals.rs` : "SEO naslov..."}
        />
        <p className="text-xs text-muted-foreground">
          Preporučeno: do 60 karaktera.{" "}
          <span className={metaTitle?.length > 60 ? "text-destructive font-medium" : ""}>
            ({metaTitle?.length || 0})
          </span>
        </p>
      </div>

      {/* Meta opis */}
      <div className="space-y-2">
        <Label htmlFor="metaDescription">Meta opis</Label>
        <Textarea
          id="metaDescription"
          {...register("metaDescription")}
          placeholder="Kratak opis za prikaz u Google rezultatima..."
          className="min-h-[80px] resize-none"
        />
        <p className="text-xs text-muted-foreground">
          Preporučeno: 150-160 karaktera.{" "}
          <span className={metaDescription?.length > 160 ? "text-destructive font-medium" : ""}>
            ({metaDescription?.length || 0})
          </span>
        </p>
      </div>

      <Separator />

      {/* Open Graph */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Open Graph (društvene mreže)
        </h4>

        <div className="space-y-2">
          <Label htmlFor="ogTitle">OG naslov</Label>
          <Input
            id="ogTitle"
            {...register("ogTitle")}
            placeholder={metaTitle || `${title} | Splashdeals.rs`}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="ogDescription">OG opis</Label>
          <Textarea
            id="ogDescription"
            {...register("ogDescription")}
            placeholder={metaDescription || "Opis za Facebook, LinkedIn..."}
            className="min-h-[60px] resize-none"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="ogImage">OG slika (URL)</Label>
          <Input
            id="ogImage"
            {...register("ogImage")}
            placeholder="https://..."
          />
        </div>
      </div>

      <Separator />

      {/* Napredno */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Napredno
        </h4>

        <div className="space-y-2">
          <Label htmlFor="canonicalUrl">Canonical URL</Label>
          <Input
            id="canonicalUrl"
            {...register("canonicalUrl")}
            placeholder="https://splashdeals.rs/blog/..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="robotsDirective">Robots direktiva</Label>
          <select
            id="robotsDirective"
            {...register("robotsDirective")}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Podrazumevano (index, follow)</option>
            <option value="noindex,nofollow">noindex, nofollow</option>
            <option value="noindex,follow">noindex, follow</option>
            <option value="index,nofollow">index, nofollow</option>
          </select>
        </div>
      </div>
    </div>
  )
}
