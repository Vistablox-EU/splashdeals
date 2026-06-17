import { ZodError } from "zod"
import { Prisma } from "@prisma/client"
import { AUTH_ERROR } from "@/server/lib/error-messages"

export interface ActionResult<T = void> {
  success: boolean
  data?: T
  error?: string
  fieldErrors?: Record<string, string[]>
}

/**
 * 🌊 Standardized Server Action Error Handler
 * Maps low-level exceptions to user-friendly Serbian messages and field-level feedback.
 * @param context Optional action name for logging (e.g., "createFacility").
 */
export function handleServerActionError<T = void>(error: unknown, context?: string): ActionResult<T> {
  const tag = context ? `[ServerAction:${context}]` : "[ServerAction]";

  if (error instanceof ZodError) {
    const fieldErrors: Record<string, string[]> = {}
    for (const issue of error.issues) {
      const path = issue.path.join(".")
      if (!fieldErrors[path]) fieldErrors[path] = []
      fieldErrors[path].push(issue.message)
    }
    console.warn(`${tag} Zod validation failed:`, error.issues)
    return { 
      success: false, 
      fieldErrors,
      error: "Proverite unete podatke." 
    }
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    console.warn(`${tag} Prisma error (${error.code}):`, error.message)
    if (error.code === "P2002") {
      const target = (error.meta?.target as string[])?.join(", ")
      return { 
        success: false, 
        error: `Unos sa istom vrednošću već postoji (${target || "jedinstveni ključ"}).` 
      }
    }
    if (error.code === "P2025") {
      return { 
        success: false, 
        error: "Traženi zapis nije pronađen." 
      }
    }
    if (error.code === "P2003") {
      return {
        success: false,
        error: "Referencirani zapis ne postoji (pogrešan ID grada ili veze)."
      }
    }
    return { 
      success: false, 
      error: "Došlo je do greške u bazi podataka." 
    }
  }

  if (error instanceof Error) {
    if (error.message === AUTH_ERROR.REQUIRED) {
      console.warn(`${tag} Auth required`)
      return { success: false, error: "Niste prijavljeni." }
    }
    if (error.message?.startsWith("Unauthorized")) {
      console.warn(`${tag} Unauthorized: ${error.message}`)
      return { success: false, error: "Nemate dozvolu za ovu akciju." }
    }
    
    console.warn(`${tag} ${error.message}`)
    return { success: false, error: error.message }
  }

  console.error(`${tag} Unhandled error:`, error)
  return { success: false, error: "Došlo je do neočekivane greške." }
}
