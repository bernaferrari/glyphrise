import { expect, test } from "@playwright/test"

test("plays all four sharp 3D starters and pauses cards out of view", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto("/")
  const welcome = page.getByRole("dialog", { name: "Make something move." })
  await expect(welcome).toBeVisible()
  const videos = welcome.locator("video")
  await expect(videos).toHaveCount(4)
  await expect(welcome.locator("canvas")).toHaveCount(0)
  await expect
    .poll(() =>
      videos.evaluateAll((elements) =>
        elements.every((element, index) => {
          const video = element as HTMLVideoElement
          return (
            !video.paused &&
            video.currentTime > 0 &&
            video.videoWidth === 512 &&
            Math.abs(video.duration - [3.6, 3, 4, 3][index]) < 0.01
          )
        })
      )
    )
    .toBe(true)
  await expect
    .poll(() =>
      videos.evaluateAll(
        (elements) =>
          elements.filter((element) => !(element as HTMLVideoElement).paused)
            .length
      )
    )
    .toBe(4)
  await welcome.getByRole("button", { name: /^Heart/ }).click()
  await expect
    .poll(() =>
      videos.nth(1).evaluate((element) => !(element as HTMLVideoElement).paused)
    )
    .toBe(true)
  await expect
    .poll(() =>
      videos.evaluateAll(
        (elements) =>
          elements.filter((element) => !(element as HTMLVideoElement).paused)
            .length
      )
    )
    .toBe(4)

  await page.setViewportSize({ width: 390, height: 320 })
  await welcome.evaluate((element) => {
    element.scrollTop = 0
  })
  await expect
    .poll(() =>
      videos.nth(3).evaluate((element) => (element as HTMLVideoElement).paused)
    )
    .toBe(true)
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390
  )
  await welcome
    .getByRole("button", { name: "Explore the editor", exact: true })
    .click()
  await expect(welcome).toHaveCount(0)
  await expect(page.locator('video[src^="/starter-previews/"]')).toHaveCount(0)
})
