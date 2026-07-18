import { describe, expect, it } from "vitest";
import { isBottomNavActive } from "@/lib/layout/bottom-nav-active";

describe("isBottomNavActive", () => {
  it("marks home only on exact /", () => {
    expect(isBottomNavActive("/", "/")).toBe(true);
    expect(isBottomNavActive("/akva-parkovi", "/")).toBe(false);
  });

  it("does not mark /#deals active from pathname alone", () => {
    expect(isBottomNavActive("/", "/#deals")).toBe(false);
    expect(isBottomNavActive("/petroland", "/#deals")).toBe(false);
  });

  it("prefix-matches non-hash destinations", () => {
    expect(isBottomNavActive("/cart", "/cart")).toBe(true);
    expect(isBottomNavActive("/search", "/search")).toBe(true);
    expect(isBottomNavActive("/akva-parkovi", "/akva-parkovi")).toBe(true);
    expect(isBottomNavActive("/akva-parkovi/ulaznice/x", "/akva-parkovi")).toBe(true);
    expect(isBottomNavActive("/support/faq", "/support")).toBe(true);
    expect(isBottomNavActive("/cart", "/support")).toBe(false);
  });

  it("does not mark facility slug pages as explore hub", () => {
    expect(isBottomNavActive("/petroland", "/akva-parkovi")).toBe(false);
  });
});
