// @vitest-environment happy-dom
import { afterEach, expect, it, vi } from "vitest"
import { animateSvgViewReset, type SvgResetTransform } from "./SvgViewReset"

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

function setup() {
  let frame: FrameRequestCallback = () => {}
  vi.spyOn(performance, "now").mockReturnValue(0)
  vi.stubGlobal(
    "requestAnimationFrame",
    vi.fn((callback: FrameRequestCallback) => {
      frame = callback
      return 1
    })
  )
  vi.stubGlobal("cancelAnimationFrame", vi.fn())
  const displayed: { current: SvgResetTransform | null } = { current: null }
  const currentZoomRef = { current: 2 }
  const requestRender = vi.fn()
  animateSvgViewReset({
    resetViewFrameRef: { current: null },
    viewNudgeFrameRef: { current: null },
    isInertiaActiveRef: { current: true },
    rotationVelocityRef: { current: { x: 2, y: 1 } },
    currentZoomRef,
    targetZoomRef: { current: 2 },
    animationStartRef: { current: 0 },
    artworkTransform: {
      rotationOffset: { x: 0, y: 90, z: 0 },
      moveOffset: { x: 12, y: 0, z: 0 },
      objectScale: 2,
      objectScaleAxes: { x: 2, y: 1, z: 0.5 },
    },
    onArtworkTransform: (transform) => {
      displayed.current = transform
    },
    requestRender,
  })
  return {
    displayed,
    currentZoomRef,
    requestRender,
    tick: (time: number) => frame(time),
  }
}

it("keeps the displayed artwork at its starting pose, then eases rotation, scale, position and zoom", () => {
  const { displayed, currentZoomRef, requestRender, tick } = setup()
  expect(displayed.current?.rotationOffset.y).toBe(90)
  tick(110)
  expect(displayed.current?.rotationOffset.y).toBeCloseTo(11.25)
  expect(displayed.current?.moveOffset.x).toBeCloseTo(1.5)
  expect(displayed.current?.objectScale).toBeCloseTo(1.125)
  expect(displayed.current?.objectScaleAxes).toEqual({
    x: 1.125,
    y: 1,
    z: 0.9375,
  })
  expect(currentZoomRef.current).toBeCloseTo(1.125)
  expect(requestRender).toHaveBeenCalledOnce()
  tick(220)
  expect(displayed.current).toBeNull()
  expect(currentZoomRef.current).toBe(1)
  expect(requestRender).toHaveBeenCalledTimes(2)
})
