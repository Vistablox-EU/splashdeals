"use client"
import { Icon } from "@/components/ui/Icon";

import * as React from "react"
import { useFormContext } from "react-hook-form"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import type { UpdateFacilityGovernanceValues } from "@/server/lib/validations/facility"

export function LocationSection() {
  const { control, getValues, formState: { dirtyFields } } = useFormContext<UpdateFacilityGovernanceValues>()

  return (
    <Card className="p-5 border-border bg-muted/40 backdrop-blur-sm space-y-4">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-500/10">
            <Icon name="location_on" className="text-[14px] text-blue-400" />
          </div>
          <h3 className="text-[10px] font-black uppercase tracking-widest text-foreground">Registry Geolocation</h3>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FormField
          control={control}
          name="city"
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel className="text-[9px] uppercase tracking-widest font-black opacity-60">City</FormLabel>
              <FormControl>
                <Input className="bg-background/40 border-border/50 h-8 text-[11px] font-bold" {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="postalCode"
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel className="text-[9px] uppercase tracking-widest font-black opacity-60">Postal Code</FormLabel>
              <FormControl>
                <Input className="bg-background/40 border-border/50 h-8 text-[11px] font-bold" {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={control}
        name="streetName"
        render={({ field }) => (
          <FormItem className="space-y-1">
            <FormLabel className="text-[9px] uppercase tracking-widest font-black opacity-60">Street Address</FormLabel>
            <FormControl>
              <Input className="bg-background/40 border-border/50 h-8 text-[11px] font-bold" {...field} value={field.value || ""} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="streetNumber"
        render={({ field }) => (
          <FormItem className="space-y-1">
            <div className="flex items-center justify-between">
              <FormLabel className="text-[9px] uppercase tracking-widest font-black opacity-60">Building/Unit</FormLabel>
              <Button
                type="button"
                variant="link"
                size="sm"
                onClick={() => window.open(`https://www.google.com/maps/search/${encodeURIComponent(`${getValues('streetName')} ${field.value}, ${getValues('city')}`)}`, '_blank')}
                className="text-[8px] font-black text-primary hover:underline uppercase tracking-tighter"
              >
                Verify Map
              </Button>
            </div>
            <FormControl>
              <Input className="bg-background/40 border-border/50 h-8 text-[11px] font-bold" {...field} value={field.value || ""} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </Card>
  )
}
