import { expect } from "@playwright/test"
import { test } from "./fixtures"

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true })

test("pinching with the transform gizmo visible doesn't edit the artwork", async ({
  page,
}) => {
  await page.goto("/")
  await expect(page.locator("#glyphrise-workspace")).toHaveAttribute(
    "aria-busy",
    "false"
  )
  await page.getByRole("button", { name: "View options", exact: true }).click()
  await page
    .getByRole("switch", { name: "Transform gizmo", exact: true })
    .click()
  await page.keyboard.press("Escape")
  const bounds = (await page
    .locator("#glyphrise-preview-frame canvas")
    .boundingBox())!
  const x = bounds.x + bounds.width / 2
  const y = bounds.y + bounds.height / 2
  const cdp = await page.context().newCDPSession(page)
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ id: 1, x, y }],
  })
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [
      { id: 1, x, y },
      { id: 2, x: x + 60, y },
    ],
  })
  for (const spread of [10, 20, 30])
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [
        { id: 1, x: x - spread, y },
        { id: 2, x: x + 60 + spread, y },
      ],
    })
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  })
  await expect(
    page.getByRole("button", { name: /^Undo(?: edit)?$/, exact: true })
  ).toBeDisabled()
})

test("pinching the phone canvas zooms the view without orbiting or editing artwork", async ({
  page,
}) => {
  await page.goto("/")
  await expect(page.locator("#glyphrise-workspace")).toHaveAttribute(
    "aria-busy",
    "false"
  )
  const canvas = page.locator("#glyphrise-preview-frame canvas")
  const bounds = (await canvas.boundingBox())!
  const center = {
    x: bounds.x + bounds.width / 2,
    y: bounds.y + bounds.height / 2,
  }
  const orientation = page
    .getByRole("group", { name: "Artwork orientation" })
    .locator("svg > g")
  const originalOrientation = await orientation.evaluateAll((markers) =>
    markers.map((marker) => marker.getAttribute("transform"))
  )
  const coloredPixels = async () => {
    const png = (await canvas.screenshot()).toString("base64")
    return page.evaluate(async (png) => {
      const image = await createImageBitmap(
        await (await fetch(`data:image/png;base64,${png}`)).blob()
      )
      const surface = document.createElement("canvas")
      surface.width = image.width
      surface.height = image.height
      const context = surface.getContext("2d")!
      context.drawImage(image, 0, 0)
      image.close()
      const pixels = context.getImageData(
        0,
        0,
        surface.width,
        surface.height
      ).data
      let count = 0
      for (let index = 0; index < pixels.length; index += 4) {
        const channels = [pixels[index], pixels[index + 1], pixels[index + 2]]
        if (Math.max(...channels) - Math.min(...channels) > 40) count++
      }
      return count
    }, png)
  }
  const before = await coloredPixels()
  expect(before).toBeGreaterThan(1000)
  const cdp = await page.context().newCDPSession(page)
  const touch = (
    type: "touchStart" | "touchMove" | "touchEnd",
    spread: number | null
  ) =>
    cdp.send("Input.dispatchTouchEvent", {
      type,
      touchPoints:
        spread === null
          ? []
          : [-1, 1].map((direction, index) => ({
              id: index + 1,
              x: center.x + direction * spread,
              y: center.y,
              radiusX: 5,
              radiusY: 5,
            })),
    })
  await touch("touchStart", 35)
  for (const spread of [45, 55, 70]) await touch("touchMove", spread)
  await touch("touchEnd", null)
  await expect.poll(coloredPixels).toBeGreaterThan(before * 1.5)
  expect(
    await orientation.evaluateAll((markers) =>
      markers.map((marker) => marker.getAttribute("transform"))
    )
  ).toEqual(originalOrientation)
  expect(await page.evaluate(() => window.visualViewport!.scale)).toBe(1)
  await expect(
    page.getByRole("button", { name: /^Undo(?: edit)?$/, exact: true })
  ).toBeDisabled()
  await touch("touchStart", 70)
  for (const spread of [55, 45, 35]) await touch("touchMove", spread)
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [{ id: 1, x: center.x - 35, y: center.y }],
  })
  await expect.poll(coloredPixels).toBeGreaterThan(before * 0.95)
  await expect.poll(coloredPixels).toBeLessThan(before * 1.05)
  // Keeping one finger down resumes orbiting from its current position.
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ id: 2, x: center.x + 80, y: center.y }],
  })
  await touch("touchEnd", null)
  await expect
    .poll(() =>
      orientation.evaluateAll((markers) =>
        markers.map((marker) => marker.getAttribute("transform"))
      )
    )
    .not.toEqual(originalOrientation)
  await expect(
    page.getByRole("button", { name: /^Undo(?: edit)?$/, exact: true })
  ).toBeDisabled()
  await page.getByRole("button", { name: "Reset view", exact: true }).click()
  await expect.poll(coloredPixels).toBeGreaterThan(before * 0.95)
  await expect.poll(coloredPixels).toBeLessThan(before * 1.05)
  // OS cancellation releases both pointers so a fresh pinch still works.
  await touch("touchStart", 35)
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchCancel",
    touchPoints: [],
  })
  await touch("touchStart", 35)
  for (const spread of [45, 55, 70]) await touch("touchMove", spread)
  await touch("touchEnd", null)
  await expect.poll(coloredPixels).toBeGreaterThan(before * 1.5)
})
