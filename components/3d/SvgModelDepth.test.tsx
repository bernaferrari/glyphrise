// @vitest-environment happy-dom
import * as THREE from "three"
import { expect, it, vi } from "vitest"
import { act } from "react"
import { createRoot } from "react-dom/client"
import * as SvgModelBuilder from "./SvgModelBuilder"
import { buildSvgIconGroup } from "./SvgModelBuilder"
import { useSvgModelGroups } from "./useSvgModelGroups"
import { planSvgGroupDepthUpdate } from "./SvgModelDepth"
import { disposeObjectTree } from "./SvgSceneUtils"
import {
  getVisibleIconCenter,
  getVisiblePivotBounds,
} from "./SvgGeometryAnalysis"
import { updateLayerSelectionOutline } from "./SvgRenderHelpers"
import type { SvgCanvasProps } from "./SvgTypes"

const props = {
  materialPreset: "chrome",
  colorA: "#aabbcc",
  colorB: "#aabbcc",
  extrusionDepth: 10,
  bevelEnabled: true,
  bevelThickness: 0.12,
  bevelSize: 0.06,
  bevelSegments: 12,
  geometryQuality: 0.04,
  layerSpacing: 0.2,
  innerElementScale: { x: 1.1, y: 0.9, z: 0.8 },
  transitionType: "wipe",
  wipeDirection: { x: 1, y: 1 },
  pathOverridesA: [
    {
      id: "1:0",
      visible: true,
      depthMultiplier: 1.4,
      scale: { x: 1, y: 1, z: 0.7 },
    },
  ],
} as SvgCanvasProps
const svg =
  '<svg viewBox="0 0 24 24"><path d="M2 2H22V22H2Z M6 6V18H18V6Z"/><path d="M9 9H15V15H9Z"/><path data-glyphrise-slash="true" d="M2 3L3 2L22 21L21 22Z"/></svg>'
const build = (settings: SvgCanvasProps) =>
  buildSvgIconGroup({
    svgContent: svg,
    isIconA: true,
    props: settings,
    clipPlaneA: new THREE.Plane(),
    clipPlaneB: null,
  })

it("keeps the real model groups through animated seeks and equivalent detail values", () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true)
  const builder = vi.spyOn(SvgModelBuilder, "buildSvgIconGroup")
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
  function Harness({ depth }: { depth: number }) {
    useSvgModelGroups({
      ...options,
      props: {
        ...props,
        iconAContent: svg,
        iconBContent: svg,
        enableGradient: true,
        extrusionDepth: depth,
        geometryQuality: 0.04001,
      },
    })
    return null
  }
  const root = createRoot(document.createElement("div"))
  try {
    act(() => root.render(<Harness depth={10} />))
    const originalGroups = [...pivot.children]
    const geometries = originalGroups.map(
      (group) => (group.children[0] as THREE.Mesh).geometry
    )
    for (const depth of [10.5, 12.3, 14.7, 18, 10]) {
      act(() => root.render(<Harness depth={depth} />))
      expect(builder).toHaveBeenCalledTimes(2)
      expect(pivot.children).toEqual(originalGroups)
      expect(
        pivot.children.map(
          (group) => (group.children[0] as THREE.Mesh).geometry
        )
      ).toEqual(geometries)
    }
  } finally {
    act(() => root.unmount())
    disposeObjectTree(pivot)
    builder.mockRestore()
    vi.unstubAllGlobals()
  }
})

it("updates animated depth exactly like fresh geometry while retaining GPU resources", () => {
  const group = build(props)
  updateLayerSelectionOutline({ groups: [group], selectedLayerId: "all" })
  const resources = group.children.map((object) => {
    const mesh = object as THREE.Mesh
    return {
      geometry: mesh.geometry,
      material: mesh.material,
      dispose: vi.spyOn(mesh.geometry, "dispose"),
    }
  })
  try {
    for (const extrusionDepth of [12.34, 18, 10]) {
      const nextProps = { ...props, extrusionDepth }
      const update = planSvgGroupDepthUpdate(group, nextProps)
      expect(update).not.toBeNull()
      update!()
      getVisibleIconCenter([group])
      getVisiblePivotBounds([group], new THREE.Group().add(group))
      const fresh = build(nextProps)
      getVisibleIconCenter([fresh])
      getVisiblePivotBounds([fresh], new THREE.Group().add(fresh))
      updateLayerSelectionOutline({ groups: [fresh], selectedLayerId: "all" })
      try {
        for (const [index, object] of group.children.entries()) {
          const actual = object as THREE.Mesh,
            expected = fresh.children[index] as THREE.Mesh
          expect(actual.geometry).toBe(resources[index].geometry)
          expect(actual.material).toBe(resources[index].material)
          expect(resources[index].dispose).not.toHaveBeenCalled()
          expect(actual.position.distanceTo(expected.position)).toBeLessThan(
            1e-5
          )
          expect(actual.scale.equals(expected.scale)).toBe(true)
          const outline = actual.getObjectByName(
            "selected-layer-outline"
          ) as THREE.LineSegments
          const freshOutline = expected.getObjectByName(
            "selected-layer-outline"
          ) as THREE.LineSegments
          const outlinePositions =
            outline.geometry.getAttribute("position").array
          const freshPositions =
            freshOutline.geometry.getAttribute("position").array
          expect(outlinePositions.length).toBe(freshPositions.length)
          expect(
            Math.max(
              ...Array.from(outlinePositions, (value, i) =>
                Math.abs(value - freshPositions[i])
              )
            )
          ).toBeLessThan(1e-5)
          for (const name of ["position", "normal", "uv"]) {
            const a = actual.geometry.getAttribute(name).array,
              b = expected.geometry.getAttribute(name).array
            expect(a.length).toBe(b.length)
            expect(
              Math.max(...Array.from(a, (value, i) => Math.abs(value - b[i])))
            ).toBeLessThan(name === "normal" ? 1e-3 : 1e-5)
          }
          expect(actual.geometry.boundingSphere!.radius).toBeCloseTo(
            expected.geometry.boundingSphere!.radius,
            4
          )
        }
        expect(
          group.userData.localBounds.min.distanceTo(
            fresh.userData.localBounds.min
          )
        ).toBeLessThan(1e-5)
        expect(
          group.userData.localBounds.max.distanceTo(
            fresh.userData.localBounds.max
          )
        ).toBeLessThan(1e-5)
        expect(
          group.userData.massCenterLocal.distanceTo(
            fresh.userData.massCenterLocal
          )
        ).toBeLessThan(1e-5)
      } finally {
        disposeObjectTree(fresh)
      }
    }
  } finally {
    disposeObjectTree(group)
  }
})

it("falls back without changing any layer when shallower depth changes its bevel", () => {
  const group = build(props)
  const original = group.children.map((object) =>
    Array.from((object as THREE.Mesh).geometry.getAttribute("position").array)
  )
  expect(
    planSvgGroupDepthUpdate(group, { ...props, extrusionDepth: 0.05 })
  ).toBeNull()
  group.children.forEach((object, index) =>
    expect(
      Array.from((object as THREE.Mesh).geometry.getAttribute("position").array)
    ).toEqual(original[index])
  )
  expect(
    planSvgGroupDepthUpdate(group, { ...props, materialPreset: "carved" })
  ).toBeNull()
  disposeObjectTree(group)
})

it("defers center and bounds analysis until requested, then reuses it", () => {
  const group = build(props)
  try {
    expect(group.userData.massCenterLocal).toBeUndefined()
    expect(group.userData.localBounds).toBeUndefined()
    const pivot = new THREE.Group().add(group)
    const center = getVisibleIconCenter([group])!
    const bounds = getVisiblePivotBounds([group], pivot)!
    expect(center.toArray().every(Number.isFinite)).toBe(true)
    expect(bounds.isEmpty()).toBe(false)
    const localCenter = group.userData.massCenterLocal
    const localBounds = group.userData.localBounds
    group.position.x += 4
    expect(getVisibleIconCenter([group])!.x).toBeCloseTo(center.x + 4)
    expect(getVisiblePivotBounds([group], pivot)!.min.x).toBeCloseTo(
      bounds.min.x + 4
    )
    expect(group.userData.massCenterLocal).toBe(localCenter)
    expect(group.userData.localBounds).toBe(localBounds)
  } finally {
    disposeObjectTree(group)
  }
})
