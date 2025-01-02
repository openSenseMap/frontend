import { test } from "@playwright/test";

test.describe("Landing Page", () => {
  // Navigate to the landing page before each test
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });
});
