"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { useAction } from "@/hooks/use-action";
import { z } from "zod";
import { createApiKeyAction, deleteApiKeyAction } from "@/server/actions/api-keys";

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  createdAt: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
}

export function ApiKeysClient({ initialKeys }: { initialKeys: ApiKey[] }) {
  const [keys, setKeys] = useState<ApiKey[]>(initialKeys);
  const [newKeyName, setNewKeyName] = useState("");
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [hasCopied, setHasCopied] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [keyToDelete, setKeyToDelete] = useState<string | null>(null);

  const { execute: handleCreate, isPending: isCreating } = useAction(
    (name: string) => createApiKeyAction(name),
    {
      successMessage: "API key generated",
      refresh: false,
      onSuccess: (result) => {
        const createApiKeyResponseSchema = z.object({
          key: z.string().optional(),
        });
        const parsed = createApiKeyResponseSchema.safeParse(result.data);
        if (parsed.success && parsed.data.key) {
          setGeneratedKey(parsed.data.key);
        }
      },
    },
  );

  const handleDelete = async (id: string) => {
    const result = await deleteApiKeyAction(id);
    if (result.success) {
      setKeys((prev) => prev.filter((k) => k.id !== id));
      toast.success("API key revoked");
    } else {
      toast.error(result.error || "Failed to revoke API key");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setHasCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setHasCopied(false), 2000);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground text-3xl font-black tracking-tight uppercase">
            API ključevi
          </h1>
          <p className="text-muted-foreground mt-1 font-mono text-sm uppercase opacity-70">
            Manage headless access for Paperclip Facility Administrator agents
          </p>
        </div>

        <Dialog
          onOpenChange={(open) => {
            if (!open) {
              setGeneratedKey(null);
              setHasCopied(false);
            }
          }}
        >
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-black tracking-tight uppercase">
              <Icon name="add" className="mr-2 text-[16px]" />
              Novi ključ
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-background border-border text-foreground">
            <DialogHeader>
              <DialogTitle className="text-xl font-black tracking-tight uppercase">
                Generiši API ključ
              </DialogTitle>
              <DialogDescription className="text-muted-foreground font-mono text-xs">
                Dajte ime vašem API ključu radi identifikacije.
              </DialogDescription>
            </DialogHeader>

            {!generatedKey ? (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs font-black uppercase opacity-70">
                    Naziv ključa
                  </Label>
                  <Input
                    id="name"
                    placeholder="e.g. Facility Admin Agent"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    className="bg-muted/30 border-border focus:border-ring"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4 py-4">
                <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
                  <Icon name="error" className="mt-0.5 shrink-0 text-[20px] text-amber-500" />
                  <div className="space-y-1">
                    <p className="text-xs font-black text-amber-500 uppercase">Upozorenje</p>
                    <p className="font-mono text-[10px] leading-relaxed text-amber-500/80">
                      Kopirajte ključ odmah. Iz bezbednosnih razloga, nećete moći ponovo da ga
                      vidite.
                    </p>
                  </div>
                </div>
                <div className="group relative">
                  <Input
                    value={generatedKey}
                    readOnly
                    className="bg-muted/30 border-border focus:border-ring pr-10 font-mono text-xs focus:ring-0"
                  />
                  <button
                    onClick={() => copyToClipboard(generatedKey)}
                    className="hover:bg-muted/50 text-muted-foreground absolute top-1.5 right-2 rounded-md p-1.5 transition-colors"
                  >
                    {hasCopied ? (
                      <Icon name="check" className="text-[16px] text-emerald-500" />
                    ) : (
                      <Icon name="content_copy" className="text-[16px]" />
                    )}
                  </button>
                </div>
              </div>
            )}

            <DialogFooter>
              {!generatedKey ? (
                <Button
                  onClick={() => {
                    if (newKeyName) handleCreate(newKeyName);
                  }}
                  disabled={isCreating || !newKeyName}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground w-full font-black uppercase"
                >
                  {isCreating ? (
                    <Icon name="progress_activity" className="animate-spin text-[16px]" />
                  ) : (
                    "Generiši ključ"
                  )}
                </Button>
              ) : (
                <Button
                  onClick={() => setGeneratedKey(null)}
                  className="bg-muted/30 hover:bg-muted/50 text-foreground w-full font-black uppercase"
                >
                  Gotovo
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-background/40 border-border/50 overflow-hidden shadow-2xl backdrop-blur-xl">
        <CardHeader className="border-border/50 border-b">
          <CardTitle className="flex items-center gap-2 text-lg font-black tracking-tight uppercase">
            <Icon name="key" className="text-primary text-[20px]" />
            Aktivni API ključevi
          </CardTitle>
          <CardDescription className="font-mono text-xs uppercase opacity-50">
            Ključevi koji trenutno imaju pristup REST backend-u
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/10">
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="text-[10px] font-black uppercase opacity-40">Naziv</TableHead>
                <TableHead className="text-[10px] font-black uppercase opacity-40">
                  Prefiks
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase opacity-40">
                  Status
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase opacity-40">
                  Poslednji put
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase opacity-40">
                  Kreiran
                </TableHead>
                <TableHead className="text-right text-[10px] font-black uppercase opacity-40">
                  Akcije
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {keys.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-muted-foreground h-32 text-center font-mono text-xs uppercase opacity-40"
                  >
                    Još uvek nema generisanih ključeva
                  </TableCell>
                </TableRow>
              ) : (
                keys.map((key) => (
                  <TableRow
                    key={key.id}
                    className="border-border/50 group hover:bg-muted/10 transition-colors"
                  >
                    <TableCell className="text-foreground text-sm font-bold">{key.name}</TableCell>
                    <TableCell>
                      <code className="bg-muted/30 border-border text-primary rounded border px-1.5 py-0.5 font-mono text-[10px]">
                        {key.prefix}...
                      </code>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="border-emerald-500/30 bg-emerald-500/5 text-[9px] font-black tracking-tighter text-emerald-500 uppercase"
                      >
                        Aktivan
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-[10px] opacity-60">
                      {key.lastUsedAt ? format(new Date(key.lastUsedAt), "MMM d, HH:mm") : "Nikad"}
                    </TableCell>
                    <TableCell className="font-mono text-[10px] opacity-60">
                      {format(new Date(key.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-400 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-400/10 hover:text-red-300"
                        onClick={() => {
                          setKeyToDelete(key.id);
                          setIsDeleteDialogOpen(true);
                        }}
                      >
                        <Icon name="delete" className="text-[16px]" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-background border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-xl font-black tracking-tight text-red-500 uppercase">
              Povuci API ključ
            </DialogTitle>
            <DialogDescription className="text-muted-foreground font-mono text-xs leading-relaxed">
              Da li ste sigurni? Ovo će odmah ukinuti sav pristup za ovaj ključ. Ova radnja je
              nepovratna.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="ghost"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="text-xs font-black uppercase"
            >
              Otkaži
            </Button>
            <Button
              onClick={() => {
                if (keyToDelete) {
                  handleDelete(keyToDelete);
                  setIsDeleteDialogOpen(false);
                  setKeyToDelete(null);
                }
              }}
              className="text-foreground bg-red-600 text-xs font-black uppercase hover:bg-red-700"
            >
              Povuci ključ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
