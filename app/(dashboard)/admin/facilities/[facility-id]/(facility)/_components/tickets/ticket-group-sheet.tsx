"use client"
import { Icon } from "@/components/ui/Icon";

import * as React from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle,
  SheetFooter
} from "@/components/ui/sheet"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
// Icons temporarily removed to debug build
import { 
  ticketGroupSchema, 
  TicketGroupValues 
} from "@/server/lib/validations/ticket"
import { 
  upsertTicketGroupAction 
} from "@/server/actions/tickets"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { DayType, TimeSlot } from "@prisma/client"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

interface TicketGroupSheetProps {
  facilityId: string
  group: any | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TicketGroupSheet({ facilityId, group, open, onOpenChange }: TicketGroupSheetProps) {
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()

  const form = useForm<TicketGroupValues>({
    resolver: zodResolver(ticketGroupSchema),
    defaultValues: {
      id: group?.id || undefined,
      facilityId,
      title: group?.title || "",
      description: group?.description || "",
      slug: group?.slug || "",
      isActive: group?.isActive ?? true,
      displayOrder: group?.displayOrder ?? 0,
      tickets: (group?.tickets || group?.tiers)?.map((t: any) => ({
        id: t.id,
        title: t.title || t.label || "Standard",
        label: t.title || t.label || "Standard",
        type: t.type || "ADULT",
        validityType: t.validityType || (t.isSeasonPass ? "SUMMER_SEASON" : "FIXED_DATE"),
        price: t.price,
        originalPrice: t.originalPrice,
        dayType: t.dayType || DayType.ALL,
        timeSlot: t.timeSlot || TimeSlot.FULL_DAY,
        minPeople: t.minPeople || 1,
        maxPeople: t.maxPeople,
        isSeasonPass: t.isSeasonPass || false,
        requiresIdentity: t.requiresIdentity || false,
        requiresPhoto: t.requiresPhoto || false,
        isActive: t.isActive ?? true,
        displayOrder: t.displayOrder ?? 0,
      })) || [{
        title: "Standard",
        label: "Standard",
        type: "ADULT",
        validityType: "FIXED_DATE",
        price: 0,
        dayType: DayType.ALL,
        timeSlot: TimeSlot.FULL_DAY,
        minPeople: 1,
        isSeasonPass: false,
        isActive: true,
        displayOrder: 0,
      }]
    }
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "tickets"
  })

  async function onSubmit(data: TicketGroupValues) {
    startTransition(async () => {
      try {
        const result = await upsertTicketGroupAction(data)
        if (result.success) {
          toast.success(group ? "Grupa uspešno ažurirana" : "Grupa uspešno kreirana")
          onOpenChange(false)
          router.refresh()
        } else {
          toast.error(result.error || "Došlo je do greške")
        }
      } catch (error) {
        toast.error("Došlo je do greške pri čuvanju")
      }
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[700px] bg-slate-950 border-white/10 p-0 flex flex-col overflow-hidden">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="h-full flex flex-col overflow-hidden">
            <div 
              className="flex-1 overflow-y-auto px-6 py-5 space-y-5"
              style={{ 
                scrollbarWidth: 'thin', 
                scrollbarColor: 'rgba(255,255,255,0.15) transparent' 
              }}
            >
              <SheetHeader className="space-y-1">
                <div className="flex items-center gap-2 text-cyan-400">
                  <Icon name="dashboard" className="text-[16px]" />
                  <Badge variant="outline" className="bg-white/5 border-white/10 text-[8px] font-black uppercase tracking-widest text-muted-foreground py-0.5 px-1.5 rounded">
                    {group ? "Edit Mode" : "Creation Mode"}
                  </Badge>
                </div>
                <SheetTitle className="text-xl font-black italic tracking-tighter uppercase text-white">
                  {group ? "Uredi Grupu" : "Nova Grupa Ulaznica"}
                </SheetTitle>
                <SheetDescription className="text-[11px] text-slate-400 font-medium italic">
                  Konfigurišite logičku grupu i njene cenovne nivoe.
                </SheetDescription>
              </SheetHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-sm font-medium text-slate-300">Naziv Grupe</FormLabel>
                      <FormControl>
                        <Input placeholder="npr. Dnevne Ulaznice" className="h-11 bg-white/5 border-white/10 focus:border-cyan-500/50 transition-all font-bold text-sm rounded-xl" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-sm font-medium text-slate-300">URL Putanja (Slug)</FormLabel>
                      <FormControl>
                        <Input placeholder="npr. dnevne-ulaznice" className="h-11 bg-white/5 border-white/10 focus:border-cyan-500/50 transition-all font-mono text-sm rounded-xl" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2 space-y-2">
                      <FormLabel className="text-sm font-medium text-slate-300">Opis (Opciono)</FormLabel>
                      <FormControl>
                        <Input placeholder="Kratak opis koji se vidi na sajtu..." className="h-11 bg-white/5 border-white/10 focus:border-cyan-500/50 transition-all text-sm rounded-xl" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.02] p-4 md:col-span-2">
                      <div className="space-y-1">
                        <FormLabel className="text-sm font-bold text-slate-200">Status Grupe</FormLabel>
                        <p className="text-xs text-slate-500">Da li je ova grupa trenutno vidljiva posetiocima?</p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-6 pt-6 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="text-lg font-black text-white italic tracking-tight uppercase">Varijante u Grupi</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">Definišite cenovne nivoe za ovu kategoriju</p>
                  </div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => append({ 
                      title: "",
                      label: "", 
                      type: "ADULT",
                      validityType: "FIXED_DATE",
                      price: 0, 
                      dayType: DayType.ALL, 
                      timeSlot: TimeSlot.FULL_DAY, 
                      minPeople: 1, 
                      isSeasonPass: false, 
                      isActive: true,
                      displayOrder: fields.length 
                    })}
                    className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 h-9 px-4 rounded-xl font-black uppercase text-[10px] tracking-widest"
                  >
                    <Icon name="add" className="text-[16px] mr-2" /> Dodaj Varijantu
                  </Button>
                </div>

                  <div className="space-y-4">
                    {fields.map((field, index) => (
                      <div key={field.id} className="relative group/tier p-6 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all space-y-6">
                        <div className="flex items-start justify-between gap-4">
                           <div className="flex items-center gap-3 flex-1">
                              <div className="cursor-grab active:cursor-grabbing p-1.5 text-slate-600 hover:text-cyan-400 transition-colors">
                                <Icon name="drag_indicator" className="text-[20px]" />
                              </div>
                              <FormField
                                control={form.control}
                                name={`tickets.${index}.title`}
                                render={({ field }) => (
                                  <FormItem className="flex-1 space-y-0.5">
                                    <FormControl>
                                      <Input placeholder="npr. Odrasli / Deca / Porodična" className="h-10 bg-transparent border-none focus-visible:ring-0 text-lg font-black uppercase italic tracking-tight p-0 text-white" {...field} value={field.value || ""} />
                                    </FormControl>
                                    <FormMessage className="text-[10px]" />
                                  </FormItem>
                                )}
                              />
                           </div>
                           <Button 
                             type="button" 
                             variant="ghost" 
                             size="icon" 
                             className="text-slate-600 hover:text-rose-500 h-9 w-9 rounded-xl hover:bg-rose-500/5 transition-all"
                             onClick={() => remove(index)}
                           >
                             <Icon name="delete" className="text-[16px]" />
                           </Button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                           <FormField
                              control={form.control}
                              name={`tickets.${index}.price`}
                              render={({ field }) => (
                                <FormItem className="space-y-2">
                                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500">Cena (RSD)</FormLabel>
                                  <FormControl>
                                    <Input type="number" className="h-10 bg-slate-950/60 border-white/10 font-bold text-sm rounded-lg" {...field} value={field.value as string} onChange={e => field.onChange(Number(e.target.value))} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                           />
                           <FormField
                              control={form.control}
                              name={`tickets.${index}.originalPrice`}
                              render={({ field }) => (
                                <FormItem className="space-y-2">
                                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500">Gate Cena</FormLabel>
                                  <FormControl>
                                    <Input type="number" className="h-10 bg-slate-950/60 border-white/10 text-sm rounded-lg opacity-60" {...field} value={String(field.value ?? "")} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : null)} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                           />
                           <FormField
                              control={form.control}
                              name={`tickets.${index}.dayType`}
                              render={({ field }) => (
                                <FormItem className="space-y-2">
                                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500">Dan</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                                    <FormControl>
                                      <SelectTrigger className="h-10 bg-slate-950/60 border-white/10 text-[10px] font-bold uppercase rounded-lg">
                                        <SelectValue placeholder="Izaberi" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="bg-slate-950 border-white/10">
                                      {Object.values(DayType).map(v => (
                                        <SelectItem key={v} value={v} className="text-[10px] font-bold uppercase">{v.replace('_', ' ')}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </FormItem>
                              )}
                           />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                           <FormField
                              control={form.control}
                              name={`tickets.${index}.timeSlot`}
                              render={({ field }) => (
                                <FormItem className="space-y-2">
                                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500">Termin</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                                    <FormControl>
                                      <SelectTrigger className="h-10 bg-slate-950/60 border-white/10 text-[10px] font-bold uppercase rounded-lg">
                                        <SelectValue placeholder="Izaberi" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="bg-slate-950 border-white/10">
                                      {Object.values(TimeSlot).map(v => (
                                        <SelectItem key={v} value={v} className="text-[10px] font-bold uppercase">{v.replace('_', ' ')}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </FormItem>
                              )}
                           />
                           <FormField
                              control={form.control}
                              name={`tickets.${index}.minPeople`}
                              render={({ field }) => (
                                <FormItem className="space-y-2">
                                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500">Min. Osoba</FormLabel>
                                  <FormControl>
                                    <Input type="number" className="h-10 bg-slate-950/60 border-white/10 text-sm rounded-lg" {...field} value={field.value as string} onChange={e => field.onChange(Number(e.target.value))} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                           />
                           <FormField
                              control={form.control}
                              name={`tickets.${index}.maxPeople`}
                              render={({ field }) => (
                                <FormItem className="space-y-2">
                                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500">Max. Osoba</FormLabel>
                                  <FormControl>
                                    <Input type="number" className="h-10 bg-slate-950/60 border-white/10 text-sm rounded-lg" {...field} value={String(field.value ?? "")} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : null)} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                           />
                        </div>

                        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-4 border-t border-white/5">
                           <FormField
                              control={form.control}
                              name={`tickets.${index}.isSeasonPass`}
                              render={({ field }) => (
                                <FormItem className="flex items-center gap-3 space-y-0">
                                  <FormControl>
                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                  </FormControl>
                                  <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Sezonska</FormLabel>
                                </FormItem>
                              )}
                           />
                           <FormField
                              control={form.control}
                              name={`tickets.${index}.requiresIdentity`}
                              render={({ field }) => (
                                <FormItem className="flex items-center gap-3 space-y-0">
                                  <FormControl>
                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                  </FormControl>
                                  <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-slate-400">ID Obavezan</FormLabel>
                                </FormItem>
                              )}
                           />
                           <FormField
                              control={form.control}
                              name={`tickets.${index}.isActive`}
                              render={({ field }) => (
                                <FormItem className="flex items-center gap-3 space-y-0 ml-auto bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500">Aktivna</FormLabel>
                                  <FormControl>
                                    <Switch checked={field.value} onCheckedChange={field.onChange} className="scale-90" />
                                  </FormControl>
                                </FormItem>
                              )}
                           />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            <div className="relative border-t border-white/10 p-6 bg-slate-950 flex-shrink-0 flex justify-end gap-4 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
               <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="h-11 px-8 rounded-xl font-bold uppercase text-[10px] tracking-widest text-slate-500 hover:text-white transition-all">
                  Otkaži
               </Button>
               <Button 
                type="submit" 
                disabled={isPending}
                className="h-11 px-10 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black uppercase text-[10px] tracking-widest shadow-2xl shadow-cyan-500/20 transition-all"
               >
                  {isPending ? (
                    <Icon name="progress_activity" className="text-[16px] animate-spin mr-2" />
                  ) : (
                    <Icon name="save" className="text-[16px] mr-2" />
                  )}
                  Sačuvaj Grupu
               </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}
