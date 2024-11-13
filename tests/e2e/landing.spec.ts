import type { BrowserContext, Page } from "@playwright/test";
import { test, expect } from "@playwright/test";

test.describe("Landing Page", () => {
  let context: BrowserContext;
  let page: Page;

  // Set up a new context and page before each test
  test.beforeEach(async ({ browser }) => {
    context = await browser.newContext(); // Create a new incognito browser context
    page = await context.newPage(); // Create a new page inside this context
    await page.goto("/"); // Navigate to the landing page
    const mainSection = page.locator("#main");
    await mainSection.waitFor();
  });

  // Close the context after each test to clear session data
  test.afterEach(async () => {
    await context.close();
  });

  test("should display the page title", async () => {
    const title = await page.title();
    expect(title).toBe("openSenseMap"); // Replace with actual title if different
  });

  test("should display header and footer", async () => {
    await expect(page.locator("header")).toBeVisible();
    await expect(page.locator("footer")).toBeVisible();
  });

  test("should display main call-to-action buttons", async () => {
    const exploreButton = page.getByRole("button", { name: "Explore" });
    const donateButton = page.getByRole("button", { name: "Donate" });

    await expect(exploreButton).toBeVisible();
    await expect(donateButton).toBeVisible();
  });

  test("should open external link for Donate button", async () => {
    const [newPage] = await Promise.all([
      page.waitForEvent("popup"),
      page.click("text=Donate"), // or use the role selector
    ]);
    await expect(newPage).toHaveURL(
      "https://www.betterplace.org/de/projects/89947-opensensemap-org-die-freie-karte-fuer-umweltdaten",
    );
  });

  test("should render stats section with animated counters", async () => {
    // Ensure stats section is visible
    await expect(page.locator("#stats-section")).toBeVisible();

    // Verify each stat element using its unique ID
    const statsIds = [
      "devices",
      "measurements_total",
      "measurements_per_minute",
    ];

    for (const id of statsIds) {
      await expect(page.locator(`#${id}`)).toBeVisible();
    }
  });

  test("should render sections: Features, Connect, Integrations, Pricing Plans, Partners", async () => {
    await expect(page.locator("#features-section")).toBeVisible();
    await expect(page.locator("#connect-section")).toBeVisible();
    await expect(page.locator("#integrations-section")).toBeVisible();
    await expect(page.locator("#pricing-section")).toBeVisible();
    await expect(page.locator("#partners-section")).toBeVisible();
  });
});
