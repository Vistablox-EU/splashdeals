import { requireAccountSession } from "@/lib/auth/require-account-session";
import { getDictionary } from "@/lib/dictionaries";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Icon } from "@/components/ui/Icon";
import Link from "next/link";
import type { Metadata } from "next";
import { ProfileNameForm } from "./_components/ProfileNameForm";
import { prisma } from "@/app/(server)/lib/prisma";

export const metadata: Metadata = {
  title: "Nalog",
  robots: { index: false, follow: false },
};

function initials(name?: string | null, email?: string | null): string {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/);
    return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
  }
  return (email?.[0] || "?").toUpperCase();
}

export default async function NalogPage() {
  const session = await requireAccountSession("/nalog");
  const dict = await getDictionary();
  const t = dict.account as Record<string, string>;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      image: true,
      emailVerified: true,
      role: true,
      accounts: { select: { providerId: true } },
    },
  });

  const displayName = user?.name || session.user.name || "";
  const email = user?.email || session.user.email || "";
  const image = user?.image || session.user.image;
  const providers = user?.accounts?.map((a) => a.providerId) || [];

  const quickLinks = [
    { href: "/moje-karte", label: t.moje_karte || "Moje karte", icon: "confirmation_number" },
    { href: "/omiljeni", label: t.omiljeni || "Omiljeni", icon: "favorite" },
    { href: "/moje-recenzije", label: t.moje_recenzije || "Recenzije", icon: "star" },
    { href: "/moje-karte/istorija", label: t.istorija || "Istorija", icon: "history" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tighter uppercase italic">
          {t.profile || t.title || "Nalog"}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm font-medium">
          {t.profile_desc || "Pregled i podešavanja vašeg profila"}
        </p>
      </div>

      <Card className="border-border flex flex-col gap-6 p-6 sm:flex-row sm:items-center">
        <Avatar className="size-16">
          {image ? <AvatarImage src={image} alt="" /> : null}
          <AvatarFallback className="text-lg font-bold">
            {initials(displayName, email)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 space-y-1">
          <p className="truncate text-lg font-black">{displayName || "Korisnik"}</p>
          <p className="text-muted-foreground truncate text-sm">{email}</p>
          <p className="text-muted-foreground text-xs">
            {user?.emailVerified
              ? t.email_verified || "Email potvrđen"
              : t.email_unverified || "Email nije potvrđen"}
          </p>
        </div>
      </Card>

      <Card className="border-border space-y-4 p-6">
        <h2 className="text-sm font-black tracking-widest uppercase">
          {t.edit_profile || "Izmena profila"}
        </h2>
        <ProfileNameForm
          initialName={displayName}
          labels={{
            name: t.display_name || "Ime za prikaz",
            save: t.save_profile || "Sačuvaj",
            saving: t.saving || "Čuvanje…",
            success: t.profile_saved || "Profil sačuvan",
          }}
        />
      </Card>

      {providers.length > 0 ? (
        <Card className="border-border space-y-3 p-6">
          <h2 className="text-sm font-black tracking-widest uppercase">
            {t.linked_providers || "Povezani nalozi"}
          </h2>
          <ul className="space-y-2">
            {providers.map((p) => (
              <li
                key={p}
                className="border-border bg-muted/30 flex min-h-11 items-center gap-2 rounded-lg border px-3 text-sm font-medium capitalize"
              >
                <Icon name="link" className="text-primary size-4" />
                {p}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="border-border hover:border-primary/40 flex min-h-11 items-center gap-3 rounded-xl border px-4 py-3 text-sm font-bold transition-colors"
          >
            <Icon name={link.icon} className="text-primary size-5" />
            {link.label}
          </Link>
        ))}
      </div>

      <p className="text-muted-foreground text-xs">
        <Link href="/privacy" className="underline underline-offset-2">
          {t.privacy_link || "Politika privatnosti"}
        </Link>
        {" · "}
        <Link href="/terms" className="underline underline-offset-2">
          {t.terms_link || "Uslovi korišćenja"}
        </Link>
      </p>
    </div>
  );
}
