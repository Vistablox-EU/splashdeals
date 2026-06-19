"use client"

import { Icon } from "@/components/ui/Icon";

import * as React from "react"
import { useRouter } from "next/navigation"
import { useForm, useWatch, type SubmitHandler, type FieldErrors } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
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
} from "@/components/ui/accordion"
import {
  Form,
} from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

import { upsertTicketAction, deleteTicketAction } from "@/server/actions/tickets"
import { ticketSchema, type TicketFormValues } from "@/server/lib/validations/ticket"
import type { SerializedAdminTicket } from "./columns"

import { TicketBasicInfoFields } from "./ticket-basic-fields"
import { TicketStatusSection } from "./ticket-status-section"
import { TicketDescriptionSection } from "./ticket-description-section"
import { TicketMediaSection } from "./ticket-media-section"
import { ConfirmDialog } from "./confirm-dialog"
import { useUnsavedChangesGuard } from "../_hooks/use-unsaved-changes-guard"

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
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false)
  const router = useRouter()

  const form = useForm<TicketFormValues>({
    resolver: zodResolver(ticketSchema) as any,
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
      dayType: ticket?.dayType || undefined,
      timeSlot: ticket?.timeSlot || undefined,
      minPeople: ticket?.minPeople || 1,
      maxPeople: ticket?.maxPeople || null,
      slug: ticket?.slug || "",
      isSeasonPass: ticket?.isSeasonPass ?? false,
    },
  })

  // Sync form internal state when the "ticket" prop changes for editing
  React.useEffect(() => {
    if (form.formState.isDirty) return // 🛡️ Preserve unsaved changes
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
        dayType: ticket.dayType || undefined,
        timeSlot: ticket.timeSlot || undefined,
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
        dayType: undefined,
        timeSlot: undefined,
        minPeople: 1,
        maxPeople: null,
        slug: "",
        isSeasonPass: false,
      })
    }
  }, [ticket, form, defaultGroupId])

  // ── Auto-sync isSeasonPass → validityType ──────────────────────────────
  const isSeasonPass = useWatch({ control: form.control, name: "isSeasonPass" })

  React.useEffect(() => {
    if (isSeasonPass) {
      form.setValue("validityType", "SUMMER_SEASON")
    } else if (form.getValues("validityType") === "SUMMER_SEASON") {
      form.setValue("validityType", "FIXED_DATE")
    }
  }, [isSeasonPass, form])

  const { showUnsavedDialog, setShowUnsavedDialog, handleOpenChange, confirmDiscard } = useUnsavedChangesGuard(
    form.formState.isDirty,
    onOpenChange,
  )

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
        form.reset(values)
        router.refresh()
        onOpenChange(false)
      } else {
        toast.error(result.error || "Greška pri čuvanju podešavanja karte")
      }
    } catch (error) {
      console.error("Critical submission crash:", error)
      toast.error(error instanceof Error ? error.message : "Došlo je do neočekivane greške pri čuvanju.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const onInvalid = (errors: FieldErrors<TicketFormValues>) => {
    console.error("Validation errors encountered:", errors)
    toast.error("Molimo ispravite greške u formi pre čuvanja.")
  }

  const onDelete = () => {
    if (!ticket) return
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!ticket) return
    setShowDeleteDialog(false)
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
      <SheetContent className="sm:max-w-lg p-0 flex flex-col h-full bg-background border-border/50">
        <SheetHeader className="p-6 border-b">
          <SheetTitle>{ticket ? "Izmeni Varijantu Karte" : "Kreiraj Novu Kartu"}</SheetTitle>
          <SheetDescription>
            Konfigurišite kako se karte ovog tipa generišu i prodaju.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              <TicketBasicInfoFields control={form.control} />

              <Accordion type="multiple" defaultValue={["governance"]} className="w-full space-y-4 border-none">
                <TicketStatusSection
                  control={form.control}
                  ticketGroups={ticketGroups}
                />
                <TicketDescriptionSection control={form.control} />
                <TicketMediaSection control={form.control} facilityId={facilityId} />
              </Accordion>
            </div>

            <SheetFooter className="p-6 border-t bg-background shrink-0">
              <div className="flex flex-col gap-3 w-full">
                {form.formState.isDirty && (
                  <div className="text-[10px] text-amber-500 font-bold uppercase tracking-[0.2em] text-center bg-amber-500/5 border border-amber-500/10 py-2.5 rounded-xl animate-pulse">
                    Nesačuvane izmene detektovane
                  </div>
                )}
                <Button type="submit" className="w-full h-11 bg-primary text-primary-foreground font-black uppercase tracking-widest text-xs rounded-xl hover:bg-primary/90 transition-all" disabled={isSubmitting}>
                  <Icon name="save" className="mr-2 text-[16px]" />
                  {ticket ? "Sačuvaj Varijantu" : "Objavi Ulaznicu"}
                </Button>

                {ticket && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full h-10 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/5 transition-all text-xs font-bold uppercase tracking-widest"
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

      {/* Unsaved Changes Dialog */}
      <ConfirmDialog
        open={showUnsavedDialog}
        onOpenChange={(open) => { if (!open) setShowUnsavedDialog(false) }}
        title="Nesačuvane izmene"
        description="Imate nesačuvane izmene. Da li ste sigurni da želite da zatvorite?"
        confirmLabel="Odbaci izmene"
        cancelLabel="Nastavi uređivanje"
        variant="destructive"
        onConfirm={confirmDiscard}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Obriši kartu"
        description="Prodate karte ostaju u sistemu, ali ova varijanta više neće biti dostupna za kupovinu."
        confirmLabel="Obriši"
        variant="destructive"
        onConfirm={confirmDelete}
        disabled={isSubmitting}
      />
    </Sheet>
  )
}
