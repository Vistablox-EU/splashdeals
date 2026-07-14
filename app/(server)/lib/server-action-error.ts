import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { AUTH_ERROR } from "@/app/(server)/lib/error-messages";

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  conflict?: boolean;
  fieldErrors?: Record<string, string[]>;
}

/**
 * Standardized Server Action Error Handler
 * Maps low-level exceptions to user-friendly messages.
 * When `dict` is provided, uses dictionary keys for localized error messages.
 */
export function handleServerActionError<T = void>(
  error: unknown,
  context?: string,
  dict?: Record<string, any>,
): ActionResult<T> {
  const tag = context ? `[ServerAction:${context}]` : "[ServerAction]";
  const msg = dict?.errors;

  if (error instanceof ZodError) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of error.issues) {
      const path = issue.path.join(".");
      if (!fieldErrors[path]) fieldErrors[path] = [];
      fieldErrors[path].push(issue.message);
    }
    console.warn(`${tag} Zod validation failed:`, error.issues);
    return {
      success: false,
      fieldErrors,
      error: msg?.validation || "Please check your input.",
    };
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    console.warn(`${tag} Prisma error (${error.code}):`, error.message);
    if (error.code === "P2002") {
      const target = (error.meta?.target as string[])?.join(", ");
      return {
        success: false,
        error: msg?.unique_violation
          ? msg.unique_violation.replace("{key}", target || "unique key")
          : `An entry with the same value already exists (${target || "unique key"}).`,
      };
    }
    if (error.code === "P2025") {
      return {
        success: false,
        error: msg?.not_found || "Record not found.",
      };
    }
    if (error.code === "P2003") {
      return {
        success: false,
        error:
          msg?.reference_invalid ||
          "Referenced record does not exist (invalid city ID or relation).",
      };
    }
    return {
      success: false,
      error: msg?.database || "A database error occurred.",
    };
  }

  if (error instanceof Error) {
    if (error.message === AUTH_ERROR.REQUIRED) {
      console.warn(`${tag} Auth required`);
      return { success: false, error: msg?.auth_required || "You are not logged in." };
    }
    if (error.message?.startsWith("Unauthorized")) {
      console.warn(`${tag} Unauthorized: ${error.message}`);
      return {
        success: false,
        error: msg?.forbidden || "You do not have permission for this action.",
      };
    }

    console.warn(`${tag} ${error.message}`);
    return { success: false, error: error.message };
  }

  console.error(`${tag} Unhandled error:`, error);
  return { success: false, error: msg?.unexpected || "An unexpected error occurred." };
}
