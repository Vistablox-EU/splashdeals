"use client";
import { Icon } from "@/components/ui/Icon";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateFacilityContactAction } from "@/server/actions/governance";
import { toast } from "sonner";

interface PublicContactWidgetProps {
  facilityId: string;
  initialContact: {
    publicPhone?: string | null;
    publicEmail?: string | null;
  };
}

export function PublicContactWidget({ facilityId, initialContact }: PublicContactWidgetProps) {
  const [isPending, startTransition] = useTransition();
  const [contact, setContact] = useState({
    publicPhone: initialContact?.publicPhone || "",
    publicEmail: initialContact?.publicEmail || "",
  });

  const [saveStatus, setSaveStatus] = useState<Record<string, boolean>>({});

  const handleBlur = (field: string) => {
    startTransition(async () => {
      const result = await updateFacilityContactAction(facilityId, contact);
      if (result.success) {
        setSaveStatus((prev) => ({ ...prev, [field]: true }));
        setTimeout(() => setSaveStatus((prev) => ({ ...prev, [field]: false })), 2000);
        toast.success("Sačuvano");
      } else {
        toast.error("Greška pri čuvanju " + field);
      }
    });
  };

  return (
    <Card className="border-border bg-muted/40 p-5 backdrop-blur-sm">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 rounded-lg p-1.5">
            <Icon name="phone" className="text-primary text-[14px]" />
          </div>
          <h3 className="text-foreground text-[10px] font-black tracking-widest uppercase">
            Javni kontakt
          </h3>
        </div>
        {isPending && (
          <Icon
            name="progress_activity"
            className="text-muted-foreground animate-spin text-[12px]"
          />
        )}
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-muted-foreground text-[9px] font-black tracking-widest uppercase">
              Broj telefona
            </Label>
            {saveStatus.publicPhone && <Icon name="check" className="text-primary text-[12px]" />}
          </div>
          <Input
            value={contact.publicPhone}
            onChange={(e) => setContact((prev) => ({ ...prev, publicPhone: e.target.value }))}
            onBlur={() => handleBlur("publicPhone")}
            className="bg-background/40 border-border/50 focus-visible:ring-ring h-9 text-xs"
            placeholder="+381..."
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-muted-foreground text-[9px] font-black tracking-widest uppercase">
              Javni email
            </Label>
            {saveStatus.publicEmail && <Icon name="check" className="text-primary text-[12px]" />}
          </div>
          <Input
            value={contact.publicEmail}
            onChange={(e) => setContact((prev) => ({ ...prev, publicEmail: e.target.value }))}
            onBlur={() => handleBlur("publicEmail")}
            className="bg-background/40 border-border/50 focus-visible:ring-ring h-9 text-xs"
            placeholder="info@park.rs"
          />
        </div>
      </div>
    </Card>
  );
}
