"use client";

import { Icon } from "@/components/ui/Icon";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { createFacilityAction } from "@/app/(server)/actions/facilities";
import { toast } from "sonner";
import { facilitySchema, type FacilityFormValues } from "@/app/(server)/lib/validations/facility";

import { IdentitySection } from "./sections/identity-section";
import { LocalizationSection } from "./sections/localization-section";
import { ConfigurationSection } from "./sections/configuration-section";

/**
 * Type guard: checks if the server action returned a successful creation result.
 */
function isSuccessResponse(result: unknown): result is { success: true; id: string } {
  return (
    typeof result === "object" &&
    result !== null &&
    "success" in result &&
    (result as Record<string, unknown>).success === true &&
    typeof (result as Record<string, unknown>).id === "string"
  );
}

/**
 * Type guard: checks if the server action returned an error result.
 */
function hasError(result: unknown): result is { success: false; error: string } {
  return (
    typeof result === "object" &&
    result !== null &&
    "success" in result &&
    (result as Record<string, unknown>).success === false &&
    typeof (result as Record<string, unknown>).error === "string"
  );
}

/**
 * 🌊 Aquastream Onboarding System
 * specialized form for institutional-grade facility registration.
 */
export function OnboardFacilityForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [isSlugLocked, setIsSlugLocked] = useState(true);

  const form = useForm<FacilityFormValues>({
    resolver: zodResolver(facilitySchema),
    defaultValues: {
      name: "",
      slug: "",
      category: "Akva Park",
      city: "",
      streetName: "",
      streetNumber: "",
      postalCode: "",
      status: "DRAFT",
    },
  });

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    form.setValue("name", newName);

    if (isSlugLocked) {
      const autoSlug = newName
        .toLowerCase()
        .trim()
        .replace(/[\s\W-]+/g, "-")
        .replace(/^-+|-+$/g, "");

      form.setValue("slug", autoSlug, { shouldValidate: true });
    }
  };

  async function onSubmit(values: FacilityFormValues) {
    setIsSubmitting(true);
    setServerError("");

    const result = await createFacilityAction(values);

    if (isSuccessResponse(result)) {
      const { id } = result;
      toast.success("Facility created successfully");
      router.push(`/admin/facilities/${id}`);
    } else if (hasError(result)) {
      setServerError(result.error);
      setIsSubmitting(false);
    } else {
      setServerError("Failed to create facility.");
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="mt-4 space-y-6"
        aria-label="Onboard New Facility Form"
      >
        {serverError && (
          <div className="bg-destructive/15 text-destructive border-destructive/20 animate-in fade-in slide-in-from-top-2 rounded-xl border p-4 text-sm font-medium">
            {serverError}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <IdentitySection
              isSlugLocked={isSlugLocked}
              setIsSlugLocked={setIsSlugLocked}
              onNameChange={handleNameChange}
            />

            <LocalizationSection />
          </div>

          <div className="space-y-6">
            <ConfigurationSection />

            <Button
              type="submit"
              size="lg"
              className="hover:bg-muted bg-foreground text-background shadow-foreground/5 h-14 w-full rounded-xl text-base font-bold shadow-xl transition-colors hover:scale-[1.01] active:scale-[0.99]"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Icon name="progress_activity" className="mr-2 animate-spin text-[20px]" />
                  Generating Workspace...
                </>
              ) : (
                <>
                  <Icon name="save" className="mr-2 text-[20px]" />
                  Save & Initialize Facility
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
