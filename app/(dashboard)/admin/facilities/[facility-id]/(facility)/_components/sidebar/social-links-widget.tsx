"use client"
import { Icon } from "@/components/ui/Icon";

import { useState, useTransition } from "react"
import { GlassCard } from "@/components/ui/GlassCard"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateFacilitySocialLinksAction } from "@/server/actions/governance"
import { toast } from "sonner"

interface SocialLinksWidgetProps {
  facilityId: string
  initialSocialLinks: Record<string, string | undefined>
}

export function SocialLinksWidget({ facilityId, initialSocialLinks }: SocialLinksWidgetProps) {
  const [isPending, startTransition] = useTransition()
  const [links, setLinks] = useState({
    instagram: initialSocialLinks?.instagram || "",
    facebook: initialSocialLinks?.facebook || "",
    website: initialSocialLinks?.website || ""
  })
  
  // Track save status per field to show green checkmarks
  const [saveStatus, setSaveStatus] = useState<Record<string, boolean>>({})

  const handleBlur = (field: string) => {
    startTransition(async () => {
      const result = await updateFacilitySocialLinksAction(facilityId, links)
      if (result.success) {
        setSaveStatus(prev => ({ ...prev, [field]: true }))
        setTimeout(() => {
          setSaveStatus(prev => ({ ...prev, [field]: false }))
        }, 2000)
      } else {
        toast.error("Failed to save " + field)
      }
    })
  }

  return (
    <GlassCard className="p-5 border-border bg-muted/40 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-5">
         <div className="flex items-center gap-2">
           <div className="p-1.5 rounded-lg bg-pink-500/10">
             <Icon name="photo_camera" className="text-[14px] text-pink-400" />
           </div>
           <h3 className="text-[10px] font-black uppercase tracking-widest text-foreground">Social Links</h3>
         </div>
         {isPending && <Icon name="progress_activity" className="text-[12px] animate-spin text-muted-foreground" />}
      </div>
      
      <div className="space-y-4">
         <div className="space-y-1.5">
           <div className="flex justify-between items-center">
             <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Instagram URL</Label>
             {saveStatus.instagram && <Icon name="check" className="text-[12px] text-emerald-500" />}
           </div>
           <Input 
             value={links.instagram}
             onChange={(e) => setLinks(prev => ({ ...prev, instagram: e.target.value }))}
             onBlur={() => handleBlur('instagram')}
             className="h-9 bg-background/40 border-border/50 text-xs focus-visible:ring-cyan-500/50" 
             placeholder="https://instagram.com/..." 
           />
         </div>
         
         <div className="space-y-1.5">
           <div className="flex justify-between items-center">
             <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Facebook URL</Label>
             {saveStatus.facebook && <Icon name="check" className="text-[12px] text-emerald-500" />}
           </div>
           <Input 
             value={links.facebook}
             onChange={(e) => setLinks(prev => ({ ...prev, facebook: e.target.value }))}
             onBlur={() => handleBlur('facebook')}
             className="h-9 bg-background/40 border-border/50 text-xs focus-visible:ring-cyan-500/50" 
             placeholder="https://facebook.com/..." 
           />
         </div>
         
         <div className="space-y-1.5">
           <div className="flex justify-between items-center">
             <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Official Website</Label>
             {saveStatus.website && <Icon name="check" className="text-[12px] text-emerald-500" />}
           </div>
           <Input 
             value={links.website}
             onChange={(e) => setLinks(prev => ({ ...prev, website: e.target.value }))}
             onBlur={() => handleBlur('website')}
             className="h-9 bg-background/40 border-border/50 text-xs focus-visible:ring-cyan-500/50" 
             placeholder="https://..." 
           />
         </div>
      </div>
    </GlassCard>
  )
}
