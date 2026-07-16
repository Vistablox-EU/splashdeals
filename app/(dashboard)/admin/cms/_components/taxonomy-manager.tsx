"use client";

import { useCallback, useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import slugify from "slugify";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export type TaxonomyItem = {
  id: string;
  name: string;
  slug: string;
  color?: string | null;
  postCount?: number;
  _count?: { posts: number };
};

export type TaxonomyManagerProps = {
  kind: "category" | "tag";
  title: string;
  description: string;
  items: TaxonomyItem[];
  createItem: (data: {
    name: string;
    slug: string;
    color?: string;
    description?: string;
    displayOrder?: number;
  }) => Promise<{ success: boolean; error?: string }>;
  updateItem: (
    id: string,
    data: {
      name: string;
      slug: string;
      color?: string;
      description?: string;
      displayOrder?: number;
    },
  ) => Promise<{ success: boolean; error?: string }>;
  deleteItem: (id: string) => Promise<{ success: boolean; error?: string }>;
  showColor?: boolean;
};

export function TaxonomyManager({
  kind,
  title,
  description,
  items,
  createItem,
  updateItem,
  deleteItem,
  showColor = false,
}: TaxonomyManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#3b82f6");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("#3b82f6");

  const label = kind === "category" ? "kategorija" : "tag";

  const handleCreate = useCallback(() => {
    if (!newName.trim()) return;
    const slug = slugify(newName, { lower: true, strict: true });
    startTransition(async () => {
      const result = await createItem({
        name: newName.trim(),
        slug,
        ...(showColor ? { color: newColor, description: "", displayOrder: 0 } : {}),
      });
      if (result.success) {
        toast.success(kind === "category" ? "Kategorija kreirana" : "Tag kreiran");
        setNewName("");
        router.refresh();
      } else {
        toast.error(result.error || "Greška");
      }
    });
  }, [newName, newColor, createItem, kind, router, showColor, startTransition]);

  const handleUpdate = useCallback(
    (id: string) => {
      if (!editName.trim()) return;
      const slug = slugify(editName, { lower: true, strict: true });
      startTransition(async () => {
        const result = await updateItem(id, {
          name: editName.trim(),
          slug,
          ...(showColor ? { color: editColor, description: "", displayOrder: 0 } : {}),
        });
        if (result.success) {
          toast.success(kind === "category" ? "Kategorija ažurirana" : "Tag ažuriran");
          setEditingId(null);
          router.refresh();
        } else {
          toast.error(result.error || "Greška");
        }
      });
    },
    [editName, editColor, updateItem, kind, router, showColor, startTransition],
  );

  const handleDelete = useCallback(
    (id: string, name: string) => {
      if (!confirm(`Da li ste sigurni da želite da obrišete ${label} "${name}"?`)) return;
      startTransition(async () => {
        const result = await deleteItem(id);
        if (result.success) {
          toast.success(kind === "category" ? "Kategorija obrisana" : "Tag obrisan");
          router.refresh();
        } else {
          toast.error(result.error || "Greška");
        }
      });
    },
    [deleteItem, kind, label, router, startTransition],
  );

  const startEditing = useCallback((item: TaxonomyItem) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditColor(item.color || "#3b82f6");
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{description}</p>
      </div>

      <div className="rounded-lg border p-4">
        <h3 className="mb-3 text-sm font-semibold">
          {kind === "category" ? "Nova kategorija" : "Novi tag"}
        </h3>
        <div className="flex flex-wrap items-end gap-3">
          <div className="max-w-xs min-w-[12rem] flex-1 space-y-1.5">
            <label className="text-muted-foreground text-xs">Naziv</label>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={kind === "category" ? "Naziv kategorije" : "Naziv taga"}
              className="h-9"
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
          </div>
          {showColor && (
            <div className="space-y-1.5">
              <label className="text-muted-foreground text-xs">Boja</label>
              <Input
                type="color"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                className="h-9 w-14 p-1"
              />
            </div>
          )}
          <Button onClick={handleCreate} disabled={isPending || !newName.trim()}>
            <Icon name="add" className="size-4" />
            Dodaj
          </Button>
        </div>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              {showColor && <TableHead className="w-12">Boja</TableHead>}
              <TableHead>Naziv</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead className="w-24">Objave</TableHead>
              <TableHead className="w-28 text-right">Akcije</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={showColor ? 5 : 4}
                  className="text-muted-foreground h-24 text-center text-sm"
                >
                  Nema stavki.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => {
                const count = item.postCount ?? item._count?.posts ?? 0;
                const editing = editingId === item.id;
                return (
                  <TableRow key={item.id}>
                    {showColor && (
                      <TableCell>
                        {editing ? (
                          <Input
                            type="color"
                            value={editColor}
                            onChange={(e) => setEditColor(e.target.value)}
                            className="h-8 w-12 p-1"
                          />
                        ) : (
                          <span
                            className="inline-block size-4 rounded-full border"
                            style={{ backgroundColor: item.color || "#94a3b8" }}
                          />
                        )}
                      </TableCell>
                    )}
                    <TableCell>
                      {editing ? (
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="h-8"
                          onKeyDown={(e) => e.key === "Enter" && handleUpdate(item.id)}
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.name}</span>
                          <Badge variant="outline" className="text-[10px]">
                            {item.slug}
                          </Badge>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">{item.slug}</TableCell>
                    <TableCell>{count}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        {editing ? (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              aria-label="Sačuvaj"
                              onClick={() => handleUpdate(item.id)}
                              disabled={isPending}
                            >
                              <Icon name="check" className="size-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              aria-label="Otkaži"
                              onClick={() => setEditingId(null)}
                            >
                              <Icon name="close" className="size-3.5" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              aria-label={`Izmeni ${label} ${item.name}`}
                              onClick={() => startEditing(item)}
                            >
                              <Icon name="edit" className="size-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive h-7 w-7 p-0"
                              aria-label={`Obriši ${label} ${item.name}`}
                              onClick={() => handleDelete(item.id, item.name)}
                            >
                              <Icon name="delete" className="size-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
