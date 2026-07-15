"use client";

import { Icon } from "@/components/ui/Icon";
import { useFormContext } from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { FacilityFormValues } from "@/app/(server)/lib/validations/facility";
import { getAdminCategoryOptions } from "@/lib/routing/categories";

const CATEGORY_OPTIONS = getAdminCategoryOptions();

export function ConfigurationSection() {
  const { control } = useFormContext<FacilityFormValues>();

  return (
    <Card className="border-border/50 bg-muted/50 overflow-hidden backdrop-blur-md">
      <CardHeader className="border-border/50 bg-muted/30 border-b">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icon name="security" className="text-primary text-[20px]" />
          Konfiguracija
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        <FormField
          control={control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kategorija</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-muted/30 border-border h-11">
                    <SelectValue placeholder="Izaberite kategoriju" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-muted border-border max-h-72">
                  {CATEGORY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                      <span className="text-muted-foreground ml-2 text-[10px]">({opt.group})</span>
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
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Početni status</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-muted/30 border-border h-11">
                    <SelectValue placeholder="Izaberite status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-muted border-border">
                  <SelectItem value="DRAFT">Nacrt (skriven)</SelectItem>
                  <SelectItem value="ACTIVE">Aktivan (javno)</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription className="text-[10px] italic">
                Preporuka: ostavite kao nacrt dok nisu spremne ulaznice i mediji.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}
