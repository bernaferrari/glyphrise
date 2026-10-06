import { expect, type Page } from "@playwright/test"
import { test } from "./fixtures"

const openProjects = async (page: Page) => {
  await page.getByRole("button", { name: "Open file menu" }).click()
  await page.getByRole("button", { name: "All files" }).click()
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const isolationKey = "glyphrise.e2e.storage-cleared"
    if (window.sessionStorage.getItem(isolationKey)) return
    window.localStorage.clear()
    window.localStorage.setItem("glyphrise:quick-start:v1", "dismissed")
    window.sessionStorage.setItem(isolationKey, "true")
  })
  await page.goto("/")
  // Native controls are inert while the project restores; fill() bypasses
  // that hit-testing guard, so wait for the interactive workspace.
  await expect(page.locator("#glyphrise-workspace")).toHaveAttribute(
    "aria-busy",
    "false"
  )
})

test("creates a named blank project without example animation", async ({
  page,
}) => {
  await openProjects(page)
  await page.getByText("Create a new file", { exact: true }).click()
  await page.getByLabel("New file name").fill("Launch mark")
  await page.getByRole("button", { name: "Start blank" }).click()

  const projectName = page.getByLabel("File name", { exact: true })
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

test("restores the saved file before creating its 3D scene", async ({
  page,
}) => {
  await openProjects(page)
  await page.getByText("Create a new file", { exact: true }).click()
  await page.getByLabel("New file name").fill("Restored file")
  await page.getByRole("button", { name: "Start blank" }).click()
  await expect(page.getByLabel("File name", { exact: true })).toHaveValue(
    "Restored file"
  )
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext
    // Record only connected preview canvases; thumbnails use offscreen canvases.
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      ...args
    ) {
      if (
        args[0] === "webgl2" &&
        this.isConnected &&
        document
          .querySelector("#glyphrise-workspace")
          ?.getAttribute("aria-busy") === "true"
      ) {
        document.documentElement.dataset.earlyWebgl = "true"
      }
      return Reflect.apply(getContext, this, args)
    } as typeof getContext
  })
  await page.reload()
  await expect(page.locator("#glyphrise-workspace")).toHaveAttribute(
    "aria-busy",
    "false"
  )
  await expect(page.getByLabel("File name", { exact: true })).toHaveValue(
    "Restored file"
  )
  await expect(
    page.getByRole("region", { name: "3D preview" }).locator("canvas")
  ).toBeVisible()
  await expect(
    page.getByText("Preparing 3D icon", { exact: true })
  ).toBeHidden()
  await expect(page.locator("html")).not.toHaveAttribute(
    "data-early-webgl",
    "true"
  )
})

test("reuses real finish previews on reload without recreating their WebGL stage", async ({
  page,
}) => {
  const satin = page
    .getByRole("button", { name: "Use Satin finish", exact: true })
    .locator("img")
  await expect(satin).toBeVisible()
  await expect
    .poll(async () =>
      page.evaluate(() => {
        const serialized = localStorage.getItem(
          "glyphrise:finish-thumbnails:v1"
        )
        return serialized
          ? Object.keys(JSON.parse(serialized).thumbnails).length
          : 0
      })
    )
    .toBeGreaterThanOrEqual(9)
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      ...args
    ) {
      if (args[0] === "webgl2" && !this.isConnected)
        document.documentElement.dataset.thumbnailWebgl = "true"
      return Reflect.apply(getContext, this, args)
    } as typeof getContext
  })
  await page.reload()
  await expect(page.locator("#glyphrise-workspace")).toHaveAttribute(
    "aria-busy",
    "false"
  )
  await expect(satin).toBeVisible()
  await expect(page.locator("html")).not.toHaveAttribute(
    "data-thumbnail-webgl",
    "true"
  )
})

test("duplicates projects and recovers after deleting the current project", async ({
  page,
}) => {
  const createBlankProject = async (name: string) => {
    await openProjects(page)
    await page.getByText("Create a new file", { exact: true }).click()
    await page.getByLabel("New file name").fill(name)
    await page.getByRole("button", { name: "Start blank" }).click()
    await expect(page.getByLabel("File name", { exact: true })).toHaveValue(
      name
    )
  }

  await createBlankProject("Original")
  await createBlankProject("Second project")

  await openProjects(page)
  await page
    .getByRole("button", { name: "Duplicate Original", exact: true })
    .click()
  await expect(page.getByLabel("File name", { exact: true })).toHaveValue(
    "Original copy"
  )

  await openProjects(page)
  await page
    .getByRole("button", { name: "Delete Original copy", exact: true })
    .click()
  await expect(
    page.getByRole("heading", { name: "Delete “Original copy”?" })
  ).toBeVisible()
  await page.getByRole("button", { name: "Delete file" }).click()

  await expect(page.getByLabel("File name", { exact: true })).toHaveValue(
    "Second project"
  )
  await expect(
    page.getByRole("button", { name: "Open Original copy, open now" })
  ).toHaveCount(0)
})

test("can reopen, duplicate, and delete a project beyond the first eight", async ({
  page,
}) => {
  const createBlankProject = async (name: string) => {
    await openProjects(page)
    await page.getByText("Create a new file", { exact: true }).click()
    await page.getByLabel("New file name").fill(name)
    await page.getByRole("button", { name: "Start blank" }).click()
    await expect(page.getByLabel("File name", { exact: true })).toHaveValue(
      name
    )
  }

  await createBlankProject("Oldest saved project")
  for (let index = 2; index <= 12; index += 1) {
    await createBlankProject(`Project ${index}`)
  }

  await openProjects(page)
  await expect(page.getByLabel("Search files")).toBeVisible()
  await expect(
    page.getByRole("button", {
      name: /^Open (Oldest saved project|Project \d+)(, open now)?$/,
    })
  ).toHaveCount(12)

  await page.getByLabel("Search files").fill("Oldest saved")
  await expect(
    page.getByRole("button", { name: "Open Oldest saved project" })
  ).toBeVisible()
  await page.getByRole("button", { name: "Open Oldest saved project" }).click()
  await expect(page.getByLabel("File name", { exact: true })).toHaveValue(
    "Oldest saved project"
  )

  await openProjects(page)
  await page.getByLabel("Search files").fill("Oldest saved")
  await page
    .getByRole("button", { name: "Duplicate Oldest saved project" })
    .click()
  await expect(page.getByLabel("File name", { exact: true })).toHaveValue(
    "Oldest saved project copy"
  )

  await openProjects(page)
  await page.getByLabel("Search files").fill("Oldest saved project copy")
  await page
    .getByRole("button", { name: "Delete Oldest saved project copy" })
    .click()
  await page.getByRole("button", { name: "Delete file" }).click()
  await expect(page.getByLabel("File name", { exact: true })).not.toHaveValue(
    "Oldest saved project copy"
  )
})

test("starts style templates with a clean undo baseline", async ({ page }) => {
  await openProjects(page)
  await page.getByText("Create a new file", { exact: true }).click()
  await page.getByLabel("New file name").fill("Styled project")
  await page.getByRole("button", { name: "Spectrum Chrome" }).click()

  await expect(page.getByLabel("File name", { exact: true })).toHaveValue(
    "Styled project"
  )
  await expect(page.getByRole("button", { name: "Undo" })).toBeDisabled()
})

test("uploads a custom SVG into the selected icon clip", async ({ page }) => {
  await page.getByRole("button", { name: /Change icon for/ }).click()
  await page.getByRole("tab", { name: "Upload", exact: true }).click()

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
  // One app menu, anchored to the file name (as in ShapeShifter).
  await page.getByRole("button", { name: "Open file menu" }).click()

  await expect(page.getByRole("button", { name: "All files" })).toBeVisible()
  await expect(
    page.getByRole("button", { name: "Open from computer" })
  ).toBeVisible()
  await expect(
    page.getByRole("button", { name: "Download a copy" })
  ).toBeVisible()
  // Animate lives on the preview, so the menu never repeats it.
  await page.keyboard.press("Escape")
  await expect(
    page.getByRole("button", { name: "Animate", exact: true })
  ).toBeVisible()
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(640)
})

test("uses dedicated workspace views on phone-sized screens", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 568 })

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
    page.getByRole("complementary", { name: "Properties inspector" })
  ).toBeVisible()

  await page.getByRole("button", { name: "Motion" }).click()
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

test("orbits the camera without editing the document", async ({ page }) => {
  const canvas = page
    .getByRole("region", { name: "3D preview" })
    .locator("canvas")
  const box = await canvas.boundingBox()
  if (!box) throw new Error("3D preview canvas was not measurable.")

  const startX = box.x + box.width * 0.28
  const startY = box.y + box.height * 0.3
  await page.mouse.move(startX, startY)
  await page.keyboard.down("Alt")
  await page.mouse.down()
  await page.mouse.move(startX + 90, startY + 55, { steps: 8 })
  await page.mouse.up()
  await page.keyboard.up("Alt")

  const rotationX = page.getByLabel("Rotation X", { exact: true })
  const rotationY = page.getByLabel("Rotation Y", { exact: true })
  await expect(rotationX).toHaveValue("0")
  await expect(rotationY).toHaveValue("0")
  await expect(page.getByRole("button", { name: "Undo" })).toBeDisabled()
  await page.getByRole("button", { name: "Reset view", exact: true }).click()
  await expect(rotationY).toHaveValue("0")
  await expect(page.getByRole("button", { name: "Undo" })).toBeDisabled()

  // An explicit object edit still participates in document undo.
  await rotationY.fill("25")
  await rotationY.press("Enter")
  await page.getByRole("button", { name: "Undo" }).click()
  await expect(rotationY).toHaveValue("0")
})

test("resets artwork rotation, position, and scale together with undo", async ({
  page,
}) => {
  await openProjects(page)
  await page.getByText("Create a new file", { exact: true }).click()
  await page.getByLabel("New file name").fill("Reset transforms")
  await page.getByRole("button", { name: "Start blank" }).click()
  const rotation = page.getByLabel("Rotation Y", { exact: true })
  const position = page.getByLabel("Position X", { exact: true })
  const scale = page.getByLabel("Scale", { exact: true })
  await scale.fill("1.5")
  await scale.press("Enter")
  await rotation.fill("25")
  await rotation.press("Enter")
  await position.fill("12")
  await position.press("Enter")
  await expect(position).toHaveValue("12")
  await page.getByRole("button", { name: "Reset view", exact: true }).click()
  await expect(rotation).toHaveValue("0")
  await expect(position).toHaveValue("0")
  await expect(scale).toHaveValue("1.00")
  await page.getByRole("button", { name: "Undo", exact: true }).click()
  await expect(rotation).toHaveValue("25")
  await expect(position).toHaveValue("12")
  await expect(scale).toHaveValue("1.50")
})

test("describes code exports as implementation starters", async ({ page }) => {
  await page.getByRole("button", { name: "Export", exact: true }).click()
  await page
    .getByRole("button", { name: "Developer exports", exact: true })
    .click()
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
  await page.getByRole("button", { name: "Export", exact: true }).click()

  await expect(page.getByText("Size", { exact: true })).toBeVisible()
  await page
    .getByRole("button", { name: "Video Full animation", exact: true })
    .click()
  await page.getByText("More settings", { exact: true }).click()
  await expect(page.getByLabel("Width")).toHaveValue("1080")
  await expect(page.getByLabel("Height")).toHaveValue("1080")
  await page
    .getByRole("radiogroup", { name: "Frame rate" })
    .getByRole("radio", { name: "24 fps" })
    .click()
  await expect(page.getByText(/· 24 fps/)).toBeVisible()
  await page.getByRole("button", { name: "Landscape" }).click()
  await expect(page.getByLabel("Width")).toHaveValue("1920")
  await expect(page.getByLabel("Height")).toHaveValue("1080")

  await page.getByText("Format details", { exact: true }).click()
  await expect(page.getByText("Export fidelity")).toBeVisible()
  await expect(page.getByRole("cell", { name: "Full timeline" })).toBeVisible()
  await expect(page.getByRole("cell", { name: "Subset" })).toBeVisible()
  await expect(page.getByRole("cell", { name: "Compatible PBR" })).toBeVisible()
})

test.describe("mobile bottom navigation gestures", () => {
  test.use({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  })

  test("keeps nav drags out of native scrolling while Properties still scrolls", async ({
    page,
  }) => {
    const nav = page.getByRole("navigation", { name: "Workspace views" })
    await nav.evaluate((element) => {
      element.addEventListener("pointercancel", () => {
        element.setAttribute("data-browser-pan", "true")
      })
    })
    const session = await page.context().newCDPSession(page)
    const swipeUp = async (x: number, y: number, distance: number) => {
      await session.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [{ x, y }],
      })
      for (let step = 1; step <= 20; step++) {
        await session.send("Input.dispatchTouchEvent", {
          type: "touchMove",
          touchPoints: [{ x, y: y - (distance * step) / 20 }],
        })
      }
      await session.send("Input.dispatchTouchEvent", {
        type: "touchEnd",
        touchPoints: [],
      })
    }
    for (const view of ["Canvas", "Properties", "Motion"]) {
      await page.getByRole("button", { name: view, exact: true }).tap()
      const before = await nav.boundingBox()
      expect(before).not.toBeNull()
      await swipeUp(
        before!.x + before!.width / 2,
        before!.y + before!.height / 2,
        300
      )
      await expect(nav).not.toHaveAttribute("data-browser-pan", "true")
      expect((await nav.boundingBox())!.y).toBe(before!.y)
      expect(await page.evaluate(() => window.scrollY)).toBe(0)
    }
    await page.getByRole("button", { name: "Properties", exact: true }).tap()
    const scrollPane = page
      .locator("#glyphrise-properties-pane")
      .locator(".overflow-y-auto")
      .filter({ visible: true })
    const box = await scrollPane.boundingBox()
    await swipeUp(box!.x + 8, box!.y + box!.height * 0.8, box!.height * 0.5)
    await expect
      .poll(() => scrollPane.evaluate((element) => element.scrollTop))
      .toBeGreaterThan(0)
    await session.detach()
  })
})
