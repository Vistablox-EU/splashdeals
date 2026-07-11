"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";
import { NavigationMenuLink } from "@/components/ui/navigation-menu";
import { ScannerBlock, ClubCardBlock } from "./visual-blocks";
import type { LinkMetadata, NavigationMenuData, NavigationMenuSectionData } from "./types";

// ── Helpers ───────────────────────────────────────────────────────────

function BadgeChip({ badge }: { badge: LinkMetadata["badge"] }) {
  if (!badge) return null;

  const config: Record<string, { label: string; className: string }> = {
    new: {
      label: badge.text || "Novo",
      className: "bg-primary/15 text-primary border-primary/20",
    },
    sale: {
      label: badge.text || "Akcija",
      className: "bg-destructive/15 text-destructive border-destructive/20",
    },
    popular: {
      label: badge.text || "Popularno",
      className: "bg-warning/15 text-warning border-warning/20",
    },
    soon: {
      label: badge.text || "Uskoro",
      className: "bg-muted/15 text-muted-foreground border-muted/20 border-dashed",
    },
    custom: {
      label: badge.text || "",
      className: "bg-primary/10 text-primary border-primary/20",
    },
  };

  const cfg = config[badge.type] || config.custom;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-bold",
        cfg.className,
      )}
    >
      {cfg.label}
    </span>
  );
}

// ── Components ────────────────────────────────────────────────────────

export function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h4 className="text-muted-foreground mb-3 text-sm font-semibold">{children}</h4>;
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
    <div className="group flex w-full flex-row items-start gap-2 rounded-sm p-2 text-sm transition-all outline-none">
      {md.accentColor && (
        <span
          className="mt-0.5 w-0.5 shrink-0 self-stretch rounded-full"
          style={{ backgroundColor: md.accentColor }}
        />
      )}
      {icon && <Icon name={icon} className="mt-0.5 size-5 shrink-0" />}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="block truncate font-medium">{title}</span>
          <BadgeChip badge={md.badge} />
          {isExternal && (
            <Icon name="open_in_new" className="text-muted-foreground size-3 shrink-0" />
          )}
        </div>
        {(desc || md.price) && (
          <span className="text-muted-foreground block">{md.price || desc}</span>
        )}
      </div>
      {md.count != null && md.count > 0 && (
        <span className="bg-muted mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold">
          {md.count}
        </span>
      )}
      {md.imageUrl && (
        <div className="mt-0.5 size-10 shrink-0 overflow-hidden rounded-md border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={md.imageUrl} alt={title} loading="lazy" className="size-full object-cover" />
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
          className={cn("flex", isFeatured && "bg-accent/30", isCta && "text-primary font-medium")}
          {...(isExternal ? { target: "_blank", rel: "noopener noreferrer nofollow" } : {})}
          prefetch={true}
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
    <span className="group flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-all outline-none">
      <span className="bg-muted-foreground/40 size-1.5 shrink-0 rounded-full" aria-hidden="true" />
      <span className="flex-1 truncate">{label}</span>
      {count != null && count > 0 && (
        <span className="text-muted-foreground text-xs">({count})</span>
      )}
    </span>
  );

  if (isDisabled) {
    return (
      <li role="none">
        <span role="menuitem" aria-disabled="true" className="flex cursor-default opacity-70">
          {dotLinkContent}
        </span>
      </li>
    );
  }

  return (
    <li role="none">
      <NavigationMenuLink asChild>
        <Link href={href} className="flex" prefetch={true} title={label}>
          {dotLinkContent}
        </Link>
      </NavigationMenuLink>
    </li>
  );
}

export function FooterBadge({ heading, icon }: { heading?: string | null; icon?: string }) {
  if (!heading) return null;
  return (
    <div className="mt-4 border-t pt-4">
      <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
        {icon && <Icon name={icon} className="text-primary size-3" />}
        {heading}
      </span>
    </div>
  );
}

// ── Section renderer (used by MegaMenu) ───────────────────────────────

export function SectionRenderer({
  section,
  menu,
  sortedCities,
}: {
  section: NavigationMenuSectionData;
  menu: NavigationMenuData;
  sortedCities: { id: string; name: string; slug: string }[];
}) {
  const config = section.config as Record<string, unknown> | null;

  // Skip empty list-style sections — they'd render unwanted vertical spacing
  if ((section.style === "LINKS" || section.style === "DOT_LINKS") && section.items.length === 0) {
    return null;
  }

  return (
    <section key={section.id} aria-labelledby={section.heading ? `nav-h-${section.id}` : undefined}>
      {section.style !== "VISUAL" && section.style !== "FOOTER_BADGE" && section.heading && (
        <SectionHeading>
          <span id={`nav-h-${section.id}`}>{section.heading}</span>
        </SectionHeading>
      )}

      <ul className="space-y-2" role="menu" aria-label={section.heading || menu.label}>
        {section.style === "LINKS" &&
          section.items.map((item) => (
            <NavItemLink
              key={item.id}
              href={item.href}
              icon={item.icon}
              title={item.label}
              desc={item.desc}
              metadata={item.metadata}
            />
          ))}

        {section.style === "DOT_LINKS" &&
          section.items.map((item) => (
            <MenuDotLink
              key={item.id}
              href={item.href || "#"}
              label={item.label}
              count={item.metadata?.count}
            />
          ))}

        {section.style === "DYNAMIC_CITIES" && (
          <>
            {sortedCities.slice(0, (config?.maxItems as number) || 10).map((city) => (
              <MenuDotLink
                key={city.id}
                href={`${(config?.basePath as string) || "/akva-parkovi"}?city=${city.slug}`}
                label={city.name}
              />
            ))}
            {sortedCities.length > ((config?.maxItems as number) || 10) && (
              <MenuDotLink
                href={(config?.basePath as string) || "/akva-parkovi"}
                label={`+${sortedCities.length - ((config?.maxItems as number) || 10)} gradova`}
              />
            )}
          </>
        )}

        {section.style === "VISUAL" && (
          <li>
            {config?.component === "scanner" && <ScannerBlock />}
            {config?.component === "club_card" && <ClubCardBlock />}
          </li>
        )}
      </ul>

      {section.style === "FOOTER_BADGE" && (
        <FooterBadge heading={section.heading} icon={config?.icon as string | undefined} />
      )}
    </section>
  );
}
