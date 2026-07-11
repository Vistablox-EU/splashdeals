"use client";
// @ts-nocheck - react-hook-form + zod v4 resolver type chain mismatch, runtime is correct

import { useCallback, useTransition, useState, useEffect } from "react";
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
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RichTextEditor } from "../../_components/rich-text-editor";
import { SEOPanel } from "../../_components/seo-panel";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { MediaLibrarySheet } from "@/app/(dashboard)/admin/media/_components/media-library-sheet";
import { createBlogPostAction, updateBlogPostAction } from "@/app/(server)/actions/cms";
import { useCmsAutosave, AutosaveData } from "@/hooks/use-cms-autosave";

function countImagesWithoutAlt(html: string): number {
  if (!html) return 0;
  const regex = /<img\s[^>]*>/gi;
  let match: RegExpExecArray | null;
  let count = 0;
  while ((match = regex.exec(html)) !== null) {
    const tag = match[0];
    // Check for an alt attribute (handle both "alt=" and "alt =")
    if (!/alt\s*=\s*["']/i.test(tag)) {
      count++;
    }
  }
  return count;
}

const postFormSchema = z.object({
  title: z.string().min(1, "Naslov je obavezan"),
  slug: z
    .string()
    .min(1, "Slug je obavezan")
    .regex(/^[a-z0-9-]+$/, "Samo mala slova, brojevi i crtice"),
  content: z.string().optional(),
  excerpt: z.string().optional(),
  coverImage: z.string().optional(),
  featuredImage: z.string().optional(),
  author: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  categoryId: z.string().optional(),
  isFeatured: z.boolean().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional(),
  ogImage: z.string().optional(),
  canonicalUrl: z.string().optional(),
  robotsDirective: z.string().optional(),
  publishedAt: z.string().optional(),
  expiresAt: z.string().optional(),
});

interface PostEditorProps {
  post?: Record<string, unknown>;
  initialTagIds?: string[];
  categories: Array<Record<string, unknown>>;
  tags: Array<Record<string, unknown>>;
  dict?: Record<string, unknown>;
}

function toDatetimeLocal(iso: Date | string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatScheduledDate(dt: string): string {
  try {
    const d = new Date(dt);
    if (isNaN(d.getTime())) return dt;
    const pad = (n: number) => n.toString().padStart(2, "0");
    const day = pad(d.getDate());
    const month = pad(d.getMonth() + 1);
    const year = d.getFullYear();
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    return `${day}.${month}.${year}. u ${hours}:${minutes}`;
  } catch {
    return dt;
  }
}

export function PostEditor({ post, initialTagIds, categories, tags, dict }: PostEditorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isEditing = !!post;

  const form = useForm({
    resolver: zodResolver(postFormSchema),
    defaultValues: {
      title: (post?.title as string) || "",
      slug: (post?.slug as string) || "",
      content: (post?.content as string) || "",
      excerpt: (post?.excerpt as string) || "",
      coverImage: (post?.coverImage as string) || "",
      featuredImage: (post?.featuredImage as string) || "",
      author: (post?.author as string) || "",
      status: (post?.status as "DRAFT" | "PUBLISHED" | "ARCHIVED") || "DRAFT",
      categoryId: (post?.categoryId as string) || "",
      isFeatured: (post?.isFeatured as boolean) || false,
      metaTitle: (post?.metaTitle as string) || "",
      metaDescription: (post?.metaDescription as string) || "",
      ogTitle: (post?.ogTitle as string) || "",
      ogDescription: (post?.ogDescription as string) || "",
      ogImage: (post?.ogImage as string) || "",
      canonicalUrl: (post?.canonicalUrl as string) || "",
      robotsDirective: (post?.robotsDirective as string) || "",
      publishedAt: post?.publishedAt ? toDatetimeLocal(post.publishedAt as Date) : "",
      expiresAt: post?.expiresAt ? toDatetimeLocal(post.expiresAt as Date) : "",
    },
  });

  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(initialTagIds || []);

  // Sync tag selection when initialTagIds changes (e.g., navigating between posts to edit)
  useEffect(() => {
    setSelectedTagIds(initialTagIds || []);
  }, [initialTagIds]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
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
      // Auto-fill missing SEO fields
      const title = (data.title as string) || "";
      const excerpt = (data.excerpt as string) || "";
      const content = (data.content as string) || "";
      const contentText = content.replace(/<[^>]*>/g, "").trim();

      if (!data.metaTitle) data.metaTitle = `${title} | Splashdeals.rs`.slice(0, 60);
      if (!data.metaDescription) {
        data.metaDescription = (excerpt || contentText.slice(0, 155)).slice(0, 160);
      }
      if (!data.ogTitle) data.ogTitle = data.metaTitle as string;
      if (!data.ogDescription) data.ogDescription = data.metaDescription as string;

      // Warn about images missing alt text — non-blocking
      const missingAltCount = countImagesWithoutAlt(content);
      if (missingAltCount > 0) {
        const label =
          missingAltCount >= 2 && missingAltCount <= 4
            ? `${missingAltCount} slike nemaju alt tekst.`
            : `${missingAltCount} slika nema alt tekst.`;
        toast.warning(`${label} Dodajte ga klikom na sliku u editoru.`);
      }

      startTransition(async () => {
        if (data.publishedAt) {
          data.publishedAt = new Date(data.publishedAt as string).toISOString();
        } else {
          data.publishedAt = null;
        }
        if (data.expiresAt) {
          data.expiresAt = new Date(data.expiresAt as string).toISOString();
        } else {
          data.expiresAt = null;
        }

        const cleansedTags = selectedTagIds.filter(Boolean);
        const result = isEditing
          ? await updateBlogPostAction(post!.id as string, data as never, cleansedTags)
          : await createBlogPostAction(data as never, cleansedTags);

        if (result.success) {
          clearDraft();
          toast.success(isEditing ? "Objava ažurirana" : "Objava kreirana");
          router.push("/admin/cms/posts");
          router.refresh();
        } else {
          toast.error(result.error || "Greška pri čuvanju");
        }
      });
    },
    [isEditing, post, selectedTagIds, router, startTransition],
  );

  const toggleTag = useCallback((tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId],
    );
  }, []);

  // --- Autosave ---
  const autosaveKey = isEditing ? `cms-draft-${post!.id}` : "cms-draft-new";
  const formValues = watch();

  const {
    status: autosaveStatus,
    restore,
    clearDraft,
    migrateDraft,
  } = useCmsAutosave(
    autosaveKey,
    {
      title: (formValues.title as string) || "",
      content: (formValues.content as string) || "",
      excerpt: (formValues.excerpt as string) || "",
      coverImage: (formValues.coverImage as string) || "",
      featuredImage: (formValues.featuredImage as string) || "",
      status: (formValues.status as string) || "DRAFT",
      categoryId: (formValues.categoryId as string) || "",
      metaTitle: (formValues.metaTitle as string) || "",
      metaDescription: (formValues.metaDescription as string) || "",
      savedAt: 0,
    },
    isDirty,
  );

  const [showRestoreBanner, setShowRestoreBanner] = useState(false);
  const [pendingAutosave, setPendingAutosave] = useState<AutosaveData | null>(null);

  // Check for a saved draft on mount
  useEffect(() => {
    const saved = restore();
    if (saved && saved.title) {
      setPendingAutosave(saved);
      setShowRestoreBanner(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  return (
    <FormProvider {...form}>
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Restore banner */}
        {showRestoreBanner && pendingAutosave && (
          <div className="mb-4 rounded-lg border border-yellow-300 bg-yellow-50 p-4 text-yellow-800">
            <p className="text-sm font-medium">
              Imate nesačuvane izmene od{" "}
              {new Date(pendingAutosave.savedAt).toLocaleTimeString("sr-RS", {
                hour: "2-digit",
                minute: "2-digit",
              })}
              .
            </p>
            <div className="mt-2 flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="default"
                onClick={() => {
                  setValue("title", pendingAutosave.title);
                  setValue("content", pendingAutosave.content || "");
                  setValue("excerpt", pendingAutosave.excerpt || "");
                  setValue("coverImage", pendingAutosave.coverImage || "");
                  setValue("featuredImage", pendingAutosave.featuredImage || "");
                  setValue(
                    "status",
                    (pendingAutosave.status as "DRAFT" | "PUBLISHED" | "ARCHIVED") || "DRAFT",
                  );
                  setValue("categoryId", pendingAutosave.categoryId || "");
                  setValue("metaTitle", pendingAutosave.metaTitle || "");
                  setValue("metaDescription", pendingAutosave.metaDescription || "");
                  setShowRestoreBanner(false);
                  setPendingAutosave(null);
                }}
              >
                Vrati ih
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  clearDraft();
                  setShowRestoreBanner(false);
                  setPendingAutosave(null);
                }}
              >
                Odbaci
              </Button>
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Naslov *</Label>
              <Input
                id="title"
                {...register("title")}
                onChange={handleTitleChange}
                placeholder="Unesi naslov objave..."
                className="text-lg font-medium"
              />
              {errors.title && <p className="text-destructive text-xs">{errors.title.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                {...register("slug")}
                placeholder="moja-blog-objava"
                className="font-mono text-sm"
              />
              {errors.slug && <p className="text-destructive text-xs">{errors.slug.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="excerpt">Kratak opis (excerpt)</Label>
              <Textarea
                id="excerpt"
                {...register("excerpt")}
                placeholder="Kratak opis objave..."
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
            <div className="space-y-2">
              <Label htmlFor="featuredImage">Istaknuta slika (URL)</Label>
              <div className="flex gap-2">
                <Input
                  id="featuredImage"
                  {...register("featuredImage")}
                  placeholder="https://..."
                  className="flex-1"
                />
                <MediaLibrarySheet
                  dict={(dict?.media_library as Record<string, unknown>) || {}}
                  onSelect={(url) => setValue("featuredImage", url)}
                  trigger={
                    <Button type="button" variant="outline" size="sm" className="shrink-0 gap-1.5">
                      <Icon name="photo_library" className="size-4" />
                      Pregledaj
                    </Button>
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="author">Autor</Label>
              <Input id="author" {...register("author")} placeholder="Ime autora" />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>Sadržaj</Label>
              {}
              <RichTextEditor
                source="blog"
                content={watch("content") || ""}
                onChange={(html) => setValue("content", html)}
                placeholder="Počni da pišeš blog objavu..."
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
              <div className="flex items-center justify-between">
                <Label htmlFor="isFeatured" className="cursor-pointer">
                  Istaknuta objava
                </Label>
                <Switch
                  id="isFeatured"
                  checked={!!watch("isFeatured")}
                  onCheckedChange={(checked) => setValue("isFeatured", checked)}
                />
              </div>

              {/* Scheduling - shown when status is PUBLISHED */}
              {watch("status") === "PUBLISHED" && (
                <div className="space-y-2 pt-2">
                  <Label htmlFor="publishedAt">Datum i vreme objave</Label>
                  <Input
                    id="publishedAt"
                    type="datetime-local"
                    {...register("publishedAt")}
                    className="w-full"
                  />
                  {(() => {
                    const val = watch("publishedAt");
                    if (val) {
                      const dt = new Date(val);
                      if (dt > new Date()) {
                        return (
                          <div className="space-y-1">
                            <p className="text-muted-foreground text-xs">
                              Zakazano za {formatScheduledDate(val)}
                            </p>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-destructive h-auto p-0 text-xs"
                              onClick={() => setValue("publishedAt", "")}
                            >
                              Otkaži zakazivanje
                            </Button>
                          </div>
                        );
                      }
                    }
                    return null;
                  })()}
                </div>
              )}

              {/* Expiry - shown when status is PUBLISHED */}
              {watch("status") === "PUBLISHED" && (
                <div className="space-y-2 pt-2">
                  <Label htmlFor="expiresAt">Ističe</Label>
                  <Input
                    id="expiresAt"
                    type="datetime-local"
                    {...register("expiresAt")}
                    className="w-full"
                  />
                  {(() => {
                    const val = watch("expiresAt");
                    if (val) {
                      const dt = new Date(val);
                      if (dt > new Date()) {
                        return (
                          <div className="space-y-1">
                            <p className="text-muted-foreground text-xs">
                              Ističe {formatScheduledDate(val)}
                            </p>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-destructive h-auto p-0 text-xs"
                              onClick={() => setValue("expiresAt", "")}
                            >
                              Otkaži istek
                            </Button>
                          </div>
                        );
                      }
                    }
                    return null;
                  })()}
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <div className="flex-1">
                  <Button type="submit" disabled={isPending} className="w-full">
                    {isPending ? (
                      <Icon name="progress_activity" className="size-4 animate-spin" />
                    ) : (
                      <Icon name="save" className="size-4" />
                    )}
                    {isEditing ? "Sačuvaj izmene" : "Kreiraj"}
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/admin/cms/posts")}
                >
                  Odustani
                </Button>
              </div>
              {/* Autosave status */}
              <div className="flex items-center justify-end gap-2 pt-1">
                {autosaveStatus === "saving" && (
                  <span className="text-muted-foreground text-xs">Čuvanje...</span>
                )}
                {autosaveStatus === "saved" && (
                  <span className="text-muted-foreground text-xs">
                    Sačuvano u{" "}
                    {new Date().toLocaleTimeString("sr-RS", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-3 rounded-lg border p-4">
              <h3 className="text-sm font-semibold">Kategorija</h3>
              <Select
                value={watch("categoryId") || ""}
                onValueChange={(value) => setValue("categoryId", value)}
              >
                <SelectTrigger id="categoryId" aria-label="Kategorija" className="w-full">
                  <SelectValue placeholder="Bez kategorije" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id as string} value={cat.id as string}>
                      {cat.name as string}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3 rounded-lg border p-4">
              <h3 className="text-sm font-semibold">Tagovi</h3>
              <div className="flex flex-wrap gap-1.5">
                {tags.length === 0 && (
                  <p className="text-muted-foreground text-xs">
                    Nema tagova. Kreiraj ih u CMS &gt; Tagovi.
                  </p>
                )}
                {tags.map((tag) => {
                  const tagId = tag.id as string;
                  const isSelected = selectedTagIds.includes(tagId);
                  return (
                    <Button
                      key={tagId}
                      type="button"
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleTag(tagId)}
                      className="rounded-full"
                    >
                      {tag.name as string}
                    </Button>
                  );
                })}
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
