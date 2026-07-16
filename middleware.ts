import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isAccountProtectedPath } from "@/lib/auth/account-paths";

/**
 * Buyer account auth middleware.
 *
 * IMPORTANT: Next.js route groups like `(account)` are NOT part of the URL.
 * Matcher must use real paths: /moje-karte, /omiljeni, /nalog, …
 */
export const config = {
  matcher: [
    "/moje-karte",
    "/moje-karte/:path*",
    "/omiljeni",
    "/omiljeni/:path*",
    "/moje-recenzije",
    "/moje-recenzije/:path*",
    "/orders",
    "/orders/:path*",
    "/nalog",
    "/nalog/:path*",
  ],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Defense: only enforce on known protected account paths
  if (!isAccountProtectedPath(pathname)) {
    return NextResponse.next();
  }

  const sessionCookie =
    request.cookies.get("better-auth.session_token")?.value ??
    request.cookies.get("__Secure-better-auth.session_token")?.value;

  if (!sessionCookie) {
    const signInUrl = new URL("/prijava", request.url);
    signInUrl.searchParams.set("callbackUrl", pathname + request.nextUrl.search);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}
