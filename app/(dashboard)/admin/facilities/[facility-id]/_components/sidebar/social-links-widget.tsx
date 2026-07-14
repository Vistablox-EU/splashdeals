"use client";
import { Icon } from "@/components/ui/Icon";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateFacilitySocialLinksAction } from "@/app/(server)/actions/governance";
import { toast } from "sonner";

interface SocialLinksWidgetProps {
  facilityId: string;
  initialSocialLinks: Record<string, string | undefined>;
}

export function SocialLinksWidget({ facilityId, initialSocialLinks }: SocialLinksWidgetProps) {
  const [isPending, startTransition] = useTransition();
  const [links, setLinks] = useState({
    instagram: initialSocialLinks?.instagram || "",
    facebook: initialSocialLinks?.facebook || "",
    website: initialSocialLinks?.website || "",
  });

  // Track save status per field to show green checkmarks
  const [saveStatus, setSaveStatus] = useState<Record<string, boolean>>({});

  const handleBlur = (field: string) => {
    const value = links[field as keyof typeof links];
    if (value && !value.startsWith("http://") && !value.startsWith("https://")) {
      toast.error("Unesite validan URL koji počinje sa http:// ili https://");
      return;
    }
    startTransition(async () => {
      const result = await updateFacilitySocialLinksAction(facilityId, links);
      if (result.success) {
        setSaveStatus((prev) => ({ ...prev, [field]: true }));
        setTimeout(() => {
          setSaveStatus((prev) => ({ ...prev, [field]: false }));
        }, 2000);
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
            <Icon name="photo_camera" className="text-primary text-[14px]" />
          </div>
          <h3 className="text-foreground text-[10px] font-black tracking-widest uppercase">
            Društvene mreže
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
              Instagram URL
            </Label>
            {saveStatus.instagram && <Icon name="check" className="text-primary text-[12px]" />}
          </div>
          <Input
            value={links.instagram}
            onChange={(e) => setLinks((prev) => ({ ...prev, instagram: e.target.value }))}
            onBlur={() => handleBlur("instagram")}
            className="bg-background/40 border-border/50 focus-visible:ring-ring h-9 text-xs"
            placeholder="https://instagram.com/..."
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-muted-foreground text-[9px] font-black tracking-widest uppercase">
              Facebook URL
            </Label>
            {saveStatus.facebook && <Icon name="check" className="text-primary text-[12px]" />}
          </div>
          <Input
            value={links.facebook}
            onChange={(e) => setLinks((prev) => ({ ...prev, facebook: e.target.value }))}
            onBlur={() => handleBlur("facebook")}
            className="bg-background/40 border-border/50 focus-visible:ring-ring h-9 text-xs"
            placeholder="https://facebook.com/..."
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-muted-foreground text-[9px] font-black tracking-widest uppercase">
              Zvanični sajt
            </Label>
            {saveStatus.website && <Icon name="check" className="text-primary text-[12px]" />}
          </div>
          <Input
            value={links.website}
            onChange={(e) => setLinks((prev) => ({ ...prev, website: e.target.value }))}
            onBlur={() => handleBlur("website")}
            className="bg-background/40 border-border/50 focus-visible:ring-ring h-9 text-xs"
            placeholder="https://..."
          />
        </div>
      </div>
    </Card>
  );
}
