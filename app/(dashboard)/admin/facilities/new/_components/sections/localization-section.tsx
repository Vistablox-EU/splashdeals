"use client";

import { Icon } from "@/components/ui/Icon";
import { useFormContext } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { FacilityFormValues } from "@/app/(server)/lib/validations/facility";

export function LocalizationSection() {
  const { control } = useFormContext<FacilityFormValues>();

  return (
    <Card className="border-border/50 bg-muted/50 overflow-hidden backdrop-blur-md">
      <CardHeader className="border-border/50 bg-muted/30 border-b">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icon name="location_on" className="text-primary text-[20px]" />
          Lokacija
        </CardTitle>
        <CardDescription>Struktuirana adresa za mape i pretragu.</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-6 p-6">
        <FormField
          control={control}
          name="city"
          render={({ field }) => (
            <FormItem className="col-span-1">
              <FormLabel>Grad</FormLabel>
              <FormControl>
                <Input
                  placeholder="Bački Petrovac"
                  className="bg-muted/30 border-border h-11"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="postalCode"
          render={({ field }) => (
            <FormItem className="col-span-1">
              <FormLabel>Poštanski broj</FormLabel>
              <FormControl>
                <Input placeholder="21470" className="bg-muted/30 border-border h-11" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="streetName"
          render={({ field }) => (
            <FormItem className="col-span-2">
              <FormLabel>Ulica</FormLabel>
              <FormControl>
                <Input
                  placeholder="Novosadski put"
                  className="bg-muted/30 border-border h-11"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="streetNumber"
          render={({ field }) => (
            <FormItem className="col-span-2">
              <FormLabel>Broj / ulaz</FormLabel>
              <FormControl>
                <Input placeholder="bb" className="bg-muted/30 border-border h-11" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}
