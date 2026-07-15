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
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(GUEST_CART_TTL_MS / 1000),
  });
}

export async function clearGuestCartCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(GUEST_CART_COOKIE_NAME);
}
