export const CHECKOUT_TERMINAL_STATUSES = [
  "FAILED",
  "CANCELLED",
  "EXPIRED",
  "PAID_REVIEW",
] as const;

export type CheckoutTerminalStatus = (typeof CHECKOUT_TERMINAL_STATUSES)[number];

export type CheckoutTerminalMessages = Partial<Record<CheckoutTerminalStatus, string>>;

/** ~2 minutes at 3s interval (plus slower retries on transient errors). */
export const MAX_CHECKOUT_STATUS_POLLS = 40;

export function isCheckoutTerminalStatus(status: string): status is CheckoutTerminalStatus {
  return (CHECKOUT_TERMINAL_STATUSES as readonly string[]).includes(status);
}

/**
 * Resolve a terminal checkout message from the dictionary slice.
 * Messages live in dictionaries/rs.json → success.terminal — not hard-coded here.
 */
export function getCheckoutTerminalMessage(
  status: string,
  messages?: CheckoutTerminalMessages | null,
): string | null {
  if (!isCheckoutTerminalStatus(status)) return null;
  const message = messages?.[status];
  return message && message.trim().length > 0 ? message : null;
}

export function shouldRetryCheckoutStatus(httpStatus: number) {
  return httpStatus === 429 || httpStatus >= 500;
}

export function hasExceededCheckoutStatusPolls(attempt: number) {
  return attempt >= MAX_CHECKOUT_STATUS_POLLS;
}
