import { getDictionary } from "@/lib/dictionaries";
import { AccountPortalNav } from "@/components/account/AccountPortalNav";
import { StaffRoleBanner } from "@/components/account/StaffRoleBanner";
import { headers } from "next/headers";
import { auth } from "@/app/(server)/lib/auth";
import { isStaffOrOwnerRole } from "@/lib/auth/account-paths";

/**
 * Authenticated buyer portal chrome:
 * desktop sidebar + mobile horizontal chips (not a second BottomNav).
 */
export default async function AccountPortalLayout({ children }: { children: React.ReactNode }) {
  const dict = await getDictionary();
  const t = dict.account;
  const session = await auth.api.getSession({ headers: await headers() });

  const links = [
    { href: "/moje-karte", label: t.moje_karte || "Moje karte", icon: "confirmation_number" },
    { href: "/moje-karte/istorija", label: t.istorija || "Istorija kupovina", icon: "history" },
    { href: "/omiljeni", label: t.omiljeni || "Omiljeni objekti", icon: "favorite" },
    { href: "/moje-recenzije", label: t.moje_recenzije || "Moje recenzije", icon: "star" },
    { href: "/nalog", label: t.profile || "Nalog", icon: "person" },
  ];

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-8 lg:flex-row lg:gap-8 lg:py-10">
      <AccountPortalNav
        links={links}
        title={t.title || "Moj nalog"}
        logoutLabel={t.odjava || "Odjava"}
        dict={dict}
      />
      <div className="min-w-0 flex-1 space-y-6">
        {isStaffOrOwnerRole(session?.user?.role) ? (
          <StaffRoleBanner dict={dict} role={session?.user?.role} />
        ) : null}
        {children}
      </div>
    </div>
  );
}
