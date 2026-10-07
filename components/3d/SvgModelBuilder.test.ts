// @vitest-environment happy-dom
import * as THREE from "three"
import { readFileSync } from "node:fs"
import { expect, it } from "vitest"
import { appendMaterialSymbolSlash, PRESET_ICONS } from "../editor/IconLibrary"
import { createShapeStop, replaceShapeIcon } from "../editor/ShapeSequenceModel"
import { completePathOverride } from "../editor/SvgLayerOverrideModel"
import { buildSvgIconGroup } from "./SvgModelBuilder"
import { planSvgGroupDepthUpdate } from "./SvgModelDepth"
import { disposeObjectTree } from "./SvgSceneUtils"
import type { SvgCanvasProps } from "./SvgTypes"

const calendar = PRESET_ICONS.find(
  (icon) => icon.id === "material-symbol-outlined-calendar_month"
)!
const settings = {
  materialPreset: "satin",
  colorA: "#ffffff",
  colorB: "#ffffff",
  extrusionDepth: 10,
  bevelEnabled: true,
  bevelThickness: 0.12,
  bevelSize: 0.06,
  bevelSegments: 12,
  geometryQuality: 0.04,
  layerSpacing: 0.16,
  innerElementScale: { x: 1, y: 1, z: 1 },
  transitionType: "fade",
  wipeDirection: { x: 0, y: 0 },
} as SvgCanvasProps

it.each(["high-density", "hvac-max-defrost"])(
  "does not transfer the previous symbol's layer depths into %s",
  (name) => {
    const previous = createShapeStop(calendar, 0, "clip")
    previous.pathOverrides = [
      completePathOverride("0:1", undefined, { depthMultiplier: 0.35 }),
      completePathOverride("0:3", undefined, { depthMultiplier: 0.35 }),
    ]
    const icon = {
      ...calendar,
      id: name,
      name,
      svgContent: readFileSync(`components/3d/fixtures/${name}.svg`, "utf8"),
    }
    const [replacement] = replaceShapeIcon([previous], previous.id, icon)
    const group = buildSvgIconGroup({
      svgContent: replacement.svgContent,
      isIconA: true,
      props: {
        ...settings,
        materialPreset: "neon",
        pathOverridesA: replacement.pathOverrides,
        bevelEnabled: false,
        bevelSize: 0,
        bevelThickness: 0,
      },
      clipPlaneA: null,
      clipPlaneB: null,
    })
    try {
      const meshes = group.children as THREE.Mesh[]
      expect(meshes).toHaveLength(name === "high-density" ? 10 : 7)
      for (const mesh of meshes) {
        mesh.geometry.computeBoundingBox()
        const bounds = mesh.geometry
          .boundingBox!.clone()
          .translate(mesh.position)
        expect(bounds.max.z).toBeCloseTo(settings.extrusionDepth / 2, 5)
        expect(bounds.min.z).toBeCloseTo(-settings.extrusionDepth / 2, 5)
        expect(mesh.scale.toArray()).toEqual([1, 1, 1])
      }
    } finally {
      disposeObjectTree(group)
    }
  }
)

it.each([calendar, appendMaterialSymbolSlash(calendar)])(
  "keeps every dot of $name at the same depth before and after animated depth changes",
  (icon) => {
    const group = buildSvgIconGroup({
      svgContent: icon.svgContent,
      isIconA: true,
      props: settings,
      clipPlaneA: null,
      clipPlaneB: null,
    })
    try {
      const dots = group.children.filter((object) => {
        const mesh = object as THREE.Mesh
        mesh.geometry.computeBoundingBox()
        const size = mesh.geometry.boundingBox!.getSize(new THREE.Vector3())
        return size.x < 3 && size.y < 3
      }) as THREE.Mesh[]
      expect(dots).toHaveLength(6)
      for (const depth of [10, 18, 6]) {
        if (depth !== settings.extrusionDepth) {
          const update = planSvgGroupDepthUpdate(group, {
            ...settings,
            extrusionDepth: depth,
          })
          expect(update).not.toBeNull()
          update!()
        }
        const bounds = dots.map((mesh) =>
          mesh.geometry.boundingBox!.clone().translate(mesh.position)
        )
        const fronts = bounds.map((box) => box.max.z)
        const backs = bounds.map((box) => box.min.z)
        expect(Math.max(...fronts) - Math.min(...fronts)).toBeLessThan(1e-5)
        expect(Math.max(...backs) - Math.min(...backs)).toBeLessThan(1e-5)
      }
    } finally {
      disposeObjectTree(group)
    }
  }
)
