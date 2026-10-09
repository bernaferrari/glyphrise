import { expect, test } from "@playwright/test"

test.describe("short phone creation", () => {
  test.use({ viewport: { width: 320, height: 568 }, hasTouch: true })
  test("keeps the creation and download actions reachable while settings scroll", async ({
    page,
  }) => {
    await page.goto("/")
    const create = page.getByRole("button", {
      name: "Start with Calendar",
      exact: true,
    })
    await expect(create).toBeInViewport({ ratio: 1 })
    await create.click()
    await page.getByRole("button", { name: "Export", exact: true }).click()
    const download = page.getByRole("button", {
      name: "Download image",
      exact: true,
    })
    await expect(download).toBeInViewport({ ratio: 1 })
    await page.getByLabel("Width", { exact: true }).fill("128")
    await page.getByLabel("Height", { exact: true }).fill("128")
    await expect(download).toBeInViewport({ ratio: 1 })
    await expect(download).toBeEnabled()
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth)
    ).toBe(320)
  })
})

for (const width of [390, 1280]) {
  test.describe(`first creation at ${width}px`, () => {
    test.use({ viewport: { width, height: 800 }, hasTouch: width < 720 })
    test("creates real artwork, styles and previews motion, downloads an image, and restores it on reload", async ({
      page,
    }) => {
      await page.goto("/")
      const welcome = page.getByRole("dialog", { name: "Make something move." })
      await expect(welcome).toBeVisible()
      // Calendar is the default first starter.
      const calendar = welcome.getByRole("radio", { name: /^Calendar/ })
      await expect(calendar).toBeChecked()
      await welcome.getByRole("radio", { name: /^Heart/ }).click()
      await calendar.click()
      await welcome
        .getByRole("button", { name: "Start with Calendar", exact: true })
        .click()
      await expect(page.getByLabel("File name", { exact: true })).toHaveValue(
        "Calendar"
      )
      const guide = page.getByRole("complementary", { name: "Your first icon" })
      await expect(guide).toBeVisible()
      // Starters arrive already moving: step 1 is watching it.
      await expect(guide).toContainText("1 of 3")
      await expect(
        guide.getByRole("button", { name: "Play", exact: true })
      ).toBeFocused()
      await guide.getByRole("button", { name: "Change motion" }).click()
      await page.getByRole("button", { name: "Tilt", exact: true }).click()
      await page.getByLabel("Motion duration", { exact: true }).fill("0.5")
      await page.getByRole("button", { name: /^Apply Tilt/ }).click()
      await guide.getByRole("button", { name: "Play", exact: true }).click()
      await expect(guide).toContainText("2 of 3")
      await guide.getByRole("button", { name: "Style it" }).click()
      // Choosing to style completes the step, even before any change and
      // after leaving the canvas on a phone.
      if (width < 720)
        await page.getByRole("button", { name: "Canvas", exact: true }).click()
      await expect(guide).toContainText("3 of 3")
      if (width < 720)
        await page
          .getByRole("button", { name: "Properties", exact: true })
          .click()
      await page
        .getByRole("button", { name: "Use Chrome finish", exact: true })
        .click()
      if (width < 720)
        await page.getByRole("button", { name: "Canvas", exact: true }).click()
      await guide.getByRole("button", { name: "Export", exact: true }).click()
      const exporter = page.getByRole("dialog", { name: "Export" })
      await exporter.getByLabel("Width", { exact: true }).fill("128")
      await exporter.getByLabel("Height", { exact: true }).fill("128")
      const downloading = page.waitForEvent("download")
      await exporter
        .getByRole("button", { name: "Download image", exact: true })
        .click()
      const download = await downloading
      const stream = await download.createReadStream()
      const chunks: Buffer[] = []
      for await (const chunk of stream!) chunks.push(Buffer.from(chunk))
      const png = Buffer.concat(chunks)
      expect(png.subarray(1, 4).toString()).toBe("PNG")
      expect(png.readUInt32BE(16)).toBe(128)
      expect(png.readUInt32BE(20)).toBe(128)
      await expect(
        exporter.getByRole("status").filter({ hasText: "downloaded" })
      ).toContainText("Image downloaded")
      await page.keyboard.press("Escape")
      await expect(
        guide.getByRole("heading", { name: "Downloaded" })
      ).toBeVisible()
      await page.reload()
      await expect(welcome).toHaveCount(0)
      await expect(page.getByLabel("File name", { exact: true })).toHaveValue(
        "Calendar"
      )
      if (width < 720)
        await page
          .getByRole("button", { name: "Properties", exact: true })
          .click()
      await expect(
        page.getByRole("button", {
          name: "Change icon for Calendar Month",
          exact: true,
        })
      ).toBeVisible()
      await expect(
        page.getByRole("button", { name: "Use Chrome finish", exact: true })
      ).toHaveAttribute("aria-pressed", "true")
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth)
      ).toBe(width)
    })
  })
}

test("records and downloads a short video, then offers a separate model export", async ({
  page,
}) => {
  await page.goto("/")
  await page
    .getByRole("button", { name: "Start with Calendar", exact: true })
    .click()
  await page.getByRole("button", { name: "Change motion", exact: true }).click()
  await page.getByLabel("Motion duration", { exact: true }).fill("0.5")
  await page.getByRole("button", { name: /^Apply Spin/ }).click()
  await page.getByRole("button", { name: "Export", exact: true }).click()
  await page.getByRole("tab", { name: "Video", exact: true }).click()
  await page.getByLabel("Width", { exact: true }).fill("128")
  await page.getByLabel("Height", { exact: true }).fill("128")
  const downloading = page.waitForEvent("download")
  await page
    .getByRole("button", { name: "Download video", exact: true })
    .click()
  const download = await downloading
  expect(download.suggestedFilename()).toMatch(/\.(mp4|webm)$/)
  const stream = await download.createReadStream()
  let bytes = 0
  for await (const chunk of stream!) bytes += chunk.length
  expect(bytes).toBeGreaterThan(1000)
  await expect(
    page
      .getByRole("dialog")
      .getByRole("status")
      .filter({ hasText: "downloaded" })
  ).toContainText("Video downloaded")
  await page.getByRole("tab", { name: "3D model", exact: true }).click()
  await expect(
    page.getByRole("button", { name: "Download GLB", exact: true })
  ).toBeEnabled()
  await expect(
    page.getByText("Gradients become standard 3D materials", { exact: false })
  ).toBeVisible()
})

test("closing an active recording cancels it and reopening export restores the download view", async ({
  page,
}) => {
  await page.goto("/")
  await page
    .getByRole("button", { name: "Start with Calendar", exact: true })
    .click()
  await page.getByRole("button", { name: "Change motion", exact: true }).click()
  await page.getByRole("button", { name: /^Apply Spin/ }).click()
  await page.getByRole("button", { name: "Export", exact: true }).click()
  await page.getByRole("tab", { name: "Video", exact: true }).click()
  await page.getByLabel("Width", { exact: true }).fill("128")
  await page.getByLabel("Height", { exact: true }).fill("128")
  await page
    .getByRole("button", { name: "Download video", exact: true })
    .click()
  await expect(
    page.getByRole("button", { name: /Recording .*Cancel/ })
  ).toBeVisible()
  await expect(
    page.getByRole("tab", { name: "Image", exact: true })
  ).toBeDisabled()
  await page.getByRole("button", { name: "Close", exact: true }).click()
  await expect(page.getByRole("dialog")).toHaveCount(0)
  await page.getByRole("button", { name: "Export", exact: true }).click()
  await expect(
    page.getByRole("button", { name: "Download image", exact: true })
  ).toBeEnabled()
  await expect(
    page.getByText("Video downloaded.", { exact: false })
  ).toHaveCount(0)
  await page.getByRole("tab", { name: "Code", exact: true }).click()
  await page.keyboard.press("Escape")
  await page.getByRole("button", { name: "Export", exact: true }).click()
  await expect(
    page.getByRole("tab", { name: "Image", exact: true })
  ).toHaveAttribute("aria-selected", "true")
  await expect(
    page.getByRole("button", { name: "Download image", exact: true })
  ).toBeEnabled()
})
