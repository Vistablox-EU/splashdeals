"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfileNameAction } from "@/app/(server)/actions/favorites";
import { toast } from "sonner";

export function ProfileNameForm({
  initialName,
  labels,
}: {
  initialName: string;
  labels: {
    name: string;
    save: string;
    saving: string;
    success: string;
  };
}) {
  const [name, setName] = useState(initialName);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const result = await updateProfileNameAction(name);
          if (!result.success) {
            toast.error(result.error || "Greška pri čuvanju");
            return;
          }
          toast.success(labels.success);
          router.refresh();
        });
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="profile-name">{labels.name}</Label>
        <Input
          id="profile-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
          className="h-11"
          required
        />
      </div>
      <Button type="submit" disabled={isPending} className="h-11 min-h-11">
        {isPending ? labels.saving : labels.save}
      </Button>
    </form>
  );
}
