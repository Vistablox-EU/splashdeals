import { z } from "zod"

/**
 * Validates a blob-storage filename (without extension).
 * No path separators, no special chars, 2-100 chars, alphanumeric + hyphens/underscores.
 */
export const imageFileNameSchema = z
  .string()
  .trim()
  .min(2, "Ime fajla mora imati najmanje 2 karaktera")
  .max(100, "Ime fajla je predugačko (max 100 karaktera)")
  .regex(
    /^[a-zA-Z0-9_\-\p{Script=Latin}]+$/u,
    "Dozvoljena su samo slova, brojevi, crtice i donje crte"
  )

export const renameTicketImageSchema = z.object({
  facilityId: z.string().uuid(),
  currentUrl: z.string().url("Neispravan URL slike"),
  newName: imageFileNameSchema,
})

export type RenameTicketImageValues = z.infer<typeof renameTicketImageSchema>
