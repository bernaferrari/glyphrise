// @vitest-environment happy-dom
import { afterEach, expect, it, vi } from "vitest"
import { animateSvgViewReset, type SvgResetTransform } from "./SvgViewReset"

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

function setup(reducedMotion = false) {
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
  vi.stubGlobal("matchMedia", () => ({ matches: reducedMotion }))
  const displayed: { current: SvgResetTransform | null } = { current: null }
  const currentZoomRef = { current: 2 }
  const onViewRotationSet = vi.fn()
  animateSvgViewReset({
    resetViewFrameRef: { current: null },
    viewNudgeFrameRef: { current: null },
    isInertiaActiveRef: { current: true },
    rotationVelocityRef: { current: { x: 2, y: 1 } },
    liveRotation: { x: 20, y: 40, z: 0 },
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
    onViewRotationSet,
  })
  return {
    displayed,
    currentZoomRef,
    onViewRotationSet,
    tick: (time: number) => frame(time),
  }
}

it("keeps the displayed artwork at its starting pose, then eases all transforms with the camera", () => {
  const { displayed, currentZoomRef, onViewRotationSet, tick } = setup()
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
  expect(onViewRotationSet).toHaveBeenLastCalledWith(
    { x: 2.5, y: 5, z: 0 },
    { commit: false }
  )
  tick(220)
  expect(displayed.current).toBeNull()
  expect(currentZoomRef.current).toBe(1)
  expect(onViewRotationSet).toHaveBeenLastCalledWith(
    { x: 0, y: 0, z: 0 },
    { commit: true }
  )
})

it("returns immediately to the committed pose on the next frame with reduced motion", () => {
  const { displayed, currentZoomRef, tick } = setup(true)
  tick(16)
  expect(displayed.current).toBeNull()
  expect(currentZoomRef.current).toBe(1)
})
