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

  if (!userCart || userCart.itemCount <= 0) {
    return { action: "claim", cartId: guestCart.id };
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
