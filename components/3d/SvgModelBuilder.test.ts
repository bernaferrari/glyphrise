// @vitest-environment happy-dom
import * as THREE from "three"
import { expect, it } from "vitest"
import { appendMaterialSymbolSlash, PRESET_ICONS } from "../editor/IconLibrary"
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
