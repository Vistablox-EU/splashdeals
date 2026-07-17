import "server-only";

export type ClaimableCart = {
  id: string;
  facilityId: string | null;
  itemCount: number;
};

export type GuestCartClaimDecision =
  | { action: "claim"; cartId: string }
  | { action: "keep_user"; cartId: string }
  | {
      action: "merge";
      guestCartId: string;
      userCartId: string;
      facilityId: string;
    }
  | {
      action: "conflict";
      guestCartId: string;
      userCartId: string;
      guestFacilityId: string;
      userFacilityId: string;
    }
  | { action: "noop" };

export function decideGuestCartClaim(input: {
  guestCart: ClaimableCart | null;
  userCart: ClaimableCart | null;
}): GuestCartClaimDecision {
  const guestCart = input.guestCart;
  const userCart = input.userCart;

  if (!guestCart || guestCart.itemCount <= 0) {
    if (userCart) return { action: "keep_user", cartId: userCart.id };
    return { action: "noop" };
  }

  // No user cart row yet → adopt the guest cart as the user cart.
  if (!userCart) {
    return { action: "claim", cartId: guestCart.id };
  }

  // Empty user cart session already exists (e.g. after intentional remove-all).
  // Prefer merge into the existing user row — never "claim" (unique userId conflict)
  // and never treat empty user cart as missing (that resurrected deleted items).
  if (userCart.itemCount <= 0) {
    if (!guestCart.facilityId) {
      return {
        action: "conflict",
        guestCartId: guestCart.id,
        userCartId: userCart.id,
        guestFacilityId: guestCart.facilityId ?? "",
        userFacilityId: userCart.facilityId ?? "",
      };
    }
    return {
      action: "merge",
      guestCartId: guestCart.id,
      userCartId: userCart.id,
      facilityId: guestCart.facilityId,
    };
  }

  if (!guestCart.facilityId || !userCart.facilityId) {
    return {
      action: "conflict",
      guestCartId: guestCart.id,
      userCartId: userCart.id,
      guestFacilityId: guestCart.facilityId ?? "",
      userFacilityId: userCart.facilityId ?? "",
    };
  }

  if (guestCart.facilityId === userCart.facilityId) {
    return {
      action: "merge",
      guestCartId: guestCart.id,
      userCartId: userCart.id,
      facilityId: guestCart.facilityId,
    };
  }

  return {
    action: "conflict",
    guestCartId: guestCart.id,
    userCartId: userCart.id,
    guestFacilityId: guestCart.facilityId,
    userFacilityId: userCart.facilityId,
  };
}
