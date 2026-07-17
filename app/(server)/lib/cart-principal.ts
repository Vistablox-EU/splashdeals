import "server-only";
import { cookies, headers } from "next/headers";
import { auth } from "@/app/(server)/lib/auth";
import { prisma } from "@/app/(server)/lib/prisma";
import {
  GUEST_CART_COOKIE_NAME,
  GUEST_CART_TTL_MS,
  createGuestCartToken,
  hashGuestCartToken,
} from "@/app/(server)/lib/guest-cart-token";

export type CartPrincipal =
  | {
      type: "user";
      userId: string;
      rateLimitKey: string;
    }
  | {
      type: "guest";
      guestTokenHash: string;
      rateLimitKey: string;
      cartId: string | null;
      shouldSetCookie: boolean;
      rawToken: string | null;
    }
  | {
      type: "anonymous";
      rateLimitKey: null;
    };

function guestRateLimitKey(tokenHash: string) {
  return `guest:${tokenHash}`;
}

/**
 * Cookie attributes for sd_guest_cart.
 * Production uses Domain=.splashdeals.rs so apex ↔ www OAuth does not drop the guest cart.
 */
export function getGuestCartCookieBaseOptions(): {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax";
  path: string;
  domain?: string;
} {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    ...(isProd ? { domain: process.env.COOKIE_DOMAIN || ".splashdeals.rs" } : {}),
  };
}

export async function resolveCartPrincipal(options: {
  createGuestIfMissing: boolean;
}): Promise<CartPrincipal> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user?.id) {
    return {
      type: "user",
      userId: session.user.id,
      rateLimitKey: `user:${session.user.id}`,
    };
  }

  const cookieStore = await cookies();
  const rawCookie = cookieStore.get(GUEST_CART_COOKIE_NAME)?.value;

  if (rawCookie) {
    const tokenHash = hashGuestCartToken(rawCookie);
    const cart = await prisma.cartSession.findUnique({
      where: { guestTokenHash: tokenHash },
      select: {
        id: true,
        guestTokenHash: true,
        userId: true,
        expiresAt: true,
      },
    });

    if (cart?.guestTokenHash && !cart.userId) {
      if (cart.expiresAt && cart.expiresAt.getTime() < Date.now()) {
        return { type: "anonymous", rateLimitKey: null };
      }
      return {
        type: "guest",
        guestTokenHash: cart.guestTokenHash,
        rateLimitKey: guestRateLimitKey(cart.guestTokenHash),
        cartId: cart.id,
        shouldSetCookie: false,
        rawToken: null,
      };
    }
  }

  if (!options.createGuestIfMissing) {
    return { type: "anonymous", rateLimitKey: null };
  }

  const { rawToken, tokenHash } = createGuestCartToken();
  const expiresAt = new Date(Date.now() + GUEST_CART_TTL_MS);
  const cart = await prisma.cartSession.create({
    data: {
      guestTokenHash: tokenHash,
      expiresAt,
    },
    select: {
      id: true,
      guestTokenHash: true,
    },
  });

  return {
    type: "guest",
    guestTokenHash: cart.guestTokenHash!,
    rateLimitKey: guestRateLimitKey(cart.guestTokenHash!),
    cartId: cart.id,
    shouldSetCookie: true,
    rawToken,
  };
}

export async function applyGuestCartCookie(principal: CartPrincipal) {
  if (principal.type !== "guest" || !principal.shouldSetCookie || !principal.rawToken) {
    return;
  }

  const cookieStore = await cookies();
  cookieStore.set(GUEST_CART_COOKIE_NAME, principal.rawToken, {
    ...getGuestCartCookieBaseOptions(),
    maxAge: Math.floor(GUEST_CART_TTL_MS / 1000),
  });
}

/**
 * Clear guest cart cookie for both:
 * - domain-scoped production cookie (.splashdeals.rs)
 * - legacy host-only cookie (no Domain) from older deploys
 */
export async function clearGuestCartCookie() {
  const cookieStore = await cookies();
  const base = getGuestCartCookieBaseOptions();

  cookieStore.set(GUEST_CART_COOKIE_NAME, "", {
    ...base,
    maxAge: 0,
  });

  // Host-only expire (omit domain) so pre-fix cookies are not left behind.
  cookieStore.set(GUEST_CART_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

/**
 * Delete leftover guest cart rows for the current cookie AND clear the cookie.
 * Used after intentional empty user cart so remount claim cannot resurrect items.
 */
export async function purgeGuestCartAndCookie() {
  const cookieStore = await cookies();
  const raw = cookieStore.get(GUEST_CART_COOKIE_NAME)?.value;
  if (raw) {
    const guestTokenHash = hashGuestCartToken(raw);
    try {
      const guestCart = await prisma.cartSession.findUnique({
        where: { guestTokenHash },
        select: { id: true, userId: true },
      });
      // Only purge pure guest carts — never touch a cart already claimed by a user.
      if (guestCart && !guestCart.userId) {
        await prisma.cartSessionItem.deleteMany({ where: { cartId: guestCart.id } });
        await prisma.cartSession.delete({ where: { id: guestCart.id } });
      }
    } catch {
      // Non-fatal — cookie clear still proceeds.
    }
  }
  await clearGuestCartCookie();
}

/** True when request still carries a guest cart cookie (for claim failsafe). */
export async function hasGuestCartCookie(): Promise<boolean> {
  const cookieStore = await cookies();
  const value = cookieStore.get(GUEST_CART_COOKIE_NAME)?.value;
  return Boolean(value && value.length > 0);
}
