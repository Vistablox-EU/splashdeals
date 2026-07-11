"use client";

import * as React from "react";
import { Icon } from "@/components/ui/Icon";
import { useFieldArray, useFormContext, useForm, FormProvider } from "react-hook-form";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { FormField } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { UpdateFacilityGovernanceValues } from "@/server/lib/validations/facility";
import { updateFacilityOperationsAction } from "@/server/actions/governance";
import { DAYS_SR_OBJECTS } from "@/lib/utils/date-time";

const DAYS = DAYS_SR_OBJECTS;

function StandaloneOperationsTable({
  facilityId,
  initialHours,
}: {
  facilityId: string;
  initialHours: UpdateFacilityGovernanceValues["hours"];
}) {
  const methods = useForm<UpdateFacilityGovernanceValues>({
    defaultValues: {
      hours: initialHours || [],
    },
  });

  return (
    <FormProvider {...methods}>
      <OperationsTableInner facilityId={facilityId} initialHours={initialHours} />
    </FormProvider>
  );
}

/**
 * 🕒 OperationsTable
 * Handles weekly availability patterns.
 */
function OperationsTable({
  facilityId,
  initialHours,
}: {
  facilityId: string;
  initialHours: UpdateFacilityGovernanceValues["hours"];
}) {
  const context = useFormContext<UpdateFacilityGovernanceValues>();
  if (!context) {
    return <StandaloneOperationsTable facilityId={facilityId} initialHours={initialHours} />;
  }
  return <OperationsTableInner facilityId={facilityId} initialHours={initialHours} />;
}

function OperationsTableInner({
  facilityId,
}: {
  facilityId: string;
  initialHours: UpdateFacilityGovernanceValues["hours"];
}) {
  const {
    control,
    watch,
    setValue,
    getValues,
    formState: { isDirty },
  } = useFormContext<UpdateFacilityGovernanceValues>();
  const [isPending, setIsPending] = React.useState(false);
  const router = useRouter();

  const { fields, append, remove } = useFieldArray({
    control,
    name: "hours",
  });

  // Warn user before leaving if form is dirty
  React.useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  async function onSave() {
    setIsPending(true);
    try {
      const values = getValues();
      const result = await updateFacilityOperationsAction({
        facilityId,
        hours: values.hours,
      });

      if (result.success) {
        toast.success("Operational windows updated");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to update schedule");
      }
    } catch {
      toast.error("Failed to persist operational data");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Card className="border-border/50 bg-background/40 space-y-4 p-4">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Icon name="schedule" className="text-warning size-3.5" />
          <h3 className="text-foreground/70 text-[10px] font-black tracking-widest uppercase">
            Institutional Availability Patterns
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {fields.length > 0 && (
            <Button
              type="button"
              variant="link"
              size="sm"
              className="text-primary flex items-center gap-1 text-[9px] font-black tracking-tighter uppercase hover:underline"
              onClick={() => {
                const first = getValues("hours.0");
                if (!first) return;
                const updatedHours = DAYS.map((d) => ({
                  dayOfWeek: d.value,
                  openTime: first.openTime,
                  closeTime: first.closeTime,
                  isClosed: first.isClosed,
                }));
                setValue("hours", updatedHours, { shouldDirty: true });
                toast.success("Schedule synchronized across nodes");
              }}
            >
              <Icon name="undo" className="text-[10px]" />
              Sync Cluster
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={fields.length >= 7}
            onClick={() => {
              const selectedDays = getValues("hours")?.map((h) => h.dayOfWeek) || [];
              const firstAvailable = DAYS.find((d) => !selectedDays.includes(d.value));
              if (firstAvailable) {
                append({
                  dayOfWeek: firstAvailable.value,
                  openTime: "09:00",
                  closeTime: "21:00",
                  isClosed: false,
                });
              }
            }}
            className="border-border/50 bg-muted/30 hover:bg-muted/50 h-6 gap-1 border px-2 text-[9px] font-black tracking-widest uppercase disabled:opacity-30"
          >
            <Icon name="add" className="text-[10px]" />
            Node
          </Button>
        </div>
      </header>

      {fields.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
          <Icon name="schedule" className="text-muted-foreground/40 text-[32px]" />
          <p className="text-muted-foreground text-xs font-medium">No operating hours configured</p>
          <p className="text-muted-foreground/60 text-[10px]">
            Click &quot;Add Node&quot; to set operating days and hours
          </p>
        </div>
      )}

      {fields.length > 0 && (
        <div className="border-border/50 bg-background/40 overflow-hidden rounded-lg border">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-border/50 bg-muted/30 border-b">
                <th className="text-muted-foreground w-[120px] px-3 py-2 text-[9px] font-black tracking-widest uppercase">
                  Domain
                </th>
                <th className="text-muted-foreground px-3 py-2 text-[9px] font-black tracking-widest uppercase">
                  Logistics
                </th>
                <th className="text-muted-foreground w-[60px] px-3 py-2 text-right text-[9px] font-black tracking-widest uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-border/50 divide-y">
              {fields.map((field, index) => {
                const isClosed = watch(`hours.${index}.isClosed`);
                return (
                  <tr key={field.id} className="group hover:bg-muted/10 transition-colors">
                    <td className="px-3 py-2">
                      <FormField
                        control={control}
                        name={`hours.${index}.dayOfWeek`}
                        render={({ field }) => (
                          <Select
                            onValueChange={(val) => field.onChange(parseInt(val))}
                            value={field.value?.toString()}
                          >
                            <SelectTrigger className="h-7 border-none bg-transparent p-0 text-[11px] font-black tracking-tight uppercase focus:ring-0">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-muted border-border">
                              {DAYS.map((day) => (
                                <SelectItem
                                  key={day.value}
                                  value={day.value.toString()}
                                  className="text-[10px] font-black tracking-widest uppercase"
                                >
                                  {day.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <div
                        className={cn(
                          "flex items-center gap-3 transition-opacity duration-300",
                          isClosed ? "pointer-events-none opacity-20" : "opacity-100",
                        )}
                      >
                        <FormField
                          control={control}
                          name={`hours.${index}.openTime`}
                          render={({ field }) => (
                            <Input
                              type="time"
                              {...field}
                              className="bg-background/60 border-border/50 h-7 w-24 px-2 font-mono text-[11px]"
                            />
                          )}
                        />
                        <span className="text-[9px] font-black tracking-tighter uppercase opacity-30">
                          to
                        </span>
                        <FormField
                          control={control}
                          name={`hours.${index}.closeTime`}
                          render={({ field }) => (
                            <Input
                              type="time"
                              {...field}
                              className="bg-background/60 border-border/50 h-7 w-24 px-2 font-mono text-[11px]"
                            />
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
                              className="border-border data-[state=checked]:border-destructive data-[state=checked]:bg-destructive size-4"
                            />
                          )}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          type="button"
                          onClick={() => remove(index)}
                          className="text-muted-foreground opacity-0 transition-all group-hover:opacity-100 hover:text-rose-500"
                        >
                          <Icon name="delete" className="text-[12px]" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Button
        type="button"
        onClick={onSave}
        disabled={!isDirty || isPending}
        className={cn(
          "h-9 w-full gap-2 text-[9px] font-black tracking-[0.2em] uppercase shadow-lg",
          isDirty
            ? "bg-warning text-warning-foreground hover:bg-warning/90"
            : "bg-muted/30 text-muted-foreground",
        )}
      >
        {isPending ? (
          <Icon name="progress_activity" className="animate-spin text-[12px]" />
        ) : (
          <Icon name="save" className="text-[12px]" />
        )}
        Persist Schedule
      </Button>
    </Card>
  );
}
export { OperationsTable };
