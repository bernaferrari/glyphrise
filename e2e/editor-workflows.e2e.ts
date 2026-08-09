import { expect, test } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => window.localStorage.clear())
  await page.goto("/")
})

test("creates a named blank project without example animation", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Open projects" }).click()
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

test("duplicates projects and recovers after deleting the current project", async ({
  page,
}) => {
  const createBlankProject = async (name: string) => {
    await page.getByRole("button", { name: "Open projects" }).click()
    await page.getByLabel("New project name").fill(name)
    await page.getByRole("button", { name: "Start blank" }).click()
    await expect(page.getByLabel("Project name", { exact: true })).toHaveValue(
      name
    )
  }

  await createBlankProject("Original")
  await createBlankProject("Second project")

  await page.getByRole("button", { name: "Open projects" }).click()
  await page
    .getByRole("button", { name: "Duplicate Original", exact: true })
    .click()
  await expect(page.getByLabel("Project name", { exact: true })).toHaveValue(
    "Original copy"
  )

  await page.getByRole("button", { name: "Open projects" }).click()
  await page
    .getByRole("button", { name: "Delete Original copy", exact: true })
    .click()
  await expect(
    page.getByRole("heading", { name: "Delete “Original copy”?" })
  ).toBeVisible()
  await page.getByRole("button", { name: "Delete project" }).click()

  await expect(page.getByLabel("Project name", { exact: true })).toHaveValue(
    "Second project"
  )
  await expect(
    page.getByRole("button", { name: "Open Original copy, current project" })
  ).toHaveCount(0)
})

test("starts style templates with a clean undo baseline", async ({ page }) => {
  await page.getByRole("button", { name: "Open projects" }).click()
  await page.getByLabel("New project name").fill("Styled project")
  await page.getByRole("button", { name: "Google Metal" }).click()

  await expect(page.getByLabel("Project name", { exact: true })).toHaveValue(
    "Styled project"
  )
  await expect(page.getByRole("button", { name: "Undo" })).toBeDisabled()
})

test("uploads a custom SVG into the selected icon clip", async ({ page }) => {
  await page.getByRole("button", { name: /Change icon for/ }).click()
  await page.getByRole("tab", { name: "Upload SVG" }).click()

  const fileChooserPromise = page.waitForEvent("filechooser")
  await page.getByRole("button", { name: "Upload SVG", exact: true }).click()
  const fileChooser = await fileChooserPromise
  await fileChooser.setFiles({
    name: "custom-mark.svg",
    mimeType: "image/svg+xml",
    buffer: Buffer.from(
      '<svg viewBox="0 0 24 24"><path d="M2 2h20v20H2z"/></svg>'
    ),
  })

  await expect(
    page.getByRole("button", { name: "Custom icon clip" })
  ).toBeVisible()
  await expect(page.getByRole("button", { name: "Undo" })).toBeEnabled()
})

test("keeps essential workspace actions reachable at compact widths", async ({
  page,
}) => {
  await page.setViewportSize({ width: 640, height: 700 })
  await page.getByRole("button", { name: "Workspace actions" }).click()

  await expect(page.getByRole("button", { name: "Projects" })).toBeVisible()
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
