export const DAY_LABELS: Record<string, string> = {
  ALL: "Svi dani",
  WEEKDAY: "Radni dan",
  WEEKEND: "Vikend",
  HOLIDAY: "Praznik",
};

export const TIME_LABELS: Record<string, string> = {
  FULL_DAY: "Ceo dan",
  AFTER_16H: "Posle 16h",
  THREE_HOUR: "3 sata",
};

export const DAY_OPTIONS = [
  { value: "ALL", label: "Svi dani" },
  { value: "WEEKDAY", label: "Radni dan" },
  { value: "WEEKEND", label: "Vikend" },
  { value: "HOLIDAY", label: "Praznik" },
] as const;

export const TIME_OPTIONS = [
  { value: "FULL_DAY", label: "Ceo dan" },
  { value: "AFTER_16H", label: "Posle 16h" },
  { value: "THREE_HOUR", label: "3 sata" },
] as const;

export const DAY_TYPE_VALUES = ["ALL", "WEEKDAY", "WEEKEND", "HOLIDAY"] as const;
export const TIME_SLOT_VALUES = ["FULL_DAY", "AFTER_16H", "THREE_HOUR"] as const;
export const VALIDITY_TYPE_VALUES = ["FIXED_DATE", "FLEXIBLE_30_DAY", "SUMMER_SEASON"] as const;
