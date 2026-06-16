"use client"

import { Icon } from "@/components/ui/Icon";
 

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger,
  SheetFooter
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { z } from "zod"

// Narrowed schema for strictly administrative governance
const adminGovernanceSchema = z.object({
  facilityId: z.string().uuid(),
  status: z.enum(["DRAFT", "ACTIVE", "CLOSED", "EMERGENCY_SHUTDOWN"]),
})

type AdminGovernanceValues = z.infer<typeof adminGovernanceSchema>

// Import the dedicated status action for efficiency
import { updateFacilityStatusAction } from "@/server/actions/governance"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"

import { FacilityStatus } from "@prisma/client"

interface FacilityGovernanceSheetProps {
  facility: {
    id: string
    name: string
    status: FacilityStatus
  }
}

export function FacilityGovernanceSheet({ facility }: FacilityGovernanceSheetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const form = useForm<AdminGovernanceValues>({
    resolver: zodResolver(adminGovernanceSchema),
    defaultValues: {
      facilityId: facility.id,
      status: facility.status,
    },
  })

  function onSubmit(values: AdminGovernanceValues) {
    startTransition(async () => {
      const result = await updateFacilityStatusAction(values)

      if (result.success) {
        toast.success("Operational status updated")
        setIsOpen(false)
        router.refresh()
      } else {
        toast.error(result.error || "Failed to update status")
      }
    })
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 border-white/10 hover:bg-white/5 transition-all text-[10px] font-black uppercase tracking-widest">
          <Icon name="settings" className="text-[16px]" />
          Advanced Governance
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-[440px] p-8 overflow-y-auto bg-slate-950/95 backdrop-blur-2xl border-white/5 shadow-2xl">
        <SheetHeader className="pb-8 border-b border-white/5">
          <SheetTitle className="flex items-center gap-2 text-xl font-black tracking-tighter">
            <Icon name="gpp_maybe" className="text-[20px] text-primary" />
            System Governance
          </SheetTitle>
          <SheetDescription className="text-xs uppercase tracking-widest font-bold opacity-50">
            Administrative controls and registry management.
          </SheetDescription>
        </SheetHeader>

        <div className="py-8 space-y-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-60">
                      <Icon name="monitor_heart" className="text-[12px]" />
                      Operational Status
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12 bg-white/[0.03] border-white/10 focus:ring-primary">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-slate-950 border-white/10">
                        <SelectItem value="DRAFT">Draft</SelectItem>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="CLOSED">Closed</SelectItem>
                        <SelectItem value="EMERGENCY_SHUTDOWN" className="text-red-500 font-bold">
                          Emergency Shutdown
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-[10px] leading-relaxed">
                      &quot;Emergency Shutdown&quot; will instantly revoke all ticket scanning capabilities for this facility.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <SheetFooter className="pt-8 border-t border-white/5">
                <Button type="submit" disabled={isPending} className="w-full h-12 text-[10px] font-black uppercase tracking-widest gap-2 bg-primary text-primary-foreground hover:scale-[1.02] transition-transform">
                  {isPending ? (
                    <Icon name="progress_activity" className="text-[14px] animate-spin" />
                  ) : (
                    <Icon name="settings" className="text-[14px]" />
                  )}
                  Update System Rules
                </Button>
              </SheetFooter>
            </form>
          </Form>
        </div>
      </SheetContent>
    </Sheet>
  )
}
