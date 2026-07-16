export const CMS_STATUS_BADGE_VARIANT = (status: string): "default" | "secondary" | "outline" => {
  switch (status) {
    case "PUBLISHED":
      return "default";
    case "DRAFT":
    case "REVIEW":
      return "secondary";
    case "ARCHIVED":
      return "outline";
    default:
      return "outline";
  }
};

export function formatCmsDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("sr-RS", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}
