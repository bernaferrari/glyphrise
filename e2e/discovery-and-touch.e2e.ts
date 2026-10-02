import { expect, test } from "@playwright/test"

test("everyday-word search surfaces labeled presets and symbols, and Enter chooses a real result", async ({
  page,
}) => {
  await page.goto("/")
  await page.getByRole("button", { name: /Change icon for/ }).click()
  const search = page.getByRole("searchbox", {
    name: "Search Material Symbols",
  })
  await search.fill("heart")
  await expect(
    page.getByRole("heading", { name: "Matching presets" })
  ).toBeVisible()
  await expect(
    page.getByRole("button", { name: "Choose Heart", exact: true })
  ).toBeVisible()
  await expect(
    page.getByRole("button", { name: "favorite", exact: true })
  ).toBeVisible()
  await expect(
    page.getByRole("button", { name: "Use first result: Heart", exact: true })
  ).toBeEnabled()
  await search.press("Enter")
  await expect(page.getByRole("dialog")).toHaveCount(0)
  await expect(
    page.getByRole("button", { name: "Change icon for Heart" })
  ).toBeVisible()
  await page.getByRole("button", { name: "Change icon for Heart" }).click()
  await search.fill("user")
  await expect(
    page.getByRole("button", { name: "person", exact: true })
  ).toBeVisible()
  await search.fill("zzzz_nonexistent")
  await expect(
    page.getByRole("button", { name: "Try exact symbol name", exact: true })
  ).toBeVisible()
  await expect(
    page.getByRole("button", { name: "Choose Heart", exact: true })
  ).toHaveCount(0)
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
      await page.getByRole("tab", { name: "Sequence", exact: true }).click()
      const targets = [
        page.getByRole("button", {
          name: width < 720 ? "Animation options" : "How the timeline works",
        }),
        page.getByRole("button", { name: "Fit timeline", exact: true }),
        page.getByRole("button", {
          name: "All Rotation keyframes easing: Smooth",
          exact: true,
        }),
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
      if (width < 720)
        await page
          .getByRole("button", { name: "Animation options", exact: true })
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
      if (width < 720) await page.keyboard.press("Escape")
      const rail = page
        .getByRole("button", { name: "Select Rotation property", exact: true })
        .locator("..")
      // The rail uses two control rows on touch; lane height must match it.
      expect((await rail.boundingBox())!.height).toBe(88)
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
    await page.getByRole("tab", { name: "Sequence", exact: true }).click()
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
    await page.getByRole("tab", { name: "Sequence", exact: true }).click()
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
