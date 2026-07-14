import { requireAdmin } from "@/app/(server)/lib/auth-guards";
import { listRedirectsAction } from "@/app/(server)/actions/redirects";
import { RedirectManager } from "./_components/redirect-manager";
import { connection } from "next/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Redirect menadžer | CMS | Splashdeals",
};

export default async function RedirectsPage() {
  await requireAdmin();
  await connection();

  const result = await listRedirectsAction();
  const redirects = result.success && result.data ? result.data : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Redirect menadžer</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Upravljaj 301/302 redirectima. Poređaj ih po source URL-u.
        </p>
      </div>

      <RedirectManager initialRedirects={redirects} />
    </div>
  );
}
