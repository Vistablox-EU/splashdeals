/**
 * Shared day/time slot labels for facility ticketing UI (Serbian Latin).
 * Prefer dictionary overrides when available; these are the canonical defaults.
 */

export const DAY_TYPE_LABELS: Record<string, string> = {
  ALL: "Svi dani",
  WEEKDAY: "Radni dan",
  WEEKEND: "Vikend",
};

export const TIME_SLOT_LABELS: Record<string, string> = {
  FULL_DAY: "Ceo dan",
  AFTER_16H: "Posle 16h",
  THREE_HOUR: "3 sata",
};

export function getDayTypeLabel(
  dayType: string | null | undefined,
  overrides?: Partial<Record<string, string>>,
): string {
  const key = dayType ?? "ALL";
  return overrides?.[key] || DAY_TYPE_LABELS[key] || DAY_TYPE_LABELS.ALL;
}

export function getTimeSlotLabel(
  timeSlot: string | null | undefined,
  overrides?: Partial<Record<string, string>>,
): string {
  const key = timeSlot ?? "FULL_DAY";
  return overrides?.[key] || TIME_SLOT_LABELS[key] || TIME_SLOT_LABELS.FULL_DAY;
}
