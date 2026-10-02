import { expect, test } from "@playwright/test"

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
    originalFinish === "Use Metal finish"
      ? "Use Glass finish"
      : "Use Metal finish"
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

test("inspector navigation supports keyboard use and timeline selections reveal the correct editor", async ({
  page,
}) => {
  const design = page.getByRole("tab", { name: "Design", exact: true })
  await expect(design).toHaveAttribute("aria-selected", "true")
  await design.focus()
  await design.press("ArrowRight")
  await expect(
    page.getByRole("tab", { name: "Transform", exact: true })
  ).toHaveAttribute("aria-selected", "true")
  await expect(page.getByLabel("Rotation Y", { exact: true })).toBeVisible()
  await page.getByRole("tab", { name: "Lighting", exact: true }).click()
  await expect(
    page.getByLabel("Light brightness", { exact: true })
  ).toBeVisible()
  await page.getByRole("tab", { name: "Sequence", exact: true }).click()
  await page
    .getByRole("button", { name: "Select Rotation property", exact: true })
    .click()
  await expect(
    page.getByRole("tab", { name: "Transform", exact: true })
  ).toHaveAttribute("aria-selected", "true")
  await design.click()
  await expect(page.getByLabel("Bevel segments", { exact: true })).toHaveCount(
    0
  )
  await page.getByRole("button", { name: "Shape detail", exact: true }).click()
  await expect(page.getByLabel("Bevel segments", { exact: true })).toBeVisible()
})

test("motion presets preview the selected artwork and the labeled keyframe controls are reachable", async ({
  page,
}) => {
  await expect(
    page.getByRole("tab", { name: "Motion", exact: true })
  ).toHaveAttribute("aria-selected", "true")
  const endpoint = page.getByRole("button", {
    name: "Edit Rotation keyframe at 5.00s",
    exact: true,
  })
  await expect(endpoint).toContainText("End")
  await expect(endpoint).toContainText("5.00s")
  await endpoint.click()
  await expect(
    page.getByLabel("Keyframe rotation Y", { exact: true })
  ).toBeVisible()
  await page.getByRole("button", { name: "Done", exact: true }).click()
  await page
    .getByRole("button", { name: "Choose motion presets", exact: true })
    .click()
  const choices = page.getByRole("dialog").locator(".motion-preview svg")
  await expect(choices).toHaveCount(3)
  await page.getByRole("button", { name: "Tilt", exact: true }).click()
  await page.getByRole("button", { name: "Apply Tilt", exact: true }).click()
  await expect(page.getByRole("dialog")).toHaveCount(0)
})

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
          originalFinish === "Use Glass finish"
            ? "Use Metal finish"
            : "Use Glass finish",
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
        name: "Select Account Circle Off icon at 4.00s",
        exact: true,
      })
      await secondIcon.click()
      await expect(secondIcon).toHaveAttribute("aria-pressed", "true")
      await expect(
        page.getByLabel("Playhead time in seconds", { exact: true })
      ).toHaveValue("4.00")
      await expect(preview).toBeVisible()
      for (const control of [
        undo,
        page.getByRole("button", { name: "Play timeline", exact: true }),
        page.getByRole("button", { name: "Animate", exact: true }),
      ]) {
        const box = (await control.boundingBox())!
        expect(box.width).toBeGreaterThanOrEqual(44)
        expect(box.height).toBeGreaterThanOrEqual(44)
      }
      await page.getByRole("button", { name: "Animate", exact: true }).click()
      await expect(
        page.getByRole("dialog").locator(".motion-preview svg")
      ).toHaveCount(3)
      await expect(
        page.getByRole("button", { name: "Apply Spin", exact: true })
      ).toBeEnabled()
      await page.keyboard.press("Escape")
      await expect(
        page.getByRole("button", { name: "Animate", exact: true })
      ).toBeFocused()
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth)
      ).toBe(width)
    })
  })
}
