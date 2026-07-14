import { z } from "zod";
import { requireAdmin } from "@/app/(server)/lib/auth-guards";

/**
 * 🛡️ Server Action Validator
 * Ensures that every server action is authenticated and its input is strictly validated.
 * Delegates auth to requireAdmin() from auth-guards for consistent enforcement.
 */
export async function validateAction<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown,
): Promise<
  | {
      success: true;
      data: z.infer<T>;
      userId: string;
    }
  | {
      success: false;
      error: string;
    }
> {
  try {
    const user = await requireAdmin();

    const validatedData = await schema.parseAsync(data);

    return {
      success: true,
      data: validatedData,
      userId: user.id,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
      return { success: false, error: `VALIDATION_ERROR: ${issues}` };
    }
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return {
      success: false,
      error: "INTERNAL_ERROR: An unexpected error occurred during action validation.",
    };
  }
}
