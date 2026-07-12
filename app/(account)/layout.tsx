import { getDictionary } from "@/lib/dictionaries";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const dict = await getDictionary();
  const t = dict.account;

  const navLinks = [
    { href: "/moje-karte", label: t.moje_karte, icon: "confirmation_number" },
    { href: "/moje-karte/istorija", label: t.istorija, icon: "history" },
    { href: "/omiljeni", label: t.omiljeni, icon: "favorite" },
    { href: "/moje-recenzije", label: t.moje_recenzije, icon: "star" },
  ] as const;

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl flex-col gap-8 px-4 pt-24 pb-16 sm:px-8 lg:flex-row">
      {/* Sidebar — desktop */}
      <aside className="hidden w-64 shrink-0 lg:block">
        <nav className="border-border space-y-1 rounded-xl border p-4">
          <h2 className="text-muted-foreground mb-4 px-3 text-[10px] font-black tracking-[0.2em] uppercase">
            {t.title}
          </h2>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hover:bg-muted flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
            >
              <Icon name={link.icon} className="text-primary size-[18px]" />
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="border-border bg-background fixed right-0 bottom-0 left-0 z-50 border-t lg:hidden">
        <div className="flex items-center justify-around py-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-muted-foreground hover:text-foreground flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] font-bold transition-colors"
            >
              <Icon name={link.icon} className="size-[22px]" />
              {link.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* Main content */}
      <main className="min-w-0 flex-1 pb-20 lg:pb-0">{children}</main>
    </div>
  );
}
