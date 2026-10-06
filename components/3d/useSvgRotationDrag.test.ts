import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import { useSvgRotationDrag } from "./useSvgRotationDrag"

function setup() {
  const cameraOrbitRef = { current: { x: 4, y: 5, z: 0 } }
  const onCameraRotationSet = vi.fn((rotation) => {
    cameraOrbitRef.current = { ...cameraOrbitRef.current, ...rotation }
  })
  let controls!: ReturnType<typeof useSvgRotationDrag>
  function Harness() {
    controls = useSvgRotationDrag({ cameraOrbitRef, onCameraRotationSet })
    return null
  }
  renderToStaticMarkup(createElement(Harness))
  return { controls, cameraOrbitRef, onCameraRotationSet }
}

const quarterTurn = Math.PI / 2

describe("Canvas camera dragging", () => {
  it("orbits the camera immediately", () => {
    const { controls, onCameraRotationSet } = setup()
    controls.applyViewRotationDelta({ x: quarterTurn, y: quarterTurn })
    expect(onCameraRotationSet).toHaveBeenCalledWith({ x: 94, y: 95 })
  })

  it("accumulates rapid movements without waiting for React props", () => {
    const { controls, cameraOrbitRef } = setup()
    controls.applyViewRotationDelta({ x: quarterTurn, y: 0 })
    controls.applyViewRotationDelta({ x: 0, y: quarterTurn })
    expect(cameraOrbitRef.current).toEqual({ x: 94, y: 95, z: 0 })
  })

  it("continues orbiting beyond full turns in both directions", () => {
    const { controls, cameraOrbitRef } = setup()
    for (let i = 0; i < 6; i++)
      controls.applyViewRotationDelta({ x: -quarterTurn, y: quarterTurn })
    expect(cameraOrbitRef.current).toEqual({ x: -536, y: 545, z: 0 })
  })
})
