import { expect } from "@playwright/test"
import { test } from "./fixtures"

test("each tab searches its own content, and Enter chooses a real symbol", async ({
  page,
}) => {
  await page.goto("/")
  await page.getByRole("button", { name: /Change icon for/ }).click()
  const search = page.getByRole("searchbox", {
    name: "Search Material Symbols",
  })
  await search.fill("heart")
  // Symbols search only symbols: presets live on their own tab.
  await expect(
    page.getByRole("button", { name: "favorite", exact: true })
  ).toBeVisible()
  await expect(
    page.getByRole("button", { name: "Choose Heart", exact: true })
  ).toHaveCount(0)
  await search.press("Enter")
  await expect(page.getByRole("dialog")).toHaveCount(0)

  await page.getByRole("button", { name: /Change icon for/ }).click()
  await search.fill("user")
  await expect(
    page.getByRole("button", { name: "person", exact: true })
  ).toBeVisible()
  await search.fill("zzzz_nonexistent")
  await expect(
    page.getByText("No matching symbols.", { exact: false })
  ).toBeVisible()

  await page.getByRole("tab", { name: "Presets", exact: true }).click()
  const presetSearch = page.getByRole("searchbox", { name: "Search presets" })
  await presetSearch.fill("heart")
  await expect(
    page.getByRole("button", { name: "Choose Heart", exact: true })
  ).toBeVisible()
})

for (const width of [390, 1024]) {
  test.describe(`touch timeline at ${width}px`, () => {
    test.use({ viewport: { width, height: 800 }, hasTouch: true })
    test("provides distinct finger-sized targets and keeps property rows aligned", async ({
      page,
    }) => {
      await page.goto("/")
      if (width < 720)
        await page.getByRole("button", { name: "Motion", exact: true }).click()
      const targets = [
        page.getByRole("button", { name: "Timeline options", exact: true }),
        page.getByRole("button", {
          name: "Remove Rotation keyframe at 0.00s",
          exact: true,
        }),
      ]
      for (const target of targets) {
        await target.scrollIntoViewIfNeeded()
        const size = await target.evaluate((element) => {
          const rect = element.getBoundingClientRect()
          return {
            width: rect.width,
            height: rect.height,
            reachable: element.contains(
              document.elementFromPoint(
                rect.x + rect.width / 2,
                rect.y + rect.height / 2
              )
            ),
          }
        })
        expect(size.width).toBeGreaterThanOrEqual(44)
        expect(size.height).toBeGreaterThanOrEqual(44)
        expect(
          size.reachable,
          (await target.getAttribute("aria-label")) ?? "Timeline target"
        ).toBe(true)
      }
      await page
        .getByRole("button", { name: "Timeline options", exact: true })
        .click()
      for (const toggle of [
        page.getByRole("button", { name: /timeline snapping/ }),
        page.getByRole("button", { name: /loop playback/ }),
      ]) {
        // Measure after the popup's scale transition settles.
        await expect
          .poll(async () => (await toggle.boundingBox())?.height ?? 0)
          .toBeGreaterThanOrEqual(44)
        expect((await toggle.boundingBox())!.width).toBeGreaterThanOrEqual(44)
      }
      await page.keyboard.press("Escape")
      const rail = page
        .getByRole("button", { name: "Select Rotation property", exact: true })
        .locator("..")
      // Rows stay one finger-height line on touch; lanes must match.
      expect((await rail.boundingBox())!.height).toBe(44)
      const keyframe = page.locator(".timeline-keyframe").first()
      const railBox = (await rail.boundingBox())!
      const keyframeBox = (await keyframe.boundingBox())!
      expect(
        Math.abs(
          keyframeBox.y +
            keyframeBox.height / 2 -
            railBox.y -
            railBox.height / 2
        )
      ).toBeLessThanOrEqual(1)
      await page
        .getByRole("button", { name: "Add property", exact: true })
        .click()
      await page.getByRole("button", { name: "Depth", exact: true }).click()
      await expect(
        page.getByRole("button", { name: "Select Depth track", exact: true })
      ).toBeVisible()
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth)
      ).toBe(width)
    })
  })
}

test.describe("touch transition editing", () => {
  test.use({ viewport: { width: 390, height: 800 }, hasTouch: true })
  test("sets precise transition timing and a distinct wipe direction, then persists it", async ({
    page,
  }) => {
    await page.goto("/")
    await page.getByRole("button", { name: "Motion", exact: true }).click()
    await page
      .getByRole("button", {
        name: "Edit Account Circle transition",
        exact: true,
      })
      .click()
    await page
      .getByLabel("Transition start in seconds", { exact: true })
      .fill("2.2")
    await page
      .getByLabel("Transition start in seconds", { exact: true })
      .press("Enter")
    await page
      .getByLabel("Transition end in seconds", { exact: true })
      .fill("2.8")
    await page
      .getByLabel("Transition end in seconds", { exact: true })
      .press("Enter")
    await page.getByRole("button", { name: "Wipe", exact: true }).click()
    const direction = page.getByRole("button", {
      name: "Left to Right",
      exact: true,
    })
    const box = (await direction.boundingBox())!
    expect(box.width).toBeGreaterThanOrEqual(44)
    expect(box.height).toBeGreaterThanOrEqual(44)
    await direction.click()
    await expect(direction).toHaveAttribute("aria-pressed", "true")
    await page.keyboard.press("Escape")
    await page.reload()
    await page.getByRole("button", { name: "Motion", exact: true }).click()
    await page
      .getByRole("button", {
        name: "Edit Account Circle transition",
        exact: true,
      })
      .click()
    await expect(
      page.getByLabel("Transition start in seconds", { exact: true })
    ).toHaveValue("2.20")
    await expect(
      page.getByLabel("Transition end in seconds", { exact: true })
    ).toHaveValue("2.80")
    await expect(
      page.getByRole("button", { name: "Wipe", exact: true })
    ).toHaveAttribute("aria-pressed", "true")
    await expect(
      page.getByRole("button", { name: "Left to Right", exact: true })
    ).toHaveAttribute("aria-pressed", "true")
  })
})

test.describe("touch intent on the phone timeline", () => {
  test.use({ viewport: { width: 390, height: 800 }, hasTouch: true })
  test("swipes scroll, taps select, holds drag, and two fingers zoom", async ({
    page,
  }) => {
    await page.goto("/")
    await page.getByRole("button", { name: "Motion", exact: true }).click()
    // The Motion sheet rises from the tab bar; aim once it has settled.
    const pane = page.locator("#glyphrise-timeline-pane")
    await expect
      .poll(async () => (await pane.boundingBox())?.height ?? 0)
      .toBeGreaterThan(300)
    await page.waitForTimeout(250)
    const cdp = await page.context().newCDPSession(page)
    const touch = (
      type: "touchStart" | "touchMove" | "touchEnd",
      points: { x: number; y: number }[]
    ) =>
      cdp.send("Input.dispatchTouchEvent", {
        type,
        touchPoints: points.map((point, index) => ({
          ...point,
          id: index + 1,
          radiusX: 5,
          radiusY: 5,
        })),
      })
    const keyframe = page.getByRole("button", {
      name: /^Select Rotation keyframe.* at 5\.00 seconds$/,
    })
    const playhead = page.getByLabel("Playhead time in seconds", {
      exact: true,
    })
    const startTime = await playhead.inputValue()
    const box = (await keyframe.boundingBox())!
    const center = { x: box.x + box.width / 2, y: box.y + box.height / 2 }

    // A swipe that starts on a keyframe is a scroll: no selection, no seek.
    await touch("touchStart", [center])
    for (const dy of [14, 40, 80])
      await touch("touchMove", [{ x: center.x, y: center.y + dy }])
    await touch("touchEnd", [])
    await expect(keyframe).toHaveAttribute("aria-pressed", "false")
    await expect(playhead).toHaveValue(startTime)

    // A tap selects it and moves the playhead there.
    await page.touchscreen.tap(center.x, center.y)
    await expect(keyframe).toHaveAttribute("aria-pressed", "true")
    await expect(playhead).not.toHaveValue(startTime)

    // Holding still picks it up; then it follows the finger.
    await touch("touchStart", [center])
    await page.waitForTimeout(450)
    for (const dx of [-12, -30, -50])
      await touch("touchMove", [{ x: center.x + dx, y: center.y }])
    await touch("touchEnd", [])
    await expect(keyframe).toHaveCount(0)

    // Two fingers spreading on the lanes zoom time around them.
    const ruler = page.getByRole("slider", { name: "Timeline playhead" })
    const before = (await ruler.boundingBox())!.width
    const y = center.y + 60
    await touch("touchStart", [
      { x: center.x - 20, y },
      { x: center.x + 20, y },
    ])
    for (const spread of [40, 70, 100])
      await touch("touchMove", [
        { x: center.x - spread, y },
        { x: center.x + spread, y },
      ])
    await touch("touchEnd", [])
    expect((await ruler.boundingBox())!.width).toBeGreaterThan(before * 1.5)
  })
})
