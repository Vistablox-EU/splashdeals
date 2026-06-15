"use client"
import { Icon } from "@/components/ui/Icon";

import * as React from "react"
import { useRouter } from "next/navigation"
import { useForm, ControllerRenderProps, SubmitHandler, type Resolver, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { TicketType, ValidityType, DayType, TimeSlot } from "@prisma/client"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Switch } from "@/components/ui/switch"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { upsertTicketAction, deleteTicketAction } from "@/app/(server)/actions/tickets"
import { TicketImageUpload } from "./ticket-image-upload"
import { toast } from "sonner"

import { ticketSchema, type TicketFormValues } from "@/lib/validations/ticket"

import { SerializedAdminTicket } from "./columns"

const TICKET_TYPE_LABELS: Record<TicketType, string> = {
  ADULT: "Odrasli",
  CHILD: "Deca",
  SENIOR: "Penzioneri",
  STUDENT: "Studenti",
  FAMILY_BUNDLE: "Porodični Paket",
  SUMMER_PASS: "Sezonska Propusnica",
}

interface TicketSheetProps {
  facilityId: string
  ticket?: SerializedAdminTicket | null
  open: boolean
  onOpenChange: (open: boolean) => void
  ticketGroups: { id: string; title: string }[]
  /** Pre-fills groupId when creating from within a group context */
  defaultGroupId?: string
}

export function TicketSheet({ facilityId, ticket, open, onOpenChange, ticketGroups, defaultGroupId }: TicketSheetProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const router = useRouter()

  const form = useForm<TicketFormValues>({
    resolver: zodResolver(ticketSchema) as Resolver<TicketFormValues>,
    defaultValues: {
      title: ticket?.titleSr || ticket?.title || "",
      type: ticket?.type || "ADULT",
      price: ticket ? Number(ticket.price) : 1200,
      originalPrice: ticket?.originalPrice ? Number(ticket.originalPrice) : null,
      currency: ticket?.currency || "RSD",
      validityType: ticket?.validityType || "FIXED_DATE",
      isActive: ticket?.isActive ?? true,
      isFeatured: ticket?.isFeatured ?? false,
      displayOrder: ticket?.displayOrder ?? 0,
      saleStart: ticket?.saleStart ? new Date(ticket.saleStart).toISOString().slice(0, 16) : "",
      saleEnd: ticket?.saleEnd ? new Date(ticket.saleEnd).toISOString().slice(0, 16) : "",
      description: ticket?.descriptionSr || ticket?.description || "",
      descriptionSr: ticket?.descriptionSr || ticket?.description || "",
      titleSr: ticket?.titleSr || ticket?.title || "",
      imageUrl: ticket?.imageUrl ?? "",
      finePrint: ticket?.finePrint ?? "",
      requiresIdentity: ticket?.requiresIdentity ?? false,
      requiresPhoto: ticket?.requiresPhoto ?? false,
      groupId: ticket?.groupId || defaultGroupId || "none",
      dayType: ticket?.dayType || DayType.ALL,
      timeSlot: ticket?.timeSlot || TimeSlot.FULL_DAY,
      minPeople: ticket?.minPeople || 1,
      maxPeople: ticket?.maxPeople || null,
      slug: ticket?.slug || "",
      isSeasonPass: ticket?.isSeasonPass ?? false,
    },
  })

  
  const currency = useWatch({
    control: form.control,
    name: "currency",
  })
  
  const validityType = useWatch({
    control: form.control,
    name: "validityType",
  })

  const imageUrl = useWatch({
    control: form.control,
    name: "imageUrl",
  })

  // Sync form internal state when the "ticket" prop changes for editing
  React.useEffect(() => {
    if (ticket) {
      form.reset({
        title: ticket.titleSr || ticket.title || "",
        type: ticket.type,
        price: Number(ticket.price),
        originalPrice: ticket.originalPrice ? Number(ticket.originalPrice) : null,
        currency: ticket.currency,
        validityType: ticket.validityType,
        isActive: ticket.isActive,
        isFeatured: ticket.isFeatured,
        displayOrder: ticket.displayOrder,
        saleStart: ticket.saleStart ? new Date(ticket.saleStart).toISOString().slice(0, 16) : "",
        saleEnd: ticket.saleEnd ? new Date(ticket.saleEnd).toISOString().slice(0, 16) : "",
        description: ticket.descriptionSr || ticket.description || "",
        descriptionSr: ticket.descriptionSr || ticket.description || "",
        titleSr: ticket.titleSr || ticket.title || "",
        imageUrl: ticket.imageUrl ?? "",
        finePrint: ticket.finePrint ?? "",
        requiresIdentity: ticket.requiresIdentity,
        requiresPhoto: ticket.requiresPhoto,
        groupId: ticket.groupId || "none",
        dayType: ticket.dayType || DayType.ALL,
        timeSlot: ticket.timeSlot || TimeSlot.FULL_DAY,
        minPeople: ticket.minPeople || 1,
        maxPeople: ticket.maxPeople || null,
        slug: ticket.slug || "",
        isSeasonPass: ticket.isSeasonPass ?? false,
      })
    } else {
      form.reset({
        title: "",
        type: "ADULT",
        price: 1200,
        originalPrice: null,
        currency: "RSD",
        validityType: "FIXED_DATE",
        isActive: true,
        isFeatured: false,
        displayOrder: 0,
        saleStart: "",
        saleEnd: "",
        description: "",
        descriptionSr: "",
        titleSr: "",
        imageUrl: "",
        finePrint: "",
        requiresIdentity: false,
        requiresPhoto: false,
        groupId: defaultGroupId || "none",
        dayType: DayType.ALL,
        timeSlot: TimeSlot.FULL_DAY,
        minPeople: 1,
        maxPeople: null,
        slug: "",
        isSeasonPass: false,
      })
    }
  }, [ticket, form])

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && form.formState.isDirty) {
      if (!window.confirm("Imate nesačuvane izmene. Da li ste sigurni da želite da zatvorite?")) {
        return
      }
    }
    onOpenChange(newOpen)
  }
 
  // 🛡️ Loss Prevention: Native HTML5 BeforeUnload Safeguard
  React.useEffect(() => {
    const handlePreventLoss = (e: BeforeUnloadEvent) => {
      if (form.formState.isDirty) {
        e.preventDefault()
        e.returnValue = "" // Native OS confirmation trigger
        return ""
      }
    }
    
    window.addEventListener("beforeunload", handlePreventLoss)
    return () => window.removeEventListener("beforeunload", handlePreventLoss)
  }, [form.formState.isDirty])

  const onSubmit: SubmitHandler<TicketFormValues> = async (values) => {
    setIsSubmitting(true)
    try {
      const result = await upsertTicketAction({
        ...values,
        id: ticket?.id,
        facilityId,
        groupId: values.groupId === "none" ? null : values.groupId,
        price: Number(values.price),
        originalPrice: values.originalPrice ? Number(values.originalPrice) : null,
        titleSr: values.title,
        description: values.descriptionSr,
        descriptionSr: values.descriptionSr,
      })

      if (result.success) {
        toast.success(ticket ? "Varijanta karte je uspešno ažurirana" : "Varijanta karte je uspešno kreirana")
        form.reset(values) // 🧼 Reset dirty bit immediately to free native lock
        router.refresh()
        onOpenChange(false)
      } else {
        toast.error(result.error || "Greška pri čuvanju podešavanja karte")
      }
    } catch (error: any) {
      console.error("Critical submission crash:", error)
      toast.error(error?.message || "Došlo je do neočekivane greške pri čuvanju.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const onInvalid = (errors: any) => {
    console.error("Validation errors encountered:", errors)
    toast.error("Molimo ispravite greške u formi pre čuvanja.")
  }

  async function onDelete() {
    if (!ticket) return
    if (!window.confirm("Da li ste sigurni da želite da obrišete ovu varijantu karte? Prodate karte će ostati sačuvane u sistemu, ali više neće biti dostupne za novu kupovinu.")) return

    setIsSubmitting(true)
    const result = await deleteTicketAction(ticket.id, facilityId)
    if (result.success) {
      toast.success("Varijanta karte je uspešno obrisana")
      router.refresh()
      onOpenChange(false)
    } else {
      toast.error("Greška pri brisanju karte")
    }
    setIsSubmitting(false)
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="sm:max-w-lg p-0 flex flex-col h-full bg-slate-950 border-white/5">
        <SheetHeader className="p-6 border-b">
          <SheetTitle>{ticket ? "Izmeni Varijantu Karte" : "Kreiraj Novu Kartu"}</SheetTitle>
          <SheetDescription>
            Konfigurišite kako se karte ovog tipa generišu i prodaju.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              <div className="space-y-5">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold uppercase tracking-wider text-slate-400">Naziv Ulaznice</FormLabel>
                      <FormControl>
                        <Input placeholder="npr. Dnevna karta - Odrasli" {...field} className="h-11 bg-white/5 border-white/10 rounded-xl font-bold text-slate-100 placeholder-slate-600 focus:border-cyan-500/50 transition-all" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold uppercase tracking-wider text-slate-400">Slug (URL Putanja)</FormLabel>
                      <FormControl>
                        <Input placeholder="npr. odrasli-radni-dan" {...field} value={field.value || ""} className="h-10 bg-white/5 border-white/10 rounded-xl font-mono text-xs text-slate-300 focus:border-cyan-500/50 transition-all" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }: { field: ControllerRenderProps<TicketFormValues, "price"> }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold uppercase tracking-wider text-slate-400">Cena</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input type="number" {...field} value={field.value as string} className="h-11 pr-12 bg-white/5 border-white/10 rounded-xl text-sm font-mono font-bold text-cyan-400 focus:border-cyan-500/50 transition-all" />
                            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-500 pointer-events-none uppercase tracking-widest">
                              {currency}
                            </span>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="originalPrice"
                    render={({ field }: { field: ControllerRenderProps<TicketFormValues, "originalPrice"> }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold uppercase tracking-wider text-slate-400">Gate Cena</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input type="number" {...field} value={String(field.value ?? "")} onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))} className="h-11 pr-12 bg-white/5 border-white/10 rounded-xl text-sm font-mono text-slate-400 focus:border-cyan-500/50 transition-all opacity-85" />
                            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-500 pointer-events-none uppercase tracking-widest">
                              {currency}
                            </span>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }: { field: ControllerRenderProps<TicketFormValues, "type"> }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold uppercase tracking-wider text-slate-400">Tip Karte</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-11 bg-white/5 border-white/10 rounded-xl text-xs px-3.5 text-slate-200 focus:border-cyan-500/50 transition-all">
                              <SelectValue placeholder="Tip" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-slate-900 border-white/10 text-slate-200">
                            {Object.values(TicketType).map((t) => (
                              <SelectItem key={t} value={t} className="text-xs focus:bg-cyan-500/20 focus:text-slate-100">
                                {TICKET_TYPE_LABELS[t] || t.replace("_", " ")}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="validityType"
                    render={({ field }: { field: ControllerRenderProps<TicketFormValues, "validityType"> }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold uppercase tracking-wider text-slate-400">Važenje</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-11 bg-white/5 border-white/10 rounded-xl text-xs px-3.5 text-slate-200 focus:border-cyan-500/50 transition-all">
                              <SelectValue placeholder="Važenje" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-slate-900 border-white/10 text-slate-200">
                            <SelectItem value="FIXED_DATE" className="text-xs focus:bg-cyan-500/20 focus:text-slate-100">Fiksni Datum</SelectItem>
                            <SelectItem value="FLEXIBLE_30_DAY" className="text-xs focus:bg-cyan-500/20 focus:text-slate-100">30 Dana Flex</SelectItem>
                            <SelectItem value="SUMMER_SEASON" className="text-xs focus:bg-cyan-500/20 focus:text-slate-100">Letnja Sezona</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="dayType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold uppercase tracking-wider text-slate-400">Dan</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                          <FormControl>
                            <SelectTrigger className="h-11 bg-white/5 border-white/10 rounded-xl text-xs px-3.5 text-slate-200">
                              <SelectValue placeholder="Izaberi" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-slate-900 border-white/10 text-slate-200">
                            {Object.values(DayType).map(v => (
                              <SelectItem key={v} value={v} className="text-xs focus:bg-cyan-500/20">{v.replace('_', ' ')}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="timeSlot"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold uppercase tracking-wider text-slate-400">Termin</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                          <FormControl>
                            <SelectTrigger className="h-11 bg-white/5 border-white/10 rounded-xl text-xs px-3.5 text-slate-200">
                              <SelectValue placeholder="Izaberi" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-slate-900 border-white/10 text-slate-200">
                            {Object.values(TimeSlot).map(v => (
                              <SelectItem key={v} value={v} className="text-xs focus:bg-cyan-500/20">{v.replace('_', ' ')}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="minPeople"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold uppercase tracking-wider text-slate-400">Min. Osoba</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} value={field.value as string} className="h-11 bg-white/5 border-white/10 rounded-xl text-sm font-bold text-slate-200" onChange={e => field.onChange(Number(e.target.value))} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="maxPeople"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold uppercase tracking-wider text-slate-400">Max. Osoba</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} value={String(field.value ?? "")} className="h-11 bg-white/5 border-white/10 rounded-xl text-sm font-bold text-slate-200" onChange={e => field.onChange(e.target.value === "" ? null : Number(e.target.value))} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              <Accordion type="multiple" defaultValue={["governance"]} className="w-full space-y-4 border-none">
                {/* Section 1: Status i Podešavanja */}
                <AccordionItem value="governance" className="border border-white/5 bg-white/[0.02] rounded-2xl px-4 overflow-hidden transition-all hover:bg-white/[0.03]">
                  <AccordionTrigger className="text-sm font-bold hover:no-underline py-4 text-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                      Status i Podešavanja
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-5 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="isActive"
                        render={({ field }: { field: ControllerRenderProps<TicketFormValues, "isActive"> }) => (
                          <FormItem className="flex items-center justify-between p-3 border border-white/5 rounded-xl bg-slate-950/40 space-y-0 gap-2">
                            <div className="space-y-0.5">
                              <FormLabel className="text-xs font-bold text-slate-300">Aktivna</FormLabel>
                              <span className="block text-[9px] text-slate-500 uppercase tracking-wider">Na sajtu</span>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                className="scale-90"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="isFeatured"
                        render={({ field }: { field: ControllerRenderProps<TicketFormValues, "isFeatured"> }) => (
                          <FormItem className="flex items-center justify-between p-3 border border-white/5 rounded-xl bg-slate-950/40 space-y-0 gap-2">
                            <div className="space-y-0.5">
                              <FormLabel className="text-xs font-bold text-slate-300">Izdvojena</FormLabel>
                              <span className="block text-[9px] text-slate-500 uppercase tracking-wider">Vrh liste</span>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                className="scale-90"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="groupId"
                      render={({ field }: { field: ControllerRenderProps<TicketFormValues, "groupId"> }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="text-xs font-semibold text-slate-400">Grupa Ulaznica</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || "none"}>
                            <FormControl>
                              <SelectTrigger className="h-10 bg-white/5 border-white/10 rounded-xl text-xs px-3.5 text-slate-200">
                                <SelectValue placeholder="Izaberite grupu" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-slate-900 border-white/10 text-slate-200">
                              <SelectItem value="none" className="text-xs focus:bg-cyan-500/20">Nema grupe (Pojedinačna karta)</SelectItem>
                              {ticketGroups?.map((g) => (
                                <SelectItem key={g.id} value={g.id} className="text-xs focus:bg-cyan-500/20">
                                  {g.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="saleStart"
                        render={({ field }: { field: ControllerRenderProps<TicketFormValues, "saleStart"> }) => (
                          <FormItem className="space-y-1">
                            <FormLabel className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Početak Prodaje</FormLabel>
                            <FormControl>
                              <Input type="datetime-local" {...field} value={field.value || ""} className="h-10 bg-slate-950/60 border-white/10 rounded-xl text-xs text-slate-300 px-3" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="saleEnd"
                        render={({ field }: { field: ControllerRenderProps<TicketFormValues, "saleEnd"> }) => (
                          <FormItem className="space-y-1">
                            <FormLabel className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Kraj Prodaje</FormLabel>
                            <FormControl>
                              <Input type="datetime-local" {...field} value={field.value || ""} className="h-10 bg-slate-950/60 border-white/10 rounded-xl text-xs text-slate-300 px-3" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Section 2: Opis i Sitna Slova */}
                <AccordionItem value="description_section" className="border border-white/5 bg-white/[0.02] rounded-2xl px-4 overflow-hidden transition-all hover:bg-white/[0.03]">
                  <AccordionTrigger className="text-sm font-bold hover:no-underline py-4 text-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                      Opis i Sitna Slova
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-5 space-y-4">
                    <FormField
                      control={form.control}
                      name="descriptionSr"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="text-xs font-semibold text-slate-400">Opis Ponude</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Šta je uključeno u ovu kartu?" className="min-h-[90px] bg-slate-950/60 border-white/10 rounded-xl leading-relaxed text-sm text-slate-200 placeholder-slate-600 focus:border-cyan-500/50" {...field} value={field.value || ""} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="finePrint"
                      render={({ field }: { field: ControllerRenderProps<TicketFormValues, "finePrint"> }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="text-xs font-semibold text-slate-400">Važne Napomene (Sitna slova)</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Npr. Nema povraćaja novca, samo radnim danima..." className="min-h-[70px] bg-slate-950/60 border-white/10 rounded-xl leading-relaxed text-xs text-slate-300 placeholder-slate-600 focus:border-cyan-500/50" {...field} value={field.value || ""} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </AccordionContent>
                </AccordionItem>

                {/* Section 3: Vizuelni Identitet & Sigurnost */}
                <AccordionItem value="visuals" className="border border-white/5 bg-white/[0.02] rounded-2xl px-4 overflow-hidden transition-all hover:bg-white/[0.03]">
                  <AccordionTrigger className="text-sm font-bold hover:no-underline py-4 text-slate-200">
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
                        Mediji i Sigurnost
                      </div>
                      {imageUrl && (
                        <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[9px] font-black uppercase text-cyan-400 tracking-widest">
                          Slika je dodata
                        </div>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-5 space-y-4">
                    <FormField
                      control={form.control}
                      name="imageUrl"
                      render={({ field }: { field: ControllerRenderProps<TicketFormValues, "imageUrl"> }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="text-xs font-semibold text-slate-400">Glavna Slika Kartice</FormLabel>
                          <FormControl>
                            <TicketImageUpload 
                              value={field.value} 
                              onChange={field.onChange} 
                              facilityId={facilityId} 
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <FormField
                        control={form.control}
                        name="requiresIdentity"
                        render={({ field }: { field: ControllerRenderProps<TicketFormValues, "requiresIdentity"> }) => (
                          <FormItem className="flex items-center justify-between p-3 border border-white/5 rounded-xl bg-slate-950/40 space-y-0 gap-2">
                            <div className="space-y-0.5">
                              <FormLabel className="text-xs font-bold text-slate-300">Ime i Prezime</FormLabel>
                              <span className="block text-[9px] text-slate-500 uppercase tracking-wider">Za pretplate</span>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={(checked) => {
                                  field.onChange(checked);
                                  if (checked) form.setValue("requiresPhoto", true);
                                }}
                                className="scale-90"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="requiresPhoto"
                        render={({ field }: { field: ControllerRenderProps<TicketFormValues, "requiresPhoto"> }) => (
                          <FormItem className="flex items-center justify-between p-3 border border-white/5 rounded-xl bg-slate-950/40 space-y-0 gap-2">
                            <div className="space-y-0.5">
                              <FormLabel className="text-xs font-bold text-slate-300">Fotografija</FormLabel>
                              <span className="block text-[9px] text-slate-500 uppercase tracking-wider">Vizuelna provera</span>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                className="scale-90"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            <SheetFooter className="p-6 border-t bg-slate-950 shrink-0">
              <div className="flex flex-col gap-3 w-full">
                {form.formState.isDirty && (
                  <div className="text-[10px] text-amber-500 font-bold uppercase tracking-[0.2em] text-center bg-amber-500/5 border border-amber-500/10 py-2.5 rounded-xl animate-pulse">
                    Nesačuvane izmene detektovane
                  </div>
                )}
                <Button type="submit" className="w-full h-11 bg-cyan-500 text-slate-950 font-black uppercase tracking-widest text-xs rounded-xl hover:bg-cyan-400 transition-all" disabled={isSubmitting}>
                  <Icon name="save" className="mr-2 text-[16px]" />
                  {ticket ? "Sačuvaj Varijantu" : "Objavi Ulaznicu"}
                </Button>

                {ticket && (
                  <Button 
                    type="button" 
                    variant="ghost" 
                    className="w-full h-10 text-slate-500 hover:text-rose-500 hover:bg-rose-500/5 transition-all text-xs font-bold uppercase tracking-widest"
                    onClick={onDelete}
                    disabled={isSubmitting}
                  >
                    <Icon name="delete" className="mr-2 text-[16px]" />
                    Obriši iz kataloga
                  </Button>
                )}
              </div>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}

