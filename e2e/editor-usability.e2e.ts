import { expect } from "@playwright/test"
import { test } from "./fixtures"
import { EDGE_INSET } from "../components/editor/timeline/TimelineGeometry"

test.beforeEach(async ({ page }) => {
  await page.goto("/")
  await expect(page.locator("#glyphrise-workspace")).toHaveAttribute(
    "aria-busy",
    "false"
  )
})

for (const width of [390, 1280]) {
  test(`drags the playhead handle and line to scrub time at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 })
    if (width < 768) {
      await page.getByRole("button", { name: "Motion", exact: true }).click()
      await expect(page.locator("html")).not.toHaveAttribute(
        "data-panel-transition",
        "compact"
      )
    }
    const ruler = page.getByRole("slider", { name: "Timeline playhead" })
    await expect(ruler).toBeVisible()
    const box = (await ruler.boundingBox())!
    const duration = Number(await ruler.getAttribute("aria-valuemax"))
    const xAt = (time: number) =>
      box.x + EDGE_INSET + ((box.width - EDGE_INSET * 2) * time) / duration
    const handle = (await ruler.locator("svg").boundingBox())!
    await page.mouse.move(
      handle.x + handle.width / 2,
      handle.y + handle.height / 2
    )
    await page.mouse.down()
    await page.mouse.move(xAt(1), handle.y + handle.height / 2, { steps: 5 })
    await page.mouse.up()
    await expect(ruler).toHaveAttribute("aria-valuenow", "1")

    const line = page.locator('[data-slot="timeline-playhead-line"]')
    const lineBox = (await line.boundingBox())!
    await page.mouse.move(lineBox.x + lineBox.width / 2, lineBox.y + 60)
    await page.mouse.down()
    // Leaving the line vertically must keep scrubbing until release.
    await page.mouse.move(xAt(3), lineBox.y + 120, { steps: 5 })
    await expect(ruler).toHaveAttribute("aria-valuenow", "3")
    await page.mouse.up()
    await expect(ruler).toBeFocused()
    await expect(
      page.getByRole("button", {
        name: "Undo",
        exact: true,
        includeHidden: true,
      })
    ).toBeDisabled()
    await page.mouse.move(xAt(2), lineBox.y + 120)
    await expect(ruler).toHaveAttribute("aria-valuenow", "3")
  })
}

test.describe("touch playhead scrubbing", () => {
  test.use({ viewport: { width: 390, height: 900 }, hasTouch: true })
  test("drags the white line immediately without scrolling the timeline", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Motion", exact: true }).click()
    await expect(page.locator("html")).not.toHaveAttribute(
      "data-panel-transition",
      "compact"
    )
    const ruler = page.getByRole("slider", { name: "Timeline playhead" })
    await ruler.focus()
    await page.keyboard.press("ArrowRight")
    const box = (await ruler.boundingBox())!
    const line = (await page
      .getByRole("button", { name: "Drag playhead" })
      .boundingBox())!
    const cdp = await page.context().newCDPSession(page)
    const x = line.x + line.width / 2
    const y = line.y + 120
    const duration = Number(await ruler.getAttribute("aria-valuemax"))
    const destinationX =
      box.x + EDGE_INSET + ((box.width - EDGE_INSET * 2) * 3) / duration
    const scrollBefore = await ruler.evaluate(
      (element) => element.parentElement!.parentElement!.scrollTop
    )
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x, y, id: 1 }],
    })
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: destinationX, y: y + 20, id: 1 }],
    })
    await expect(ruler).toHaveAttribute("aria-valuenow", "3")
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    })
    expect(
      await ruler.evaluate(
        (element) => element.parentElement!.parentElement!.scrollTop
      )
    ).toBe(scrollBefore)
  })
})

test("Space activates a focused control without starting background playback", async ({
  page,
}) => {
  await page.getByRole("button", { name: /Change icon for/ }).focus()
  await page.keyboard.press("Space")
  await expect(page.getByRole("dialog")).toBeVisible()
  await expect(
    page.getByRole("button", {
      name: "Pause",
      exact: true,
      includeHidden: true,
    })
  ).toHaveCount(0)
  await page.keyboard.press("Escape")
  await expect(page.getByRole("dialog", { includeHidden: true })).toHaveCount(0)
  await page.getByRole("main").focus()
  await page.keyboard.press("Space")
  await expect(
    page.getByRole("button", { name: "Pause", exact: true })
  ).toBeVisible()
})

test("preset search stays in the selected library", async ({ page }) => {
  await page.getByRole("button", { name: /Change icon for/ }).click()
  await page.getByRole("tab", { name: "Presets", exact: true }).click()
  await page.getByRole("searchbox", { name: "Search presets" }).fill("heart")
  await page.getByRole("searchbox", { name: "Search presets" }).press("Enter")
  await expect(
    page.getByRole("button", { name: "Use typed symbol" })
  ).toHaveCount(0)
  await page.getByRole("button", { name: "Choose Heart", exact: true }).click()
  await expect(
    page.getByRole("button", { name: "Change icon for Heart" })
  ).toBeVisible()
})

test("selected icon name remains readable in the desktop inspector", async ({
  page,
}) => {
  const name = page
    .getByRole("complementary", { name: "Properties inspector" })
    .locator('[title="Account Circle"]')
  await expect(name).toBeVisible()
  expect(
    await name.evaluate((element) => element.scrollWidth <= element.clientWidth)
  ).toBe(true)
})

test("phone inspector preserves a live preview with its canvas controls", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 568 })
  await page.getByRole("button", { name: "Properties" }).click()
  await expect(
    page.getByRole("heading", { name: "Build your first 3D motion" })
  ).toHaveCount(0)
  const inspector = page.getByRole("complementary", {
    name: "Properties inspector",
  })
  await expect(inspector).toBeVisible()
  await expect(
    page.getByRole("button", { name: "Reopen quick start" })
  ).toHaveCount(0)
  const preview = page.getByRole("region", { name: "3D preview" })
  await expect(preview).toBeVisible()
  // The sheet rises from the tab bar; measure once it has settled.
  await expect
    .poll(async () => {
      const previewBox = (await preview.boundingBox())!
      const inspectorBox = (await inspector.boundingBox())!
      return previewBox.y + previewBox.height - inspectorBox.y
    })
    .toBeLessThanOrEqual(0)
  expect((await preview.boundingBox())!.height).toBeGreaterThan(120)
  await expect(
    page.getByRole("button", { name: "View options", exact: true })
  ).toBeVisible()
  await page.getByRole("button", { name: "Canvas", exact: true }).click()
  await expect(
    page.getByRole("button", { name: "Reset view", exact: true })
  ).toBeVisible()
})

test("downloads a rendered PNG with the requested dimensions", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Export", exact: true }).click()
  await page.getByLabel("Width", { exact: true }).fill("256")
  await page.getByLabel("Height", { exact: true }).fill("256")
  const downloadPromise = page.waitForEvent("download")
  await page
    .getByRole("button", { name: "Download image", exact: true })
    .click()
  const download = await downloadPromise
  expect(await download.failure()).toBeNull()
  const stream = await download.createReadStream()
  const chunks: Buffer[] = []
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk))
  const png = Buffer.concat(chunks)
  expect(png.subarray(1, 4).toString()).toBe("PNG")
  expect(png.readUInt32BE(16)).toBe(256)
  expect(png.readUInt32BE(20)).toBe(256)
})

test("Reset view renders intermediate artwork poses and remains one undoable edit", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const transforms = new Set<string>()
    let recording = false
    document.addEventListener("capture-reset", () => {
      recording = true
      transforms.clear()
    })
    ;(
      window as typeof window & { readResetTransforms: () => string[] }
    ).readResetTransforms = () => [...transforms]
    for (const GL of [WebGLRenderingContext, WebGL2RenderingContext]) {
      const names = new WeakMap<WebGLUniformLocation, string>()
      const locate = GL.prototype.getUniformLocation
      GL.prototype.getUniformLocation = function (program, name) {
        const location = locate.call(this, program, name)
        if (location) names.set(location, name)
        return location
      }
      const upload = GL.prototype.uniformMatrix4fv
      GL.prototype.uniformMatrix4fv = function (
        ...args: [WebGLUniformLocation | null, boolean, Iterable<number>]
      ) {
        const [location, , value] = args
        // Observe the actual 3D artwork; thumbnail stages and SVG controls
        // cannot make this pass if the canvas skips its intermediate poses.
        if (
          recording &&
          location &&
          names.get(location) === "modelViewMatrix" &&
          this.canvas instanceof HTMLCanvasElement &&
          this.canvas.closest("#glyphrise-preview-frame")
        ) {
          const elements = Array.from(value)
          transforms.add(
            JSON.stringify(
              [0, 1, 2, 4, 5, 6, 8, 9, 10].map((index) =>
                Number(elements[index].toFixed(5))
              )
            )
          )
        }
        upload.apply(this, args)
      }
    }
  })
  await page.reload()
  const rotation = page.getByLabel("Rotation Y", { exact: true })
  await rotation.fill("90")
  await rotation.press("Enter")
  await page.evaluate(() => document.dispatchEvent(new Event("capture-reset")))
  await page.getByRole("button", { name: "Reset view", exact: true }).click()
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (
            window as typeof window & { readResetTransforms: () => string[] }
          ).readResetTransforms().length
      )
    )
    .toBeGreaterThan(3)
  await expect(rotation).toHaveValue("0")
  await page.getByRole("button", { name: "Undo", exact: true }).click()
  await expect(rotation).toHaveValue("90")
})

test("Space on the timeline toggles playback without scrolling, including key repeat", async ({
  page,
}) => {
  const playhead = page.getByRole("slider", { name: "Timeline playhead" })
  await playhead.click({ position: { x: 50, y: 8 } })
  await expect(playhead).toBeFocused()
  const scrollPositions = () =>
    playhead.evaluate((element) => {
      const positions = []
      for (
        let parent = element.parentElement;
        parent;
        parent = parent.parentElement
      ) {
        positions.push(parent.scrollTop)
      }
      return positions
    })
  const before = await scrollPositions()
  await page.keyboard.down("Space")
  await expect(
    page.getByRole("button", { name: "Pause", exact: true })
  ).toBeVisible()
  await page.keyboard.down("Space")
  await page.keyboard.down("Space")
  await page.keyboard.up("Space")
  await expect(
    page.getByRole("button", { name: "Pause", exact: true })
  ).toBeVisible()
  expect(await scrollPositions()).toEqual(before)
  await page.keyboard.press("Space")
  await expect(
    page.getByRole("button", { name: "Play", exact: true })
  ).toBeVisible()
  expect(await scrollPositions()).toEqual(before)

  const time = Number(await playhead.getAttribute("aria-valuenow"))
  await page.keyboard.press("ArrowRight")
  await expect
    .poll(async () => Number(await playhead.getAttribute("aria-valuenow")))
    .toBeGreaterThan(time)
  const projectName = page.getByLabel("File name", { exact: true })
  await projectName.fill("My")
  await projectName.press("Space")
  await expect(projectName).toHaveValue("My ")
  await expect(
    page.getByRole("button", { name: "Play", exact: true })
  ).toBeVisible()
})

test("panel visibility eases in both directions", async ({ page }) => {
  const preview = page.locator("#glyphrise-preview-pane")
  const originalWidth = (await preview.boundingBox())!.width
  await page.getByRole("button", { name: "More options", exact: true }).click()
  await page.getByRole("menuitem", { name: "Hide panels", exact: true }).click()
  await expect
    .poll(() =>
      page.evaluate(() =>
        document
          .getAnimations()
          .some(
            (animation) =>
              "animationName" in animation &&
              animation.animationName === "panel-slide-right"
          )
      )
    )
    .toBe(true)
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.dataset.panelTransition)
    )
    .toBeUndefined()
  expect((await preview.boundingBox())!.width).toBeGreaterThan(originalWidth)

  await page.getByRole("button", { name: "More options", exact: true }).click()
  await page.getByRole("menuitem", { name: "Show panels", exact: true }).click()
  await expect
    .poll(() =>
      page.evaluate(() =>
        document
          .getAnimations()
          .some(
            (animation) =>
              "animationName" in animation &&
              animation.animationName === "panel-enter-right"
          )
      )
    )
    .toBe(true)
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.dataset.panelTransition)
    )
    .toBeUndefined()
  expect((await preview.boundingBox())!.width).toBeCloseTo(originalWidth, 0)
})

test.describe("phone shared canvas transition", () => {
  test.use({ viewport: { width: 390, height: 800 }, hasTouch: true })
  test("widens the same canvas into Properties and keeps the canvas controls", async ({
    page,
  }) => {
    const preview = page.locator("#glyphrise-preview-frame")
    const animate = page.getByRole("button", { name: "Animate", exact: true })
    await expect(animate).toBeVisible()
    // Snapshotting backdrop filters bakes the resized canvas into these controls,
    // leaving a blurred patch while the preview travels beneath them.
    for (const control of [
      animate,
      page.locator('[data-slot="viewport-tools"]'),
    ]) {
      expect(
        await control.evaluate(
          (element) => getComputedStyle(element).backdropFilter
        )
      ).toBe("none")
    }
    const original = (await preview.boundingBox())!
    const previewSnapshotStyles = () =>
      page.evaluate(() => {
        const root = document.documentElement
        const incoming = getComputedStyle(
          root,
          "::view-transition-new(editor-preview)"
        )
        const outgoing = getComputedStyle(
          root,
          "::view-transition-old(editor-preview)"
        )
        return {
          animation: incoming.animationName,
          opacity: incoming.opacity,
          blend: incoming.mixBlendMode,
          oldDisplay: outgoing.display,
        }
      })
    const canvasControls = [
      "Reset view",
      "Transform object",
      "View options",
    ].map((name) => page.getByRole("button", { name, exact: true }))
    const originalControls = await Promise.all(
      canvasControls.map((control) => control.boundingBox())
    )
    const resetButton = await canvasControls[0].elementHandle()
    // Inspect the opening snapshot at its first frame, when an incorrect cover
    // fit magnifies the short preview to fill the former tall canvas.
    await page.evaluate(() => {
      const start = document.startViewTransition.bind(document)
      document.startViewTransition = (update) => {
        document.startViewTransition = start
        const transition = start(update)
        void transition.ready.then(() => {
          for (const animation of document.getAnimations()) {
            animation.pause()
            animation.currentTime = 0
          }
        })
        return transition
      }
    })
    await page.getByRole("button", { name: "Properties", exact: true }).click()
    await expect
      .poll(() =>
        page.evaluate(() =>
          document
            .getAnimations()
            .some(
              (animation) =>
                animation.effect instanceof KeyframeEffect &&
                animation.effect.pseudoElement ===
                  "::view-transition-group(editor-preview)"
            )
        )
      )
      .toBe(true)
    expect(await previewSnapshotStyles()).toEqual({
      animation: "none",
      opacity: "1",
      blend: "normal",
      oldDisplay: "none",
    })
    const opening = await preview.evaluate((frame) => {
      const root = document.documentElement
      return {
        frameHeight: frame.getBoundingClientRect().height,
        snapshotHeight: parseFloat(
          getComputedStyle(root, "::view-transition-new(editor-preview)").height
        ),
        groupHeight: parseFloat(
          getComputedStyle(root, "::view-transition-group(editor-preview)")
            .height
        ),
      }
    })
    expect(opening.groupHeight).toBeCloseTo(original.height, 0)
    expect(opening.snapshotHeight).toBeLessThanOrEqual(opening.frameHeight + 1)
    expect(
      await page.locator('[data-slot="viewport-tools"]').evaluate((tools) => ({
        name: getComputedStyle(tools).viewTransitionName,
        animation: getComputedStyle(
          document.documentElement,
          "::view-transition-group(editor-tools)"
        ).animationName,
        oldDisplay: getComputedStyle(
          document.documentElement,
          "::view-transition-old(editor-tools)"
        ).display,
      }))
    ).toEqual({ name: "editor-tools", animation: "none", oldDisplay: "none" })
    expect(
      await page.evaluate(() => {
        const exit = getComputedStyle(
          document.documentElement,
          "::view-transition-old(editor-animate)"
        )
        // The exit ends before the canvas resize. Its snapshot must stay
        // invisible for the remainder instead of returning to opacity 1.
        const animations = document.getAnimations()
        for (const animation of animations) {
          animation.pause()
          animation.currentTime = 190
        }
        const result = {
          name: exit.animationName,
          duration: exit.animationDuration,
          fill: exit.animationFillMode,
          opacityAfterExit: exit.opacity,
        }
        for (const animation of animations) animation.play()
        return result
      })
    ).toEqual({
      name: "exit",
      duration: "0.15s",
      fill: "both",
      opacityAfterExit: "0",
    })
    expect(
      await page
        .locator('[data-slot="viewport-animate"]')
        .evaluate((button) => ({
          opacity: getComputedStyle(button).opacity,
          transition: getComputedStyle(button).transitionDuration,
          name: getComputedStyle(button).viewTransitionName,
        }))
    ).toEqual({ opacity: "0", transition: "0s", name: "none" })

    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.dataset.panelTransition)
      )
      .toBeUndefined()
    await expect(page.getByText("Live preview", { exact: true })).toHaveCount(0)
    await expect(animate).toHaveCount(0)
    const expanded = (await preview.boundingBox())!
    for (const [index, control] of canvasControls.entries()) {
      const position = (await control.boundingBox())!
      expect(position.x).toBeCloseTo(originalControls[index]!.x, 1)
      expect(position.y).toBeCloseTo(originalControls[index]!.y, 1)
    }
    expect(
      await canvasControls[0].evaluate(
        (button, original) => button === original,
        resetButton
      )
    ).toBe(true)
    expect(expanded.width).toBeGreaterThan(original.width)
    expect(expanded.height).toBeLessThan(original.height)
    await expect(
      page.getByRole("button", { name: "Reset view", exact: true })
    ).toBeVisible()
    await expect(
      page.getByRole("button", { name: "Transform object", exact: true })
    ).toBeVisible()
    await expect(
      page.getByRole("button", { name: "View options", exact: true })
    ).toBeVisible()
    await page.getByRole("button", { name: "Motion", exact: true }).click()
    expect(
      await page.evaluate(
        () => document.documentElement.dataset.panelTransition
      )
    ).toBeUndefined()
    expect((await preview.boundingBox())!.height).toBeCloseTo(
      expanded.height,
      1
    )
    await page.getByRole("button", { name: "Properties", exact: true }).click()
    expect(
      await page.evaluate(
        () => document.documentElement.dataset.panelTransition
      )
    ).toBeUndefined()
    expect((await preview.boundingBox())!.height).toBeCloseTo(
      expanded.height,
      1
    )
    await page.getByRole("button", { name: "Canvas", exact: true }).click()
    await expect
      .poll(() =>
        page.evaluate(() =>
          document
            .getAnimations()
            .some(
              (animation) =>
                animation.effect instanceof KeyframeEffect &&
                animation.effect.pseudoElement ===
                  "::view-transition-group(editor-preview)"
            )
        )
      )
      .toBe(true)
    expect(await previewSnapshotStyles()).toEqual({
      animation: "none",
      opacity: "1",
      blend: "normal",
      oldDisplay: "none",
    })
    expect(
      await page.evaluate(() => {
        const root = document.documentElement
        const sheet = getComputedStyle(
          root,
          "::view-transition-old(editor-properties)"
        )
        const entrance = getComputedStyle(
          root,
          "::view-transition-new(editor-animate)"
        )
        const tools = getComputedStyle(
          root,
          "::view-transition-group(editor-tools)"
        )
        return {
          sheet: sheet.animationName,
          animate: entrance.animationName,
          fill: entrance.animationFillMode,
          tools: tools.animationName,
        }
      })
    ).toEqual({
      sheet: "panel-slide-down",
      animate: "enter",
      fill: "both",
      tools: "none",
    })
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.dataset.panelTransition)
      )
      .toBeUndefined()
    await expect(animate).toBeVisible()
    expect((await preview.boundingBox())!.width).toBeCloseTo(original.width, 1)
    expect((await preview.boundingBox())!.height).toBeCloseTo(
      original.height,
      1
    )
    for (const [index, control] of canvasControls.entries()) {
      const position = (await control.boundingBox())!
      expect(position.x).toBeCloseTo(originalControls[index]!.x, 1)
      expect(position.y).toBeCloseTo(originalControls[index]!.y, 1)
    }
    await page.getByRole("button", { name: "Properties", exact: true }).click()
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.dataset.panelTransition)
      )
      .toBeUndefined()
    await expect(
      page.getByRole("complementary", { name: "Properties inspector" })
    ).toBeVisible()
    await page
      .getByRole("button", { name: "More options", exact: true })
      .click()
    await expect(
      page.getByRole("button", { name: "Focus canvas", exact: true })
    ).toHaveCount(0)
    await expect(
      page.getByRole("menuitem", { name: "Hide panels", exact: true })
    ).toBeHidden()
  })
})

for (const width of [390, 1280]) {
  test(`arrows step time after transport and background clicks at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 })
    if (width < 768)
      await page.getByRole("button", { name: "Motion", exact: true }).click()
    const ruler = page.locator('[aria-label="Timeline playhead"]')
    const time = async () => Number(await ruler.getAttribute("aria-valuenow"))
    const stepped = (time: number, frames: number) =>
      Number((Math.max(0, Math.round(time * 60) + frames) / 60).toFixed(3))
    const toolbar = page.getByRole("toolbar", { name: "Timeline", exact: true })
    const next = toolbar.getByRole("button", {
      name: "Next keyframe",
      exact: true,
    })
    await next.click()
    // Let the existing 180ms animated checkpoint seek settle before measuring steps.
    await page.waitForTimeout(250)
    const checkpoint = await time()
    await page.keyboard.press("ArrowRight")
    await expect.poll(time).toBeCloseTo(stepped(checkpoint, 1), 3)
    await page.keyboard.press("ArrowLeft")
    await expect.poll(time).toBeCloseTo(checkpoint, 3)
    const previous = toolbar.getByRole("button", {
      name: "Previous keyframe",
      exact: true,
    })
    await previous.click()
    await page.waitForTimeout(250)
    const previousTime = await time()
    await page.keyboard.press("ArrowRight")
    await expect.poll(time).toBeCloseTo(stepped(previousTime, 1), 3)

    await toolbar
      .getByRole("button", { name: /^Play(?: timeline)?$/, exact: false })
      .click()
    await expect(
      toolbar.getByRole("button", { name: /^Pause(?: timeline)?$/ })
    ).toBeVisible()
    await page.keyboard.press("ArrowRight")
    await expect(
      toolbar.getByRole("button", { name: /^Play(?: timeline)?$/ })
    ).toBeVisible()
    const pausedTime = await time()
    await page.keyboard.press("Shift+ArrowRight")
    await expect.poll(time).toBeCloseTo(stepped(pausedTime, 10), 3)

    // Clicking empty timeline space must release focus from the time input.
    const input = page.getByLabel("Playhead time in seconds", { exact: true })
    await input.focus()
    const beforeInputArrow = await time()
    await page.keyboard.press("ArrowRight")
    expect(await time()).toBe(beforeInputArrow)
    const lanes = page
      .locator("[data-timeline-step-surface] .editor-scrollbar")
      .last()
    const box = (await lanes.boundingBox())!
    await page.mouse.click(box.x + box.width - 30, box.y + box.height - 15)
    await expect(ruler).toBeFocused()
    const backgroundTime = await time()
    await page.keyboard.press("ArrowLeft")
    await expect.poll(time).toBeCloseTo(stepped(backgroundTime, -1), 3)
    await page.keyboard.press("Shift+ArrowRight")
    await expect
      .poll(time)
      .toBeCloseTo(stepped(stepped(backgroundTime, -1), 10), 3)
    if (width < 768) {
      await page.getByRole("button", { name: "Canvas", exact: true }).click()
      await expect
        .poll(() =>
          page.evaluate(() => document.documentElement.dataset.panelTransition)
        )
        .toBeUndefined()
      await page
        .getByRole("button", { name: "Next keyframe", exact: true })
        .click()
      await page.waitForTimeout(250)
      const canvasTime = await time()
      await page.keyboard.press("ArrowRight")
      await expect.poll(time).toBeCloseTo(canvasTime + 1 / 60, 3)
      await page.keyboard.press("ArrowLeft")
      await expect.poll(time).toBeCloseTo(canvasTime, 3)
    }
    await expect(
      page.getByRole("button", {
        name: "Undo",
        exact: true,
        includeHidden: true,
      })
    ).toBeDisabled()
  })
}
