import { expect } from "@playwright/test"
import { test } from "./fixtures"

for (const width of [320, 1280]) {
  test.describe(`canvas orientation at ${width}px`, () => {
    test.use({ viewport: { width, height: 800 }, hasTouch: width < 720 })
    test("tapping an axis restores the original aligned view", async ({
      page,
    }) => {
      await page.goto("/")
      await expect(page.locator("#glyphrise-workspace")).toHaveAttribute(
        "aria-busy",
        "false"
      )
      const gizmo = page.getByRole("group", { name: "Artwork orientation" })
      const canvas = page.locator("#glyphrise-preview-frame canvas")
      const bounds = (await canvas.boundingBox())!
      await page.mouse.move(
        bounds.x + bounds.width * 0.25,
        bounds.y + bounds.height * 0.3
      )
      await page.mouse.down()
      await page.mouse.move(
        bounds.x + bounds.width * 0.65,
        bounds.y + bounds.height * 0.5
      )
      await page.mouse.up()
      for (const [axis, transforms] of [
        [
          "Z",
          [
            "translate(62.0 40.0)",
            "translate(40.0 18.0)",
            "translate(40.0 40.0)",
          ],
        ],
        [
          "X",
          [
            "translate(40.0 40.0)",
            "translate(40.0 18.0)",
            "translate(18.0 40.0)",
          ],
        ],
        [
          "Y",
          [
            "translate(62.0 40.0)",
            "translate(40.0 40.0)",
            "translate(40.0 18.0)",
          ],
        ],
      ] as const) {
        const button = gizmo.getByRole("button", {
          name: `Align view to ${axis} axis`,
          exact: true,
        })
        if (width < 720) await button.tap()
        else await button.click()
        for (const [index, transform] of transforms.entries()) {
          await expect(gizmo.locator("svg > g").nth(index)).toHaveAttribute(
            "transform",
            transform
          )
        }
      }
      await expect(
        page.getByRole("button", {
          name: "Undo",
          exact: true,
          includeHidden: true,
        })
      ).toBeDisabled()
    })
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
      // A single movement must start orbiting immediately, including a
      // touch-sized drag. The former threshold path discarded this event.
      await page.mouse.move(
        bounds.x + bounds.width * 0.25,
        bounds.y + bounds.height * 0.4
      )
      await page.mouse.down()
      await page.mouse.move(
        bounds.x + bounds.width * 0.6,
        bounds.y + bounds.height * 0.4
      )
      await expect(marker).not.toHaveAttribute("transform", initial!)
      await page.mouse.up()
      if (width < 720) {
        await page
          .getByRole("button", { name: "Properties", exact: true })
          .click()
        await expect(
          page.getByLabel("Rotation Y", { exact: true })
        ).toHaveValue("0")
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
      const verticalMarker = gizmo.locator("svg > g").nth(1)
      for (const name of ["Tilt up 45 degrees", "Tilt down 45 degrees"]) {
        for (const y of ["24.4", "40.0", "55.6", "62.0"]) {
          const tilt = gizmo.getByRole("button", { name, exact: true })
          if (width < 720) await tilt.tap()
          else await tilt.click()
          await expect(verticalMarker).toHaveAttribute(
            "transform",
            `translate(40.0 ${y})`
          )
        }
        await page
          .getByRole("button", { name: "Reset view", exact: true })
          .click()
        await expect(verticalMarker).toHaveAttribute(
          "transform",
          "translate(40.0 18.0)"
        )
      }
      await page.getByRole("button", { name: "Play", exact: true }).click()
      await expect(marker).not.toHaveAttribute("transform", initial!)
      await page.getByRole("button", { name: "Pause", exact: true }).click()
      await page.screenshot({ path: `/tmp/3d-editor-orientation-${width}.png` })
    })
  })
}
