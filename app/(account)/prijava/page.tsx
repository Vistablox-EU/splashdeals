import { getDictionary } from "@/lib/dictionaries";
import { isSafeCallbackPath } from "@/lib/auth/callback-url";
import { SignInButtons } from "./_components/SignInButtons";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Prijava",
  robots: { index: false, follow: false },
};

/**
 * Buyer sign-in — uses platform shell from parent account layout,
 * without portal subnav (prijava is outside `(portal)`).
 */
export default async function PrijavaPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const dict = await getDictionary();
  const t = dict.account;
  const sp = await searchParams;
  const callbackUrl = isSafeCallbackPath(sp.callbackUrl) ? sp.callbackUrl : "/moje-karte";

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <div className="border-border w-full max-w-sm space-y-8 rounded-xl border p-8">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-black tracking-tighter uppercase italic">
            {t.sign_in_title}
          </h1>
          <p className="text-muted-foreground text-sm font-medium">{t.sign_in_desc}</p>
        </div>

        <SignInButtons dict={t} callbackUrl={callbackUrl} />
      </div>
    </div>
  );
}
