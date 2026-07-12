"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFormContext } from "react-hook-form";
import { SEOScoringPanel } from "./seo-scoring-panel";

interface SEOPanelProps {
  previewUrl?: string;
  content?: string;
}

export function SEOPanel({ previewUrl, content }: SEOPanelProps) {
  const { register, watch } = useFormContext();
  const title = watch("title");
  const metaTitle = watch("metaTitle");
  const metaDescription = watch("metaDescription");

  const serpTitle = metaTitle || title || "—";
  const serpDesc = metaDescription || "Dodaj meta opis za prikaz u pretrazi...";

  return (
    <div className="space-y-6">
      {/* Focus Keyword + SEO Scoring */}
      <div className="space-y-2">
        <Label htmlFor="focusKeyword">Fokus ključna reč</Label>
        <Input
          id="focusKeyword"
          {...register("focusKeyword")}
          placeholder="npr. akva park Beograd"
          className="w-full"
        />
      </div>
      <SEOScoringPanel content={content} />
      <Separator />

      {/* SERP Preview */}
      <div>
        <h4 className="text-muted-foreground mb-2 text-xs font-semibold tracking-wider uppercase">
          Google SERP Preview
        </h4>
        <div className="bg-card space-y-1 rounded-lg border p-3">
          <p className="text-primary truncate text-xs">{previewUrl || "splashdeals.rs/blog/..."}</p>
          <p className="text-primary truncate text-sm leading-tight font-medium">
            {serpTitle.length > 60 ? serpTitle.slice(0, 57) + "..." : serpTitle}
          </p>
          <p className="text-muted-foreground line-clamp-2 text-xs leading-tight">
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
        <p className="text-muted-foreground text-xs">
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
        <p className="text-muted-foreground text-xs">
          Preporučeno: 150-160 karaktera.{" "}
          <span className={metaDescription?.length > 160 ? "text-destructive font-medium" : ""}>
            ({metaDescription?.length || 0})
          </span>
        </p>
      </div>

      <Separator />

      {/* Open Graph */}
      <div className="space-y-3">
        <h4 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
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
          <Input id="ogImage" {...register("ogImage")} placeholder="https://..." />
        </div>
      </div>

      <Separator />

      {/* Napredno */}
      <div className="space-y-3">
        <h4 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
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
          <Select
            value={watch("robotsDirective") || ""}
            onValueChange={(value) => {
              const event = { target: { name: "robotsDirective", value } };
              register("robotsDirective").onChange(event);
            }}
          >
            <SelectTrigger id="robotsDirective" className="w-full">
              <SelectValue placeholder="Podrazumevano (index, follow)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Podrazumevano (index, follow)</SelectItem>
              <SelectItem value="noindex,nofollow">noindex, nofollow</SelectItem>
              <SelectItem value="noindex,follow">noindex, follow</SelectItem>
              <SelectItem value="index,nofollow">index, nofollow</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
