import { expect, test } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => window.localStorage.clear())
  await page.goto("/")
})

test("creates a named blank project without example animation", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Start a new project" }).click()
  await page.getByLabel("New project name").fill("Launch mark")
  await page.getByRole("button", { name: "Start blank" }).click()

  const projectName = page.getByLabel("Project name", { exact: true })
  await expect(projectName).toHaveValue("Launch mark")
  await expect(
    page.locator(
      'button[aria-label$=" icon clip"]:not([aria-label="Add icon clip"])'
    )
  ).toHaveCount(1)
  await expect(page.getByRole("button", { name: "Undo" })).toBeDisabled()

  await projectName.fill("Accidental rename")
  await projectName.press("Escape")
  await expect(projectName).toHaveValue("Launch mark")
})

test("keeps essential workspace actions reachable at compact widths", async ({
  page,
}) => {
  await page.setViewportSize({ width: 640, height: 700 })
  await page.getByRole("button", { name: "Workspace actions" }).click()

  await expect(page.getByRole("button", { name: "New project" })).toBeVisible()
  await expect(
    page.getByRole("button", { name: "Open project file" })
  ).toBeVisible()
  await expect(
    page.getByRole("button", { name: "Download project" })
  ).toBeVisible()
  await expect(
    page.getByRole("button", { name: "Quick start", exact: true })
  ).toBeVisible()
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(640)
})

test("describes code exports as implementation starters", async ({ page }) => {
  await page.getByRole("button", { name: "Export" }).click()
  await page.getByRole("tab", { name: "React starter" }).click()

  await expect(
    page.getByText(/Starter code preserves timing, transforms, wipes/)
  ).toBeVisible()
  await page.getByRole("tab", { name: "Android viewer" }).click()
  await expect(
    page.getByText(/static Filament viewer, not the editor timeline/)
  ).toBeVisible()
})
