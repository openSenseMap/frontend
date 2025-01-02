import { test, expect } from "@playwright/test";

test.describe("Landing Page", () => {
  // Navigate to the landing page before each test
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should display the header element", async ({ page }) => {
    const header = page.locator("#header");
    await expect(header).toBeVisible();
    await expect(header).toHaveAttribute("id", "header");
  });

  test("should display the footer element", async ({ page }) => {
    const footer = page.locator("#footer");
    await expect(footer).toBeVisible();
    await expect(footer).toHaveAttribute("id", "footer");
  });

  test("should ensure the footer contains contact or copyright info", async ({ page }) => {
    const footerContent = page.locator("#footer");
    await expect(footerContent).toContainText(/Impressum|Imprint/i);
  });
});
