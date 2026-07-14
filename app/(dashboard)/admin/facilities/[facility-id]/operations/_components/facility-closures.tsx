"use client";

import * as React from "react";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  addFacilityClosureAction,
  removeFacilityClosureAction,
} from "@/app/(server)/actions/closures";

interface Closure {
  id: string;
  startDate: Date;
  endDate: Date;
  reason: string | null;
  isEmergency: boolean;
}

interface FacilityClosuresSectionProps {
  facilityId: string;
  initialClosures: Closure[];
}

export function FacilityClosuresSection({
  facilityId,
  initialClosures,
}: FacilityClosuresSectionProps) {
  const router = useRouter();
  const [closures, setClosures] = React.useState<Closure[]>(initialClosures);
  const [isAdding, setIsAdding] = React.useState(false);
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  async function handleAdd() {
    if (!startDate || !endDate) {
      toast.error("Unesite datum početka i završetka.");
      return;
    }
    if (new Date(endDate) <= new Date(startDate)) {
      toast.error("Datum završetka mora biti posle datuma početka.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await addFacilityClosureAction({
        facilityId,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        reason: reason || null,
      });

      if (result.success && result.data) {
        toast.success("Zatvaranje dodato.");
        setStartDate("");
        setEndDate("");
        setReason("");
        setIsAdding(false);
        router.refresh();
      } else {
        toast.error((result as { error?: string }).error || "Greška pri dodavanju zatvaranja.");
      }
    } catch {
      toast.error("Greška pri dodavanju zatvaranja.");
    } finally {
      setIsSubmitting(false);
      setClosures(await fetchUpdatedClosures());
    }
  }

  async function fetchUpdatedClosures(): Promise<Closure[]> {
    // Refresh from server — the page re-renders with fresh data
    router.refresh();
    return closures;
  }

  async function handleRemove(closureId: string) {
    try {
      const result = await removeFacilityClosureAction(closureId, facilityId);
      if (result.success) {
        toast.success("Zatvaranje uklonjeno.");
        setClosures((prev) => prev.filter((c) => c.id !== closureId));
        router.refresh();
      } else {
        toast.error(result.error || "Greška pri uklanjanju zatvaranja.");
      }
    } catch {
      toast.error("Greška pri uklanjanju zatvaranja.");
    }
  }

  return (
    <Card className="border-border/50 bg-background/40 space-y-4 p-4">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Icon name="event_busy" className="text-destructive size-3.5" />
          <h3 className="text-foreground/70 text-[10px] font-black tracking-widest uppercase">
            Scheduled Closures
          </h3>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-6 gap-1 px-2 text-[9px] font-black tracking-widest uppercase"
          onClick={() => setIsAdding(!isAdding)}
        >
          <Icon name="add" className="text-[10px]" />
          {isAdding ? "Cancel" : "Add Closure"}
        </Button>
      </header>

      {isAdding && (
        <div className="border-border/50 bg-muted/20 space-y-4 rounded-lg border p-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="closure-start"
                className="text-[10px] font-bold tracking-wider uppercase"
              >
                Start Date
              </Label>
              <Input
                id="closure-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="closure-end"
                className="text-[10px] font-bold tracking-wider uppercase"
              >
                End Date
              </Label>
              <Input
                id="closure-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label
              htmlFor="closure-reason"
              className="text-[10px] font-bold tracking-wider uppercase"
            >
              Reason (optional)
            </Label>
            <Textarea
              id="closure-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Scheduled maintenance, seasonal closure, etc."
              className="h-16 resize-none text-xs"
              maxLength={200}
            />
          </div>
          <Button
            type="button"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            disabled={isSubmitting}
            onClick={handleAdd}
          >
            {isSubmitting ? (
              <Icon name="progress_activity" className="size-3.5 animate-spin" />
            ) : (
              <Icon name="check" className="size-3.5" />
            )}
            Save Closure
          </Button>
        </div>
      )}

      {closures.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
          <Icon name="event_busy" className="text-muted-foreground/40 size-6" />
          <p className="text-muted-foreground text-xs font-medium">No scheduled closures</p>
          <p className="text-muted-foreground/60 text-[10px]">
            Add closure periods for maintenance or seasonal shutdowns
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {closures
            .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
            .map((closure) => (
              <div
                key={closure.id}
                className="border-border/50 bg-background/40 flex items-center justify-between rounded-lg border p-3"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-foreground text-[11px] font-bold">
                      {new Date(closure.startDate).toLocaleDateString("sr-RS")}
                    </span>
                    <span className="text-muted-foreground text-[9px]">→</span>
                    <span className="text-foreground text-[11px] font-bold">
                      {new Date(closure.endDate).toLocaleDateString("sr-RS")}
                    </span>
                    {closure.isEmergency && (
                      <span className="bg-destructive/10 text-destructive rounded-full px-1.5 py-0.5 text-[8px] font-black tracking-wider uppercase">
                        Emergency
                      </span>
                    )}
                  </div>
                  {closure.reason && (
                    <p className="text-muted-foreground text-[10px]">{closure.reason}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive h-7 w-7"
                  onClick={() => handleRemove(closure.id)}
                >
                  <Icon name="delete" className="size-3.5" />
                </Button>
              </div>
            ))}
        </div>
      )}
    </Card>
  );
}
