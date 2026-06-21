"use client"
import { Icon } from "@/components/ui/Icon";

import { useState, useTransition } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateFacilityContactAction } from "@/server/actions/governance"
import { toast } from "sonner"

interface PublicContactWidgetProps {
  facilityId: string
  initialContact: {
    publicPhone?: string | null
    publicEmail?: string | null
  }
}

export function PublicContactWidget({ facilityId, initialContact }: PublicContactWidgetProps) {
  const [isPending, startTransition] = useTransition()
  const [contact, setContact] = useState({
    publicPhone: initialContact?.publicPhone || "",
    publicEmail: initialContact?.publicEmail || "",
  })

  const [saveStatus, setSaveStatus] = useState<Record<string, boolean>>({})

  const handleBlur = (field: string) => {
    startTransition(async () => {
      const result = await updateFacilityContactAction(facilityId, contact)
      if (result.success) {
        setSaveStatus(prev => ({ ...prev, [field]: true }))
        setTimeout(() => setSaveStatus(prev => ({ ...prev, [field]: false })), 2000)
        toast.success("Sačuvano")
      } else {
        toast.error("Failed to save " + field)
      }
    })
  }

  return (
    <Card className="p-5 border-border bg-muted/40 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10">
            <Icon name="phone" className="text-[14px] text-emerald-400" />
          </div>
          <h3 className="text-[10px] font-black uppercase tracking-widest text-foreground">Public Contact</h3>
        </div>
        {isPending && <Icon name="progress_activity" className="text-[12px] animate-spin text-muted-foreground" />}
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Phone Number</Label>
            {saveStatus.publicPhone && <Icon name="check" className="text-[12px] text-emerald-500" />}
          </div>
          <Input
            value={contact.publicPhone}
            onChange={(e) => setContact(prev => ({ ...prev, publicPhone: e.target.value }))}
            onBlur={() => handleBlur("publicPhone")}
            className="h-9 bg-background/40 border-border/50 text-xs focus-visible:ring-ring"
            placeholder="+381..."
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Public Email</Label>
            {saveStatus.publicEmail && <Icon name="check" className="text-[12px] text-emerald-500" />}
          </div>
          <Input
            value={contact.publicEmail}
            onChange={(e) => setContact(prev => ({ ...prev, publicEmail: e.target.value }))}
            onBlur={() => handleBlur("publicEmail")}
            className="h-9 bg-background/40 border-border/50 text-xs focus-visible:ring-ring"
            placeholder="info@park.rs"
          />
        </div>
      </div>
    </Card>
  )
}
