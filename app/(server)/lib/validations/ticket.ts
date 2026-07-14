import * as z from "zod";
import { TicketType, ValidityType, DayType, TimeSlot } from "@prisma/client";

export const ticketSchema = z
  .object({
    title: z.string().trim().min(3, "Naziv mora imati najmanje 3 karaktera"),
    type: z.nativeEnum(TicketType),
    price: z.coerce.number().min(0),
    originalPrice: z.coerce.number().min(0).optional().nullable(),
    currency: z.string().default("RSD"),
    validityType: z.nativeEnum(ValidityType),
    isActive: z.boolean().default(true),
    isFeatured: z.boolean().default(false),
    displayOrder: z.coerce.number().default(0),
    saleStart: z.string().optional().nullable(),
    saleEnd: z.string().optional().nullable(),
    description: z.string().trim().optional().nullable(),
    imageUrl: z
      .string()
      .trim()
      .url("Molimo unesite ispravan URL slike")
      .optional()
      .nullable()
      .or(z.literal("")),
    finePrint: z.string().trim().optional().nullable(),
    dayType: z.nativeEnum(DayType).default(DayType.ALL),
    timeSlot: z.nativeEnum(TimeSlot).default(TimeSlot.FULL_DAY),
    isSeasonPass: z.boolean().default(false),
    minPeople: z.coerce.number().min(1).default(1),
    maxPeople: z.coerce.number().optional().nullable(),
    requiresIdentity: z.boolean().default(false),
    requiresPhoto: z.boolean().default(false),
    groupId: z.string().optional().nullable(),
    slug: z.string().trim().optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.saleStart && data.saleEnd) {
        return new Date(data.saleEnd) > new Date(data.saleStart);
      }
      return true;
    },
    {
      message: "Sale end must be after sale start",
      path: ["saleEnd"],
    },
  );

export type TicketFormValues = z.input<typeof ticketSchema>;

export const upsertTicketSchema = ticketSchema.safeExtend({
  id: z.string().optional(),
  facilityId: z.string(),
});

export type UpsertTicketValues = z.input<typeof upsertTicketSchema>;

// --- TicketGroup & TicketTier Schemas ---

export const groupTicketSchema = ticketSchema.safeExtend({
  id: z.string().optional(),
  facilityId: z.string().optional(),
  groupId: z.string().optional(),
  // Label maps to Title
  label: z.string().optional(),
});

export type GroupTicketValues = z.input<typeof groupTicketSchema>;
export type TicketTierValues = GroupTicketValues; // Compatibility alias

export const ticketGroupSchema = z.object({
  id: z.string().optional(),
  facilityId: z.string(),
  title: z.string().min(3, "Naziv mora imati najmanje 3 karaktera"),
  description: z.string().optional().nullable(),
  displayOrder: z.coerce.number().default(0),
  isActive: z.boolean().default(true),
  slug: z.string().optional().nullable(),
  tickets: z.array(groupTicketSchema).optional(),
});

export type TicketGroupValues = z.input<typeof ticketGroupSchema>;

export const reorderSchema = z.object({
  groupId: z.string(),
  ids: z.array(z.string()),
});

export type ReorderValues = z.infer<typeof reorderSchema>;

export const slugSchema = z.object({
  slug: z.string(),
});
