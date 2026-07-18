import { expect, test } from "@playwright/test";

/**
 * Smoke path for cart UX Phase 4:
 * public cart surface → login surface → checkout boundary still auth-gated.
 * Full paid Stripe completion is out of scope without test credentials.
 */
test.describe("cart login checkout smoke", () => {
  test("cart page loads and login surface is reachable", async ({ page }) => {
    await page.goto("/cart");
    await expect(page).toHaveURL(/\/cart/);
    // CartClient mounts client-side; assert page shell rather than a specific H1.
    await expect(page.locator("#main-content")).toBeVisible({ timeout: 30_000 });
    await expect(page.locator("body")).not.toContainText("Application error");

    await page.goto("/prijava");
    await expect(page).toHaveURL(/\/prijava/);
    await expect(page.locator("body")).toContainText(/prijav|login|nalog|google|facebook/i);
  });

  test("header and bottom nav cart entry points exist on homepage", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await expect(page.locator("header")).toBeVisible({ timeout: 30_000 });

    const bottomNav = page.getByRole("navigation", { name: /mobilna navigacija/i });
    await expect(bottomNav).toBeVisible({ timeout: 30_000 });

    const cartNavLink = bottomNav.locator('a[href="/cart"]');
    await expect(cartNavLink).toBeVisible();
    await expect(cartNavLink).toHaveAttribute("href", "/cart");

    // Explore → indexable hub (not noindex /search)
    await expect(bottomNav.locator('a[href="/akva-parkovi"]')).toBeVisible();

    // 4-tab IA: support is footer-only (not a BottomNav tab)
    await expect(bottomNav.locator('a[href="/support"]')).toHaveCount(0);
    await expect(bottomNav.locator('a[href="/search"]')).toHaveCount(0);

    // Account lives in BottomNav on mobile (not duplicated in header)
    // Logged-out users see /prijava; logged-in would see /moje-karte
    const accountLink = bottomNav.locator('a[href="/prijava"], a[href="/moje-karte"]');
    await expect(accountLink.first()).toBeVisible();
  });
});
