import { getDictionary } from "@/lib/dictionaries";
import { AccountPortalNav } from "@/components/account/AccountPortalNav";

/**
 * Authenticated buyer portal chrome:
 * desktop sidebar + mobile horizontal chips (not a second BottomNav).
 */
export default async function AccountPortalLayout({ children }: { children: React.ReactNode }) {
  const dict = await getDictionary();
  const t = dict.account;

  const links = [
    { href: "/moje-karte", label: t.moje_karte || "Moje karte", icon: "confirmation_number" },
    { href: "/moje-karte/istorija", label: "Istorija", icon: "history" },
    { href: "/omiljeni", label: "Omiljeni", icon: "favorite" },
    { href: "/moje-recenzije", label: "Recenzije", icon: "star" },
  ];

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-8 lg:flex-row lg:gap-8 lg:py-10">
      <AccountPortalNav
        links={links}
        title={t.title || "Moj nalog"}
        logoutLabel={t.odjava || "Odjava"}
        dict={dict}
      />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
