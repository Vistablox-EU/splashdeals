import { getDictionary } from "@/lib/dictionaries";
import { SignInButtons } from "./_components/SignInButtons";

/**
 * 🌊 Custom branded sign-in page for buyer accounts.
 * Renders social provider buttons instead of Better Auth's default UI.
 */
export default async function PrijavaPage() {
  const dict = await getDictionary();
  const t = dict.account;

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <div className="border-border w-full max-w-sm space-y-8 rounded-xl border p-8">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-black tracking-tighter uppercase italic">
            {t.sign_in_title}
          </h1>
          <p className="text-muted-foreground text-sm font-medium">{t.sign_in_desc}</p>
        </div>

        <SignInButtons dict={t} />
      </div>
    </div>
  );
}
