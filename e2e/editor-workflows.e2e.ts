import { expect, test, type Page } from "@playwright/test"

const openProjects = async (page: Page) => {
  await page.getByRole("button", { name: "Open project menu" }).click()
  await page.getByRole("button", { name: "Open projects" }).click()
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const isolationKey = "glyphrise.e2e.storage-cleared"
    if (window.sessionStorage.getItem(isolationKey)) return
    window.localStorage.clear()
    window.sessionStorage.setItem(isolationKey, "true")
  })
  await page.goto("/")
})

test("creates a named blank project without example animation", async ({
  page,
}) => {
  await openProjects(page)
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
    await openProjects(page)
    await page.getByLabel("New project name").fill(name)
    await page.getByRole("button", { name: "Start blank" }).click()
    await expect(page.getByLabel("Project name", { exact: true })).toHaveValue(
      name
    )
  }

  await createBlankProject("Original")
  await createBlankProject("Second project")

  await openProjects(page)
  await page
    .getByRole("button", { name: "Duplicate Original", exact: true })
    .click()
  await expect(page.getByLabel("Project name", { exact: true })).toHaveValue(
    "Original copy"
  )

  await openProjects(page)
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
  await openProjects(page)
  await page.getByLabel("New project name").fill("Styled project")
  await page.getByRole("button", { name: "Spectrum Chrome" }).click()

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
    page.getByRole("button", { name: "Import project file" })
  ).toBeVisible()
  await expect(
    page.getByRole("button", { name: "Download project backup" })
  ).toBeVisible()
  await expect(
    page.getByRole("button", { name: "Quick start", exact: true })
  ).toBeVisible()
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(640)
})

test("uses dedicated workspace views on phone-sized screens", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 568 })
  await page.getByRole("button", { name: "Dismiss quick start" }).click()

  const preview = page.getByRole("region", { name: "3D preview" })
  await expect(preview).toBeVisible()
  await expect
    .poll(() =>
      preview.evaluate((element) => {
        const rect = element.getBoundingClientRect()
        return rect.bottom <= window.innerHeight && rect.height > 0
      })
    )
    .toBe(true)

  await page.getByRole("button", { name: "Properties" }).click()
  await expect(
    page.getByRole("navigation", { name: "Inspector sections" })
  ).toBeVisible()

  await page.getByRole("button", { name: "Timeline" }).click()
  await expect(page.getByRole("button", { name: "Add property" })).toBeVisible()
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(390)
})

test("persists the latest edit during an immediate reload", async ({
  page,
}) => {
  const extrusion = page.getByLabel("Extrusion depth", { exact: true })
  await extrusion.fill("14")
  await extrusion.press("Enter")
  await page.reload()

  await expect(page.getByLabel("Extrusion depth", { exact: true })).toHaveValue(
    "14.00"
  )
})

test("treats one canvas drag as one undo step", async ({ page }) => {
  await page.getByRole("button", { name: "Dismiss quick start" }).click()
  const canvas = page
    .getByRole("region", { name: "3D preview" })
    .locator("canvas")
  const box = await canvas.boundingBox()
  if (!box) throw new Error("3D preview canvas was not measurable.")

  const startX = box.x + box.width * 0.28
  const startY = box.y + box.height * 0.3
  await page.mouse.move(startX, startY)
  await page.mouse.down()
  await page.mouse.move(startX + 90, startY + 55, { steps: 8 })
  await page.mouse.up()

  const rotationX = page.getByLabel("Rotation X", { exact: true })
  const rotationY = page.getByLabel("Rotation Y", { exact: true })
  await expect
    .poll(async () => [
      await rotationX.inputValue(),
      await rotationY.inputValue(),
    ])
    .not.toEqual(["0", "0"])
  await page.waitForTimeout(400)
  await page.getByRole("button", { name: "Undo" }).click()

  await expect(rotationX).toHaveValue("0")
  await expect(rotationY).toHaveValue("0")
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

test("offers production render controls and an honest fidelity matrix", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Export" }).click()

  await expect(page.getByText("Render settings")).toBeVisible()
  await expect(page.getByLabel("Width")).toHaveValue("1080")
  await expect(page.getByLabel("Height")).toHaveValue("1080")
  await page.getByLabel("Frame rate").selectOption("24")
  await expect(page.getByText(/at 24 fps/)).toBeVisible()
  await page.getByRole("button", { name: "Landscape" }).click()
  await expect(page.getByLabel("Width")).toHaveValue("1920")
  await expect(page.getByLabel("Height")).toHaveValue("1080")

  await expect(page.getByText("Export fidelity")).toBeVisible()
  await expect(page.getByRole("cell", { name: "Full timeline" })).toBeVisible()
  await expect(page.getByRole("cell", { name: "Subset" })).toBeVisible()
  await expect(page.getByRole("cell", { name: "Compatible PBR" })).toBeVisible()
})
