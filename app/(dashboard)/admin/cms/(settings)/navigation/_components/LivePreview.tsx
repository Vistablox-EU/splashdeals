"use client";

import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";
import type { MenuWithSections, LinkMetadata } from "./types";
import NextImage from "next/image";

/* ─── Internal preview helpers (mirror MegaMenu.tsx) ─── */

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h4 className="text-muted-foreground mb-3 text-sm font-semibold">{children}</h4>;
}

function BadgeChip({ metadata }: { metadata: LinkMetadata }) {
  const badge = metadata.badge;
  if (!badge) return null;

  const config = {
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
    custom: { label: badge.text || "", className: "bg-primary/10 text-primary border-primary/20" },
  }[badge.type];

  return (
    <span
      className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-bold ${config.className}`}
    >
      {config.label}
    </span>
  );
}

function PreviewMenuItem({
  item,
}: {
  item: {
    label: string;
    href?: string | null;
    icon?: string | null;
    desc?: string | null;
    metadata?: unknown;
  };
}) {
  const md = (item.metadata || {}) as LinkMetadata;
  const hasAccent = !!md.accentColor;
  const isExternal = !!md.external;
  const isFeatured = md.variant === "featured";
  const isCta = md.variant === "cta";

  return (
    <a
      href={item.href || "#"}
      className={cn(
        "hover:bg-accent hover:text-accent-foreground group focus-visible:ring-ring/50 flex flex-row items-start gap-2 rounded-sm p-2 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none",
        isFeatured && "bg-accent/30",
        isCta && "text-primary font-medium",
      )}
    >
      {hasAccent && (
        <span
          className="mt-0.5 w-0.5 shrink-0 self-stretch rounded-full"
          style={{ backgroundColor: md.accentColor }}
        />
      )}
      {item.icon && <Icon name={item.icon} className="mt-0.5 size-5 shrink-0" />}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="block truncate font-medium">{item.label}</span>
          <BadgeChip metadata={md} />
          {isExternal && (
            <Icon name="open_in_new" className="text-muted-foreground size-3 shrink-0" />
          )}
        </div>
        {(item.desc || md.price) && (
          <span className="text-muted-foreground mt-0.5 block text-xs">
            {md.price || item.desc}
          </span>
        )}
      </div>
      {md.count != null && md.count > 0 && (
        <span className="bg-muted mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold">
          {md.count}
        </span>
      )}
      {md.imageUrl && (
        <div className="mt-0.5 size-10 shrink-0 overflow-hidden rounded-md border">
          <NextImage src={md.imageUrl} alt="" fill className="object-cover" sizes="40px" />
        </div>
      )}
    </a>
  );
}

function PreviewDotLink({
  item,
}: {
  item: { label: string; href?: string | null; metadata?: unknown };
}) {
  const md = (item.metadata || {}) as LinkMetadata;
  return (
    <a
      href={item.href || "#"}
      className="hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring/50 flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
    >
      <span className="bg-muted-foreground/40 size-1.5 shrink-0 rounded-full" />
      <span className="truncate">{item.label}</span>
      {md.count != null && md.count > 0 && (
        <span className="text-muted-foreground ml-auto text-xs">({md.count})</span>
      )}
    </a>
  );
}

function PreviewScannerBlock() {
  return (
    <div className="bg-muted/10 flex flex-col items-center gap-3 rounded-sm border p-6 text-center">
      <div className="bg-primary/10 flex size-12 items-center justify-center rounded-xl">
        <Icon name="qr_code_scanner" className="text-primary size-6" />
      </div>
      <div>
        <span className="block text-sm font-medium">Skeniranje uspešno</span>
        <span className="text-muted-foreground mt-0.5 block text-xs">
          Ulaznica #PETR-401A je verifikovana
        </span>
      </div>
      <span className="text-primary bg-primary/10 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium">
        <Icon name="check_circle" className="size-3" />
        Validirano
      </span>
    </div>
  );
}

function PreviewClubCardBlock() {
  return (
    <div className="bg-muted/10 flex flex-col items-center gap-3 rounded-sm border p-6 text-center">
      <div className="from-primary/10 to-muted flex aspect-[2/3] w-28 flex-col justify-between rounded-xl border bg-gradient-to-b p-3 shadow-sm">
        <div className="flex items-center justify-between border-b pb-1.5">
          <span className="text-primary text-[7px] font-bold uppercase">Splash Club</span>
          <Icon name="waves" className="text-primary size-2.5" />
        </div>
        <div className="text-center">
          <span className="text-muted-foreground block text-[6px] font-medium uppercase">
            Članska Kartica
          </span>
          <span className="mt-0.5 block text-[10px] font-bold uppercase">PREMIUM PRO</span>
        </div>
        <div className="flex flex-col items-center border-t pt-1.5">
          <Icon name="qr_code" className="size-6" />
          <span className="text-muted-foreground mt-0.5 text-[4px]">#SPLASH-PASS</span>
        </div>
      </div>
      <span className="text-primary bg-primary/10 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium">
        <Icon name="auto_awesome" className="size-3" />
        Splash Club
      </span>
    </div>
  );
}

function PreviewFooterBadge({ heading, icon }: { heading?: string | null; icon?: string }) {
  return (
    <div className="mt-4 border-t pt-4">
      <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
        {icon && <Icon name={icon} className="text-primary size-3" />}
        {heading}
      </span>
    </div>
  );
}

/* ─── Main component ────────────────────────────────── */

interface LivePreviewProps {
  menu: MenuWithSections;
}

export function LivePreview({ menu }: LivePreviewProps) {
  return (
    <div className="bg-background overflow-hidden rounded-lg border shadow-lg">
      <div className="bg-muted/20 text-muted-foreground flex items-center gap-2 border-b px-4 py-2 text-xs font-semibold tracking-wider uppercase">
        <Icon name="visibility" className="size-3.5" />
        Live Preview — {menu.label}
      </div>
      <div className="max-w-full overflow-x-auto">
        <div className="w-[900px] p-6">
          <div className="grid grid-cols-[2fr_1fr_1fr] gap-6">
            {[0, 1, 2].map((column) => {
              const sections = menu.sections.filter((s) => s.column === column);
              return (
                <div key={column} className="space-y-4">
                  {sections.map((section) => {
                    const config = section.config as Record<string, unknown> | null;

                    return (
                      <div key={section.id}>
                        {section.style !== "FOOTER_BADGE" &&
                          section.style !== "VISUAL" &&
                          section.heading && <SectionHeading>{section.heading}</SectionHeading>}

                        <div className="space-y-2">
                          {section.style === "LINKS" &&
                            section.items.map((item) => (
                              <PreviewMenuItem key={item.id} item={item} />
                            ))}

                          {section.style === "DOT_LINKS" &&
                            section.items.map((item) => (
                              <PreviewDotLink key={item.id} item={item} />
                            ))}

                          {section.style === "DYNAMIC_CITIES" && (
                            <div className="text-muted-foreground py-2 text-sm">
                              [Gradovi — automatski iz baze]
                            </div>
                          )}

                          {section.style === "VISUAL" && config?.component === "scanner" && (
                            <PreviewScannerBlock />
                          )}

                          {section.style === "VISUAL" && config?.component === "club_card" && (
                            <PreviewClubCardBlock />
                          )}

                          {section.style === "FOOTER_BADGE" && (
                            <PreviewFooterBadge
                              heading={section.heading}
                              icon={config?.icon as string | undefined}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
