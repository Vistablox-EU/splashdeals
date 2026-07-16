"use client";
// @ts-nocheck - react-hook-form + zod v4 resolver type chain mismatch, runtime is correct

import { useCallback, useTransition, useState, useEffect, useRef } from "react";
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
import { RichTextEditor } from "../../../_components/rich-text-editor";
import { SEOPanel } from "../../../_components/seo-panel";
import { ReadabilityPanel } from "../../../_components/readability-panel";
import { InternalLinksPanel } from "../../../_components/internal-links-panel";
import { EditorPresence } from "../../../_components/editor-presence";
import { SocialSharePreview } from "../../../_components/social-share-preview";
import { CmsEditorShell } from "../../../_components/cms-editor-shell";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { MediaLibrarySheet } from "@/app/(dashboard)/admin/media/_components/media-library-sheet";
import {
  createPageAction,
  updatePageAction,
  submitForReviewAction,
  approvePostAction,
  rejectPostAction,
} from "@/app/(server)/actions/cms/content";
import { useCmsAutosave, AutosaveData } from "@/hooks/use-cms-autosave";
import { countImagesWithoutAlt } from "../../../_lib/cms-editor-utils";

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
  status: z.enum(["DRAFT", "REVIEW", "PUBLISHED", "PUBLISHED_PENDING", "ARCHIVED"]).optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional(),
  ogImage: z.string().optional(),
  canonicalUrl: z.string().optional(),
  robotsDirective: z.string().optional(),
  focusKeyword: z.string().optional(),
  expiresAt: z.string().optional(),
});

interface PageEditorProps {
  page?: Record<string, unknown>;
  dict?: Record<string, unknown>;
  currentUserId?: string;
}

export function PageEditor({ page, dict, currentUserId = "" }: PageEditorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isEditing = !!page;
  const clearDraftRef = useRef<() => void>(() => {});

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
      status:
        (page?.status as "DRAFT" | "REVIEW" | "PUBLISHED" | "PUBLISHED_PENDING" | "ARCHIVED") ||
        "DRAFT",
      metaTitle: (page?.metaTitle as string) || "",
      metaDescription: (page?.metaDescription as string) || "",
      ogTitle: (page?.ogTitle as string) || "",
      ogDescription: (page?.ogDescription as string) || "",
      ogImage: (page?.ogImage as string) || "",
      canonicalUrl: (page?.canonicalUrl as string) || "",
      robotsDirective: (page?.robotsDirective as string) || "",
      focusKeyword: (page?.focusKeyword as string) || "",
      expiresAt: (page?.expiresAt as string) || "",
    },
  });

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
        if (data.expiresAt) {
          data.expiresAt = new Date(data.expiresAt as string).toISOString();
        } else {
          data.expiresAt = null;
        }
        const result = isEditing
          ? await updatePageAction(page!.id as string, data as never)
          : await createPageAction(data as never);

        if (result.success) {
          clearDraftRef.current();
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

  // --- Autosave ---
  const autosaveKey = isEditing ? `cms-draft-${page!.id}` : "cms-draft-new";
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
      featuredImage: "",
      status: (formValues.status as string) || "DRAFT",
      categoryId: "",
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
      <form onSubmit={handleSubmit(onSubmit)}>
        {isEditing && !!page?.id && currentUserId && (
          <EditorPresence pageId={page.id as string} currentUserId={currentUserId} />
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
                  setValue(
                    "status",
                    (pendingAutosave.status as "DRAFT" | "PUBLISHED" | "ARCHIVED") || "DRAFT",
                  );
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
              <p className="text-sm font-medium text-yellow-800">Ova strana čeka pregled</p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="default"
                  className="bg-green-600 text-white hover:bg-green-700"
                  onClick={async () => {
                    const result = await approvePostAction(page!.id as string, "page");
                    if (result.success) {
                      toast.success("Strana odobrena");
                      router.push("/admin/cms/pages");
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
                    const result = await rejectPostAction(page!.id as string, "page");
                    if (result.success) {
                      toast.success("Strana vraćena na doradu");
                      router.push("/admin/cms/pages");
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
              <RichTextEditor
                source="stranica"
                content={watch("content") || ""}
                onChange={(html) => setValue("content", html)}
                placeholder="Počni da pišeš sadržaj strane..."
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
                              Ističe{" "}
                              {new Date(val).toLocaleDateString("sr-RS", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
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
                      const result = await submitForReviewAction(page!.id as string, "page");
                      if (result.success) {
                        toast.success("Strana poslata na pregled");
                        router.push("/admin/cms/pages");
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
                  onClick={() => router.push("/admin/cms/pages")}
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
                  <SEOPanel
                    content={watch("content") as string}
                    previewUrl={`splashdeals.rs/${watch("slug") || "..."}`}
                  />
                </div>
              </SheetContent>
            </Sheet>

            <div className="space-y-3 rounded-lg border p-4">
              <SocialSharePreview
                title={(watch("ogTitle") as string) || (watch("title") as string) || ""}
                coverImage={(watch("ogImage") as string) || (watch("coverImage") as string) || ""}
                excerpt={(watch("ogDescription") as string) || (watch("excerpt") as string) || ""}
                pathHint={`splashdeals.rs/${watch("slug") || "..."}`}
              />
            </div>

            <div className="space-y-3 rounded-lg border p-4">
              <ReadabilityPanel content={watch("content") as string} />
            </div>

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
