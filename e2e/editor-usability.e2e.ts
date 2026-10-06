import { expect } from "@playwright/test"
import { test } from "./fixtures"

test.beforeEach(async ({ page }) => {
  await page.goto("/")
  await expect(page.locator("#glyphrise-workspace")).toHaveAttribute(
    "aria-busy",
    "false"
  )
})

test("Space activates a focused control without starting background playback", async ({
  page,
}) => {
  await page.getByRole("button", { name: /Change icon for/ }).focus()
  await page.keyboard.press("Space")
  await expect(page.getByRole("dialog")).toBeVisible()
  await expect(
    page.getByRole("button", {
      name: "Pause",
      exact: true,
      includeHidden: true,
    })
  ).toHaveCount(0)
  await page.keyboard.press("Escape")
  await expect(page.getByRole("dialog", { includeHidden: true })).toHaveCount(0)
  await page.getByRole("main").focus()
  await page.keyboard.press("Space")
  await expect(
    page.getByRole("button", { name: "Pause", exact: true })
  ).toBeVisible()
})

test("preset search stays in the selected library", async ({ page }) => {
  await page.getByRole("button", { name: /Change icon for/ }).click()
  await page.getByRole("tab", { name: "Presets", exact: true }).click()
  await page.getByRole("searchbox", { name: "Search presets" }).fill("heart")
  await page.getByRole("searchbox", { name: "Search presets" }).press("Enter")
  await expect(
    page.getByRole("button", { name: "Use typed symbol" })
  ).toHaveCount(0)
  await page.getByRole("button", { name: "Choose Heart", exact: true }).click()
  await expect(
    page.getByRole("button", { name: "Change icon for Heart" })
  ).toBeVisible()
})

test("selected icon name remains readable in the desktop inspector", async ({
  page,
}) => {
  const name = page
    .getByRole("complementary", { name: "Properties inspector" })
    .locator('[title="Account Circle"]')
  await expect(name).toBeVisible()
  expect(
    await name.evaluate((element) => element.scrollWidth <= element.clientWidth)
  ).toBe(true)
})

test("phone inspector preserves a live preview with its canvas controls", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 568 })
  await page.getByRole("button", { name: "Properties" }).click()
  await expect(
    page.getByRole("heading", { name: "Build your first 3D motion" })
  ).toHaveCount(0)
  const inspector = page.getByRole("complementary", {
    name: "Properties inspector",
  })
  await expect(inspector).toBeVisible()
  await expect(
    page.getByRole("button", { name: "Reopen quick start" })
  ).toHaveCount(0)
  const preview = page.getByRole("region", { name: "3D preview" })
  await expect(preview).toBeVisible()
  // The sheet rises from the tab bar; measure once it has settled.
  await expect
    .poll(async () => {
      const previewBox = (await preview.boundingBox())!
      const inspectorBox = (await inspector.boundingBox())!
      return previewBox.y + previewBox.height - inspectorBox.y
    })
    .toBeLessThanOrEqual(0)
  expect((await preview.boundingBox())!.height).toBeGreaterThan(120)
  await expect(
    page.getByRole("button", { name: "View options", exact: true })
  ).toBeVisible()
  await page.getByRole("button", { name: "Canvas", exact: true }).click()
  await expect(
    page.getByRole("button", { name: "Reset view", exact: true })
  ).toBeVisible()
})

test("downloads a rendered PNG with the requested dimensions", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Export", exact: true }).click()
  await page.getByText("More settings", { exact: true }).click()
  await page.getByLabel("Width", { exact: true }).fill("256")
  await page.getByLabel("Height", { exact: true }).fill("256")
  const downloadPromise = page.waitForEvent("download")
  await page
    .getByRole("button", { name: "Download image", exact: true })
    .click()
  const download = await downloadPromise
  expect(await download.failure()).toBeNull()
  const stream = await download.createReadStream()
  const chunks: Buffer[] = []
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk))
  const png = Buffer.concat(chunks)
  expect(png.subarray(1, 4).toString()).toBe("PNG")
  expect(png.readUInt32BE(16)).toBe(256)
  expect(png.readUInt32BE(20)).toBe(256)
})

test("Reset view renders intermediate artwork poses and remains one undoable edit", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const transforms = new Set<string>()
    let recording = false
    document.addEventListener("capture-reset", () => {
      recording = true
      transforms.clear()
    })
    ;(
      window as typeof window & { readResetTransforms: () => string[] }
    ).readResetTransforms = () => [...transforms]
    for (const GL of [WebGLRenderingContext, WebGL2RenderingContext]) {
      const names = new WeakMap<WebGLUniformLocation, string>()
      const locate = GL.prototype.getUniformLocation
      GL.prototype.getUniformLocation = function (program, name) {
        const location = locate.call(this, program, name)
        if (location) names.set(location, name)
        return location
      }
      const upload = GL.prototype.uniformMatrix4fv
      GL.prototype.uniformMatrix4fv = function (
        ...args: [WebGLUniformLocation | null, boolean, Iterable<number>]
      ) {
        const [location, , value] = args
        // Observe the actual 3D artwork; thumbnail stages and SVG controls
        // cannot make this pass if the canvas skips its intermediate poses.
        if (
          recording &&
          location &&
          names.get(location) === "modelViewMatrix" &&
          this.canvas instanceof HTMLCanvasElement &&
          this.canvas.closest("#glyphrise-preview-frame")
        ) {
          const elements = Array.from(value)
          transforms.add(
            JSON.stringify(
              [0, 1, 2, 4, 5, 6, 8, 9, 10].map((index) =>
                Number(elements[index].toFixed(5))
              )
            )
          )
        }
        upload.apply(this, args)
      }
    }
  })
  await page.reload()
  const rotation = page.getByLabel("Rotation Y", { exact: true })
  await rotation.fill("90")
  await rotation.press("Enter")
  await page.evaluate(() => document.dispatchEvent(new Event("capture-reset")))
  await page.getByRole("button", { name: "Reset view", exact: true }).click()
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (
            window as typeof window & { readResetTransforms: () => string[] }
          ).readResetTransforms().length
      )
    )
    .toBeGreaterThan(3)
  await expect(rotation).toHaveValue("0")
  await page.getByRole("button", { name: "Undo", exact: true }).click()
  await expect(rotation).toHaveValue("90")
})

test("Space on the timeline toggles playback without scrolling, including key repeat", async ({
  page,
}) => {
  const playhead = page.getByRole("slider", { name: "Timeline playhead" })
  await playhead.click({ position: { x: 50, y: 8 } })
  await expect(playhead).toBeFocused()
  const scrollPositions = () =>
    playhead.evaluate((element) => {
      const positions = []
      for (
        let parent = element.parentElement;
        parent;
        parent = parent.parentElement
      ) {
        positions.push(parent.scrollTop)
      }
      return positions
    })
  const before = await scrollPositions()
  await page.keyboard.down("Space")
  await expect(
    page.getByRole("button", { name: "Pause", exact: true })
  ).toBeVisible()
  await page.keyboard.down("Space")
  await page.keyboard.down("Space")
  await page.keyboard.up("Space")
  await expect(
    page.getByRole("button", { name: "Pause", exact: true })
  ).toBeVisible()
  expect(await scrollPositions()).toEqual(before)
  await page.keyboard.press("Space")
  await expect(
    page.getByRole("button", { name: "Play", exact: true })
  ).toBeVisible()
  expect(await scrollPositions()).toEqual(before)

  const time = Number(await playhead.getAttribute("aria-valuenow"))
  await page.keyboard.press("ArrowRight")
  await expect
    .poll(async () => Number(await playhead.getAttribute("aria-valuenow")))
    .toBeGreaterThan(time)
  const projectName = page.getByLabel("File name", { exact: true })
  await projectName.fill("My")
  await projectName.press("Space")
  await expect(projectName).toHaveValue("My ")
  await expect(
    page.getByRole("button", { name: "Play", exact: true })
  ).toBeVisible()
})

test("panel visibility eases in both directions and respects reduced motion", async ({
  page,
}) => {
  const preview = page.locator("#glyphrise-preview-pane")
  const originalWidth = (await preview.boundingBox())!.width
  await page.getByRole("button", { name: "Hide panels", exact: true }).click()
  await expect
    .poll(() =>
      page.evaluate(() =>
        document
          .getAnimations()
          .some(
            (animation) =>
              "animationName" in animation &&
              animation.animationName === "panel-slide-right"
          )
      )
    )
    .toBe(true)
  await expect(
    page.getByRole("button", { name: "Show panels", exact: true })
  ).toBeVisible()
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.dataset.panelTransition)
    )
    .toBeUndefined()
  expect((await preview.boundingBox())!.width).toBeGreaterThan(originalWidth)

  await page.getByRole("button", { name: "Show panels", exact: true }).click()
  await expect
    .poll(() =>
      page.evaluate(() =>
        document
          .getAnimations()
          .some(
            (animation) =>
              "animationName" in animation &&
              animation.animationName === "panel-enter-right"
          )
      )
    )
    .toBe(true)
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.dataset.panelTransition)
    )
    .toBeUndefined()
  expect((await preview.boundingBox())!.width).toBeCloseTo(originalWidth, 0)

  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.getByRole("button", { name: "Hide panels", exact: true }).click()
  await expect(
    page.getByRole("button", { name: "Show panels", exact: true })
  ).toBeVisible()
  expect(
    await page.evaluate(() => document.documentElement.dataset.panelTransition)
  ).toBeUndefined()
  await page.getByRole("button", { name: "Show panels", exact: true }).click()
  await expect(
    page.getByRole("complementary", { name: "Properties inspector" })
  ).toBeVisible()
})

test.describe("phone shared canvas transition", () => {
  test.use({ viewport: { width: 390, height: 800 }, hasTouch: true })
  test("widens the same canvas into Properties, keeps Reset view, and respects reduced motion", async ({
    page,
  }) => {
    const preview = page.locator("#glyphrise-preview-frame")
    const original = (await preview.boundingBox())!
    await page.getByRole("button", { name: "Properties", exact: true }).click()
    await expect
      .poll(() =>
        page.evaluate(() =>
          document
            .getAnimations()
            .some(
              (animation) =>
                animation.effect instanceof KeyframeEffect &&
                animation.effect.pseudoElement ===
                  "::view-transition-group(editor-preview)"
            )
        )
      )
      .toBe(true)
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.dataset.panelTransition)
      )
      .toBeUndefined()
    const expanded = (await preview.boundingBox())!
    expect(expanded.width).toBeGreaterThan(original.width)
    expect(expanded.height).toBeLessThan(original.height)
    await expect(
      page.getByRole("button", { name: "Reset view", exact: true })
    ).toBeVisible()
    await expect(
      page.getByRole("button", { name: "Transform object", exact: true })
    ).toBeVisible()
    await expect(
      page.getByRole("button", { name: "View options", exact: true })
    ).toBeVisible()
    await page.getByRole("button", { name: "Motion", exact: true }).click()
    expect(
      await page.evaluate(
        () => document.documentElement.dataset.panelTransition
      )
    ).toBeUndefined()
    expect((await preview.boundingBox())!.height).toBeCloseTo(
      expanded.height,
      1
    )
    await page.getByRole("button", { name: "Properties", exact: true }).click()
    expect(
      await page.evaluate(
        () => document.documentElement.dataset.panelTransition
      )
    ).toBeUndefined()
    expect((await preview.boundingBox())!.height).toBeCloseTo(
      expanded.height,
      1
    )
    await page.getByRole("button", { name: "Canvas", exact: true }).click()
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.dataset.panelTransition)
      )
      .toBeUndefined()
    expect((await preview.boundingBox())!.width).toBeCloseTo(original.width, 1)
    expect((await preview.boundingBox())!.height).toBeCloseTo(
      original.height,
      1
    )
    await page.emulateMedia({ reducedMotion: "reduce" })
    await page.getByRole("button", { name: "Properties", exact: true }).click()
    expect(
      await page.evaluate(
        () => document.documentElement.dataset.panelTransition
      )
    ).toBeUndefined()
    await expect(
      page.getByRole("complementary", { name: "Properties inspector" })
    ).toBeVisible()
    await page
      .getByRole("button", { name: "Open file menu", exact: true })
      .click()
    await expect(
      page.getByRole("button", { name: "Focus canvas", exact: true })
    ).toHaveCount(0)
    await expect(
      page.getByRole("button", { name: "Hide panels", exact: true })
    ).toBeHidden()
  })
})
