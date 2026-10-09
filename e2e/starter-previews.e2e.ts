import { expect, test } from "@playwright/test"

test("plays the chosen starter on one sharp stage and previews on hover", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto("/")
  const welcome = page.getByRole("dialog", { name: "Make something move." })
  await expect(welcome).toBeVisible()
  // One live stage; the four choices are still posters.
  const stage = welcome.locator("video")
  await expect(stage).toHaveCount(1)
  await expect(welcome.locator("canvas")).toHaveCount(0)
  const playing = (src: string, duration: number) =>
    stage.evaluate(
      (element, [src, duration]) => {
        const video = element as HTMLVideoElement
        return (
          video.src.endsWith(src as string) &&
          !video.paused &&
          video.currentTime > 0 &&
          video.videoWidth === 512 &&
          Math.abs(video.duration - (duration as number)) < 0.01
        )
      },
      [src, duration]
    )
  await expect.poll(() => playing("/calendar.mp4", 3.6)).toBe(true)

  // Hovering previews; choosing keeps it; leaving returns to the choice.
  const heart = welcome.getByRole("radio", { name: /^Heart/ })
  await heart.hover()
  await expect.poll(() => playing("/heart.mp4", 3)).toBe(true)
  await welcome.getByRole("radio", { name: /^Wi/ }).click()
  await page.mouse.move(0, 0)
  await expect.poll(() => playing("/wifi.mp4", 3.8)).toBe(true)
  await expect(
    welcome.getByRole("button", { name: /^Start with Wi/ })
  ).toBeVisible()

  // Arrow keys move the choice; Enter starts it.
  await welcome.getByRole("radio", { name: /^Wi/ }).focus()
  await page.keyboard.press("ArrowRight")
  await expect(welcome.getByRole("radio", { name: /^Bell/ })).toBeChecked()
  await page.keyboard.press("Enter")
  await expect(welcome).toHaveCount(0)
  await expect(page.getByLabel("File name", { exact: true })).toHaveValue(
    "Bell"
  )
  await expect(page.locator('video[src^="/starter-previews/"]')).toHaveCount(0)
})

test("phones swipe, drag or tap arrows through one playing starter", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 780 })
  await page.goto("/")
  const welcome = page.getByRole("dialog", { name: "Make something move." })
  await expect(welcome.locator("video")).toHaveCount(1)
  await expect(
    welcome.getByRole("button", { name: "Previous starter" })
  ).toBeDisabled()
  await welcome.getByRole("button", { name: "Next starter" }).click()
  await expect(welcome.getByRole("radio", { name: /^Heart/ })).toBeChecked()

  // A mouse can drag the track; the card it lands on becomes the choice.
  const track = welcome.getByRole("radiogroup", { name: "Starter" })
  const box = (await track.boundingBox())!
  await page.mouse.move(box.x + box.width * 0.7, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width * 0.1, box.y + box.height / 2, {
    steps: 10,
  })
  await page.mouse.up()
  await expect(welcome.getByRole("radio", { name: /^Wi/ })).toBeChecked()
  await expect(welcome.locator("video")).toHaveCount(1)

  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    360
  )
  await welcome.getByRole("button", { name: /^Start with Wi/ }).click()
  await expect(welcome).toHaveCount(0)
})
