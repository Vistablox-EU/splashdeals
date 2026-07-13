import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/server/lib/auth";

export const config = {
  matcher: ["/(account)/:path*"],
};

export async function proxy(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    const signInUrl = new URL("/prijava", request.url);
    signInUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Admin users should use the admin dashboard
  if (session.user.role !== "CUSTOMER") {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next();
}
