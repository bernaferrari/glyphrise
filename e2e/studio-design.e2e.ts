import { expect } from "@playwright/test"
import { test } from "./fixtures"

test.beforeEach(async ({ page }) => {
  await page.goto("/")
  await expect(page.locator("#glyphrise-workspace")).toHaveAttribute(
    "aria-busy",
    "false"
  )
})

test("direct finish choices change the artwork and undo restores the selected finish", async ({
  page,
}) => {
  const originalFinish = await page
    .locator('[aria-label="Popular finishes"] button[aria-pressed="true"]')
    .getAttribute("aria-label")
  const chosenName =
    originalFinish === "Use Satin finish"
      ? "Use Frost finish"
      : "Use Satin finish"
  const metal = page.getByRole("button", {
    name: chosenName,
    exact: true,
  })
  await metal.click()
  await expect(metal).toHaveAttribute("aria-pressed", "true")
  await expect(
    page.getByRole("button", { name: "Undo", exact: true })
  ).toBeEnabled()
  await page.getByRole("button", { name: "Undo", exact: true }).click()
  await expect(
    page.getByRole("button", { name: originalFinish!, exact: true })
  ).toHaveAttribute("aria-pressed", "true")
})

test("gradient presets support pointer and keyboard selection with an accurate selected state", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Gradient", exact: true }).click()
  const presets = page.getByRole("button", { name: /^Use .* gradient$/ })
  const first = presets.nth(0)
  const second = presets.nth(1)
  await first.click()
  await expect(first).toHaveAttribute("aria-pressed", "true")
  await second.focus()
  await second.press("Enter")
  await expect(second).toHaveAttribute("aria-pressed", "true")
  await expect(first).toHaveAttribute("aria-pressed", "false")
  await page.keyboard.press("Escape")
  await expect(first).toHaveCount(0)
  await page.getByRole("button", { name: "Undo", exact: true }).click()
  await page.getByRole("button", { name: "Gradient", exact: true }).click()
  await expect(first).toHaveAttribute("aria-pressed", "true")
})

test("desktop inspector shows every section and timeline selections reveal the right one", async ({
  page,
}) => {
  // One scrolling column on desktop, like Figma: no tabs to hunt through.
  await expect(page.getByRole("tab", { name: "Design" })).toHaveCount(0)
  await expect(page.getByLabel("Rotation Y", { exact: true })).toBeAttached()
  await expect(
    page.getByLabel("Light brightness", { exact: true })
  ).toBeAttached()
  await page
    .getByRole("button", { name: "Select Rotation property", exact: true })
    .click()
  await expect(page.getByLabel("Rotation Y", { exact: true })).toBeInViewport()
  await expect(page.getByLabel("Bevel segments", { exact: true })).toHaveCount(
    0
  )
  await page.getByRole("button", { name: "Shape detail", exact: true }).click()
  await expect(page.getByLabel("Bevel segments", { exact: true })).toBeVisible()
})

test("Animate previews the selected artwork and timeline points stay reachable", async ({
  page,
}) => {
  await expect(page.getByText("Motion presets", { exact: true })).toHaveCount(0)
  await expect(page.locator(".motion-preview")).toHaveCount(0)
  const endpoint = page.getByRole("button", {
    name: /^Select Rotation keyframe.* at 5\.00 seconds$/,
  })
  await endpoint.dblclick()
  await expect(
    page.getByLabel("Keyframe rotation Y", { exact: true })
  ).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(page.getByRole("dialog")).toHaveCount(0)
  await expect(endpoint).toBeFocused()
  await page.getByRole("button", { name: "Add property", exact: true }).click()
  // Each preset previews on the user's artwork, grouped by property.
  const menu = page.getByRole("dialog")
  await expect(menu.locator(".motion-preview svg")).toHaveCount(3)
  await menu
    .getByRole("region", { name: "Rotation" })
    .getByRole("button", { name: "Tilt", exact: true })
    .click()
  await expect(page.getByRole("dialog")).toHaveCount(0)
})

for (const width of [390, 1280]) {
  test.describe(`property sliders at ${width}px`, () => {
    test.use({ viewport: { width, height: 800 }, hasTouch: width < 720 })
    test("supports pointer and keyboard changes with undo and exact numeric entry", async ({
      page,
    }) => {
      if (width < 720)
        await page
          .getByRole("button", { name: "Properties", exact: true })
          .click()
      const slider = page.getByRole("slider", {
        name: "Extrusion depth slider",
        exact: true,
      })
      const number = page.getByLabel("Extrusion depth", { exact: true })
      await slider.scrollIntoViewIfNeeded()
      const bounds = (await slider.boundingBox())!
      // Compact on desktop (matches the number field); finger-sized on phones.
      expect(bounds.height).toBeGreaterThanOrEqual(width < 720 ? 44 : 32)
      const original = await number.inputValue()
      await slider.click({
        position: { x: bounds.width * 0.75, y: bounds.height / 2 },
      })
      await expect(number).not.toHaveValue(original)
      const clicked = await number.inputValue()
      await slider.press("ArrowLeft")
      await expect(number).not.toHaveValue(clicked)
      const undo = page.getByRole("button", {
        name: width < 720 ? "Undo edit" : "Undo",
        exact: true,
      })
      await undo.click()
      await expect(number).toHaveValue(clicked)
      await number.fill("25.50")
      await number.press("Enter")
      await expect(number).toHaveValue("25.50")
      await expect(slider).toHaveAttribute("aria-valuetext", "25.50")
    })
  })
}

test("the inspector spans the desktop workspace and the icon library returns keyboard focus", async ({
  page,
}) => {
  const inspector = await page
    .getByRole("complementary", { name: "Properties inspector" })
    .boundingBox()
  const timeline = await page.locator("#glyphrise-timeline-pane").boundingBox()
  expect(inspector!.y + inspector!.height).toBeCloseTo(
    timeline!.y + timeline!.height,
    0
  )
  expect(timeline!.x + timeline!.width).toBeLessThanOrEqual(inspector!.x + 1)
  const changeIcon = page.getByRole("button", { name: /Change icon for/ })
  await changeIcon.click()
  await expect(page.getByRole("dialog")).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(page.getByRole("dialog")).toHaveCount(0)
  await expect(changeIcon).toBeFocused()
})

for (const width of [320, 390]) {
  test.describe(`preview-first phone editing at ${width}px`, () => {
    test.use({ viewport: { width, height: 800 }, hasTouch: true })
    test("edits appearance beside a live preview, undoes it directly, and selects artwork from the motion strip", async ({
      page,
    }) => {
      await page
        .getByRole("button", { name: "Properties", exact: true })
        .click()
      const preview = page.getByRole("region", { name: "3D preview" })
      const inspector = page.getByRole("complementary", {
        name: "Properties inspector",
      })
      const previewBox = (await preview.boundingBox())!
      const inspectorBox = (await inspector.boundingBox())!
      expect(previewBox.y + previewBox.height).toBeLessThanOrEqual(
        inspectorBox.y
      )
      expect(previewBox.height).toBeGreaterThan(200)
      const originalFinish = await page
        .locator('[aria-label="Popular finishes"] button[aria-pressed="true"]')
        .getAttribute("aria-label")
      const changed = page.getByRole("button", {
        name:
          originalFinish === "Use Frost finish"
            ? "Use Satin finish"
            : "Use Frost finish",
        exact: true,
      })
      await changed.click()
      await expect(changed).toHaveAttribute("aria-pressed", "true")
      const undo = page.getByRole("button", { name: "Undo edit", exact: true })
      await undo.click()
      await expect(
        page.getByRole("button", { name: originalFinish!, exact: true })
      ).toHaveAttribute("aria-pressed", "true")
      await page.getByRole("button", { name: "Redo edit", exact: true }).click()
      await expect(changed).toHaveAttribute("aria-pressed", "true")
      await page.getByRole("button", { name: "Motion", exact: true }).click()
      const secondIcon = page.getByRole("button", {
        name: "Account Circle Off icon clip",
        exact: true,
      })
      await secondIcon.click()
      await expect(secondIcon).toHaveAttribute("aria-pressed", "true")
      await expect(
        page.getByLabel("Playhead time in seconds", { exact: true })
      ).toHaveValue("0:04.00")
      await expect(preview).toBeVisible()
      for (const control of [
        undo,
        page.getByRole("button", { name: "Play timeline", exact: true }),
      ]) {
        const box = (await control.boundingBox())!
        expect(box.width).toBeGreaterThanOrEqual(44)
        expect(box.height).toBeGreaterThanOrEqual(44)
      }
      await page.getByRole("button", { name: "Workspace actions" }).click()
      await page.getByRole("button", { name: "Animate", exact: true }).click()
      await expect(
        page.getByRole("dialog").locator(".motion-preview svg")
      ).toHaveCount(4)
      await expect(
        page.getByRole("button", { name: /^Apply Spin/ })
      ).toBeEnabled()
      await page.keyboard.press("Escape")
      await expect(page.getByRole("dialog")).toHaveCount(0)
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth)
      ).toBe(width)
    })
  })
}
