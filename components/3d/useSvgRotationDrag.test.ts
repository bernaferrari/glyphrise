import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { afterEach, describe, expect, it, vi } from "vitest"
import { useSvgRotationDrag } from "./useSvgRotationDrag"

function setup() {
  const rotationOffset = { x: 10, y: 20, z: 30 }
  const cameraOrbitRef = { current: { x: 4, y: 5, z: 0 } }
  vi.stubGlobal(
    "requestAnimationFrame",
    vi.fn(() => 1)
  )
  vi.stubGlobal("cancelAnimationFrame", vi.fn())
  const onObjectRotationSet = vi.fn()
  const onCameraRotationSet = vi.fn()
  let controls!: ReturnType<typeof useSvgRotationDrag>
  function Harness() {
    controls = useSvgRotationDrag({
      rotationOffset,
      cameraOrbitRef,
      onObjectRotationSet,
      onCameraRotationSet,
    })
    return null
  }
  renderToStaticMarkup(createElement(Harness))
  return {
    controls,
    rotationOffset,
    cameraOrbitRef,
    onObjectRotationSet,
    onCameraRotationSet,
  }
}

afterEach(() => vi.unstubAllGlobals())

const quarterTurn = Math.PI / 2

describe("Canvas rotation dragging", () => {
  it("updates object rotation through the inspector and timeline callback", () => {
    const { controls, onObjectRotationSet, onCameraRotationSet } = setup()
    controls.beginViewDrag({ altKey: false })
    controls.applyViewRotationDelta({ x: quarterTurn, y: quarterTurn })
    expect(onObjectRotationSet).not.toHaveBeenCalled()
    controls.flushViewRotation()
    expect(onObjectRotationSet).toHaveBeenCalledWith({ x: 100, y: 110, z: 30 })
    expect(onCameraRotationSet).not.toHaveBeenCalled()
  })

  it("accumulates rapid movements before React publishes updated props", () => {
    const { controls, onObjectRotationSet, rotationOffset } = setup()
    controls.beginViewDrag({ altKey: false })
    controls.applyViewRotationDelta({ x: quarterTurn, y: 0 })
    controls.applyViewRotationDelta({ x: 0, y: quarterTurn })
    expect(requestAnimationFrame).toHaveBeenCalledTimes(1)
    controls.flushViewRotation()
    expect(onObjectRotationSet).toHaveBeenCalledTimes(1)
    expect(onObjectRotationSet).toHaveBeenLastCalledWith({
      x: 100,
      y: 110,
      z: 30,
    })
    expect(rotationOffset).toEqual({ x: 10, y: 20, z: 30 })
  })

  it("keeps Alt-drag camera orbit out of document properties", () => {
    const { controls, onObjectRotationSet, onCameraRotationSet } = setup()
    controls.beginViewDrag({ altKey: true })
    controls.applyViewRotationDelta({ x: quarterTurn, y: quarterTurn })
    expect(onCameraRotationSet).toHaveBeenCalledWith({ x: 94, y: 95 })
    expect(onObjectRotationSet).not.toHaveBeenCalled()
  })
})
