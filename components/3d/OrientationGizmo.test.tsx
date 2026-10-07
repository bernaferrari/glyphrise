// @vitest-environment happy-dom
import { act, createRef } from "react"
import { createRoot } from "react-dom/client"
import * as THREE from "three"
import { expect, it, vi } from "vitest"
import {
  OrientationGizmo,
  updateOrientationGizmo,
  type OrientationGizmoRefs,
} from "./OrientationGizmo"

it("paints front axes above the center and rear axes below it as the view rotates", () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true)
  const host = document.createElement("div")
  const root = createRoot(host)
  const refs: OrientationGizmoRefs = {
    centerDotRef: createRef(),
    lineXRef: createRef(),
    lineYRef: createRef(),
    lineZRef: createRef(),
    markerXRef: createRef(),
    markerYRef: createRef(),
    markerZRef: createRef(),
  }
  const paintOrder = () =>
    Array.from(host.querySelector("svg")!.children)
      .filter((node) => node.tagName !== "line")
      .map((node) => node.textContent || "center")
  const turn = (angle: number) =>
    updateOrientationGizmo(
      refs,
      new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle)
    )
  const render = () =>
    act(() =>
      root.render(
        <OrientationGizmo
          refs={refs}
          onNudgeViewRotation={() => undefined}
          onAlignViewToAxis={() => undefined}
        />
      )
    )
  try {
    render()
    turn(0)
    expect(paintOrder()).toEqual(["center", "X", "Y", "Z"])
    turn(Math.PI)
    expect(paintOrder()).toEqual(["Z", "center", "X", "Y"])
    turn(Math.PI / 2)
    expect(paintOrder()).toEqual(["X", "center", "Y", "Z"])
    turn(-Math.PI / 2)
    expect(paintOrder()).toEqual(["center", "Y", "Z", "X"])
    // Front-facing axes also follow their relative depth.
    turn(-Math.PI / 6)
    expect(paintOrder()).toEqual(["center", "Y", "X", "Z"])
    turn(-Math.PI / 3)
    expect(paintOrder()).toEqual(["center", "Y", "Z", "X"])
    const mutations = new MutationObserver(() => undefined)
    mutations.observe(host.querySelector("svg")!, { childList: true })
    turn(-Math.PI / 3)
    expect(mutations.takeRecords()).toEqual([])
    mutations.disconnect()
    // Imperative paint ordering must survive React rerenders.
    render()
    expect(paintOrder()).toEqual(["center", "Y", "Z", "X"])
    turn(0)
    expect(paintOrder()).toEqual(["center", "X", "Y", "Z"])
  } finally {
    act(() => root.unmount())
    vi.unstubAllGlobals()
  }
})
