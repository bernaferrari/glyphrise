import { describe, expect, it } from "vitest"
import {
  advanceInertiaVelocity,
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

it("settles a normal canvas fling within 600ms without reversing direction", () => {
  let velocity = { x: 0.036, y: 0.072 }
  let active = true
  let frames = 0
  while (active && frames <= 60) {
    const next = advanceInertiaVelocity(velocity)
    expect(next.velocity.x).toBeGreaterThanOrEqual(0)
    expect(next.velocity.y).toBeGreaterThanOrEqual(0)
    expect(next.velocity.y).toBeLessThan(velocity.y)
    velocity = next.velocity
    active = next.active
    frames++
  }
  expect(frames * (1000 / 60)).toBeLessThanOrEqual(600)
  expect(velocity).toEqual({ x: 0, y: 0 })
})
