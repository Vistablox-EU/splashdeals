import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/app/(server)/lib/auth";
import { buildPrijavaUrl } from "@/lib/auth/callback-url";

/**
 * Require an authenticated buyer session for account pages.
 * Defense-in-depth alongside middleware cookie check.
 */
export async function requireAccountSession(callbackPath: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect(buildPrijavaUrl(callbackPath));
  }
  return session;
}
