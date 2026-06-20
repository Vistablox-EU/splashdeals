"use client"

import { useCallback, useTransition, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import slugify from "slugify"
import { Icon } from "@/components/ui/Icon"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
} from "@/app/(server)/actions/cms"

interface CategoryRow {
  id: string
  name: string
  slug: string
  description: string | null
  color: string | null
  displayOrder: number
  _count?: { posts: number }
}

export function CategoriesManager({
  categories,
}: {
  categories: Array<Record<string, unknown>>
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [newName, setNewName] = useState("")
  const [newColor, setNewColor] = useState("#3b82f6")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editColor, setEditColor] = useState("")

  const handleCreate = useCallback(() => {
    if (!newName.trim()) return
    const slug = slugify(newName, { lower: true, strict: true })
    startTransition(async () => {
      const result = await createCategoryAction({
        name: newName.trim(),
        slug,
        description: "",
        color: newColor,
        displayOrder: 0,
      })
      if (result.success) {
        toast.success("Kategorija kreirana")
        setNewName("")
        router.refresh()
      } else {
        toast.error(result.error || "Greška")
      }
    })
  }, [newName, newColor, router, startTransition])

  const handleUpdate = useCallback((id: string) => {
    if (!editName.trim()) return
    const slug = slugify(editName, { lower: true, strict: true })
    startTransition(async () => {
      const result = await updateCategoryAction(id, {
        name: editName.trim(),
        slug,
        description: "",
        color: editColor,
        displayOrder: 0,
      })
      if (result.success) {
        toast.success("Kategorija ažurirana")
        setEditingId(null)
        router.refresh()
      } else {
        toast.error(result.error || "Greška")
      }
    })
  }, [editName, editColor, router, startTransition])

  const handleDelete = useCallback((id: string, name: string) => {
    if (!confirm(`Da li ste sigurni da želite da obrišete kategoriju "${name}"?`)) return
    startTransition(async () => {
      const result = await deleteCategoryAction(id)
      if (result.success) {
        toast.success("Kategorija obrisana")
        router.refresh()
      } else {
        toast.error(result.error || "Greška")
      }
    })
  }, [router, startTransition])

  const startEditing = useCallback((cat: CategoryRow) => {
    setEditingId(cat.id)
    setEditName(cat.name)
    setEditColor(cat.color || "#3b82f6")
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Kategorije</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Organizuj blog objave po kategorijama.
        </p>
      </div>

      {/* Nova kategorija */}
      <div className="rounded-lg border p-4">
        <h3 className="text-sm font-semibold mb-3">Nova kategorija</h3>
        <div className="flex items-end gap-3">
          <div className="space-y-1.5 flex-1">
            <label className="text-xs text-muted-foreground">Naziv</label>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Naziv kategorije"
              className="h-9"
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Boja</label>
            <input
              type="color"
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              className="h-9 w-12 rounded-md border border-input bg-transparent p-1 cursor-pointer"
            />
          </div>
          <Button onClick={handleCreate} disabled={isPending || !newName.trim()} className="h-9">
            <Icon name="add" className="size-4 mr-1" />
            Dodaj
          </Button>
        </div>
      </div>

      {/* Lista kategorija */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Naziv</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Objave</TableHead>
              <TableHead className="w-[120px]">Akcije</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(categories as unknown as CategoryRow[]).length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-sm text-muted-foreground">
                  Nema kategorija. Kreiraj prvu kategoriju.
                </TableCell>
              </TableRow>
            ) : (
              (categories as unknown as CategoryRow[]).map((cat) => (
                <TableRow key={cat.id}>
                  <TableCell>
                    {editingId === cat.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="h-8 w-48"
                          onKeyDown={(e) => e.key === "Enter" && handleUpdate(cat.id)}
                        />
                        <input
                          type="color"
                          value={editColor}
                          onChange={(e) => setEditColor(e.target.value)}
                          className="h-8 w-10 rounded border p-0.5 cursor-pointer"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block size-3 rounded-full shrink-0"
                          style={{ backgroundColor: cat.color || "#3b82f6" }}
                        />
                        <span className="text-sm font-medium">{cat.name}</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <code className="text-xs text-muted-foreground">{cat.slug}</code>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">
                      {cat._count?.posts || 0}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {editingId === cat.id ? (
                        <>
                          <Button
                            variant="default"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => handleUpdate(cat.id)}
                            disabled={isPending}
                          >
                            Sačuvaj
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7"
                            onClick={() => setEditingId(null)}
                          >
                            Odustani
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => startEditing(cat)}
                          >
                            <Icon name="edit" className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(cat.id, cat.name)}
                          >
                            <Icon name="delete" className="size-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
