import { describe, expect, it } from "vitest";
import {
  isAccountBottomNavActive,
  isAccountProtectedPath,
  isAccountSurfacePath,
  isStaffOrOwnerRole,
} from "@/lib/auth/account-paths";

describe("account path helpers", () => {
  it("treats real Serbian paths as protected (not route-group syntax)", () => {
    expect(isAccountProtectedPath("/moje-karte")).toBe(true);
    expect(isAccountProtectedPath("/moje-karte/istorija")).toBe(true);
    expect(isAccountProtectedPath("/omiljeni")).toBe(true);
    expect(isAccountProtectedPath("/moje-recenzije")).toBe(true);
    expect(isAccountProtectedPath("/orders/abc")).toBe(true);
    expect(isAccountProtectedPath("/nalog")).toBe(true);
    expect(isAccountProtectedPath("/(account)/moje-karte")).toBe(false);
    expect(isAccountProtectedPath("/prijava")).toBe(false);
    expect(isAccountProtectedPath("/cart")).toBe(false);
  });

  it("includes prijava in account surface for BottomNav active", () => {
    expect(isAccountSurfacePath("/prijava")).toBe(true);
    expect(isAccountSurfacePath("/nalog")).toBe(true);
    expect(isAccountBottomNavActive("/omiljeni")).toBe(true);
    expect(isAccountBottomNavActive("/")).toBe(false);
  });

  it("detects staff/owner roles", () => {
    expect(isStaffOrOwnerRole("SUPER_ADMIN")).toBe(true);
    expect(isStaffOrOwnerRole("FACILITY_OWNER")).toBe(true);
    expect(isStaffOrOwnerRole("CUSTOMER")).toBe(false);
    expect(isStaffOrOwnerRole(null)).toBe(false);
  });
});
