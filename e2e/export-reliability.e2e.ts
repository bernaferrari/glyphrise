import { expect, test, type Page, type Download } from "@playwright/test"
import { Input, ALL_FORMATS, BufferSource, EncodedPacketSink } from "mediabunny"

async function bytes(download: Download) {
  const chunks: Buffer[] = []
  for await (const chunk of (await download.createReadStream())!)
    chunks.push(Buffer.from(chunk))
  return Buffer.concat(chunks)
}
async function createMotion(page: Page) {
  await page.goto("/")
  await page
    .getByRole("button", { name: "Start with Spin", exact: true })
    .click()
  await page.getByRole("button", { name: "Change motion", exact: true }).click()
  await page.getByLabel("Motion duration", { exact: true }).fill("0.5")
  await page.getByRole("button", { name: /^Apply Spin/ }).click()
  await page.getByRole("button", { name: "Export", exact: true }).click()
  await page.getByText("More settings", { exact: true }).click()
  await page.getByLabel("Width", { exact: true }).fill("128")
  await page.getByLabel("Height", { exact: true }).fill("128")
}

for (const [container, fps] of [
  ["webm", 24],
  ["webm", 30],
  ["webm", 60],
  ["mp4", 30],
] as const) {
  test(`decodes ${container} ${fps} fps video with the exact sequence and duration despite slow rendering`, async ({
    page,
  }) => {
    test.setTimeout(90_000)
    // Every callback takes longer than a 24/30/60 fps frame. Encoding timestamps
    // must still describe half a second, rather than elapsed export time.
    await page.addInitScript(() => {
      const request = window.requestAnimationFrame.bind(window)
      window.requestAnimationFrame = (callback) =>
        request((time) => {
          setTimeout(() => callback(time), 55)
        })
    })
    await createMotion(page)
    await page
      .getByRole("button", { name: "Video Full animation", exact: true })
      .click()
    if (container === "mp4") {
      const mp4 = page.getByRole("radio", { name: "MP4", exact: true })
      await expect(
        page.getByRole("button", { name: "Download video", exact: true })
      ).toBeEnabled()
      test.skip(
        (await mp4.count()) === 0,
        "MP4 encoding is unsupported in this browser"
      )
      await mp4.click()
    }
    await page.getByRole("radio", { name: `${fps} fps`, exact: true }).click()
    const downloading = page.waitForEvent("download")
    await page
      .getByRole("button", { name: "Download video", exact: true })
      .click()
    const download = await downloading
    await download.saveAs(test.info().outputPath(`motion.${container}`))
    const encoded = await bytes(download)
    const input = new Input({
      formats: ALL_FORMATS,
      source: new BufferSource(encoded),
    })
    try {
      expect(await input.computeDuration()).toBeCloseTo(0.5, 2)
      const track = (await input.getPrimaryVideoTrack())!
      expect([track.displayWidth, track.displayHeight]).toEqual([128, 128])
      const times: number[] = []
      for await (const packet of new EncodedPacketSink(track).packets())
        times.push(packet.timestamp)
      expect(times).toHaveLength(fps / 2)
      times.sort((a, b) => a - b)
      times.forEach((time, index) => expect(time).toBeCloseTo(index / fps, 2))
    } finally {
      input.dispose()
    }
    // Decode the downloaded bytes in the browser and compare actual pixels at
    // four phases. A static or blank recording must fail even with valid metadata.
    const hashes = await page.evaluate(
      async ({ base64, container }) => {
        const video = document.createElement("video")
        video.muted = true
        video.src = `data:video/${container};base64,${base64}`
        await new Promise<void>((resolve, reject) => {
          video.onloadeddata = () => resolve()
          video.onerror = () =>
            reject(new Error("Cannot decode downloaded video"))
        })
        const canvas = document.createElement("canvas")
        canvas.width = canvas.height = 128
        const ctx = canvas.getContext("2d")!
        const results: number[] = []
        for (const time of [0.01, 0.09, 0.21, 0.34]) {
          await new Promise<void>((resolve) => {
            video.onseeked = () => resolve()
            video.currentTime = time
          })
          ctx.clearRect(0, 0, 128, 128)
          ctx.drawImage(video, 0, 0)
          const pixels = ctx.getImageData(0, 0, 128, 128).data
          let hash = 0
          for (const value of pixels) hash = (hash * 31 + value) | 0
          results.push(hash)
        }
        video.removeAttribute("src")
        video.load()
        return results
      },
      { base64: encoded.toString("base64"), container }
    )
    expect(new Set(hashes).size, JSON.stringify(hashes)).toBeGreaterThanOrEqual(
      3
    )
  })
}

test("uses the rendered PNG preview bytes for the still download", async ({
  page,
}) => {
  await createMotion(page)
  await page.getByLabel("Height", { exact: true }).fill("192")
  const image = page.getByRole("img", { name: "Rendered export frame" })
  await expect(image).toBeVisible()
  const preview = await image.evaluate(async (img) => {
    const blob = await (await fetch((img as HTMLImageElement).src)).blob()
    return Array.from(new Uint8Array(await blob.arrayBuffer()))
  })
  const downloading = page.waitForEvent("download")
  await page
    .getByRole("button", { name: "Download image", exact: true })
    .click()
  expect([...(await bytes(await downloading))]).toEqual(preview)
  await page.screenshot({ path: test.info().outputPath("export-preview.png") })
})

test("imports exported SVG markup directly at entry and finishes with a still image", async ({
  page,
}) => {
  await page.goto("/")
  await page.getByLabel("Use my SVG file").setInputFiles({
    name: "My logo.svg",
    mimeType: "image/svg+xml",
    buffer: Buffer.from(
      '<?xml version="1.0"?><!-- Logo --><svg viewBox="0 0 24 24"><metadata>exported by an editor</metadata><path style="fill:#f00" d="M0 0h20v20H0z"/></svg>'
    ),
  })
  await expect(page.getByLabel("File name", { exact: true })).toHaveValue(
    "My logo"
  )
  await page
    .getByRole("button", { name: "Export a still image", exact: true })
    .click()
  await page.getByText("More settings", { exact: true }).click()
  await page.getByLabel("Width", { exact: true }).fill("128")
  await page.getByLabel("Height", { exact: true }).fill("128")
  const downloading = page.waitForEvent("download")
  await page
    .getByRole("button", { name: "Download image", exact: true })
    .click()
  expect((await bytes(await downloading)).readUInt32BE(16)).toBe(128)
  await page.keyboard.press("Escape")
  await expect(
    page.getByRole("heading", { name: "Your icon is ready." })
  ).toBeVisible()
})

test("immediately undoes the first edit through the button and keyboard", async ({
  page,
}) => {
  await page.goto("/")
  await page
    .getByRole("button", { name: "Start with Spin", exact: true })
    .click()
  const undo = page.getByRole("button", { name: "Undo", exact: true })
  await expect(undo).toBeDisabled()
  const original = await page
    .locator('[aria-label="Popular finishes"] [aria-pressed="true"]')
    .getAttribute("aria-label")
  const changed = page.getByRole("button", {
    name: "Use Satin finish",
    exact: true,
  })
  await changed.click()
  await undo.click()
  await expect(
    page.getByRole("button", { name: original!, exact: true })
  ).toHaveAttribute("aria-pressed", "true")
  await expect(undo).toBeDisabled()
  await changed.click()
  await page.keyboard.press("Meta+z")
  await expect(
    page.getByRole("button", { name: original!, exact: true })
  ).toHaveAttribute("aria-pressed", "true")
})

test("reports incomplete deletion and repairs it on reload without resurrecting the old identity", async ({
  page,
}) => {
  await page.goto("/")
  await page
    .getByRole("button", { name: "Start with Spin", exact: true })
    .click()
  await page
    .getByRole("button", { name: "Open file menu", exact: true })
    .click()
  await page.getByRole("button", { name: "All files", exact: true }).click()
  await page.getByText("Create a new file", { exact: true }).click()
  await page.getByLabel("New file name").fill("Disposable")
  await page.getByRole("button", { name: "Start blank", exact: true }).click()
  const deletedId = await page.evaluate(() =>
    localStorage.getItem("glyphrise.editor.current-project.v2")
  )
  await page
    .getByRole("button", { name: "Open file menu", exact: true })
    .click()
  await page.getByRole("button", { name: "All files", exact: true }).click()
  await page
    .getByRole("button", { name: "Delete Disposable", exact: true })
    .click()
  await page.evaluate((deletedId) => {
    const remove = Storage.prototype.removeItem
    Storage.prototype.removeItem = function (key) {
      if (key === `glyphrise.editor.project.v2.${deletedId}`)
        throw new Error("Injected cleanup failure")
      return remove.call(this, key)
    }
  }, deletedId)
  await page.getByRole("button", { name: "Delete file", exact: true }).click()
  await expect(page.getByLabel("File name", { exact: true })).toHaveValue(
    "Star spin"
  )
  await expect(page.getByRole("alert")).toContainText(
    "Deletion cleanup is incomplete"
  )
  expect(
    await page.evaluate(() =>
      localStorage.getItem("glyphrise.pending-deletion")
    )
  ).not.toBeNull()
  await page.reload()
  await expect(page.getByLabel("File name", { exact: true })).toHaveValue(
    "Star spin"
  )
  expect(
    await page.evaluate(
      (deletedId) =>
        localStorage.getItem(`glyphrise.editor.project.v2.${deletedId}`),
      deletedId
    )
  ).toBeNull()
  expect(
    await page.evaluate(() =>
      localStorage.getItem("glyphrise.pending-deletion")
    )
  ).toBeNull()
})
