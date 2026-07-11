"use client";
// @ts-nocheck - react-hook-form + zod v4 resolver type chain mismatch, runtime is correct

import { useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import slugify from "slugify";
import { z } from "zod/v4";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { RichTextEditor } from "../../_components/rich-text-editor";
import { SEOPanel } from "../../_components/seo-panel";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { MediaLibrarySheet } from "@/app/(dashboard)/admin/media/_components/media-library-sheet";
import { createPageAction, updatePageAction } from "@/app/(server)/actions/cms";

function countImagesWithoutAlt(html: string): number {
  if (!html) return 0;
  const regex = /<img\s[^>]*>/gi;
  let match: RegExpExecArray | null;
  let count = 0;
  while ((match = regex.exec(html)) !== null) {
    const tag = match[0];
    if (!/alt\s*=\s*["']/i.test(tag)) {
      count++;
    }
  }
  return count;
}

const pageFormSchema = z.object({
  title: z.string().min(1, "Naslov je obavezan"),
  slug: z
    .string()
    .min(1, "Slug je obavezan")
    .regex(/^[a-z0-9-]+$/, "Samo mala slova, brojevi i crtice"),
  content: z.string().optional(),
  excerpt: z.string().optional(),
  coverImage: z.string().optional(),
  template: z.string().optional(),
  showHeader: z.boolean().optional(),
  showFooter: z.boolean().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional(),
  ogImage: z.string().optional(),
  canonicalUrl: z.string().optional(),
  robotsDirective: z.string().optional(),
});

interface PageEditorProps {
  page?: Record<string, unknown>;
  dict?: Record<string, unknown>;
}

export function PageEditor({ page, dict }: PageEditorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isEditing = !!page;

  const form = useForm({
    resolver: zodResolver(pageFormSchema),
    defaultValues: {
      title: (page?.title as string) || "",
      slug: (page?.slug as string) || "",
      content: (page?.content as string) || "",
      excerpt: (page?.excerpt as string) || "",
      coverImage: (page?.coverImage as string) || "",
      template: (page?.template as string) || "default",
      showHeader: (page?.showHeader as boolean) ?? true,
      showFooter: (page?.showFooter as boolean) ?? true,
      status: (page?.status as "DRAFT" | "PUBLISHED" | "ARCHIVED") || "DRAFT",
      metaTitle: (page?.metaTitle as string) || "",
      metaDescription: (page?.metaDescription as string) || "",
      ogTitle: (page?.ogTitle as string) || "",
      ogDescription: (page?.ogDescription as string) || "",
      ogImage: (page?.ogImage as string) || "",
      canonicalUrl: (page?.canonicalUrl as string) || "",
      robotsDirective: (page?.robotsDirective as string) || "",
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = form;

  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const title = e.target.value;
      setValue("title", title);
      if (!isEditing && title) {
        setValue("slug", slugify(title, { lower: true, strict: true }));
      }
    },
    [setValue, isEditing],
  );

  const onSubmit = useCallback(
    async (data: Record<string, unknown>) => {
      // Warn about images missing alt text — non-blocking
      const content = (data.content as string) || "";
      const missingAltCount = countImagesWithoutAlt(content);
      if (missingAltCount > 0) {
        const label =
          missingAltCount >= 2 && missingAltCount <= 4
            ? `${missingAltCount} slike nemaju alt tekst.`
            : `${missingAltCount} slika nema alt tekst.`;
        toast.warning(`${label} Dodajte ga klikom na sliku u editoru.`);
      }

      startTransition(async () => {
        const result = isEditing
          ? await updatePageAction(page!.id as string, data as never)
          : await createPageAction(data as never);

        if (result.success) {
          toast.success(isEditing ? "Strana ažurirana" : "Strana kreirana");
          router.push("/admin/cms/pages");
          router.refresh();
        } else {
          toast.error(result.error || "Greška pri čuvanju");
        }
      });
    },
    [isEditing, page, router, startTransition],
  );

  return (
    <FormProvider {...form}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Naslov *</Label>
              <Input
                id="title"
                {...register("title")}
                onChange={handleTitleChange}
                placeholder="Unesi naslov strane..."
                className="text-lg font-medium"
              />
              {errors.title && <p className="text-destructive text-xs">{errors.title.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                {...register("slug")}
                placeholder="moja-strana"
                className="font-mono text-sm"
              />
              {errors.slug && <p className="text-destructive text-xs">{errors.slug.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="excerpt">Kratak opis (excerpt)</Label>
              <Textarea
                id="excerpt"
                {...register("excerpt")}
                placeholder="Kratak opis strane..."
                className="min-h-[80px] resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coverImage">Cover slika (URL)</Label>
              <div className="flex gap-2">
                <Input
                  id="coverImage"
                  {...register("coverImage")}
                  placeholder="https://..."
                  className="flex-1"
                />
                <MediaLibrarySheet
                  dict={(dict?.media_library as Record<string, unknown>) || {}}
                  onSelect={(url) => setValue("coverImage", url)}
                  trigger={
                    <Button type="button" variant="outline" size="sm" className="shrink-0 gap-1.5">
                      <Icon name="photo_library" className="size-4" />
                      Pregledaj
                    </Button>
                  }
                />
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>Sadržaj</Label>
              {}
              <RichTextEditor
                source="stranica"
                content={watch("content") || ""}
                onChange={(html) => setValue("content", html)}
                placeholder="Počni da pišeš sadržaj strane..."
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-4 rounded-lg border p-4">
              <h3 className="text-sm font-semibold">Status</h3>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={watch("status") || "DRAFT"}
                  onValueChange={(value) =>
                    setValue("status", value as "DRAFT" | "PUBLISHED" | "ARCHIVED")
                  }
                >
                  <SelectTrigger id="status" aria-label="Status" className="w-full">
                    <SelectValue placeholder="Izaberi status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Nacrt</SelectItem>
                    <SelectItem value="PUBLISHED">Objavljeno</SelectItem>
                    <SelectItem value="ARCHIVED">Arhivirano</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="template">Šablon</Label>
                <Select
                  value={watch("template") || "default"}
                  onValueChange={(value) => setValue("template", value)}
                >
                  <SelectTrigger id="template" aria-label="Šablon" className="w-full">
                    <SelectValue placeholder="Izaberi šablon" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Podrazumevani</SelectItem>
                    <SelectItem value="full-width">Puna širina</SelectItem>
                    <SelectItem value="landing">Landing page</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="showHeader" className="cursor-pointer">
                  Prikaži header
                </Label>
                <Switch
                  id="showHeader"
                  checked={!!watch("showHeader")}
                  onCheckedChange={(checked) => setValue("showHeader", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="showFooter" className="cursor-pointer">
                  Prikaži footer
                </Label>
                <Switch
                  id="showFooter"
                  checked={!!watch("showFooter")}
                  onCheckedChange={(checked) => setValue("showFooter", checked)}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={isPending} className="flex-1">
                  {isPending ? (
                    <Icon name="progress_activity" className="size-4 animate-spin" />
                  ) : (
                    <Icon name="save" className="size-4" />
                  )}
                  {isEditing ? "Sačuvaj izmene" : "Kreiraj"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/admin/cms/pages")}
                >
                  Odustani
                </Button>
              </div>
            </div>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="w-full gap-2">
                  <Icon name="search_insights" className="size-4" />
                  SEO podešavanja
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[400px] overflow-y-auto sm:w-[480px]">
                <SheetHeader>
                  <SheetTitle>SEO podešavanja</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <SEOPanel />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </form>
    </FormProvider>
  );
}
