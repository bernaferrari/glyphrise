import * as THREE from "three"
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js"
import type { GradientStop, SvgCanvasProps } from "./SvgTypes"

export const MODEL_SCALE = 0.12
export const ICON_VIEWBOX_SIZE = 24
export const DEFAULT_VIEWPORT_FRACTION = 0.5
export const CAMERA_FOV = 40
export const MAX_BEVEL_SEGMENTS = 24
export const GIZMO_SNAP_DEGREES = 45
export const SVG_PATH_LAYER_GAP_RATIO = 0.018
export const SVG_PATH_LAYER_GAP_MIN = 0.035
// The slash of an "off" icon is a solid part of the icon, centred like every
// other shape and a touch deeper, so it reads on top from front and back.
export const GLYPHRISE_SLASH_DEPTH_RATIO = 1.08
export const WIPE_SEAM_OVERLAP_WORLD = 0.8 * MODEL_SCALE

export const pathRebuildSignature = (
  overrides: SvgCanvasProps["pathOverridesA"]
) =>
  JSON.stringify(
    (overrides ?? [])
      .map(({ id, visible, color, depthMultiplier, scale }) => ({
        id,
        visible,
        color,
        depthMultiplier,
        scale,
      }))
      .sort((a, b) => a.id.localeCompare(b.id))
  )

export const gradientStopsSignature = (stops: GradientStop[] | undefined) =>
  (stops ?? [])
    .map(
      (stop) =>
        `${stop.color}:${Number(stop.position).toFixed(3)}` +
        // Moved mesh points must recolor too.
        (stop.x !== undefined || stop.y !== undefined
          ? `@${Number(stop.x ?? 0).toFixed(3)},${Number(stop.y ?? 0).toFixed(3)}`
          : "")
    )
    .join("|")

export const applySvgModelScale = (group: THREE.Group) => {
  group.scale.set(MODEL_SCALE, -MODEL_SCALE, MODEL_SCALE)
}

export const framedCameraDistance = (camera: THREE.PerspectiveCamera) => {
  const smallerViewportAxis = Math.max(0.2, Math.min(1, camera.aspect))
  const iconWorldSize = ICON_VIEWBOX_SIZE * MODEL_SCALE
  const targetVisibleWorldSize = iconWorldSize / DEFAULT_VIEWPORT_FRACTION
  const visibleWorldPerDistance =
    2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * smallerViewportAxis
  return targetVisibleWorldSize / visibleWorldPerDistance
}

export const disposeObjectTree = (object: THREE.Object3D | null) => {
  const textures = new Set<THREE.Texture>()
  object?.traverse((child) => {
    const mesh = child as THREE.Mesh
    const line = child as THREE.LineSegments
    if (!mesh.isMesh && !line.isLineSegments) return
    const renderable = child as THREE.Mesh | THREE.LineSegments
    renderable.geometry?.dispose()
    const materials = Array.isArray(renderable.material)
      ? renderable.material
      : [renderable.material]
    materials.forEach((material) => {
      const map = (material as THREE.MeshStandardMaterial).map
      if (map?.userData.glyphriseGradient) textures.add(map)
      material.dispose()
    })
  })
  textures.forEach((texture) => texture.dispose())
}

/**
 * three.js's neutral studio room, prefiltered for image-based lighting. It
 * gives every finish soft, colorless fill and clean softbox reflections.
 */
export const createStudioEnvironment = (renderer: THREE.WebGLRenderer) => {
  const pmrem = new THREE.PMREMGenerator(renderer)
  const room = new RoomEnvironment()
  const { texture } = pmrem.fromScene(room, 0.04)
  room.dispose()
  pmrem.dispose()
  return texture
}
