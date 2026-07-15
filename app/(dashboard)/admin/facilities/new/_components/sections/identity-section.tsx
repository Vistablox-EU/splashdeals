"use client";

import { Icon } from "@/components/ui/Icon";
import { useFormContext } from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { FacilityFormValues } from "@/app/(server)/lib/validations/facility";
import { buildPublicFacilityPath } from "@/lib/routing/public-facility-path";

interface IdentitySectionProps {
  isSlugLocked: boolean;
  setIsSlugLocked: (locked: boolean) => void;
  onNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function IdentitySection({
  isSlugLocked,
  setIsSlugLocked,
  onNameChange,
}: IdentitySectionProps) {
  const { control } = useFormContext<FacilityFormValues>();

  return (
    <Card className="border-border/50 bg-muted/50 overflow-hidden backdrop-blur-md">
      <CardHeader className="border-border/50 bg-muted/30 border-b">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icon name="business" className="text-primary text-[20px]" />
          Identitet
        </CardTitle>
        <CardDescription>
          Javno ime i URL objekta. Treba jasno da opiše destinaciju.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        <FormField
          control={control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Naziv objekta</FormLabel>
              <FormControl>
                <Input
                  placeholder="npr. AquaPark Petroland"
                  className="bg-muted/30 border-border h-12"
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    onNameChange(e);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL slug</FormLabel>
              <FormControl>
                <div className="group relative">
                  <Icon
                    name="link"
                    className="text-muted-foreground absolute top-4 left-3 text-[16px]"
                  />
                  <Input
                    placeholder="aquapark-petroland"
                    className="bg-muted/30 border-border h-12 pr-10 pl-9"
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      if (isSlugLocked) setIsSlugLocked(false);
                    }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground absolute top-2 right-1 h-8 w-8"
                    onClick={() => setIsSlugLocked(!isSlugLocked)}
                    title={isSlugLocked ? "Otključaj slug" : "Zaključaj slug"}
                    aria-label={isSlugLocked ? "Otključaj slug" : "Zaključaj slug"}
                  >
                    {isSlugLocked ? (
                      <Icon name="lock" className="text-[14px]" />
                    ) : (
                      <Icon name="lock_open" className="text-muted-foreground text-[14px]" />
                    )}
                  </Button>
                </div>
              </FormControl>
              <FormDescription className="text-muted-foreground text-xs italic">
                Javna putanja:{" "}
                <strong>splashdeals.rs{buildPublicFacilityPath(field.value || "slug")}</strong>
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}
