"use client"
// @ts-nocheck - react-hook-form + zod v4 resolver type chain mismatch, runtime is correct

import { useCallback, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useForm, FormProvider } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import slugify from "slugify"
import { z } from "zod/v4"
import { Icon } from "@/components/ui/Icon"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { RichTextEditor } from "../../_components/rich-text-editor"
import { SEOPanel } from "../../_components/seo-panel"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  createPageAction,
  updatePageAction,
} from "@/app/(server)/actions/cms"

const pageFormSchema = z.object({
  title: z.string().min(1, "Naslov je obavezan"),
  slug: z.string().min(1, "Slug je obavezan").regex(/^[a-z0-9-]+$/, "Samo mala slova, brojevi i crtice"),
  content: z.string().optional(),
  excerpt: z.string().optional(),
  coverImage: z.string().optional(),
  template: z.string().optional(),
  showHeader: z.boolean().optional(),
  showFooter: z.boolean().optional(),
  status: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional(),
  ogImage: z.string().optional(),
  canonicalUrl: z.string().optional(),
  robotsDirective: z.string().optional(),
})

interface PageEditorProps {
  page?: Record<string, unknown>
}

export function PageEditor({ page }: PageEditorProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const isEditing = !!page

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
      status: (page?.status as string) || "DRAFT",
      metaTitle: (page?.metaTitle as string) || "",
      metaDescription: (page?.metaDescription as string) || "",
      ogTitle: (page?.ogTitle as string) || "",
      ogDescription: (page?.ogDescription as string) || "",
      ogImage: (page?.ogImage as string) || "",
      canonicalUrl: (page?.canonicalUrl as string) || "",
      robotsDirective: (page?.robotsDirective as string) || "",
    },
  })

  const { register, handleSubmit, setValue, watch, formState: { errors } } = form

  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const title = e.target.value
      setValue("title", title)
      if (!isEditing && title) {
        setValue("slug", slugify(title, { lower: true, strict: true }))
      }
    },
    [setValue, isEditing]
  )

  const onSubmit = useCallback(
    async (data: Record<string, unknown>) => {
      startTransition(async () => {
        const result = isEditing
          ? await updatePageAction(page!.id as string, data as never)
          : await createPageAction(data as never)

        if (result.success) {
          toast.success(isEditing ? "Strana ažurirana" : "Strana kreirana")
          router.push("/admin/cms/pages")
          router.refresh()
        } else {
          toast.error(result.error || "Greška pri čuvanju")
        }
      })
    },
    [isEditing, page, router, startTransition]
  )

  return (
    <FormProvider {...form}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Naslov *</Label>
              <Input id="title" {...register("title")} onChange={handleTitleChange} placeholder="Unesi naslov strane..." className="text-lg font-medium" />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input id="slug" {...register("slug")} placeholder="moja-strana" className="font-mono text-sm" />
              {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="excerpt">Kratak opis (excerpt)</Label>
              <Textarea id="excerpt" {...register("excerpt")} placeholder="Kratak opis strane..." className="min-h-[80px] resize-none" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coverImage">Cover slika (URL)</Label>
              <Input id="coverImage" {...register("coverImage")} placeholder="https://..." />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>Sadržaj</Label>
              {/* eslint-disable-next-line react-hooks/incompatible-library */}
              <RichTextEditor content={watch("content") || ""} onChange={(html) => setValue("content", html)} placeholder="Počni da pišeš sadržaj strane..." />
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-lg border p-4 space-y-4">
              <h3 className="text-sm font-semibold">Status</h3>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select id="status" {...register("status")} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                  <option value="DRAFT">Nacrt</option>
                  <option value="PUBLISHED">Objavljeno</option>
                  <option value="ARCHIVED">Arhivirano</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="template">Šablon</Label>
                <select id="template" {...register("template")} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                  <option value="default">Podrazumevani</option>
                  <option value="full-width">Puna širina</option>
                  <option value="landing">Landing page</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="showHeader" className="cursor-pointer">Prikaži header</Label>
                <Switch id="showHeader" checked={!!watch("showHeader")} onCheckedChange={(checked) => setValue("showHeader", checked)} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="showFooter" className="cursor-pointer">Prikaži footer</Label>
                <Switch id="showFooter" checked={!!watch("showFooter")} onCheckedChange={(checked) => setValue("showFooter", checked)} />
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={isPending} className="flex-1">
                  {isPending ? <Icon name="progress_activity" className="size-4 animate-spin" /> : <Icon name="save" className="size-4" />}
                  {isEditing ? "Sačuvaj izmene" : "Kreiraj"}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.push("/admin/cms/pages")}>Odustani</Button>
              </div>
            </div>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="w-full gap-2">
                  <Icon name="search_insights" className="size-4" />
                  SEO podešavanja
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[400px] sm:w-[480px] overflow-y-auto">
                <SheetHeader><SheetTitle>SEO podešavanja</SheetTitle></SheetHeader>
                <div className="mt-6">
                  <SEOPanel />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </form>
    </FormProvider>
  )
}
