import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import { useSvgRotationDrag } from "./useSvgRotationDrag"
import type { SvgCanvasLiveRenderProps } from "./useSvgCanvasLiveRefs"

function setup() {
  const liveRenderPropsRef = {
    current: {
      rotationOffset: { x: 4, y: 5, z: 12 },
    } as SvgCanvasLiveRenderProps,
  }
  const onViewRotationSet = vi.fn()
  let controls!: ReturnType<typeof useSvgRotationDrag>
  function Harness() {
    controls = useSvgRotationDrag({
      liveRenderPropsRef,
      onViewRotationSet,
      requestRender: vi.fn(),
    })
    return null
  }
  renderToStaticMarkup(createElement(Harness))
  return { controls, liveRenderPropsRef, onViewRotationSet }
}

const quarterTurn = Math.PI / 2

describe("Shared canvas and artwork rotation", () => {
  it("updates the displayed artwork and Properties immediately, preserving Z", () => {
    const { controls, onViewRotationSet } = setup()
    controls.applyViewRotationDelta({ x: quarterTurn, y: quarterTurn })
    expect(onViewRotationSet).toHaveBeenCalledWith(
      { x: 94, y: 95, z: 12 },
      { commit: false }
    )
    controls.finishViewRotation()
    expect(onViewRotationSet).toHaveBeenLastCalledWith(
      { x: 94, y: 95, z: 12 },
      { commit: true }
    )
  })

  it("accumulates rapid movements without waiting for React props", () => {
    const { controls, liveRenderPropsRef } = setup()
    controls.applyViewRotationDelta({ x: quarterTurn, y: 0 })
    controls.applyViewRotationDelta({ x: 0, y: quarterTurn })
    expect(liveRenderPropsRef.current.rotationOffset).toEqual({
      x: 94,
      y: 95,
      z: 12,
    })
    controls.finishViewRotation()
  })

  it("continues rotating beyond full turns in both directions", () => {
    const { controls, liveRenderPropsRef } = setup()
    for (let i = 0; i < 6; i++)
      controls.applyViewRotationDelta({ x: -quarterTurn, y: quarterTurn })
    expect(liveRenderPropsRef.current.rotationOffset).toEqual({
      x: -536,
      y: 545,
      z: 12,
    })
    controls.finishViewRotation()
  })
  it("lets a nudge preview finish its own animation before committing", () => {
    const { controls, onViewRotationSet } = setup()
    controls.setViewRotation({ y: 20 }, { commit: false })
    controls.finishViewRotation()
    expect(onViewRotationSet).toHaveBeenCalledOnce()
    controls.setViewRotation({ y: 45 }, { commit: true })
    expect(onViewRotationSet).toHaveBeenLastCalledWith(
      { x: 4, y: 45, z: 12 },
      { commit: true }
    )
  })
})
// @vitest-environment happy-dom
