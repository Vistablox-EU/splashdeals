"use client"
import { Icon } from "@/components/ui/Icon";

import * as React from "react"
import { useFieldArray, useFormContext, useForm, FormProvider } from "react-hook-form"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { FormField } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { GlassCard } from "@/components/ui/GlassCard"
import { cn } from "@/lib/utils"
import { UpdateFacilityGovernanceValues } from "@/server/lib/validations/facility"
import { updateFacilityOperationsAction } from "@/server/actions/governance"
import { DAYS_SR_OBJECTS } from "@/lib/utils/date-time"

const DAYS = DAYS_SR_OBJECTS

function StandaloneOperationsTable({ facilityId, initialHours }: { facilityId: string, initialHours: UpdateFacilityGovernanceValues["hours"] }) {
  const methods = useForm<UpdateFacilityGovernanceValues>({
    defaultValues: {
      hours: initialHours || [],
    },
  })
  
  return (
    <FormProvider {...methods}>
      <OperationsTableInner facilityId={facilityId} initialHours={initialHours} />
    </FormProvider>
  )
}

/** 
 * 🕒 OperationsTable
 * Handles weekly availability patterns.
 */
function OperationsTable({ facilityId, initialHours }: { facilityId: string, initialHours: UpdateFacilityGovernanceValues["hours"] }) {
  const context = useFormContext<UpdateFacilityGovernanceValues>()
  if (!context) {
    return <StandaloneOperationsTable facilityId={facilityId} initialHours={initialHours} />
  }
  return <OperationsTableInner facilityId={facilityId} initialHours={initialHours} />
}

function OperationsTableInner({ facilityId, initialHours }: { facilityId: string, initialHours: UpdateFacilityGovernanceValues["hours"] }) {
  const { control, watch, setValue, getValues, formState: { isDirty } } = useFormContext<UpdateFacilityGovernanceValues>()
  const [isPending, setIsPending] = React.useState(false)
  const router = useRouter()
  
  const { fields, append, remove } = useFieldArray({
    control,
    name: "hours",
  })

  async function onSave() {
    setIsPending(true)
    try {
      const values = getValues()
      const result = await updateFacilityOperationsAction({
        facilityId,
        hours: values.hours
      })
      
      if (result.success) {
        toast.success("Operational windows updated")
        router.refresh()
      } else {
        toast.error(result.error || "Failed to update schedule")
      }
    } catch (_err) {
      toast.error("Failed to persist operational data")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <GlassCard className="p-4 border-white/5 bg-slate-950/40 space-y-4">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Icon name="schedule" className="size-3.5 text-amber-400" />
          <h3 className="text-[10px] font-black uppercase tracking-widest text-white/70">Institutional Availability Patterns</h3>
        </div>
        <div className="flex items-center gap-2">
          {fields.length > 0 && (
            <button
              type="button"
              onClick={() => {
                const first = getValues("hours.0")
                if (!first) return
                const updatedHours = DAYS.map(d => ({
                  dayOfWeek: d.value,
                  openTime: first.openTime,
                  closeTime: first.closeTime,
                  isClosed: first.isClosed
                }))
                setValue("hours", updatedHours, { shouldDirty: true })
                toast.success("Schedule synchronized across nodes")
              }}
              className="text-[9px] font-black uppercase tracking-tighter text-cyan-400 hover:underline flex items-center gap-1"
            >
              <Icon name="undo" className="text-[10px]" />
              Sync Cluster
            </button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={fields.length >= 7}
            onClick={() => {
              const selectedDays = getValues("hours")?.map(h => h.dayOfWeek) || []
              const firstAvailable = DAYS.find(d => !selectedDays.includes(d.value))
              if (firstAvailable) {
                append({ dayOfWeek: firstAvailable.value, openTime: "09:00", closeTime: "21:00", isClosed: false })
              }
            }}
            className="h-6 px-2 border border-white/5 bg-white/5 hover:bg-white/10 text-[9px] font-black uppercase tracking-widest gap-1 disabled:opacity-30"
          >
            <Icon name="add" className="text-[10px]" />
            Node
          </Button>
        </div>
      </header>

      <div className="rounded-lg border border-white/5 bg-slate-950/40 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 bg-white/5">
              <th className="px-3 py-2 text-[9px] font-black uppercase tracking-widest text-muted-foreground w-[120px]">Domain</th>
              <th className="px-3 py-2 text-[9px] font-black uppercase tracking-widest text-muted-foreground">Logistics</th>
              <th className="px-3 py-2 text-[9px] font-black uppercase tracking-widest text-muted-foreground text-right w-[60px]">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {fields.map((field, index) => {
              const isClosed = watch(`hours.${index}.isClosed`)
              return (
                <tr key={field.id} className="group hover:bg-white/[0.02] transition-colors">
                  <td className="px-3 py-2">
                    <FormField
                      control={control}
                      name={`hours.${index}.dayOfWeek`}
                      render={({ field }) => (
                        <Select 
                          onValueChange={(val) => field.onChange(parseInt(val))} 
                          value={field.value?.toString()}
                        >
                          <SelectTrigger className="h-7 border-none bg-transparent focus:ring-0 text-[11px] font-black uppercase tracking-tight p-0">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900 border-white/10">
                            {DAYS.map(day => (
                              <SelectItem key={day.value} value={day.value.toString()} className="text-[10px] font-black uppercase tracking-widest">
                                {day.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <div className={cn(
                      "flex items-center gap-3 transition-opacity duration-300",
                      isClosed ? "opacity-20 pointer-events-none" : "opacity-100"
                    )}>
                      <FormField
                        control={control}
                        name={`hours.${index}.openTime`}
                        render={({ field }) => (
                          <Input type="time" {...field} className="h-7 w-24 bg-slate-950/60 border-white/5 text-[11px] font-mono px-2" />
                        )}
                      />
                      <span className="text-[9px] font-black opacity-30 tracking-tighter uppercase">to</span>
                      <FormField
                        control={control}
                        name={`hours.${index}.closeTime`}
                        render={({ field }) => (
                          <Input type="time" {...field} className="h-7 w-24 bg-slate-950/60 border-white/5 text-[11px] font-mono px-2" />
                        )}
                      />
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <FormField
                        control={control}
                        name={`hours.${index}.isClosed`}
                        render={({ field }) => (
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="size-4 border-white/10 data-[state=checked]:bg-rose-500 data-[state=checked]:border-rose-500"
                          />
                        )}
                      />
                      <button 
                        type="button"
                        onClick={() => remove(index)}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-rose-500 transition-all"
                      >
                        <Icon name="delete" className="text-[12px]" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <Button
        type="button"
        onClick={onSave}
        disabled={!isDirty || isPending}
        className={cn(
          "w-full h-9 text-[9px] font-black uppercase tracking-[0.2em] gap-2 shadow-lg",
          isDirty ? "bg-amber-500 text-slate-950 hover:bg-amber-400" : "bg-white/5 text-muted-foreground"
        )}
      >
        {isPending ? <Icon name="progress_activity" className="text-[12px] animate-spin" /> : <Icon name="save" className="text-[12px]" />}
        Persist Schedule
      </Button>
    </GlassCard>
  )
}
export { OperationsTable }
