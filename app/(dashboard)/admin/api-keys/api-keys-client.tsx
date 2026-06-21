"use client"

import { useState } from "react"
import { Icon } from "@/components/ui/Icon"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"
import { format } from "date-fns"
import { useAction } from "@/hooks/use-action"
import { createApiKeyAction, deleteApiKeyAction } from "@/server/actions/api-keys"

interface ApiKey {
  id: string
  name: string
  prefix: string
  createdAt: string
  lastUsedAt: string | null
  expiresAt: string | null
}

export function ApiKeysClient({ initialKeys }: { initialKeys: ApiKey[] }) {
  const [keys] = useState<ApiKey[]>(initialKeys)
  const [newKeyName, setNewKeyName] = useState("")
  const [generatedKey, setGeneratedKey] = useState<string | null>(null)
  const [hasCopied, setHasCopied] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [keyToDelete, setKeyToDelete] = useState<string | null>(null)

  const { execute: handleCreate, isPending: isCreating } = useAction(
    (name: string) => createApiKeyAction(name),
    {
      successMessage: "API key generated",
      refresh: false,
      onSuccess: (result) => {
        const data = result.data as { key?: string } | undefined
        if (data?.key) {
          setGeneratedKey(data.key)
        }
      },
    }
  )

  const { execute: handleDelete } = useAction(
    (id: string) => deleteApiKeyAction(id),
    {
      successMessage: "API key revoked",
      refresh: true,
    }
  )

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setHasCopied(true)
    toast.success("Copied to clipboard")
    setTimeout(() => setHasCopied(false), 2000)
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground uppercase">API ključevi</h1>
          <p className="text-muted-foreground text-sm uppercase font-mono mt-1 opacity-70">
            Manage headless access for Paperclip Facility Administrator agents
          </p>
        </div>

        <Dialog onOpenChange={(open) => {
          if (!open) {
            setGeneratedKey(null)
            setHasCopied(false)
          }
        }}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-tight">
              <Icon name="add" className="mr-2 text-[16px]" />
              Novi ključ
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-background border-border text-foreground">
            <DialogHeader>
              <DialogTitle className="text-xl font-black uppercase tracking-tight">Generiši API ključ</DialogTitle>
              <DialogDescription className="text-muted-foreground font-mono text-xs">
                Dajte ime vašem API ključu radi identifikacije.
              </DialogDescription>
            </DialogHeader>

            {!generatedKey ? (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs font-black uppercase opacity-70">Naziv ključa</Label>
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
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
                  <Icon name="error" className="text-[20px] text-amber-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-black text-amber-500 uppercase">Upozorenje</p>
                    <p className="text-[10px] text-amber-500/80 font-mono leading-relaxed">
                      Kopirajte ključ odmah. Iz bezbednosnih razloga, nećete moći ponovo da ga vidite.
                    </p>
                  </div>
                </div>
                <div className="relative group">
                  <Input 
                    value={generatedKey}
                    readOnly
                    className="bg-muted/30 border-border font-mono text-xs pr-10 focus:ring-0 focus:border-ring"
                  />
                  <button 
                    onClick={() => copyToClipboard(generatedKey)}
                    className="absolute right-2 top-1.5 p-1.5 rounded-md hover:bg-muted/50 text-muted-foreground transition-colors"
                  >
                    {hasCopied ? <Icon name="check" className="text-[16px] text-emerald-500" /> : <Icon name="content_copy" className="text-[16px]" />}
                  </button>
                </div>
              </div>
            )}

            <DialogFooter>
              {!generatedKey ? (
                <Button 
                  onClick={() => {
                    if (newKeyName) handleCreate(newKeyName)
                  }} 
                  disabled={isCreating || !newKeyName}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase"
                >
                  {isCreating ? <Icon name="progress_activity" className="text-[16px] animate-spin" /> : "Generiši ključ"}
                </Button>
              ) : (
                <Button 
                  onClick={() => setGeneratedKey(null)}
                  className="w-full bg-muted/30 hover:bg-muted/50 text-foreground font-black uppercase"
                >
                  Gotovo
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-background/40 border-border/50 backdrop-blur-xl overflow-hidden shadow-2xl">
        <CardHeader className="border-b border-border/50">
          <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
            <Icon name="key" className="text-[20px] text-primary" />
            Aktivni API ključevi
          </CardTitle>
          <CardDescription className="text-xs font-mono opacity-50 uppercase">
            Ključevi koji trenutno imaju pristup REST backend-u
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/10">
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="text-[10px] font-black uppercase opacity-40">Naziv</TableHead>
                <TableHead className="text-[10px] font-black uppercase opacity-40">Prefiks</TableHead>
                <TableHead className="text-[10px] font-black uppercase opacity-40">Status</TableHead>
                <TableHead className="text-[10px] font-black uppercase opacity-40">Poslednji put</TableHead>
                <TableHead className="text-[10px] font-black uppercase opacity-40">Kreiran</TableHead>
                <TableHead className="text-right text-[10px] font-black uppercase opacity-40">Akcije</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {keys.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground font-mono text-xs uppercase opacity-40">
                    Još uvek nema generisanih ključeva
                  </TableCell>
                </TableRow>
              ) : (
                keys.map((key) => (
                  <TableRow key={key.id} className="border-border/50 group transition-colors hover:bg-muted/10">
                    <TableCell className="font-bold text-sm text-foreground">{key.name}</TableCell>
                    <TableCell>
                      <code className="text-[10px] px-1.5 py-0.5 rounded bg-muted/30 border border-border font-mono text-primary">
                        {key.prefix}...
                      </code>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[9px] font-black border-emerald-500/30 text-emerald-500 bg-emerald-500/5 uppercase tracking-tighter">
                        Aktivan
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[10px] font-mono opacity-60">
                      {key.lastUsedAt ? format(new Date(key.lastUsedAt), "MMM d, HH:mm") : "Nikad"}
                    </TableCell>
                    <TableCell className="text-[10px] font-mono opacity-60">
                      {format(new Date(key.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-400 hover:text-red-300 hover:bg-red-400/10 opacity-0 group-hover:opacity-100 transition-all"
                        onClick={() => {
                          setKeyToDelete(key.id)
                          setIsDeleteDialogOpen(true)
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
            <DialogTitle className="text-xl font-black uppercase tracking-tight text-red-500">Povuci API ključ</DialogTitle>
            <DialogDescription className="text-muted-foreground font-mono text-xs leading-relaxed">
              Da li ste sigurni? Ovo će odmah ukinuti sav pristup za ovaj ključ. Ova radnja je nepovratna.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setIsDeleteDialogOpen(false)} className="font-black uppercase text-xs">
              Otkaži
            </Button>
            <Button 
              onClick={() => {
                if (keyToDelete) {
                  handleDelete(keyToDelete)
                  setIsDeleteDialogOpen(false)
                  setKeyToDelete(null)
                }
              }} 
              className="bg-red-600 hover:bg-red-700 text-foreground font-black uppercase text-xs"
            >
              Povuci ključ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
