// @vitest-environment happy-dom
import * as THREE from "three"
import { act } from "react"
import { createRoot } from "react-dom/client"
import { expect, it, vi } from "vitest"
import { useSvgModelGroups } from "./useSvgModelGroups"
import { buildSvgIconGroup } from "./SvgModelBuilder"
import type { SvgCanvasProps } from "./SvgTypes"

vi.mock("./SvgModelBuilder", () => ({
  buildSvgIconGroup: vi.fn(() =>
    new THREE.Group().add(
      new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial())
    )
  ),
}))

it("rebuilds only changed icons and preserves the preview after failed edits", () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true)
  const pivot = new THREE.Group()
  const options = {
    pivotGroupRef: { current: pivot },
    iconAGroupRef: { current: null as THREE.Group | null },
    iconBGroupRef: { current: null as THREE.Group | null },
    clipPlaneARef: { current: new THREE.Plane() },
    clipPlaneBRef: { current: new THREE.Plane() },
    setModelReady: vi.fn(),
    setModelError: vi.fn(),
    pathOverridesASignature: "",
    pathOverridesBSignature: "",
    colorAStopsKey: "",
    colorBStopsKey: "",
  }
  const props = {
    iconAContent: "a",
    iconBContent: "b",
    materialPreset: "satin",
    colorA: "#ffffff",
    colorB: "#ffffff",
    emissiveIntensity: 0,
    extrusionDepth: 10,
    transitionType: "wipe",
    wipeDirection: { x: 1, y: 1 },
  } as SvgCanvasProps
  function Harness({ props }: { props: SvgCanvasProps }) {
    useSvgModelGroups({ props, ...options })
    return null
  }
  const container = document.createElement("div")
  const root = createRoot(container)
  vi.mocked(buildSvgIconGroup).mockClear()
  try {
    act(() => root.render(<Harness props={props} />))
    const groups = [...pivot.children]
    act(() =>
      root.render(
        <Harness props={{ ...props, wipeDirection: { x: -1, y: 1 } }} />
      )
    )
    act(() =>
      root.render(<Harness props={{ ...props, transitionType: "fade" }} />)
    )
    expect(buildSvgIconGroup).toHaveBeenCalledTimes(2)
    expect(pivot.children).toEqual(groups)
    // Editing one icon must preserve the other icon's GPU resources.
    const retainedB = options.iconBGroupRef.current!
    const retainedBDispose = vi.spyOn(
      (retainedB.children[0] as THREE.Mesh).geometry,
      "dispose"
    )
    act(() =>
      root.render(<Harness props={{ ...props, iconAContent: "edited-a" }} />)
    )
    expect(buildSvgIconGroup).toHaveBeenCalledTimes(3)
    expect(options.iconBGroupRef.current).toBe(retainedB)
    expect(retainedBDispose).not.toHaveBeenCalled()
    const retainedA = options.iconAGroupRef.current
    act(() =>
      root.render(
        <Harness
          props={{
            ...props,
            iconAContent: "edited-a",
            iconBContent: "edited-b",
          }}
        />
      )
    )
    expect(buildSvgIconGroup).toHaveBeenCalledTimes(4)
    expect(options.iconAGroupRef.current).toBe(retainedA)
    // A shared shape edit still regenerates both icons.
    act(() =>
      root.render(
        <Harness
          props={{
            ...props,
            iconAContent: "edited-a",
            iconBContent: "edited-b",
            extrusionDepth: 20,
          }}
        />
      )
    )
    expect(buildSvgIconGroup).toHaveBeenCalledTimes(6)
    const lastA = options.iconAGroupRef.current!
    const lastB = options.iconBGroupRef.current!
    const lastADispose = vi.spyOn(
      (lastA.children[0] as THREE.Mesh).geometry,
      "dispose"
    )
    const lastBDispose = vi.spyOn(
      (lastB.children[0] as THREE.Mesh).geometry,
      "dispose"
    )
    // A failed shared edit discards its new candidate, preserving both old models.
    const candidate = new THREE.Group().add(
      new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial())
    )
    const candidateDispose = vi.spyOn(
      (candidate.children[0] as THREE.Mesh).geometry,
      "dispose"
    )
    vi.mocked(buildSvgIconGroup)
      .mockReturnValueOnce(candidate)
      .mockImplementationOnce(() => {
        throw new Error("Invalid SVG")
      })
    act(() => root.render(<Harness props={{ ...props, extrusionDepth: 30 }} />))
    expect(options.iconAGroupRef.current).toBe(lastA)
    expect(options.iconBGroupRef.current).toBe(lastB)
    expect(lastADispose).not.toHaveBeenCalled()
    expect(lastBDispose).not.toHaveBeenCalled()
    expect(candidateDispose).toHaveBeenCalledTimes(1)
    expect(options.setModelError).toHaveBeenLastCalledWith("Invalid SVG")
    act(() => root.render(<Harness props={{ ...props, extrusionDepth: 40 }} />))
    expect(options.iconAGroupRef.current).not.toBe(lastA)
    expect(options.iconBGroupRef.current).not.toBe(lastB)
    expect(lastADispose).toHaveBeenCalledTimes(1)
    expect(lastBDispose).toHaveBeenCalledTimes(1)
  } finally {
    act(() => root.unmount())
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  }
})
