import "server-only";

// ── Core ──────────────────────────────────────────────────────
export { auth } from "./auth";
export { prisma } from "./prisma";
export { AUTH_ERROR } from "./error-messages";

// ── Auth Guards ──────────────────────────────────────────────
export { requireAdmin, requireSuperAdmin, validateFacilityAccess } from "./auth-guards";

// ── Actions ──────────────────────────────────────────────────
export { validateAction } from "./actions/validator";
export { subscribeToNewsletter } from "./actions/newsletter";

// ── Email ────────────────────────────────────────────────────
export { sendEmail, sendOrderConfirmation, sendRecoveryEmail } from "./email";

// ── Stripe ───────────────────────────────────────────────────
export { generateIdempotencyKey, withStripeRetry } from "./stripe-utils";

// ── Media ────────────────────────────────────────────────────
export { processImageToWebP, generateThumbnail, processTicketImage } from "./media";

// ── Utilities ────────────────────────────────────────────────
export { handleServerActionError } from "./server-action-error";
export type { ActionResult } from "./server-action-error";
export { withFacilityAccess } from "./with-facility-access";
export { hashApiKey, generateApiKey, authenticateRequest } from "./api-key-auth";

// ── Admin Bootstrap ──────────────────────────────────────────
export { bootstrapSuperAdmin } from "./admin-bootstrap";

// ── Discovery Data ───────────────────────────────────────────
export { getActiveCities, getDiscoveryCategories, validateDiscoverySlug } from "./data/discovery";

// ── Seasonal ─────────────────────────────────────────────────
export {
  getSummerSeasonEnd,
  getSummerSeasonStart,
  getNextSubscriptionExpiry,
} from "./utils/seasonal";

// ── Revalidation ─────────────────────────────────────────────
export {
  revalidateAdmin,
  revalidateAdminFacilities,
  revalidateAdminFacility,
  revalidateAdminAmenities,
  revalidateAdminMedia,
  revalidateAdminUsers,
} from "./revalidation";
