import { expect, test, type Page } from "@playwright/test"

async function backup(page: Page) {
  await page.getByRole("button", { name: "Workspace actions" }).click()
  const downloaded = page.waitForEvent("download")
  await page.getByRole("button", { name: "Download project backup" }).click()
  const stream = await (await downloaded).createReadStream()
  const chunks: Buffer[] = []
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk))
  return JSON.parse(Buffer.concat(chunks).toString()).snapshot
}

for (const width of [320, 390]) {
  test.describe(`precise phone animation at ${width}px`, () => {
    test.setTimeout(60_000)
    test.use({ viewport: { width, height: 568 }, hasTouch: true })
    test("edits time, easing, and values, adds and deletes frames, preserves every track on reload", async ({
      page,
    }) => {
      await page.goto("/")
      const before = await backup(page)
      await page.getByRole("button", { name: "Motion", exact: true }).click()
      await expect(
        page.getByRole("tab", { name: "Motion", exact: true })
      ).toHaveAttribute("aria-selected", "true")
      await expect(
        page.getByRole("region", { name: "3D preview", includeHidden: true })
      ).toBeVisible()
      await expect(
        page.getByLabel("Rotation keyframe time in seconds", { exact: true })
      ).toHaveCount(0)
      await page
        .getByRole("button", {
          name: "Edit Rotation keyframe at 5.00s",
          exact: true,
        })
        .click()
      const time = page.getByLabel("Rotation keyframe time in seconds", {
        exact: true,
      })
      await time.fill("4.5")
      await time.press("Enter")
      const dialogBounds = (await page.getByRole("dialog").boundingBox())!
      const timeBounds = (await time.boundingBox())!
      expect(timeBounds.x + timeBounds.width).toBeLessThanOrEqual(
        dialogBounds.x + dialogBounds.width
      )
      await page
        .getByRole("button", {
          name: "Selected Rotation keyframe easing: Smooth",
          exact: true,
        })
        .click()
      await page.getByRole("button", { name: "Bounce", exact: true }).click()
      await expect(
        page.getByRole("button", {
          name: "Selected Rotation keyframe easing: Bounce",
          exact: true,
        })
      ).toBeVisible()
      await expect(
        page.getByRole("region", { name: "3D preview", includeHidden: true })
      ).toBeVisible()
      const rotation = page.getByLabel("Keyframe rotation Y", { exact: true })
      await rotation.fill("90")
      await rotation.press("Enter")
      await page.getByRole("button", { name: "Done", exact: true }).click()
      await expect(
        page.getByRole("button", {
          name: "Edit Rotation keyframe at 4.50s",
          exact: true,
        })
      ).toBeFocused()
      const playhead = page.getByLabel("Playhead time in seconds", {
        exact: true,
      })
      await playhead.fill("2")
      await playhead.press("Enter")
      await page
        .getByRole("button", {
          name: "Add Rotation keyframe at 2.00s",
          exact: true,
        })
        .click()
      await page
        .getByRole("button", { name: "Keyframe actions", exact: true })
        .click()
      await page
        .getByRole("button", {
          name: "Delete Rotation keyframe at 2.00s",
          exact: true,
        })
        .click()
      await expect(
        page.getByRole("button", {
          name: "Edit Rotation keyframe at 2.00s",
          exact: true,
        })
      ).toHaveCount(0)
      await expect(
        page.getByRole("button", {
          name: "Add Rotation keyframe at 2.00s",
          exact: true,
        })
      ).toBeFocused()
      await page
        .getByRole("button", { name: "Add property", exact: true })
        .click()
      await page.getByRole("button", { name: "Depth", exact: true }).click()
      await page
        .getByRole("button", {
          name: "Edit Depth keyframe at 2.50s",
          exact: true,
        })
        .click()
      const depthTime = page.getByLabel("Depth keyframe time in seconds", {
        exact: true,
      })
      await depthTime.fill("2.25")
      await depthTime.press("Enter")
      const depthValue = page.getByLabel("Depth keyframe value", {
        exact: true,
      })
      await depthValue.fill("18")
      await depthValue.press("Enter")
      await page.getByRole("button", { name: "Done", exact: true }).click()
      const after = await backup(page)
      expect(after.tracks.map((track: { id: string }) => track.id)).toEqual(
        before.tracks.map((track: { id: string }) => track.id)
      )
      const frames = after.tracks.find(
        (track: { id: string }) => track.id === "extrusion"
      ).keyframes
      expect(frames).toHaveLength(3)
      expect(
        frames.some(
          (frame: { time: number; value: number }) =>
            frame.time === 2.25 && frame.value === 18
        )
      ).toBe(true)
      for (const track of before.tracks.filter(
        (track: { id: string }) => track.id !== "extrusion"
      ))
        expect(
          after.tracks.find(
            (candidate: { id: string }) => candidate.id === track.id
          )
        ).toEqual(track)
      expect(after.rotationAxisKeyframes).toHaveLength(2)
      expect(
        after.rotationAxisKeyframes.some(
          (frame: { time: number; value: { y: number }; easing: string }) =>
            frame.time === 4.5 &&
            frame.value.y === 90 &&
            frame.easing === "bounce"
        )
      ).toBe(true)
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth)
      ).toBe(width)
      await page.reload()
      expect(await backup(page)).toEqual(after)
      await page.getByRole("button", { name: "Motion", exact: true }).click()
      await page
        .getByRole("button", { name: "Play timeline", exact: true })
        .click()
      await expect(
        page.getByRole("button", { name: "Pause timeline", exact: true })
      ).toBeVisible()
      await page
        .getByRole("button", { name: "Pause timeline", exact: true })
        .click()
      await page
        .getByRole("button", {
          name: "Edit Depth keyframe at 2.25s",
          exact: true,
        })
        .click()
      for (const control of [
        page.getByLabel("Depth keyframe value", { exact: true }),
        page.getByRole("button", {
          name: "Selected Depth keyframe easing: Smooth",
          exact: true,
        }),
        page.getByRole("button", { name: "Keyframe actions", exact: true }),
      ]) {
        await control.scrollIntoViewIfNeeded()
        const box = (await control.boundingBox())!
        expect(box.width).toBeGreaterThanOrEqual(44)
        expect(box.height).toBeGreaterThanOrEqual(44)
      }
    })
  })
}

test.describe("phone style keyframe recovery", () => {
  test.setTimeout(60_000)
  test.use({ viewport: { width: 390, height: 568 }, hasTouch: true })
  test("keeps a retimed style frame editable and restores it after deleting the last frame", async ({
    page,
  }) => {
    await page.goto("/")
    await page.getByRole("button", { name: "Properties", exact: true }).click()
    await page
      .getByRole("button", { name: "Add style keyframe at 0.00s", exact: true })
      .click()
    await page.getByRole("button", { name: "Motion", exact: true }).click()
    await page
      .getByRole("button", {
        name: "Edit Style keyframe at 0.00s",
        exact: true,
      })
      .click()
    const time = page.getByLabel("Style keyframe time in seconds", {
      exact: true,
    })
    await time.fill("1.2")
    await time.press("Enter")
    await expect(time).toHaveValue("1.20")
    await page
      .getByRole("button", {
        name: "Selected Style keyframe easing: Smooth",
        exact: true,
      })
      .click()
    await page.getByRole("button", { name: "Spring", exact: true }).click()
    await expect(
      page.getByRole("button", {
        name: "Selected Style keyframe easing: Spring",
        exact: true,
      })
    ).toBeVisible()
    await page
      .getByRole("button", { name: "Keyframe actions", exact: true })
      .click()
    await page
      .getByRole("button", {
        name: "Delete Style keyframe at 1.20s",
        exact: true,
      })
      .click()
    await expect(
      page.getByRole("region", { name: "Style keyframes", exact: true })
    ).toHaveCount(0)
    await expect(
      page.getByRole("button", { name: "Add property", exact: true })
    ).toBeFocused()
    await page.getByRole("button", { name: "Workspace actions" }).click()
    await page.getByRole("button", { name: "Undo", exact: true }).click()
    await page
      .getByRole("button", {
        name: "Edit Style keyframe at 1.20s",
        exact: true,
      })
      .click()
    await expect(
      page.getByRole("button", {
        name: "Selected Style keyframe easing: Spring",
        exact: true,
      })
    ).toBeVisible()
  })
})
