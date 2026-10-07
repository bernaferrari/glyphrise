import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { afterEach, describe, expect, it, vi } from "vitest"
import { useSvgViewNudge } from "./useSvgViewNudge"

function setup() {
  const rotationRef = { current: { x: 0, y: 0, z: 0 } }
  let frame: FrameRequestCallback | undefined
  vi.spyOn(performance, "now").mockReturnValue(0)
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    frame = callback
    return 1
  })
  vi.stubGlobal("cancelAnimationFrame", () => {
    frame = undefined
  })
  let controls!: ReturnType<typeof useSvgViewNudge>
  function Harness() {
    controls = useSvgViewNudge({
      getRotation: () => rotationRef.current,
      isInertiaActiveRef: { current: false },
      rotationVelocityRef: { current: { x: 0, y: 0 } },
      onViewRotationSetRef: {
        current: (rotation) => {
          rotationRef.current = { ...rotationRef.current, ...rotation }
        },
      },
    })
    return null
  }
  renderToStaticMarkup(createElement(Harness))
  return { controls, rotationRef, tick: (time: number) => frame!(time) }
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe("interrupted rotation nudges", () => {
  it.each([
    [20, 1, 45],
    [20, -1, 0],
    [-20, 1, 0],
    [-20, -1, -45],
    [45, 1, 90],
    [45, -1, 0],
  ] as const)(
    "snaps %s degrees in direction %s to %s",
    (start, direction, target) => {
      const { controls, rotationRef, tick } = setup()
      rotationRef.current.y = start
      controls.nudgeViewRotation("y", direction)
      tick(220)
      expect(rotationRef.current.y).toBe(target)
    }
  )

  it.each([
    ["x", { x: 0, y: -90, z: 0 }],
    ["y", { x: -90, y: 0, z: 0 }],
    ["z", { x: 0, y: 0, z: 0 }],
  ] as const)(
    "restores the original %s axis view and cancels an active nudge",
    (axis, target) => {
      const { controls, rotationRef, tick } = setup()
      rotationRef.current = { x: 23, y: 56, z: 12 }
      controls.nudgeViewRotation("x", 1)
      tick(110)
      controls.alignViewToAxis(axis)
      expect(rotationRef.current).toEqual(target)
      expect(controls.viewNudgeFrameRef.current).toBeNull()
    }
  )

  it("uses the dragged rotation after cancelling a nudge", () => {
    const { controls, rotationRef, tick } = setup()
    controls.nudgeViewRotation("x", 1)
    tick(110)
    controls.cancelViewNudge()
    rotationRef.current.x = 10
    controls.nudgeViewRotation("x", 1)
    tick(220)
    expect(rotationRef.current.x).toBe(45)
  })

  it("uses the reset rotation after reset cancels its frame", () => {
    const { controls, rotationRef, tick } = setup()
    controls.nudgeViewRotation("x", 1)
    tick(110)
    cancelAnimationFrame(controls.viewNudgeFrameRef.current!)
    controls.viewNudgeFrameRef.current = null
    rotationRef.current.x = 0
    controls.nudgeViewRotation("x", 1)
    tick(220)
    expect(rotationRef.current.x).toBe(45)
  })
})
