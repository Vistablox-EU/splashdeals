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
import { createTagAction, updateTagAction, deleteTagAction } from "@/app/(server)/actions/cms";

interface TagRow {
  id: string;
  name: string;
  slug: string;
  postCount: number;
}

export function TagsManager({ tags }: { tags: Array<Record<string, unknown>> }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const handleCreate = useCallback(() => {
    if (!newName.trim()) return;
    const slug = slugify(newName, { lower: true, strict: true });
    startTransition(async () => {
      const result = await createTagAction({ name: newName.trim(), slug });
      if (result.success) {
        toast.success("Tag kreiran");
        setNewName("");
        router.refresh();
      } else {
        toast.error(result.error || "Greška");
      }
    });
  }, [newName, router, startTransition]);

  const handleUpdate = useCallback(
    (id: string) => {
      if (!editName.trim()) return;
      const slug = slugify(editName, { lower: true, strict: true });
      startTransition(async () => {
        const result = await updateTagAction(id, { name: editName.trim(), slug });
        if (result.success) {
          toast.success("Tag ažuriran");
          setEditingId(null);
          router.refresh();
        } else {
          toast.error(result.error || "Greška");
        }
      });
    },
    [editName, router, startTransition],
  );

  const handleDelete = useCallback(
    (id: string, name: string) => {
      if (!confirm(`Da li ste sigurni da želite da obrišete tag "${name}"?`)) return;
      startTransition(async () => {
        const result = await deleteTagAction(id);
        if (result.success) {
          toast.success("Tag obrisan");
          router.refresh();
        } else {
          toast.error(result.error || "Greška");
        }
      });
    },
    [router, startTransition],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tagovi</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Dodaj tagove za blog objave (samo SUPER_ADMIN).
        </p>
      </div>

      {/* Novi tag */}
      <div className="rounded-lg border p-4">
        <h3 className="mb-3 text-sm font-semibold">Novi tag</h3>
        <div className="flex items-end gap-3">
          <div className="max-w-xs flex-1 space-y-1.5">
            <label className="text-muted-foreground text-xs">Naziv</label>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Naziv taga"
              className="h-9"
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
          </div>
          <Button onClick={handleCreate} disabled={isPending || !newName.trim()} className="h-9">
            <Icon name="add" className="mr-1 size-4" />
            Dodaj
          </Button>
        </div>
      </div>

      {/* Lista tagova */}
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
            {(tags as unknown as TagRow[]).length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground h-24 text-center text-sm">
                  Nema tagova.
                </TableCell>
              </TableRow>
            ) : (
              (tags as unknown as TagRow[]).map((tag) => (
                <TableRow key={tag.id}>
                  <TableCell>
                    {editingId === tag.id ? (
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="h-8 w-48"
                        onKeyDown={(e) => e.key === "Enter" && handleUpdate(tag.id)}
                      />
                    ) : (
                      <span className="text-sm font-medium">{tag.name}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <code className="text-muted-foreground text-xs">{tag.slug}</code>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">
                      {tag.postCount ?? 0}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {editingId === tag.id ? (
                        <>
                          <Button
                            variant="default"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => handleUpdate(tag.id)}
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
                            onClick={() => {
                              setEditingId(tag.id);
                              setEditName(tag.name);
                            }}
                          >
                            <Icon name="edit" className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive h-7 w-7 p-0"
                            onClick={() => handleDelete(tag.id, tag.name)}
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
  );
}
