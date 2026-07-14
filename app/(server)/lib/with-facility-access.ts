import { validateFacilityAccess, type AuthedUser } from "@/app/(server)/lib/auth-guards";
import { handleServerActionError } from "@/app/(server)/lib/server-action-error";

/**
 * 🌊 Action Authorization Wrapper
 * Encapsulates RBAC and facility ownership checks for Server Actions.
 * Reduces boilerplate and ensures consistent security enforcement.
 * Auth failures are caught and returned as structured ActionResult errors.
 */
type ActionHandler<TInput, TOutput> = (input: TInput, user: AuthedUser) => Promise<TOutput>;

export function withFacilityAccess<TInput extends { facilityId: string }, TOutput>(
  handler: ActionHandler<TInput, TOutput>,
): (input: TInput) => Promise<TOutput> {
  return async (input: TInput): Promise<TOutput> => {
    try {
      const user = await validateFacilityAccess(input.facilityId);
      return handler(input, user);
    } catch (error) {
      return handleServerActionError(error) as TOutput;
    }
  };
}
