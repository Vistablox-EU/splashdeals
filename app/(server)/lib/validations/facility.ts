import { z } from "zod";
import { getAllDbCategoryValues } from "@/lib/routing/categories";

const FACILITY_CATEGORY_VALUES = getAllDbCategoryValues() as [string, ...string[]];

export const facilitySchema = z.object({
  name: z.string().trim().min(2, "Naziv je prekratak"),
  slug: z.string().trim().min(2, "Slug je prekratak"),
  category: z
    .string()
    .trim()
    .refine((v) => FACILITY_CATEGORY_VALUES.includes(v), {
      message: "Izaberite validnu kategoriju",
    }),
  city: z.string().trim().min(2, "Grad je obavezan"),
  cityId: z.string().trim().optional(),
  streetName: z.string().trim().min(2, "Ulica je obavezna"),
  streetNumber: z.string().trim().min(1, "Broj je obavezan"),
  postalCode: z.string().trim().min(4, "Poštanski broj je obavezan"),
  status: z.enum(["DRAFT", "ACTIVE"]),
});

export type FacilityFormValues = z.infer<typeof facilitySchema>;

export const updateFacilityGovernanceSchema = z.object({
  facilityId: z.string(),
  name: z.string().trim().min(2, "Name is too short"),
  slug: z.string().trim().min(2, "Slug is too short"),
  description: z
    .string()
    .trim()
    .max(2000)
    .refine((val) => val.length === 0 || val.length >= 10, {
      message: "Description must be at least 10 characters",
    }),
  city: z.string().trim().min(2, "City is required"),
  streetName: z.string().trim().min(2, "Street name is required"),
  streetNumber: z.string().trim().min(1, "Number is required"),
  postalCode: z.string().trim().min(4, "Postal code is required"),
  hours: z.array(
    z.object({
      dayOfWeek: z.number().min(0).max(6),
      openTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid open time format (HH:mm)"),
      closeTime: z
        .string()
        .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid close time format (HH:mm)"),
      isClosed: z.boolean().default(false),
    }),
  ),
  status: z.enum(["DRAFT", "ACTIVE", "CLOSED", "EMERGENCY_SHUTDOWN"]).optional(),
  metaTitle: z.string().trim().max(70, "SEO Title is too long (max 70 chars)").nullish(),
  metaDescription: z.string().trim().max(160, "SEO Description is too long").nullish(),
  logoUrl: z.string().trim().nullish(),
  publicPhone: z.string().trim().max(25, "Phone number is too long").nullish(),
  publicEmail: z.string().trim().email("Invalid email format").nullish().or(z.literal("")),
  socialLinks: z
    .object({
      facebook: z.string().trim().url("Invalid Facebook URL").nullish().or(z.literal("")),
      instagram: z.string().trim().url("Invalid Instagram URL").nullish().or(z.literal("")),
      website: z.string().trim().url("Invalid Website URL").nullish().or(z.literal("")),
    })
    .default({}),
  emergencyContact: z.string().trim().max(200, "Contact info is too long").nullish(),
  seoArticle: z.string().trim().max(10000, "SEO Article is too long").nullish(),
  transitGuide: z.string().trim().max(3000, "Transit guide is too long").nullish(),
});

export type UpdateFacilityGovernanceValues = z.infer<typeof updateFacilityGovernanceSchema>;

export const updateFacilityAmenitiesSchema = z.object({
  facilityId: z.string().uuid(),
  lastUpdatedAt: z.string().nullish(),
  amenities: z.array(
    z.object({
      amenityId: z.string(),
      name: z.string().min(1, "Name is required"),
      category: z.string().nullish(),
      icon: z.string(),
      type: z.enum(["QUANTIFIABLE", "BOOLEAN", "TEXT"]),
      checked: z.boolean(),
      value: z.string().max(100, "Metadata is too long (max 100 chars)").nullish(),
      displayOrder: z.number().int(),
      isNew: z.boolean().optional(),
      isSeeded: z.boolean().optional(),
      coverage: z.array(z.string()).optional(),
      totalFacilities: z.number().int().optional(),
      isFeatured: z.boolean().default(false),
      scheduledAt: z.string().datetime().nullish(),
      imageUrl: z.string().nullish(),
    }),
  ),
});

export type UpdateFacilityAmenitiesValues = z.infer<typeof updateFacilityAmenitiesSchema>;

export const updateFacilityStatusSchema = z.object({
  facilityId: z.string().uuid(),
  status: z.enum(["DRAFT", "ACTIVE", "CLOSED", "EMERGENCY_SHUTDOWN"]),
});

export type UpdateFacilityStatusValues = z.infer<typeof updateFacilityStatusSchema>;

export const updateFacilityOperationsSchema = z.object({
  facilityId: z.string().uuid(),
  hours: z.array(
    z.object({
      dayOfWeek: z.number().min(0).max(6),
      openTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid open time format (HH:mm)"),
      closeTime: z
        .string()
        .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid close time format (HH:mm)"),
      isClosed: z.boolean(),
    }),
  ),
});

export type UpdateFacilityOperationsValues = z.infer<typeof updateFacilityOperationsSchema>;
