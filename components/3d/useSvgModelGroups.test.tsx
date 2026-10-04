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

it("updates transition settings without rebuilding the icon meshes", () => {
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
    // A real shape edit still regenerates geometry.
    act(() => root.render(<Harness props={{ ...props, extrusionDepth: 20 }} />))
    expect(buildSvgIconGroup).toHaveBeenCalledTimes(4)
  } finally {
    act(() => root.unmount())
    vi.unstubAllGlobals()
  }
})
