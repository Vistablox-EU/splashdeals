const TERMINAL_STATUS_MESSAGES: Record<string, string> = {
  FAILED: "Plaćanje nije uspelo. Vaša korpa je sačuvana.",
  CANCELLED: "Plaćanje je otkazano. Vaša korpa je sačuvana.",
  EXPIRED: "Vreme za plaćanje je isteklo. Vaša korpa je sačuvana.",
  PAID_REVIEW:
    "Plaćanje je primljeno, ali je potrebna dodatna provera. Naš tim će vas kontaktirati.",
};

export function isCheckoutTerminalStatus(status: string) {
  return Object.hasOwn(TERMINAL_STATUS_MESSAGES, status);
}

export function getCheckoutTerminalMessage(status: string) {
  return TERMINAL_STATUS_MESSAGES[status] ?? null;
}

export function shouldRetryCheckoutStatus(httpStatus: number) {
  return httpStatus === 429 || httpStatus >= 500;
}
