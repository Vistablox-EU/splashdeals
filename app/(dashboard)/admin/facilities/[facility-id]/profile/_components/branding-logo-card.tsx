"use client"

import * as React from "react"
import { Icon } from "@/components/ui/Icon"
import { useFormContext } from "react-hook-form"
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form"
import { Card } from "@/components/ui/card"
import { FacilityLogoUpload } from "./facility-logo-upload"
import type { UpdateFacilityGovernanceValues } from "@/server/lib/validations/facility"

interface BrandingLogoCardProps {
  facilityId: string
}

/** 
 * 🎨 BrandingLogoCard
 * Dedicated card for Logo upload and management.
 */
export function BrandingLogoCard({ facilityId }: BrandingLogoCardProps) {
  const { control } = useFormContext<UpdateFacilityGovernanceValues>()

  return (
    <Card className="p-5 border-border bg-muted/40 backdrop-blur-sm space-y-4">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10">
            <Icon name="image" className="text-[14px] text-primary" />
          </div>
          <h3 className="text-[10px] font-black uppercase tracking-widest text-foreground">Branding Logo Asset</h3>
        </div>
      </div>
      
      <div className="space-y-3">
        <FormField
          control={control}
          name="logoUrl"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <FacilityLogoUpload 
                  value={field.value} 
                  onChange={field.onChange} 
                  facilityId={facilityId} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <p className="text-[9px] text-muted-foreground font-medium leading-relaxed">
          Upload a high-fidelity vector or high-resolution branding asset. Auto-optimized to WebP at 512x512 on hardware canvas.
        </p>
      </div>
    </Card>
  )
}
