"use client"
// @ts-nocheck - react-hook-form + zod v4 resolver type chain mismatch, runtime is correct

import { useCallback, useTransition, useState } from "react"
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
  createBlogPostAction,
  updateBlogPostAction,
} from "@/app/(server)/actions/cms"

const postFormSchema = z.object({
  title: z.string().min(1, "Naslov je obavezan"),
  slug: z.string().min(1, "Slug je obavezan").regex(/^[a-z0-9-]+$/, "Samo mala slova, brojevi i crtice"),
  content: z.string().optional(),
  excerpt: z.string().optional(),
  coverImage: z.string().optional(),
  featuredImage: z.string().optional(),
  author: z.string().optional(),
  status: z.string().optional(),
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
})

interface PostEditorProps {
  post?: Record<string, unknown>
  initialTagIds?: string[]
  categories: Array<Record<string, unknown>>
  tags: Array<Record<string, unknown>>
}

export function PostEditor({ post, initialTagIds, categories, tags }: PostEditorProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const isEditing = !!post

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
      status: (post?.status as string) || "DRAFT",
      categoryId: (post?.categoryId as string) || "",
      isFeatured: (post?.isFeatured as boolean) || false,
      metaTitle: (post?.metaTitle as string) || "",
      metaDescription: (post?.metaDescription as string) || "",
      ogTitle: (post?.ogTitle as string) || "",
      ogDescription: (post?.ogDescription as string) || "",
      ogImage: (post?.ogImage as string) || "",
      canonicalUrl: (post?.canonicalUrl as string) || "",
      robotsDirective: (post?.robotsDirective as string) || "",
      publishedAt: (post?.publishedAt as string) || "",
    },
  })

  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(initialTagIds || [])

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
      // Auto-fill missing SEO fields
      const title = (data.title as string) || ""
      const excerpt = (data.excerpt as string) || ""
      const content = (data.content as string) || ""
      const contentText = content.replace(/<[^>]*>/g, "").trim()

      if (!data.metaTitle) data.metaTitle = `${title} | Splashdeals.rs`.slice(0, 60)
      if (!data.metaDescription) {
        data.metaDescription = (excerpt || contentText.slice(0, 155)).slice(0, 160)
      }
      if (!data.ogTitle) data.ogTitle = data.metaTitle as string
      if (!data.ogDescription) data.ogDescription = data.metaDescription as string

      startTransition(async () => {
        const cleansedTags = selectedTagIds.filter(Boolean)
        const result = isEditing
          ? await updateBlogPostAction(post!.id as string, data as never, cleansedTags)
          : await createBlogPostAction(data as never, cleansedTags)

        if (result.success) {
          toast.success(isEditing ? "Objava ažurirana" : "Objava kreirana")
          router.push("/admin/cms/posts")
          router.refresh()
        } else {
          toast.error(result.error || "Greška pri čuvanju")
        }
      })
    },
    [isEditing, post, selectedTagIds, router, startTransition]
  )

  const toggleTag = useCallback((tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    )
  }, [])

  return (
    <FormProvider {...form}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Naslov *</Label>
              <Input id="title" {...register("title")} onChange={handleTitleChange} placeholder="Unesi naslov objave..." className="text-lg font-medium" />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input id="slug" {...register("slug")} placeholder="moja-blog-objava" className="font-mono text-sm" />
              {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="excerpt">Kratak opis (excerpt)</Label>
              <Textarea id="excerpt" {...register("excerpt")} placeholder="Kratak opis objave..." className="min-h-[80px] resize-none" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coverImage">Cover slika (URL)</Label>
              <Input id="coverImage" {...register("coverImage")} placeholder="https://..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="author">Autor</Label>
              <Input id="author" {...register("author")} placeholder="Ime autora" />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>Sadržaj</Label>
              {/* eslint-disable-next-line react-hooks/incompatible-library */}
              <RichTextEditor content={watch("content") || ""} onChange={(html) => setValue("content", html)} placeholder="Počni da pišeš blog objavu..." />
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
              <div className="flex items-center justify-between">
                <Label htmlFor="isFeatured" className="cursor-pointer">Istaknuta objava</Label>
                <Switch id="isFeatured" checked={!!watch("isFeatured")} onCheckedChange={(checked) => setValue("isFeatured", checked)} />
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={isPending} className="flex-1">
                  {isPending ? <Icon name="progress_activity" className="size-4 animate-spin" /> : <Icon name="save" className="size-4" />}
                  {isEditing ? "Sačuvaj izmene" : "Objavi"}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.push("/admin/cms/posts")}>Odustani</Button>
              </div>
            </div>

            <div className="rounded-lg border p-4 space-y-3">
              <h3 className="text-sm font-semibold">Kategorija</h3>
              <select {...register("categoryId")} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                <option value="">Bez kategorije</option>
                {categories.map((cat) => (
                  <option key={cat.id as string} value={cat.id as string}>{cat.name as string}</option>
                ))}
              </select>
            </div>

            <div className="rounded-lg border p-4 space-y-3">
              <h3 className="text-sm font-semibold">Tagovi</h3>
              <div className="flex flex-wrap gap-1.5">
                {tags.length === 0 && <p className="text-xs text-muted-foreground">Nema tagova. Kreiraj ih u CMS &gt; Tagovi.</p>}
                {tags.map((tag) => {
                  const tagId = tag.id as string
                  const isSelected = selectedTagIds.includes(tagId)
                  return (
                    <button key={tagId} type="button" onClick={() => toggleTag(tagId)}
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${isSelected ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
                      {tag.name as string}
                    </button>
                  )
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
