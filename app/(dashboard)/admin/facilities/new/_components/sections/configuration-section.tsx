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

export function ConfigurationSection() {
  const { control } = useFormContext<FacilityFormValues>();

  return (
    <Card className="border-border/50 bg-muted/50 overflow-hidden backdrop-blur-md">
      <CardHeader className="border-border/50 bg-muted/30 border-b">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icon name="security" className="text-primary text-[20px]" />
          Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        <FormField
          control={control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-muted/30 border-border h-11">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-muted border-border">
                  <SelectItem value="Waterpark">Waterpark</SelectItem>
                  <SelectItem value="Thermal Bath">Thermal Bath</SelectItem>
                  <SelectItem value="Public Pool">Public Pool</SelectItem>
                  <SelectItem value="Resort">Resort</SelectItem>
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
              <FormLabel>Initial Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-muted/30 border-border h-11">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-muted border-border">
                  <SelectItem value="DRAFT">Draft (Hidden)</SelectItem>
                  <SelectItem value="ACTIVE">Active (Live)</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription className="text-[10px] italic">
                Recommended: Draft until tickets & media are complete.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}
