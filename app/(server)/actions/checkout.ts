"use server";

import { createCheckoutSession } from "@/server/lib/stripe-checkout";
import { handleServerActionError, type ActionResult } from "@/server/lib/server-action-error";
import { sendOrderConfirmation } from "@/server/lib/email";
import {
  validatePromoCodeAction,
  incrementCampaignUsageAction,
} from "@/app/(server)/actions/campaigns";
import { auth } from "@/server/lib/auth";
import { headers } from "next/headers";

/**
 * 🌊 Initialise a Stripe Checkout session from the cart.
 *
 * Validates items, builds Stripe line items, creates a PENDING transaction,
 * and returns the Stripe Checkout redirect URL.
 *
 * Requires the user to be authenticated via social auth.
 * Called from CartClient.tsx — the client clears the cart and redirects
 * the browser to the returned URL.
 */
export async function createCheckoutSessionAction(params: {
  items: { ticketPriceId: string; quantity: number }[];
  holderName?: string | null;
  holderPhotoUrl?: string | null;
  promoCode?: string | null;
  campaignId?: string | null;
}): Promise<ActionResult<{ url: string }>> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return { success: false, error: "Morate biti prijavljeni da biste nastavili kupovinu." };
    }

    const result = await createCheckoutSession({
      ...params,
      userId: session.user.id,
      email: session.user.email,
    });
    return { success: true, data: { url: result.url } };
  } catch (error) {
    return handleServerActionError(error, "checkout");
  }
}

/**
 * 📧 Resends the order confirmation email for a given transaction.
 * Called from the success page when the user clicks "Pošalji ponovo na email".
 */
export async function resendConfirmationAction(
  transactionId: string,
): Promise<ActionResult<{ sent: boolean }>> {
  try {
    await sendOrderConfirmation(transactionId);
    return { success: true, data: { sent: true } };
  } catch (error) {
    return handleServerActionError(error, "resendConfirmation");
  }
}

/**
 * 🏷️ Validates a promo code and returns discount info.
 * Used by CartClient.tsx to validate the code before sending it to checkout.
 * Also used internally by createCheckoutSession during checkout.
 */
export async function validateAndApplyPromoAction(
  code: string,
  facilityId?: string,
  totalAmount?: number,
): Promise<
  ActionResult<{
    valid: boolean;
    discountPercent?: number;
    campaignId?: string;
    error?: string;
  }>
> {
  return validatePromoCodeAction(code, facilityId, totalAmount);
}

/**
 * 📈 Increments campaign usage after a successful checkout.
 */
export async function applyPromoUsageAction(campaignId: string): Promise<ActionResult> {
  return incrementCampaignUsageAction(campaignId);
}
