"use client"

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
import { Textarea } from "@/components/ui/textarea"

interface TicketDescriptionSectionProps<T extends FieldValues> {
  control: Control<T>
}

/**
 * Accordion section: description + fine print textareas.
 */
export function TicketDescriptionSection<T extends FieldValues>({
  control,
}: TicketDescriptionSectionProps<T>) {
  return (
    <AccordionItem
      value="description_section"
      className="border border-border/50 bg-muted/10 rounded-2xl px-4 overflow-hidden transition-all hover:bg-muted/20"
    >
      <AccordionTrigger className="text-sm font-bold hover:no-underline py-4 text-foreground/90">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
          Opis i Sitna Slova
        </div>
      </AccordionTrigger>
      <AccordionContent className="pb-5 space-y-4">
        <FormField
          control={control}
          name={"descriptionSr" as Path<T>}
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel className="text-xs font-semibold text-muted-foreground">Opis Ponude</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Šta je uključeno u ovu kartu?"
                  className="min-h-[90px] bg-background/60 border-border rounded-xl leading-relaxed text-sm text-foreground/90 placeholder-slate-600 focus:border-primary/50"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name={"finePrint" as Path<T>}
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel className="text-xs font-semibold text-muted-foreground">
                Važne Napomene (Sitna slova)
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Npr. Nema povraćaja novca, samo radnim danima..."
                  className="min-h-[70px] bg-background/60 border-border rounded-xl leading-relaxed text-xs text-foreground/80 placeholder-slate-600 focus:border-primary/50"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </AccordionContent>
    </AccordionItem>
  )
}
