import { describe, expect, it } from "vitest"
import {
  shouldContinueSvgRenderLoop,
  shouldScheduleSvgRenderFrame,
} from "./SvgRenderLoopModel"

describe("shouldScheduleSvgRenderFrame", () => {
  it("schedules the visible active loop when no frame is queued", () => {
    expect(
      shouldScheduleSvgRenderFrame({
        disposed: false,
        documentHidden: false,
        animationFrameId: null,
      })
    ).toBe(true)
  })

  it("does not schedule while hidden or disposed", () => {
    expect(
      shouldScheduleSvgRenderFrame({
        disposed: false,
        documentHidden: true,
        animationFrameId: null,
      })
    ).toBe(false)
    expect(
      shouldScheduleSvgRenderFrame({
        disposed: true,
        documentHidden: false,
        animationFrameId: null,
      })
    ).toBe(false)
  })

  it("does not queue a duplicate animation frame", () => {
    expect(
      shouldScheduleSvgRenderFrame({
        disposed: false,
        documentHidden: false,
        animationFrameId: 42,
      })
    ).toBe(false)
  })
})

describe("shouldContinueSvgRenderLoop", () => {
  it("stops once an idle scene is settled", () => {
    expect(
      shouldContinueSvgRenderLoop({
        isPlaying: false,
        isExporting: false,
        isDragging: false,
        isInertiaActive: false,
        zoomDelta: 0,
      })
    ).toBe(false)
  })

  it.each([
    ["playback", { isPlaying: true }],
    ["export", { isExporting: true }],
    ["drag", { isDragging: true }],
    ["inertia", { isInertiaActive: true }],
    ["zoom settling", { zoomDelta: 0.001 }],
  ])("continues for %s", (_label, override) => {
    expect(
      shouldContinueSvgRenderLoop({
        isPlaying: false,
        isExporting: false,
        isDragging: false,
        isInertiaActive: false,
        zoomDelta: 0,
        ...override,
      })
    ).toBe(true)
  })
})
