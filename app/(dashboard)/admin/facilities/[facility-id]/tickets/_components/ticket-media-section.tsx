"use client"

import { useWatch, useFormContext } from "react-hook-form"
import type { Control, FieldValues, Path } from "react-hook-form"
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form"
import { Switch } from "@/components/ui/switch"
import { TicketImageUpload } from "./ticket-image-upload"

interface TicketMediaSectionProps<T extends FieldValues> {
  control: Control<T>
  facilityId: string
}

/**
 * Accordion section: image upload + identity/photo security toggles.
 */
export function TicketMediaSection<T extends FieldValues>({
  control,
  facilityId,
}: TicketMediaSectionProps<T>) {
  const { setValue } = useFormContext()
  const imageUrl = useWatch({ control, name: "imageUrl" as Path<T> })

  return (
    <AccordionItem
      value="visuals"
      className="border border-border/50 bg-muted/10 rounded-2xl px-4 overflow-hidden transition-all hover:bg-muted/20"
    >
      <AccordionTrigger className="text-sm font-bold hover:no-underline py-4 text-foreground/90">
        <div className="flex items-center justify-between w-full pr-4">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-primary shadow-primary/50" />
            Mediji i Sigurnost
          </div>
          {imageUrl && (
            <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[9px] font-black uppercase text-primary tracking-widest">
              Slika je dodata
            </div>
          )}
        </div>
      </AccordionTrigger>
      <AccordionContent className="pb-5 space-y-4">
        <FormField
          control={control}
          name={"imageUrl" as Path<T>}
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel className="text-xs font-semibold text-muted-foreground">Glavna Slika Kartice</FormLabel>
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
            control={control}
            name={"requiresIdentity" as Path<T>}
            render={({ field }) => (
              <FormItem className="flex items-center justify-between p-3 border border-border/50 rounded-xl bg-background/40 space-y-0 gap-2">
                <div className="space-y-0.5">
                  <FormLabel className="text-xs font-bold text-foreground/80">Ime i Prezime</FormLabel>
                  <span className="block text-[9px] text-muted-foreground uppercase tracking-wider">Za pretplate</span>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={(checked) => {
                      field.onChange(checked)
                      if (checked) setValue("requiresPhoto" as Path<T>, true as any)
                    }}
                    className="scale-90"
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name={"requiresPhoto" as Path<T>}
            render={({ field }) => (
              <FormItem className="flex items-center justify-between p-3 border border-border/50 rounded-xl bg-background/40 space-y-0 gap-2">
                <div className="space-y-0.5">
                  <FormLabel className="text-xs font-bold text-foreground/80">Fotografija</FormLabel>
                  <span className="block text-[9px] text-muted-foreground uppercase tracking-wider">Vizuelna provera</span>
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
  )
}
