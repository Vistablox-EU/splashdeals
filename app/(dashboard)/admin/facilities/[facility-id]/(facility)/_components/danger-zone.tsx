"use client"
import { Icon } from "@/components/ui/Icon";

import * as React from "react"
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { GlassCard } from "@/components/ui/GlassCard"
import { deleteFacilityAction } from "@/server/actions/facilities"

interface DangerZoneProps {
  facilityId: string
  facilityName: string
  userRole: string
  transactionCount: number
}

/**
 * ⚠️ DangerZone Component (Aquastream UI Pro Max)
 * 
 * Implements high-friction, Super Admin-gated deletion with cascade transaction safeguards.
 * Respects strict color-ban rules (Absolutely NO purple/indigo/violet).
 */
export function DangerZone({
  facilityId,
  facilityName,
  userRole,
  transactionCount,
}: DangerZoneProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [confirmName, setConfirmName] = useState("")
  const [isOpen, setIsOpen] = useState(false)

  const isSuperAdmin = userRole === "SUPER_ADMIN"
  const hasTransactions = transactionCount > 0

  const handleDelete = () => {
    if (confirmName !== facilityName) {
      toast.error("Verification name does not match.")
      return
    }

    startTransition(async () => {
      try {
        const result = await deleteFacilityAction(facilityId)
        if (result.success) {
          toast.success("Facility successfully purged")
          setIsOpen(false)
          router.push("/admin/facilities")
          router.refresh()
        } else {
          toast.error(result.error || "Failed to purge facility")
        }
      } catch {
        toast.error("An anomaly occurred during deletion.")
      }
    })
  }

  return (
    <GlassCard className="p-6 border-rose-500/20 bg-rose-950/5 backdrop-blur-md space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-rose-500/10">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-rose-500/10">
            <Icon name="warning" className="text-[16px] text-rose-400" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-white">Danger Zone</h3>
            <p className="text-[9px] font-bold text-rose-400/60 uppercase tracking-widest mt-0.5">Catastrophic Actions & Registry Purges</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {!isSuperAdmin ? (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-950/40 border border-white/5">
            <Icon name="lock" className="text-[16px] text-slate-400 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="text-xs font-black uppercase tracking-wider text-slate-300">Administrative Guard Active</p>
              <p className="text-[10px] text-slate-500 font-medium leading-normal">
                Your role classification ({userRole}) does not possess elevated privileges required to delete facility nodes. Contact a Super Administrator to execute purges.
              </p>
            </div>
          </div>
        ) : hasTransactions ? (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-950/40 border border-rose-500/10">
            <Icon name="lock" className="text-[16px] text-rose-400 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="text-xs font-black uppercase tracking-wider text-rose-400">Deletion Locked</p>
              <p className="text-[10px] text-slate-400 font-medium leading-normal leading-relaxed">
                This facility is linked to <strong className="text-white">{transactionCount} active or historical transaction records</strong> in the system ledger.
                Hard deletion is disabled to preserve accounting audits. Set the facility status to <strong className="text-white">CLOSED</strong> instead.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-slate-950/40 border border-rose-500/10">
            <div className="space-y-1 max-w-xl">
              <p className="text-xs font-black uppercase tracking-wider text-white">Purge Facility Node</p>
              <p className="text-[10px] text-slate-400 font-medium leading-normal">
                Permanently delete <strong className="text-slate-300">{facilityName}</strong> along with all associated tickets, operating hours, amenities, closures, and staff assignments. This action is absolute and cannot be undone.
              </p>
            </div>

            <Dialog open={isOpen} onOpenChange={(open) => {
              setIsOpen(open)
              if (!open) setConfirmName("")
            }}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  type="button"
                  className="h-10 px-6 shrink-0 border-rose-500/20 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-slate-950 font-black uppercase tracking-widest text-[9px] rounded-xl transition-all duration-300"
                >
                  <Icon name="delete" className="size-3.5 mr-2" />
                  Purge Node
                </Button>
              </DialogTrigger>

              <DialogContent className="bg-slate-950 border-white/10 text-white max-w-md rounded-2xl p-6 outline-none">
                <DialogHeader className="space-y-3">
                  <div className="flex items-center gap-2 text-rose-400">
                    <Icon name="warning" className="size-5 shrink-0" />
                    <DialogTitle className="text-base font-black uppercase tracking-wider">Absolute Purge Registry</DialogTitle>
                  </div>
                  <DialogDescription className="text-xs text-slate-400 leading-normal">
                    This action is <strong className="text-rose-400 uppercase">destructive</strong> and will completely wipe <strong className="text-white">{facilityName}</strong> from the database. It will immediately cascade to delete:
                  </DialogDescription>
                </DialogHeader>

                <div className="py-2 space-y-2">
                  <ul className="text-[9px] font-mono text-slate-400 list-disc pl-5 space-y-1 uppercase tracking-wider">
                    <li>All pricing schemas & active tickets</li>
                    <li>Schedules, hours & closure exceptions</li>
                    <li>Media associations & gallery images</li>
                    <li>Staff assignments & local registry records</li>
                  </ul>

                  <div className="space-y-2 pt-4 border-t border-white/5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      To confirm, type the exact facility name <span className="text-white select-none">&quot;{facilityName}&quot;</span> below:
                    </label>
                    <Input
                      value={confirmName}
                      onChange={(e) => setConfirmName(e.target.value)}
                      placeholder={facilityName}
                      className="bg-white/5 border-white/10 text-white text-xs h-10 px-3 rounded-lg focus:border-rose-500/50"
                      disabled={isPending}
                    />
                  </div>
                </div>

                <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsOpen(false)
                      setConfirmName("")
                    }}
                    className="h-10 border-white/5 bg-white/5 hover:bg-white/10 text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all"
                    disabled={isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleDelete}
                    disabled={isPending || confirmName !== facilityName}
                    className="h-10 bg-rose-600 hover:bg-rose-500 disabled:bg-rose-950/20 disabled:text-rose-900/50 text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center min-w-[120px]"
                  >
                    {isPending ? (
                      <Icon name="progress_activity" className="size-3.5 animate-spin" />
                    ) : (
                      <>
                        <Icon name="delete" className="size-3.5 mr-2" />
                        Purge Facility
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>
    </GlassCard>
  )
}
