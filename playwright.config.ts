import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E config for xmpkanban (Next.js dev server on :4789).
 *
 * Projects:
 *  - setup:      runs tests/playwright/auth.setup.ts once, saves admin session to playwright/.auth/user.json
 *  - chromium:   all other specs, reusing the saved session via storageState
 */
export default defineConfig({
  testDir: "./tests/playwright",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:4789",
    trace: "on-first-retry",
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], storageState: "playwright/.auth/user.json" },
      dependencies: ["setup"],
      testIgnore: /auth\.setup\.ts/,
    },
  ],
});