import { test as base } from "@playwright/test"

// Editing regressions exercise a returning user's workspace. The first-visit
// suite uses Playwright's base fixture and tests the welcome flow separately.
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("glyphrise:quick-start:v1", "dismissed")
    })
    await use(page)
  },
})
