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
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface TicketStatusSectionProps<T extends FieldValues> {
  control: Control<T>
  ticketGroups: { id: string; title: string }[]
}

/**
 * Accordion section: status toggles, group assignment, sale date window.
 */
export function TicketStatusSection<T extends FieldValues>({
  control,
  ticketGroups,
}: TicketStatusSectionProps<T>) {
  return (
    <AccordionItem
      value="governance"
      className="border border-border/50 bg-muted/10 rounded-2xl px-4 overflow-hidden transition-all hover:bg-muted/20"
    >
      <AccordionTrigger className="text-sm font-bold hover:no-underline py-4 text-foreground/90">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
          Status i Podešavanja
        </div>
      </AccordionTrigger>
      <AccordionContent className="pb-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={control}
            name={"isActive" as Path<T>}
            render={({ field }) => (
              <FormItem className="flex items-center justify-between p-3 border border-border/50 rounded-xl bg-background/40 space-y-0 gap-2">
                <div className="space-y-0.5">
                  <FormLabel className="text-xs font-bold text-foreground/80">Aktivna</FormLabel>
                  <span className="block text-[9px] text-muted-foreground uppercase tracking-wider">Na sajtu</span>
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
            control={control}
            name={"isFeatured" as Path<T>}
            render={({ field }) => (
              <FormItem className="flex items-center justify-between p-3 border border-border/50 rounded-xl bg-background/40 space-y-0 gap-2">
                <div className="space-y-0.5">
                  <FormLabel className="text-xs font-bold text-foreground/80">Izdvojena</FormLabel>
                  <span className="block text-[9px] text-muted-foreground uppercase tracking-wider">Vrh liste</span>
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
          control={control}
          name={"groupId" as Path<T>}
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel className="text-xs font-semibold text-muted-foreground">Grupa Ulaznica</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || "none"}>
                <FormControl>
                  <SelectTrigger className="h-10 bg-muted/30 border-border rounded-xl text-xs px-3.5 text-foreground/90">
                    <SelectValue placeholder="Izaberite grupu" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-muted border-border text-foreground/90">
                  <SelectItem value="none" className="text-xs focus:bg-primary/20">
                    Nema grupe (Pojedinačna karta)
                  </SelectItem>
                  {ticketGroups?.map((g) => (
                    <SelectItem key={g.id} value={g.id} className="text-xs focus:bg-primary/20">
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
            control={control}
            name={"saleStart" as Path<T>}
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Početak Prodaje
                </FormLabel>
                <FormControl>
                  <Input
                    type="datetime-local"
                    {...field}
                    value={field.value || ""}
                    className="h-10 bg-background/60 border-border rounded-xl text-xs text-foreground/80 px-3"
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={"saleEnd" as Path<T>}
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Kraj Prodaje
                </FormLabel>
                <FormControl>
                  <Input
                    type="datetime-local"
                    {...field}
                    value={field.value || ""}
                    className="h-10 bg-background/60 border-border rounded-xl text-xs text-foreground/80 px-3"
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
