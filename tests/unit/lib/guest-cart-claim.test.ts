import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { decideGuestCartClaim, type ClaimableCart } from "@/app/(server)/lib/guest-cart-claim";

const guest: ClaimableCart = {
  id: "guest-cart",
  facilityId: "facility-a",
  itemCount: 2,
};

const userSame: ClaimableCart = {
  id: "user-cart",
  facilityId: "facility-a",
  itemCount: 1,
};

const userDifferent: ClaimableCart = {
  id: "user-cart",
  facilityId: "facility-b",
  itemCount: 3,
};

describe("guest cart claim decision", () => {
  it("claims the guest cart when the user has no cart", () => {
    expect(decideGuestCartClaim({ guestCart: guest, userCart: null })).toEqual({
      action: "claim",
      cartId: "guest-cart",
    });
  });

  it("merges when both carts belong to the same facility", () => {
    expect(decideGuestCartClaim({ guestCart: guest, userCart: userSame })).toEqual({
      action: "merge",
      guestCartId: "guest-cart",
      userCartId: "user-cart",
      facilityId: "facility-a",
    });
  });

  it("requires an explicit choice when facilities differ", () => {
    expect(decideGuestCartClaim({ guestCart: guest, userCart: userDifferent })).toEqual({
      action: "conflict",
      guestCartId: "guest-cart",
      userCartId: "user-cart",
      guestFacilityId: "facility-a",
      userFacilityId: "facility-b",
    });
  });

  it("keeps the user cart when the guest cart is empty", () => {
    expect(
      decideGuestCartClaim({
        guestCart: { ...guest, itemCount: 0, facilityId: null },
        userCart: userSame,
      }),
    ).toEqual({
      action: "keep_user",
      cartId: "user-cart",
    });
  });

  it("merges into an existing empty user cart instead of claim (unique userId)", () => {
    expect(
      decideGuestCartClaim({
        guestCart: guest,
        userCart: { id: "user-cart", facilityId: "facility-a", itemCount: 0 },
      }),
    ).toEqual({
      action: "merge",
      guestCartId: "guest-cart",
      userCartId: "user-cart",
      facilityId: "facility-a",
    });
  });
});
