/**
 * Calculates the DST (summer time) end date in Central Europe (Serbia).
 * Rule: Last Sunday of October at 03:00 AM — clocks fall back to winter time.
 * Note: This is the daylight-saving period end, not the tourist season end.
 */
export function getSummerSeasonEnd(year: number): Date {
  // Start with October 31st
  const date = new Date(year, 9, 31, 3, 0, 0, 0); // Month is 0-indexed (9 = Oct)

  // Find the last Sunday
  const day = date.getDay(); // 0 = Sunday
  date.setDate(31 - day);

  return date;
}

/**
 * Calculates the DST (summer time) start date in Central Europe (Serbia).
 * Rule: Last Sunday of March at 02:00 AM — clocks spring forward.
 * Note: This is the daylight-saving period start, not the tourist season start.
 */
export function getSummerSeasonStart(year: number): Date {
  // Start with March 31st
  const date = new Date(year, 2, 31, 2, 0, 0, 0); // Month is 0-indexed (2 = Mar)

  // Find the last Sunday
  const day = date.getDay(); // 0 = Sunday
  date.setDate(31 - day);

  return date;
}

/**
 * Helper to determine if the subscription should expire in the current year or the next.
 * If we are already past the summer end of the current year, the next subscription
 * should likely target the next year's season.
 */
export function getNextSubscriptionExpiry(year: number, now: Date): Date {
  const currentEnd = getSummerSeasonEnd(year);

  if (now > currentEnd) {
    return getSummerSeasonEnd(year + 1);
  }

  return currentEnd;
}
