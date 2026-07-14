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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { manageCitiesAction } from "@/app/(server)/actions/cities";

interface CityRow {
  id: string;
  name: string;
  slug: string;
}

export function CitiesManager({ cities }: { cities: CityRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // New city form
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<CityRow | null>(null);

  const handleCreate = useCallback(() => {
    if (!newName.trim() || !newSlug.trim()) return;
    startTransition(async () => {
      const result = await manageCitiesAction([{ name: newName.trim(), slug: newSlug.trim() }]);
      if (result.success) {
        toast.success("Grad kreiran");
        setNewName("");
        setNewSlug("");
        router.refresh();
      } else {
        toast.error(result.error || "Greška pri kreiranju grada");
      }
    });
  }, [newName, newSlug, router, startTransition]);

  const autoSlugNew = useCallback(
    (name: string) => {
      setNewName(name);
      if (!newSlug || newSlug === slugify(newName, { lower: true, strict: true })) {
        setNewSlug(slugify(name, { lower: true, strict: true }));
      }
    },
    [newSlug, newName],
  );

  const handleUpdate = useCallback(
    (id: string) => {
      if (!editName.trim() || !editSlug.trim()) return;
      startTransition(async () => {
        const result = await manageCitiesAction([
          { id, name: editName.trim(), slug: editSlug.trim() },
        ]);
        if (result.success) {
          toast.success("Grad ažuriran");
          setEditingId(null);
          router.refresh();
        } else {
          toast.error(result.error || "Greška pri ažuriranju grada");
        }
      });
    },
    [editName, editSlug, router, startTransition],
  );

  const handleDelete = useCallback(
    (city: CityRow) => {
      startTransition(async () => {
        const result = await manageCitiesAction([
          { id: city.id, name: city.name, slug: city.slug, isDeleted: true },
        ]);
        if (result.success) {
          toast.success(`Grad "${city.name}" obrisan`);
          setDeleteTarget(null);
          router.refresh();
        } else {
          toast.error(result.error || "Greška pri brisanju grada");
        }
      });
    },
    [router, startTransition],
  );

  const startEditing = useCallback((city: CityRow) => {
    setEditingId(city.id);
    setEditName(city.name);
    setEditSlug(city.slug);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Gradovi</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Upravljajte gradovima koji se koriste za objekte i pretragu.
        </p>
      </div>

      {/* Dodaj grad */}
      <div className="rounded-lg border p-4">
        <h3 className="mb-3 text-sm font-semibold">Dodaj grad</h3>
        <div className="flex items-end gap-3">
          <div className="max-w-xs flex-1 space-y-1.5">
            <label className="text-muted-foreground text-xs">Ime</label>
            <Input
              value={newName}
              onChange={(e) => autoSlugNew(e.target.value)}
              placeholder="Naziv grada"
              className="h-9"
            />
          </div>
          <div className="max-w-xs flex-1 space-y-1.5">
            <label className="text-muted-foreground text-xs">Slug</label>
            <Input
              value={newSlug}
              onChange={(e) => setNewSlug(e.target.value)}
              placeholder="slug-grada"
              className="h-9"
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
          </div>
          <Button
            onClick={handleCreate}
            disabled={isPending || !newName.trim() || !newSlug.trim()}
            className="h-9"
          >
            <Icon name="add" className="mr-1 size-4" />
            Dodaj
          </Button>
        </div>
      </div>

      {/* Lista gradova */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ime</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead className="w-[140px]">Akcije</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cities.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-muted-foreground h-24 text-center text-sm">
                  Nema gradova.
                </TableCell>
              </TableRow>
            ) : (
              cities.map((city) => (
                <TableRow key={city.id}>
                  <TableCell>
                    {editingId === city.id ? (
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="h-8 w-48"
                      />
                    ) : (
                      <span className="text-sm font-medium">{city.name}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === city.id ? (
                      <Input
                        value={editSlug}
                        onChange={(e) => setEditSlug(e.target.value)}
                        className="h-8 w-48"
                        onKeyDown={(e) => e.key === "Enter" && handleUpdate(city.id)}
                      />
                    ) : (
                      <code className="text-muted-foreground text-xs">{city.slug}</code>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {editingId === city.id ? (
                        <>
                          <Button
                            variant="default"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => handleUpdate(city.id)}
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
                            aria-label={`Izmeni grad ${city.name}`}
                            onClick={() => startEditing(city)}
                          >
                            <Icon name="edit" className="size-3.5" />
                          </Button>
                          <AlertDialog
                            open={deleteTarget?.id === city.id}
                            onOpenChange={(open) => {
                              if (!open) setDeleteTarget(null);
                            }}
                          >
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive h-7 w-7 p-0"
                                aria-label={`Obriši grad ${city.name}`}
                                onClick={() => setDeleteTarget(city)}
                              >
                                <Icon name="delete" className="size-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Obriši grad</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Da li ste sigurni da želite da obrišete grad &quot;{city.name}
                                  &quot;? Ova radnja je nepovratna.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Odustani</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  onClick={() => handleDelete(city)}
                                  disabled={isPending}
                                >
                                  {isPending ? "Brisanje..." : "Obriši"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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
