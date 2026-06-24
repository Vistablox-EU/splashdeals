"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";
import { NavigationMenuLink } from "@/components/ui/navigation-menu";
import type { LinkMetadata } from "./types";

// ── Helpers ────────────────────────────────────────────────────────

function BadgeChip({ badge }: { badge: LinkMetadata["badge"] }) {
  if (!badge) return null;

  const config: Record<string, { label: string; className: string }> = {
    new: {
      label: badge.text || "Novo",
      className: "bg-cyan-500/15 text-cyan-500 border-cyan-500/20",
    },
    sale: {
      label: badge.text || "Akcija",
      className: "bg-red-500/15 text-red-500 border-red-500/20",
    },
    popular: {
      label: badge.text || "Popularno",
      className: "bg-amber-500/15 text-amber-500 border-amber-500/20",
    },
    soon: {
      label: badge.text || "Uskoro",
      className:
        "bg-purple-500/15 text-purple-500 border-purple-500/20 border-dashed",
    },
    custom: {
      label: badge.text || "",
      className: "bg-primary/10 text-primary border-primary/20",
    },
  };

  const cfg = config[badge.type] || config.custom;

  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold rounded-full border ${cfg.className}`}
    >
      {cfg.label}
    </span>
  );
}

// ── Components ─────────────────────────────────────────────────────

export function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="mb-3 font-semibold text-muted-foreground text-sm">
      {children}
    </h4>
  );
}

export function NavItemLink({
  href,
  icon,
  title,
  desc,
  metadata,
}: {
  href: string | null;
  icon?: string | null;
  title: string;
  desc?: string | null;
  metadata?: LinkMetadata | null;
}) {
  const md = metadata || {};
  const isFeatured = md.variant === "featured";
  const isCta = md.variant === "cta";
  const isExternal = !!md.external;
  const isDisabled = !href || href === "#";

  const linkContent = (
    <div className="flex flex-row items-start gap-2 rounded-sm p-2 text-sm transition-all outline-none group w-full">
      {md.accentColor && (
        <span
          className="w-0.5 shrink-0 self-stretch rounded-full mt-0.5"
          style={{ backgroundColor: md.accentColor }}
        />
      )}
      {icon && <Icon name={icon} className="size-5 shrink-0 mt-0.5" />}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="block font-medium truncate">{title}</span>
          <BadgeChip badge={md.badge} />
          {isExternal && (
            <Icon
              name="open_in_new"
              className="size-3 shrink-0 text-muted-foreground"
            />
          )}
        </div>
        {(desc || md.price) && (
          <span className="block text-muted-foreground">
            {md.price || desc}
          </span>
        )}
      </div>
      {md.count != null && md.count > 0 && (
        <span className="inline-flex items-center justify-center size-5 rounded-full bg-muted text-[10px] font-bold shrink-0 mt-0.5">
          {md.count}
        </span>
      )}
      {md.imageUrl && (
        <div className="size-10 shrink-0 rounded-md overflow-hidden border mt-0.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={md.imageUrl}
            alt={title}
            loading="lazy"
            className="size-full object-cover"
          />
        </div>
      )}
    </div>
  );

  if (isDisabled) {
    return (
      <li role="none">
        <span
          role="menuitem"
          aria-disabled="true"
          className={cn(
            "flex cursor-default opacity-70",
            isFeatured && "bg-accent/30",
            isCta && "text-primary font-medium",
          )}
        >
          {linkContent}
        </span>
      </li>
    );
  }

  return (
    <li role="none">
      <NavigationMenuLink asChild>
        <Link
          href={href}
          className={cn(
            "flex",
            isFeatured && "bg-accent/30",
            isCta && "text-primary font-medium",
          )}
          {...(isExternal
            ? { target: "_blank", rel: "noopener noreferrer nofollow" }
            : {})}
          prefetch={false}
          title={desc || title}
        >
          {linkContent}
        </Link>
      </NavigationMenuLink>
    </li>
  );
}

export function MenuDotLink({
  href,
  label,
  count,
}: {
  href: string;
  label: string;
  count?: number;
}) {
  const isDisabled = !href || href === "#";

  const dotLinkContent = (
    <span className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-all outline-none group w-full">
      <span
        className="size-1.5 rounded-full bg-muted-foreground/40 shrink-0"
        aria-hidden="true"
      />
      <span className="truncate flex-1">{label}</span>
      {count != null && count > 0 && (
        <span className="text-xs text-muted-foreground">({count})</span>
      )}
    </span>
  );

  if (isDisabled) {
    return (
      <li role="none">
        <span
          role="menuitem"
          aria-disabled="true"
          className="flex cursor-default opacity-70"
        >
          {dotLinkContent}
        </span>
      </li>
    );
  }

  return (
    <li role="none">
      <NavigationMenuLink asChild>
        <Link
          href={href}
          className="flex"
          prefetch={false}
          title={label}
        >
          {dotLinkContent}
        </Link>
      </NavigationMenuLink>
    </li>
  );
}

export function FooterBadge({
  heading,
  icon,
}: {
  heading?: string | null;
  icon?: string;
}) {
  if (!heading) return null;
  return (
    <div className="pt-4 mt-4 border-t">
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon && <Icon name={icon} className="size-3 text-primary" />}
        {heading}
      </span>
    </div>
  );
}
