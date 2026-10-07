import * as THREE from "three"
import {
  safeShapeExtrudeSettings,
  svgExtrudeBaseSettings,
  type SafeShapeExtrudeSettings,
} from "./SvgExtrudeSettings"
import { invalidateGroupGeometryAnalysis } from "./SvgGeometryAnalysis"
import {
  GLYPHRISE_SLASH_DEPTH_RATIO,
  GLYPHRISE_SLASH_FORWARD_RATIO,
  SVG_PATH_LAYER_GAP_MIN,
  SVG_PATH_LAYER_GAP_RATIO,
} from "./SvgSceneUtils"
import { finiteNumber } from "./SvgGeometry"
import { updateLayerOutlineDepth } from "./SvgRenderHelpers"
import type { SvgCanvasProps } from "./SvgTypes"

export type SvgDepthLayer = {
  mesh: THREE.Mesh
  shape: THREE.Shape
  shapeSize: THREE.Vector2
  depthMultiplier: number
  isSlashOverlay: boolean
  pathIndex: number
  extrude: SafeShapeExtrudeSettings
}
const groupDepths = new WeakMap<
  THREE.Group,
  { pathCount: number; layers: SvgDepthLayer[] }
>()
export const registerSvgGroupDepth = (
  group: THREE.Group,
  pathCount: number,
  layers: SvgDepthLayer[]
) => {
  groupDepths.set(group, { pathCount, layers })
}

/** Move the front/back halves without altering the bevel or reallocating GPU resources.
 * Validate every layer before committing; depth-dependent bevels and carved roofs rebuild. */
export const planSvgGroupDepthUpdate = (
  group: THREE.Group,
  props: SvgCanvasProps
): (() => void) | null => {
  const stored = groupDepths.get(group)
  const base = svgExtrudeBaseSettings(props)
  if (!stored || base.crownEnabled) return null
  const gap =
    stored.pathCount > 1
      ? Math.max(
          SVG_PATH_LAYER_GAP_MIN,
          base.depth * SVG_PATH_LAYER_GAP_RATIO,
          finiteNumber(props.layerSpacing, 0) * 0.06
        )
      : 0
  const plans: Array<{
    layer: SvgDepthLayer
    extrude: SafeShapeExtrudeSettings
    offset: number
  }> = []
  for (const layer of stored.layers) {
    const extrude = safeShapeExtrudeSettings({
      shape: layer.shape,
      shapeSize: layer.shapeSize,
      base,
      depthMultiplier: layer.depthMultiplier,
      bevelEnabled: props.bevelEnabled,
      slashDepthRatio: GLYPHRISE_SLASH_DEPTH_RATIO,
      isSlashOverlay: layer.isSlashOverlay,
    })
    if (
      extrude.bevelEnabled !== layer.extrude.bevelEnabled ||
      extrude.bevelSize !== layer.extrude.bevelSize ||
      extrude.bevelThickness !== layer.extrude.bevelThickness ||
      extrude.bevelSegments !== layer.extrude.bevelSegments
    )
      return null
    const offset = layer.isSlashOverlay
      ? base.depth / 2 +
        extrude.shapeDepth / 2 +
        gap +
        base.depth * GLYPHRISE_SLASH_FORWARD_RATIO
      : layer.pathIndex * gap
    plans.push({ layer, extrude, offset })
  }
  return () => {
    for (const { layer, extrude, offset } of plans) {
      const { mesh } = layer
      const delta = (extrude.shapeDepth - layer.extrude.shapeDepth) / 2
      const positions = mesh.geometry.getAttribute("position")
      if (delta !== 0) {
        if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox()
        if (!mesh.geometry.boundingSphere) mesh.geometry.computeBoundingSphere()
        const bounds = mesh.geometry.boundingBox!
        const sphere = mesh.geometry.boundingSphere!
        const values = positions.array
        let radiusSquared = 0
        // XY and the symmetric center stay fixed. Update Z and the exact
        // bounding radius in one pass instead of scanning the vertices three times.
        for (let offset = 0; offset < values.length; offset += 3) {
          const z = values[offset + 2]
          values[offset + 2] = z + (z < 0 ? -delta : delta)
          const x = values[offset] - sphere.center.x
          const y = values[offset + 1] - sphere.center.y
          const nextZ = values[offset + 2] - sphere.center.z
          radiusSquared = Math.max(radiusSquared, x * x + y * y + nextZ * nextZ)
        }
        bounds.min.z -= delta
        bounds.max.z += delta
        sphere.radius = Math.sqrt(radiusSquared)
        positions.needsUpdate = true
        updateLayerOutlineDepth(mesh, delta)
      }
      const positionDelta = offset - mesh.position.z
      mesh.position.z = offset
      // These cached origins drive subsequent per-layer/inner scaling.
      for (const key of ["innerScaleBasePosition", "layerScaleBasePosition"]) {
        const origin = mesh.userData[key] as THREE.Vector3 | undefined
        if (origin) origin.z += positionDelta
      }
      mesh.updateMatrix()
      layer.extrude = extrude
    }
    invalidateGroupGeometryAnalysis(group)
  }
}
