import { expect } from "@playwright/test"
import { test } from "./fixtures"

for (const width of [320, 1280]) {
  test.describe(`canvas orientation at ${width}px`, () => {
    test.use({ viewport: { width, height: 800 }, hasTouch: width < 720 })
    test("follows artwork, playback, camera nudges, and reset", async ({
      page,
    }) => {
      await page.goto("/")
      await expect(page.locator("#glyphrise-workspace")).toHaveAttribute(
        "aria-busy",
        "false"
      )
      const gizmo = page.getByRole("group", { name: "Artwork orientation" })
      const marker = gizmo.locator("svg > g").first()
      await expect(marker).toHaveAttribute("transform", "translate(62.0 40.0)")
      const initial = await marker.getAttribute("transform")
      const canvas = page.locator("#glyphrise-preview-frame canvas")
      const bounds = (await canvas.boundingBox())!
      await page.mouse.move(
        bounds.x + bounds.width * 0.25,
        bounds.y + bounds.height * 0.4
      )
      await page.mouse.down()
      await page.mouse.move(
        bounds.x + bounds.width * 0.6,
        bounds.y + bounds.height * 0.5,
        { steps: 8 }
      )
      await page.mouse.up()
      await expect(marker).not.toHaveAttribute("transform", initial!)
      if (width < 720) {
        await page
          .getByRole("button", { name: "Properties", exact: true })
          .click()
        await expect(
          page.getByLabel("Rotation Y", { exact: true })
        ).not.toHaveValue("0")
        await page.getByRole("button", { name: "Canvas", exact: true }).click()
      }
      await page
        .getByRole("button", { name: "Reset view", exact: true })
        .click()
      await expect(marker).toHaveAttribute("transform", initial!)
      const nudge = gizmo.getByRole("button", {
        name: "Rotate left 45 degrees",
      })
      await expect(nudge).toBeVisible()
      await expect(nudge).toBeInViewport({ ratio: 1 })
      if (width < 720) await nudge.tap()
      else await nudge.click()
      await expect(marker).not.toHaveAttribute("transform", initial!)
      await page
        .getByRole("button", { name: "Reset view", exact: true })
        .click()
      await expect(marker).toHaveAttribute("transform", initial!)
      await page.getByRole("button", { name: "Play", exact: true }).click()
      await expect(marker).not.toHaveAttribute("transform", initial!)
      await page.getByRole("button", { name: "Pause", exact: true }).click()
      await page.screenshot({ path: `/tmp/3d-editor-orientation-${width}.png` })
    })
  })
}
