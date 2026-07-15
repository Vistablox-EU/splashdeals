/**
 * Serbian user-facing error copy for MegaMenu load failures.
 * Prefer dictionary keys; fall back to hard-coded Serbian (never English).
 */
export function megaMenuLoadFailedMessage(
  dict?: {
    mega_menu?: {
      load_failed?: string;
      load_failed_generic?: string;
    };
  } | null,
): string {
  return dict?.mega_menu?.load_failed ?? "Učitavanje navigacije nije uspelo";
}

export function megaMenuLoadFailedGenericMessage(
  dict?: {
    mega_menu?: {
      load_failed?: string;
      load_failed_generic?: string;
    };
  } | null,
  err?: unknown,
): string {
  // Never surface raw English Error.message to the UI
  if (err instanceof Error && /[а-шА-ШćčžšđĆČŽŠĐ]/.test(err.message)) {
    return err.message;
  }
  return dict?.mega_menu?.load_failed_generic ?? "Učitavanje menija nije uspelo";
}
