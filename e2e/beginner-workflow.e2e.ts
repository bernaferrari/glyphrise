import { expect, type Page } from "@playwright/test"
import { test } from "./fixtures"

async function backup(page: Page) {
  await page.getByRole("button", { name: "Open file menu" }).click()
  const downloaded = page.waitForEvent("download")
  await page.getByRole("menuitem", { name: "Download a copy" }).click()
  const stream = await (await downloaded).createReadStream()
  const chunks: Buffer[] = []
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk))
  return JSON.parse(Buffer.concat(chunks).toString()).snapshot
}

async function renderPng(page: Page) {
  await page.getByRole("button", { name: "Export", exact: true }).click()
  await page.getByLabel("Width", { exact: true }).fill("256")
  await page.getByLabel("Height", { exact: true }).fill("256")
  const downloaded = page.waitForEvent("download")
  await page
    .getByRole("button", { name: "Download image", exact: true })
    .click()
  const stream = await (await downloaded).createReadStream()
  const chunks: Buffer[] = []
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk))
  await page.keyboard.press("Escape")
  await expect(page.getByRole("dialog", { includeHidden: true })).toHaveCount(0)
  return Buffer.concat(chunks)
}

test.beforeEach(async ({ page }) => {
  await page.goto("/")
})

test("Reset during playback keeps the animation running without changing the document", async ({
  page,
}) => {
  const before = await backup(page)
  const marker = page
    .getByRole("group", { name: "Artwork orientation" })
    .getByRole("button", { name: "Align view to X axis", exact: true })
  await page.getByRole("button", { name: "Play", exact: true }).click()
  await expect(marker).not.toHaveAttribute("transform", "translate(62.0 40.0)")
  await page.getByRole("button", { name: "Reset view", exact: true }).click()
  await expect(
    page.getByRole("button", { name: "Pause", exact: true })
  ).toBeVisible()
  const resetPose = await marker.getAttribute("transform")
  await expect(marker).not.toHaveAttribute("transform", resetPose!)
  await page.getByRole("button", { name: "Pause", exact: true }).click()
  expect(await backup(page)).toEqual(before)
})

test("a preset picked under its property preserves artwork and undoes in one step", async ({
  page,
}) => {
  const before = await backup(page)
  // Presets are listed under the row they animate, across the timeline.
  await page.getByRole("button", { name: "Add property", exact: true }).click()
  await page
    .getByRole("region", { name: "Rotation" })
    .getByRole("button", { name: "Tilt", exact: true })
    .click()
  const after = await backup(page)
  expect(after.duration).toBe(before.duration)
  expect(
    after.rotationAxisKeyframes.map(
      (k: { time: number; value: { z: number } }) => [k.time, k.value.z]
    )
  ).toEqual([
    [0, 0],
    [before.duration / 2, 25],
    [before.duration, 0],
  ])
  for (const field of [
    "materialPreset",
    "materialSettings",
    "fillColor",
    "extrusionDepth",
    "objectScale",
    "moveOffset",
  ])
    expect(after[field]).toEqual(before[field])
  expect(
    after.shapes.map((shape: { svgContent: string }) => shape.svgContent)
  ).toEqual(
    before.shapes.map((shape: { svgContent: string }) => shape.svgContent)
  )
  await page.getByRole("button", { name: "Undo", exact: true }).click()
  expect(await backup(page)).toEqual(before)
})

test("editing an animated property keys the playhead, like a stopwatch", async ({
  page,
}) => {
  const before = await backup(page)
  const playhead = page.getByRole("slider", { name: "Timeline playhead" })
  await playhead.focus()
  await playhead.press("ArrowRight")
  const rotation = page.getByLabel("Rotation Y", { exact: true })
  await expect(rotation).toBeEnabled()
  await rotation.fill("45")
  await rotation.press("Enter")
  const document = await backup(page)
  expect(document.rotationAxisKeyframes).toHaveLength(
    before.rotationAxisKeyframes.length + 1
  )
  expect(
    document.rotationAxisKeyframes.some(
      (k: { time: number; value: { y: number } }) =>
        k.time > 0 && k.time < 5 && k.value.y === 45
    )
  ).toBe(true)
  await page.getByRole("button", { name: "Undo", exact: true }).click()
  expect((await backup(page)).rotationAxisKeyframes).toEqual(
    before.rotationAxisKeyframes
  )
})

test("adding a property supplies a useful animation", async ({ page }) => {
  await page.getByRole("button", { name: "Add property", exact: true }).click()
  await page.getByRole("button", { name: "Depth", exact: true }).click()
  const document = await backup(page)
  const frames = document.tracks.find(
    (track: { id: string }) => track.id === "extrusion"
  ).keyframes
  expect(frames).toHaveLength(3)
  expect(frames[0].value).not.toBe(frames[1].value)
  expect(frames[0].value).toBe(frames[2].value)
})

test("canvas rotation is saved, exported, and undone as a single edit", async ({
  page,
}) => {
  await page.getByRole("button", { name: "View options" }).click()
  await page.getByRole("switch", { name: "Inertia", exact: true }).click()
  await page.keyboard.press("Escape")
  const before = await backup(page)
  const originalPng = await renderPng(page)
  const canvas = page
    .getByRole("region", { name: "3D preview" })
    .locator("canvas")
  await expect(
    page.getByRole("button", { name: /Change icon for/ })
  ).toBeVisible()
  const box = (await canvas.boundingBox())!
  // Compare the rendered icon, excluding browser-antialiased rounded corners
  // and overlay controls whose hover/focus appearance changes during the flow.
  const captureIcon = () =>
    page.screenshot({
      clip: {
        x: box.x + box.width / 4,
        y: box.y + box.height / 4,
        width: box.width / 2,
        height: box.height / 2,
      },
    })
  const image = await captureIcon()
  await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.3)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5, {
    steps: 12,
  })
  await page.mouse.up()
  expect((await captureIcon()).equals(image)).toBe(false)
  const rotated = await backup(page)
  expect(rotated.rotationOffset).not.toEqual(before.rotationOffset)
  expect(rotated.shapes).toEqual(before.shapes)
  expect((await renderPng(page)).equals(originalPng)).toBe(false)
  await expect(
    page.getByRole("button", { name: "Undo", exact: true })
  ).toBeEnabled()
  await page.getByRole("button", { name: "Undo", exact: true }).click()
  await expect.poll(async () => (await captureIcon()).equals(image)).toBe(true)
  expect(await backup(page)).toEqual(before)
  expect((await renderPng(page)).equals(originalPng)).toBe(true)
  // A compass nudge uses the same saved rotation and one undo step too.
  await page
    .getByRole("button", { name: "Rotate left 45 degrees", exact: true })
    .click()
  await expect(page.getByLabel("Rotation Y", { exact: true })).toHaveValue("45")
  await page.getByRole("button", { name: "Undo", exact: true }).click()
  expect(await backup(page)).toEqual(before)
})

test("phone workflow reaches animated motion preview and export", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 568 })
  // Phones reach presets from the button on the preview.
  await page.getByRole("button", { name: "Animate", exact: true }).click()
  await expect(page.getByRole("dialog")).toBeVisible()
  expect(
    await page
      .locator('[data-slot="motion-preview"]')
      .first()
      .evaluate((element) => getComputedStyle(element).animationName)
  ).toBe("motion-preview-spin")
  await page.getByRole("button", { name: "Pulse", exact: true }).click()
  await page.getByRole("button", { name: /^Apply Pulse/ }).click()
  await page.getByRole("button", { name: "Play", exact: true }).click()
  await expect(
    page.getByRole("button", { name: "Pause", exact: true })
  ).toBeVisible()
  await page.getByRole("button", { name: "Export", exact: true }).click()
  await expect(page.getByRole("dialog")).toBeVisible()
  await expect(page.getByLabel("Width", { exact: true })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390
  )
})

test("reload restores keyframes silently and subsequent presets still announce creation", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const notices: string[] = []
    Object.assign(window, { restoredKeyframeNotices: notices })
    new MutationObserver(() => {
      for (const status of document.querySelectorAll('[role="status"]')) {
        if (/keyframes? created/.test(status.textContent ?? ""))
          notices.push(status.textContent!)
      }
    }).observe(document, {
      childList: true,
      characterData: true,
      subtree: true,
    })
  })
  await page.getByRole("button", { name: "Add property", exact: true }).click()
  await page
    .getByRole("region", { name: "Scale", exact: true })
    .getByRole("button", { name: "Pulse", exact: true })
    .click()
  const before = await backup(page)
  await page.reload()
  await expect(page.locator("#glyphrise-workspace")).toHaveAttribute(
    "aria-busy",
    "false"
  )
  expect(await backup(page)).toEqual(before)
  expect(
    await page.evaluate(
      () =>
        (window as Window & { restoredKeyframeNotices?: string[] })
          .restoredKeyframeNotices
    )
  ).toEqual([])
  await page.getByRole("button", { name: "Add property", exact: true }).click()
  await page
    .getByRole("region", { name: "Rotation", exact: true })
    .getByRole("button", { name: "Tilt", exact: true })
    .click()
  await expect(
    page.getByRole("status").filter({ hasText: "Keyframe created" })
  ).toBeVisible()
})

test("restoring older depth animations regenerates internal quality frames without a creation banner", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Add property", exact: true }).click()
  await page.getByRole("button", { name: "Depth", exact: true }).click()
  await backup(page)
  await page.evaluate(() => {
    for (const key of Object.keys(localStorage)) {
      const raw = localStorage.getItem(key)
      if (!raw) continue
      try {
        const document = JSON.parse(raw)
        if (document.snapshot?.qualityKeyframes) {
          document.snapshot.qualityKeyframes = []
          localStorage.setItem(key, JSON.stringify(document))
        }
      } catch {
        /* Ignore non-document preferences. */
      }
    }
  })
  await page.addInitScript(() => {
    const notices: string[] = []
    Object.assign(window, { restoredDepthNotices: notices })
    new MutationObserver(() => {
      for (const status of document.querySelectorAll('[role="status"]')) {
        if (/keyframes? created/.test(status.textContent ?? ""))
          notices.push(status.textContent!)
      }
    }).observe(document, { childList: true, subtree: true })
  })
  await page.reload()
  await expect(page.locator("#glyphrise-workspace")).toHaveAttribute(
    "aria-busy",
    "false"
  )
  const restored = await backup(page)
  expect(restored.qualityKeyframes.length).toBeGreaterThan(0)
  expect(
    await page.evaluate(
      () =>
        (window as unknown as { restoredDepthNotices: string[] })
          .restoredDepthNotices
    )
  ).toEqual([])
})
