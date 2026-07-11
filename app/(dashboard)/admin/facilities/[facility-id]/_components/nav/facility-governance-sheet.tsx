"use client";

import { Icon } from "@/components/ui/Icon";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { z } from "zod";

// Narrowed schema for strictly administrative governance
const adminGovernanceSchema = z.object({
  facilityId: z.string().uuid(),
  status: z.enum(["DRAFT", "ACTIVE", "CLOSED", "EMERGENCY_SHUTDOWN"]),
});

type AdminGovernanceValues = z.infer<typeof adminGovernanceSchema>;

// Import the dedicated status action for efficiency
import { updateFacilityStatusAction } from "@/server/actions/governance";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { FacilityStatus } from "@prisma/client";

interface FacilityGovernanceSheetProps {
  facility: {
    id: string;
    name: string;
    status: FacilityStatus;
  };
}

export function FacilityGovernanceSheet({ facility }: FacilityGovernanceSheetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<AdminGovernanceValues>({
    resolver: zodResolver(adminGovernanceSchema),
    defaultValues: {
      facilityId: facility.id,
      status: facility.status,
    },
  });

  function onSubmit(values: AdminGovernanceValues) {
    startTransition(async () => {
      const result = await updateFacilityStatusAction(values);

      if (result.success) {
        toast.success("Status operativnosti ažuriran");
        setIsOpen(false);
        router.refresh();
      } else {
        toast.error(result.error || "Greška pri ažuriranju statusa");
      }
    });
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-border hover:bg-muted/30 gap-2 text-[10px] font-black tracking-widest uppercase transition-all"
        >
          <Icon name="settings" className="text-[16px]" />
          Napredno upravljanje
        </Button>
      </SheetTrigger>
      <SheetContent className="bg-background/95 border-border/50 w-full overflow-y-auto p-8 shadow-2xl backdrop-blur-2xl sm:max-w-[440px]">
        <SheetHeader className="border-border/50 border-b pb-8">
          <SheetTitle className="flex items-center gap-2 text-xl font-black tracking-tighter">
            <Icon name="gpp_maybe" className="text-primary text-[20px]" />
            Sistemsko upravljanje
          </SheetTitle>
          <SheetDescription className="text-xs font-bold tracking-widest uppercase opacity-50">
            Administrativne kontrole i upravljanje registrom.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-8 py-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-[10px] font-black tracking-widest uppercase opacity-60">
                      <Icon name="monitor_heart" className="text-[12px]" />
                      Operativni status
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-muted/20 border-border focus:ring-primary h-12">
                          <SelectValue placeholder="Izaberite status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-background border-border">
                        <SelectItem value="DRAFT">Draft (Skica)</SelectItem>
                        <SelectItem value="ACTIVE">Aktivno</SelectItem>
                        <SelectItem value="CLOSED">Zatvoreno</SelectItem>
                        <SelectItem
                          value="EMERGENCY_SHUTDOWN"
                          className="text-destructive font-bold"
                        >
                          Hitno gašenje
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-[10px] leading-relaxed">
                      &quot;Hitno gašenje&quot; će trenutno povući sve mogućnosti skeniranja
                      ulaznica za ovaj objekat.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <SheetFooter className="border-border/50 border-t pt-8">
                <Button
                  type="submit"
                  disabled={isPending}
                  className="bg-primary text-primary-foreground h-12 w-full gap-2 text-[10px] font-black tracking-widest uppercase transition-transform hover:scale-[1.02]"
                >
                  {isPending ? (
                    <Icon name="progress_activity" className="animate-spin text-[14px]" />
                  ) : (
                    <Icon name="settings" className="text-[14px]" />
                  )}
                  Ažuriraj pravila sistema
                </Button>
              </SheetFooter>
            </form>
          </Form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
