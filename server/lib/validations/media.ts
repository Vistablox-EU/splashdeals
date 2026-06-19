import { z } from "zod"

export const mediaUploadSchema = z.object({
  url: z.string().url("Invalid image URL format").optional().or(z.literal("")),
  base64: z.string().optional(),
  fileName: z.string().optional(),
  type: z.enum(["PHOTO", "VIDEO"]).default("PHOTO"),
  purpose: z.enum(["GALLERY", "HERO_ONLY", "TICKET", "AERIAL"]).default("GALLERY"),
  caption: z.string().max(300, "Caption is too long").nullish(),
  isHero: z.boolean().default(false),
  isCardBackground: z.boolean().default(false),
})

export type MediaUploadValues = z.infer<typeof mediaUploadSchema>

export const renameMediaSchema = z.object({
  mediaId: z.string().uuid(),
  facilityId: z.string().uuid(),
  newName: z
    .string()
    .trim()
    .min(2, "Ime fajla mora imati najmanje 2 karaktera")
    .max(100, "Ime fajla je predugačko (max 100 karaktera)")
    .regex(
      /^[a-zA-Z0-9_\-\p{Script=Latin}]+$/u,
      "Dozvoljena su samo slova, brojevi, crtice i donje crte"
    ),
})

export type RenameMediaValues = z.infer<typeof renameMediaSchema>
