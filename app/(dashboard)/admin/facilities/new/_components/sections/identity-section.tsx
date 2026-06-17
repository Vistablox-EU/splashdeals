"use client"

import { Icon } from "@/components/ui/Icon";
 

import { useFormContext } from "react-hook-form"
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { FacilityFormValues } from "@/server/lib/validations/facility"

interface IdentitySectionProps {
  isSlugLocked: boolean
  setIsSlugLocked: (locked: boolean) => void
  onNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export function IdentitySection({ isSlugLocked, setIsSlugLocked, onNameChange }: IdentitySectionProps) {
  const { control } = useFormContext<FacilityFormValues>()

  return (
    <Card className="border-border/50 bg-muted/50 backdrop-blur-md overflow-hidden">
      <CardHeader className="border-b border-border/50 bg-muted/30">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icon name="business" className="text-[20px] text-primary" />
          General Identity
        </CardTitle>
        <CardDescription>
          Javno ime i kategorija objekta. Treba jasno da opiše tip objekta.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <FormField
          control={control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Registered Business / Park Name</FormLabel>
              <FormControl>
                <Input 
                  placeholder="e.g. AquaPark Petroland" 
                  className="h-12 bg-muted/30 border-border"
                  {...field} 
                  onChange={(e) => {
                    field.onChange(e);
                    onNameChange(e);
                  }} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL Slug</FormLabel>
              <FormControl>
                <div className="relative group">
                  <Icon name="link" className="absolute left-3 top-4 text-[16px] text-muted-foreground" />
                  <Input 
                    placeholder="aquapark-petroland" 
                    className="h-12 pl-9 pr-10 bg-muted/30 border-border" 
                    {...field} 
                    onChange={(e) => {
                      field.onChange(e)
                      if (isSlugLocked) setIsSlugLocked(false)
                    }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-2 h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={() => setIsSlugLocked(!isSlugLocked)}
                    title={isSlugLocked ? "Unlock to edit slug" : "Lock to sync with name"}
                  >
                    {isSlugLocked ? <Icon name="lock" className="text-[14px]" /> : <Icon name="lock_open" className="text-[14px] text-amber-500" />}
                  </Button>
                </div>
              </FormControl>
              <FormDescription className="text-xs italic text-muted-foreground">
                splashdeals.rs/places/<strong>{field.value || "slug"}</strong>
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  )
}
