"use client";
// react-hook-form + zod v4 resolver type chain mismatch — runtime is correct

import { useCallback, useTransition, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm, FormProvider, type SubmitHandler } from "react-hook-form";
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RichTextEditor } from "../../../_components/rich-text-editor";
import { SEOPanel } from "../../../_components/seo-panel";
import { ReadabilityPanel } from "../../../_components/readability-panel";
import { InternalLinksPanel } from "../../../_components/internal-links-panel";
import { EditorPresence } from "../../../_components/editor-presence";
import { RollbackDropdown } from "../../../_components/rollback-dropdown";
import { SocialSharePreview } from "../../../_components/social-share-preview";
import { CmsEditorShell } from "../../../_components/cms-editor-shell";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { MediaLibrarySheet } from "@/app/(dashboard)/admin/media/_components/media-library-sheet";
import {
  createBlogPostAction,
  updateBlogPostAction,
  submitForReviewAction,
  approvePostAction,
  rejectPostAction,
} from "@/app/(server)/actions/cms/content";
import { generateContentAction } from "@/app/(server)/actions/ai-content";
import { useCmsAutosave, AutosaveData } from "@/hooks/use-cms-autosave";
import {
  countImagesWithoutAlt,
  toDatetimeLocal,
  formatScheduledDate,
} from "../../../_lib/cms-editor-utils";

const postFormSchema = z.object({
  title: z.string().min(1, "Naslov je obavezan"),
  slug: z
    .string()
    .min(1, "Slug je obavezan")
    .regex(/^[a-z0-9-]+$/, "Samo mala slova, brojevi i crtice"),
  content: z.string().optional(),
  excerpt: z.string().optional(),
  coverImage: z.string().optional(),
  coverImageAlt: z.string().optional(),
  featuredImage: z.string().optional(),
  author: z.string().optional(),
  authorPersonId: z.string().optional(),
  status: z.enum(["DRAFT", "REVIEW", "PUBLISHED", "PUBLISHED_PENDING", "ARCHIVED"]).optional(),
  categoryId: z.string().optional(),
  isFeatured: z.boolean().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  focusKeyword: z.string().optional(),
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
  currentUserId?: string;
}

export function PostEditor({ post, initialTagIds, categories, tags, dict, currentUserId = "" }: PostEditorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isEditing = !!post;
  const clearDraftRef = useRef<() => void>(() => {});

  const form = useForm({
    resolver: zodResolver(postFormSchema),
    defaultValues: {
      title: (post?.title as string) || "",
      slug: (post?.slug as string) || "",
      content: (post?.content as string) || "",
      excerpt: (post?.excerpt as string) || "",
      coverImage: (post?.coverImage as string) || "",
      coverImageAlt: (post?.coverImageAlt as string) || "",
      featuredImage: (post?.featuredImage as string) || "",
      author: (post?.author as string) || "",
      authorPersonId: (post?.authorPersonId as string) || "",
      status:
        (post?.status as "DRAFT" | "REVIEW" | "PUBLISHED" | "PUBLISHED_PENDING" | "ARCHIVED") ||
        "DRAFT",
      categoryId: (post?.categoryId as string) || "",
      isFeatured: (post?.isFeatured as boolean) || false,
      metaTitle: (post?.metaTitle as string) || "",
      metaDescription: (post?.metaDescription as string) || "",
      ogTitle: (post?.ogTitle as string) || "",
      ogDescription: (post?.ogDescription as string) || "",
      ogImage: (post?.ogImage as string) || "",
      canonicalUrl: (post?.canonicalUrl as string) || "",
      robotsDirective: (post?.robotsDirective as string) || "",
      focusKeyword: (post?.focusKeyword as string) || "",
      publishedAt: post?.publishedAt ? toDatetimeLocal(post.publishedAt as Date) : "",
      expiresAt: post?.expiresAt ? toDatetimeLocal(post.expiresAt as Date) : "",
    },
  });

  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(initialTagIds || []);
  const [aiTopic, setAiTopic] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Sync tag selection when initialTagIds changes (e.g., navigating between posts to edit)
  useEffect(() => {
    setSelectedTagIds(initialTagIds || []);
  }, [initialTagIds]);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
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
          clearDraftRef.current();
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
    migrateDraft: _migrateDraft,
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
  clearDraftRef.current = clearDraft;

  const [showRestoreBanner, setShowRestoreBanner] = useState(false);
  const [pendingAutosave, setPendingAutosave] = useState<AutosaveData | null>(null);

  // Check for a saved draft on mount
  useEffect(() => {
    const saved = restore();
    if (saved && saved.title) {
      setPendingAutosave(saved);
      setShowRestoreBanner(true);
    }
  }, [restore, autosaveKey]);

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
      <form onSubmit={handleSubmit(onSubmit as SubmitHandler<any>)}>
        {/* Editor Presence */}
        {isEditing && !!post?.id && currentUserId && (
          <EditorPresence postId={post.id as string} currentUserId={currentUserId} />
        )}
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
                    (pendingAutosave.status as "DRAFT" | "REVIEW" | "PUBLISHED" | "ARCHIVED") ||
                      "DRAFT",
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
        {/* REVIEW status banner */}
        {isEditing && watch("status") === "REVIEW" && (
          <div className="mb-4 rounded-lg border border-yellow-400 bg-yellow-50 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-yellow-800">Ova objava čeka pregled</p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="default"
                  className="bg-green-600 text-white hover:bg-green-700"
                  onClick={async () => {
                    const result = await approvePostAction(post!.id as string, "post");
                    if (result.success) {
                      toast.success("Objava odobrena");
                      router.push("/admin/cms/posts");
                      router.refresh();
                    } else {
                      toast.error(result.error || "Greška pri odobravanju");
                    }
                  }}
                >
                  Odobri
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-50"
                  onClick={async () => {
                    const result = await rejectPostAction(post!.id as string, "post");
                    if (result.success) {
                      toast.success("Objava vraćena na doradu");
                      router.push("/admin/cms/posts");
                      router.refresh();
                    } else {
                      toast.error(result.error || "Greška pri vraćanju");
                    }
                  }}
                >
                  Vrati na doradu
                </Button>
              </div>
            </div>
          </div>
        )}
        <CmsEditorShell
          main={
          <>
            {isEditing && !!post?.id && (
              <RollbackDropdown
                postId={post.id as string}
                onRestore={(title, content, excerpt) => {
                  setValue("title", title, { shouldDirty: true });
                  setValue("content", content, { shouldDirty: true });
                  setValue("excerpt", excerpt, { shouldDirty: true });
                }}
              />
            )}
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
            {/* #365 — AI content generation */}
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5 border-purple-300 text-purple-700 hover:bg-purple-50"
                onClick={async () => {
                  const topic = getValues("title");
                  if (!topic || topic.trim().length < 2) {
                    toast.error("Prvo unesi naslov (temu) za generisanje sadržaja.");
                    return;
                  }
                  const { generateContentAction } =
                    await import("@/app/(server)/actions/ai-content");
                  const result = await generateContentAction(topic);
                  if (result.success && result.data) {
                    setValue("content", result.data.content || "");
                    setValue("excerpt", result.data.excerpt || "");
                    if (result.data.title && result.data.title !== topic) {
                      setValue("title", result.data.title);
                      if (!isEditing) {
                        setValue("slug", slugify(result.data.title, { lower: true, strict: true }));
                      }
                    }
                    toast.success("Sadržaj generisan!");
                  } else {
                    toast.error(result.error || "Greška pri generisanju.");
                  }
                }}
              >
                <Icon name="auto_awesome" className="size-4" />
                Generiši sadržaj
              </Button>
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
              {/* #385 — Cover image alt text separately editable */}
              <Input
                id="coverImageAlt"
                {...register("coverImageAlt")}
                placeholder="Alt tekst za cover sliku (SEO)"
                className="text-muted-foreground mt-1 text-sm"
              />
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
              <div className="flex items-center justify-between">
                <Label>Sadržaj</Label>
                <Collapsible className="w-auto">
                  <CollapsibleTrigger asChild>
                    <Button type="button" variant="outline" size="sm" className="gap-1.5">
                      <Icon name="auto_awesome" className="size-4" />
                      AI Generiši
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2">
                    <div className="flex items-center gap-2 rounded-lg border p-3">
                      <Input
                        id="ai-topic"
                        value={aiTopic}
                        onChange={(e) => setAiTopic(e.target.value)}
                        placeholder="Npr. 'Prednosti termalnih bazena zimi'"
                        className="h-9 text-sm"
                        disabled={isGenerating}
                      />
                      <Button
                        type="button"
                        size="sm"
                        className="h-9 shrink-0 gap-1.5"
                        disabled={isGenerating || !aiTopic.trim()}
                        onClick={async () => {
                          if (!aiTopic.trim()) {
                            toast.error("Unesite temu za generisanje.");
                            return;
                          }
                          const topic = aiTopic.trim();
                          setAiTopic("");
                          setIsGenerating(true);
                          toast.loading("Generišem sadržaj...", { id: "ai-generate" });
                          try {
                            const result = await generateContentAction(topic);
                            if (result.success && result.data) {
                              setValue("title", result.data.title);
                              setValue("content", result.data.content);
                              setValue("excerpt", result.data.excerpt);
                              toast.success("Sadržaj generisan!", { id: "ai-generate" });
                            } else {
                              toast.error(result.error || "Greška pri generisanju.", {
                                id: "ai-generate",
                              });
                            }
                          } catch {
                            toast.error("Greška pri generisanju sadržaja.", {
                              id: "ai-generate",
                            });
                          } finally {
                            setIsGenerating(false);
                          }
                        }}
                      >
                        <Icon name="sparkles" className="size-4" />
                        {isGenerating ? "Generišem..." : "Generiši"}
                      </Button>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
              <RichTextEditor
                source="blog"
                content={watch("content") || ""}
                onChange={(html) => setValue("content", html)}
                placeholder="Počni da pišeš blog objavu... ili klikni 'AI Generiši' iznad za automatski generisan sadržaj"
              />
            </div>
          </>
          }
          sidebar={
          <>
            <div className="space-y-4 rounded-lg border p-4">
              <h3 className="text-sm font-semibold">Status</h3>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={watch("status") || "DRAFT"}
                  onValueChange={(value) =>
                    setValue(
                      "status",
                      value as "DRAFT" | "REVIEW" | "PUBLISHED" | "PUBLISHED_PENDING" | "ARCHIVED",
                    )
                  }
                >
                  <SelectTrigger id="status" aria-label="Status" className="w-full">
                    <SelectValue placeholder="Izaberi status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Nacrt</SelectItem>
                    <SelectItem value="REVIEW">Na pregledu</SelectItem>
                    <SelectItem value="PUBLISHED">Objavljeno</SelectItem>
                    <SelectItem value="PUBLISHED_PENDING">Objavljeno (čeka potvrdu)</SelectItem>
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
                {isEditing && watch("status") === "DRAFT" && (
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={isPending}
                    onClick={async () => {
                      const result = await submitForReviewAction(post!.id as string, "post");
                      if (result.success) {
                        toast.success("Objava poslata na pregled");
                        router.push("/admin/cms/posts");
                        router.refresh();
                      } else {
                        toast.error(result.error || "Greška pri slanju na pregled");
                      }
                    }}
                  >
                    <Icon name="rate_review" className="size-4" />
                    Pošalji na pregled
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/admin/cms/posts")}
                >
                  Odustani
                </Button>
                {isEditing && (
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-1.5 border-blue-300 text-blue-700 hover:bg-blue-50"
                    onClick={() => {
                      const slug = watch("slug");
                      if (slug) {
                        window.open(`/blog/${slug}?preview=1`, "_blank");
                      } else {
                        toast.error("Prvo sačuvaj objavu da bi dobila slug.");
                      }
                    }}
                  >
                    <Icon name="visibility" className="size-4" />
                    Pregled
                  </Button>
                )}
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
                  <SEOPanel content={watch("content") as string} />
                </div>
              </SheetContent>
            </Sheet>

            {/* Social share preview */}
            <div className="space-y-3 rounded-lg border p-4">
              <SocialSharePreview
                title={(watch("ogTitle") as string) || (watch("title") as string) || ""}
                coverImage={(watch("ogImage") as string) || (watch("coverImage") as string) || ""}
                excerpt={(watch("ogDescription") as string) || (watch("excerpt") as string) || ""}
                pathHint={`splashdeals.rs/blog/${watch("slug") || "..."}`}
              />
            </div>

            {/* Readability Panel */}
            <div className="space-y-3 rounded-lg border p-4">
              <ReadabilityPanel content={watch("content") as string} />
            </div>

            {/* Internal Links Panel */}
            <div className="space-y-3 rounded-lg border p-4">
              <InternalLinksPanel content={watch("content") as string} />
            </div>
          </>
          }
        />
      </form>
    </FormProvider>
  );
}
