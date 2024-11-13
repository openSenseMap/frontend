import { defineConfig, devices } from "@playwright/test";
import "dotenv/config";

const PORT = process.env.PORT || "3000";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: process.env.CI ? 30 * 1000 : 15 * 1000,
  expect: {
    timeout: process.env.CI ? 10 * 1000 : 5 * 1000,
  },
  fullyParallel: !process.env.CI,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: `http://localhost:${PORT}/`,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
  webServer: {
    command: process.env.CI ? "npm run start:mocks && sleep 5" : "npm run dev",
    port: Number(PORT),
    reuseExistingServer: true,
    timeout: 60 * 1000,
    env: {
      PORT,
      NODE_ENV: "test",
    },
  },
});
