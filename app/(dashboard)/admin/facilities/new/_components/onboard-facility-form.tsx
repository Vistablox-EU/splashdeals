"use client"

import { Icon } from "@/components/ui/Icon";
import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { createFacilityAction } from "@/server/actions/facilities"
import { facilitySchema, type FacilityFormValues } from "@/server/lib/validations/facility"

import { IdentitySection } from "./sections/identity-section"
import { LocalizationSection } from "./sections/localization-section"
import { ConfigurationSection } from "./sections/configuration-section"

/**
 * 🌊 Aquastream Onboarding System
 * specialized form for institutional-grade facility registration.
 */
export function OnboardFacilityForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState("")
  const [isSlugLocked, setIsSlugLocked] = useState(true)

  const form = useForm<FacilityFormValues>({
    resolver: zodResolver(facilitySchema),
    defaultValues: {
      name: "",
      slug: "",
      category: "",
      city: "",
      streetName: "",
      streetNumber: "",
      postalCode: "",
      status: "DRAFT",
    },
  })

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value
    form.setValue("name", newName)
    
    if (isSlugLocked) {
      const autoSlug = newName
        .toLowerCase()
        .trim()
        .replace(/[\s\W-]+/g, "-")
        .replace(/^-+|-+$/g, "")
      
      form.setValue("slug", autoSlug, { shouldValidate: true })
    }
  }

  async function onSubmit(values: FacilityFormValues) {
    setIsSubmitting(true)
    setServerError("")
    
    const result = await createFacilityAction(values)
    
    if (result?.success) {
      const { id } = result as { success: true; id: string }
      router.push(`/admin/facilities/${id}`)
    } else {
      const error = result && "error" in result ? (result as { success: false; error: string }).error : null
      setServerError(error || "Failed to create facility.")
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form 
        onSubmit={form.handleSubmit(onSubmit)} 
        className="space-y-6 mt-4"
        aria-label="Onboard New Facility Form"
      >
        
        {serverError && (
          <div className="p-4 bg-destructive/15 text-destructive border border-destructive/20 rounded-xl text-sm font-medium animate-in fade-in slide-in-from-top-2">
            {serverError}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-2 space-y-6">
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
              className="w-full h-14 rounded-xl bg-white text-black font-bold text-base hover:bg-muted transition-all hover:scale-[1.01] active:scale-[0.99] shadow-xl shadow-white/5" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Icon name="progress_activity" className="mr-2 text-[20px] animate-spin" />
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
  )
}
