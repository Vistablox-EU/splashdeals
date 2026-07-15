/**
 * Shared pure helpers for CMS post/page editors (desktop admin).
 */

export function countImagesWithoutAlt(html: string): number {
  if (!html) return 0;
  const regex = /<img\s[^>]*>/gi;
  let match: RegExpExecArray | null;
  let count = 0;
  while ((match = regex.exec(html)) !== null) {
    const tag = match[0];
    if (!/alt\s*=\s*["']/i.test(tag)) {
      count++;
    }
  }
  return count;
}

export function toDatetimeLocal(iso: Date | string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatScheduledDate(dt: string): string {
  try {
    const d = new Date(dt);
    if (isNaN(d.getTime())) return dt;
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}. u ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return dt;
  }
}

export type CmsPostListRow = {
  id: string;
  title: string;
  slug: string;
  status: string;
  isFeatured?: boolean;
  isStale?: boolean;
  readingTime?: number | null;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string | null;
  reviewedAt?: string | null;
  category?: { id: string; name: string; slug: string; color?: string | null } | null;
  _count?: { tags?: number };
};

export const CMS_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Nacrt",
  REVIEW: "Na pregledu",
  PUBLISHED: "Objavljeno",
  PUBLISHED_PENDING: "Zakazano",
  ARCHIVED: "Arhivirano",
};
