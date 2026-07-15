const TERMINAL_STATUS_MESSAGES: Record<string, string> = {
  FAILED: "Plaćanje nije uspelo. Vaša korpa je sačuvana.",
  CANCELLED: "Plaćanje je otkazano. Vaša korpa je sačuvana.",
  EXPIRED: "Vreme za plaćanje je isteklo. Vaša korpa je sačuvana.",
  PAID_REVIEW:
    "Plaćanje je primljeno, ali je potrebna dodatna provera. Naš tim će vas kontaktirati.",
};

/** ~2 minutes at 3s interval (plus slower retries on transient errors). */
export const MAX_CHECKOUT_STATUS_POLLS = 40;

export const CHECKOUT_STATUS_STILL_PROCESSING_MESSAGE =
  "Još uvek obrađujemo plaćanje. Ako ste naplatili, karte će stići na email. Osvežite stranicu ili kontaktirajte podršku.";

export function isCheckoutTerminalStatus(status: string) {
  return Object.hasOwn(TERMINAL_STATUS_MESSAGES, status);
}

export function getCheckoutTerminalMessage(status: string) {
  return TERMINAL_STATUS_MESSAGES[status] ?? null;
}

export function shouldRetryCheckoutStatus(httpStatus: number) {
  return httpStatus === 429 || httpStatus >= 500;
}

export function hasExceededCheckoutStatusPolls(attempt: number) {
  return attempt >= MAX_CHECKOUT_STATUS_POLLS;
}
