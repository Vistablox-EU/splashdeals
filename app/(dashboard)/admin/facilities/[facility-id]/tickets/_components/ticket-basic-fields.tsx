"use client"

import { TicketType, DayType, TimeSlot } from "@prisma/client"
import { useWatch } from "react-hook-form"
import type { Control, FieldValues, Path } from "react-hook-form"
import {
  FormControl,
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

const TICKET_TYPE_LABELS: Record<TicketType, string> = {
  ADULT: "Odrasli",
  CHILD: "Deca",
  SENIOR: "Penzioneri",
  STUDENT: "Studenti",
  FAMILY_BUNDLE: "Porodični Paket",
  SUMMER_PASS: "Sezonska Propusnica",
}

interface TicketBasicInfoFieldsProps<T extends FieldValues> {
  control: Control<T>
}

/**
 * Core ticket fields: name, slug, pricing, type, validity, day/time, capacity.
 */
export function TicketBasicInfoFields<T extends FieldValues>({
  control,
}: TicketBasicInfoFieldsProps<T>) {
  const currency = useWatch({ control, name: "currency" as Path<T> }) as string

  return (
    <div className="space-y-5">
      {/* Title */}
      <FormField
        control={control}
        name={"title" as Path<T>}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Naziv Ulaznice
            </FormLabel>
            <FormControl>
              <Input
                placeholder="npr. Dnevna karta - Odrasli"
                {...field}
                className="h-11 bg-muted/30 border-border rounded-xl font-bold text-foreground placeholder-slate-600 focus:border-primary/50 transition-all"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Slug */}
      <FormField
        control={control}
        name={"slug" as Path<T>}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Slug (URL Putanja)
            </FormLabel>
            <FormControl>
              <Input
                placeholder="npr. odrasli-radni-dan"
                {...field}
                value={field.value || ""}
                className="h-10 bg-muted/30 border-border rounded-xl font-mono text-xs text-foreground/80 focus:border-primary/50 transition-all"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Price + Original Price + Type + Validity */}
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={control}
          name={"price" as Path<T>}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Cena
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type="number"
                    {...field}
                    value={field.value as string}
                    className="h-11 pr-12 bg-muted/30 border-border rounded-xl text-sm font-mono font-bold text-primary focus:border-primary/50 transition-all"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-black text-muted-foreground pointer-events-none uppercase tracking-widest">
                    {currency}
                  </span>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name={"originalPrice" as Path<T>}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Gate Cena
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type="number"
                    {...field}
                    value={String(field.value ?? "")}
                    onChange={(e) =>
                      field.onChange(e.target.value === "" ? null : Number(e.target.value))
                    }
                    className="h-11 pr-12 bg-muted/30 border-border rounded-xl text-sm font-mono text-muted-foreground focus:border-primary/50 transition-all opacity-85"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-black text-muted-foreground pointer-events-none uppercase tracking-widest">
                    {currency}
                  </span>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name={"type" as Path<T>}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Tip Karte
              </FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="h-11 bg-muted/30 border-border rounded-xl text-xs px-3.5 text-foreground/90 focus:border-primary/50 transition-all">
                    <SelectValue placeholder="Tip" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-muted border-border text-foreground/90">
                  {Object.values(TicketType).map((t) => (
                    <SelectItem key={t} value={t} className="text-xs focus:bg-primary/20 focus:text-foreground">
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
          control={control}
          name={"validityType" as Path<T>}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Važenje
              </FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="h-11 bg-muted/30 border-border rounded-xl text-xs px-3.5 text-foreground/90 focus:border-primary/50 transition-all">
                    <SelectValue placeholder="Važenje" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-muted border-border text-foreground/90">
                  <SelectItem value="FIXED_DATE" className="text-xs focus:bg-primary/20 focus:text-foreground">
                    Fiksni Datum
                  </SelectItem>
                  <SelectItem value="FLEXIBLE_30_DAY" className="text-xs focus:bg-primary/20 focus:text-foreground">
                    30 Dana Flex
                  </SelectItem>
                  <SelectItem value="SUMMER_SEASON" className="text-xs focus:bg-primary/20 focus:text-foreground">
                    Letnja Sezona
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Day Type + Time Slot */}
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={control}
          name={"dayType" as Path<T>}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Dan
              </FormLabel>
              <Select onValueChange={field.onChange} value={field.value || undefined}>
                <FormControl>
                  <SelectTrigger className="h-11 bg-muted/30 border-border rounded-xl text-xs px-3.5 text-foreground/90">
                    <SelectValue placeholder="Izaberi" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-muted border-border text-foreground/90">
                  {Object.values(DayType).map((v) => (
                    <SelectItem key={v} value={v} className="text-xs focus:bg-primary/20">
                      {v.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name={"timeSlot" as Path<T>}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Termin
              </FormLabel>
              <Select onValueChange={field.onChange} value={field.value || undefined}>
                <FormControl>
                  <SelectTrigger className="h-11 bg-muted/30 border-border rounded-xl text-xs px-3.5 text-foreground/90">
                    <SelectValue placeholder="Izaberi" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-muted border-border text-foreground/90">
                  {Object.values(TimeSlot).map((v) => (
                    <SelectItem key={v} value={v} className="text-xs focus:bg-primary/20">
                      {v.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
      </div>

      {/* Min / Max People */}
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={control}
          name={"minPeople" as Path<T>}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Min. Osoba
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  value={field.value as string}
                  className="h-11 bg-muted/30 border-border rounded-xl text-sm font-bold text-foreground/90"
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={"maxPeople" as Path<T>}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Max. Osoba
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  value={String(field.value ?? "")}
                  className="h-11 bg-muted/30 border-border rounded-xl text-sm font-bold text-foreground/90"
                  onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    </div>
  )
}
