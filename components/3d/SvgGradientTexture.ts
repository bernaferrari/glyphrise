import * as THREE from "three"
import { createIconGradientSampler } from "./SvgColor"
import {
  gradeFinishSurfaceColor,
  type MaterialPresetId,
} from "./MaterialPresets"
import type { GradientStop, GradientType } from "./SvgTypes"

const TEXTURE_SIZE = 256
// Geometry changes do not change its fill. Retain a few immutable CPU images;
// each icon still owns its GPU texture and writable image buffer.
const MAX_BAKED_GRADIENTS = 16
const bakedGradients = new Map<string, Uint8Array>()
const groupTextures = new WeakMap<
  THREE.Group,
  { key: string; texture: THREE.DataTexture }
>()

/** All layers share a color map; recoloring updates it without rebuilding geometry. */
export const iconGradientTexture = (
  group: THREE.Group,
  type: GradientType,
  stops: GradientStop[],
  preset: MaterialPresetId = "satin"
) => {
  const key = JSON.stringify([type, stops, preset])
  let cached = groupTextures.get(group)
  if (cached?.key === key) return cached.texture
  const size = stops.every((stop) => stop.color === stops[0]?.color)
    ? 1
    : TEXTURE_SIZE
  // Texture dimensions are immutable once uploaded. Replace only when
  // switching between a uniform fill and a spatial gradient.
  if (cached && cached.texture.image.width !== size) {
    cached.texture.dispose()
    cached = undefined
  }
  if (!cached) {
    const texture = new THREE.DataTexture(
      new Uint8Array(size * size * 4),
      size,
      size
    )
    texture.name = "Icon gradient"
    texture.colorSpace = THREE.SRGBColorSpace
    texture.magFilter = THREE.LinearFilter
    texture.minFilter = THREE.LinearMipmapLinearFilter
    texture.generateMipmaps = true
    // glTF and DataTexture both use the stored image rows directly.
    texture.flipY = false
    texture.userData.glyphriseGradient = true
    cached = { key, texture }
    groupTextures.set(group, cached)
  }
  const data = cached.texture.image.data!
  let baked = bakedGradients.get(key)
  if (!baked) {
    baked = new Uint8Array(data.length)
    const sample = createIconGradientSampler(type, stops)
    const encoded = new THREE.Color()
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        encoded.copy(sample((x + 0.5) / size, (y + 0.5) / size))
        gradeFinishSurfaceColor(preset, encoded).convertLinearToSRGB()
        const offset = (y * size + x) * 4
        baked[offset] = Math.round(encoded.r * 255)
        baked[offset + 1] = Math.round(encoded.g * 255)
        baked[offset + 2] = Math.round(encoded.b * 255)
        baked[offset + 3] = 255
      }
    }
  }
  bakedGradients.delete(key)
  bakedGradients.set(key, baked)
  if (bakedGradients.size > MAX_BAKED_GRADIENTS) {
    bakedGradients.delete(bakedGradients.keys().next().value!)
  }
  data.set(baked)
  cached.key = key
  cached.texture.needsUpdate = true
  return cached.texture
}

export const clearIconGradientTexture = (group: THREE.Group) => {
  groupTextures.get(group)?.texture.dispose()
  groupTextures.delete(group)
}

/** Planar coordinates cover front, back, and bevels consistently across SVG paths. */
export const applyIconGradientUvs = (
  geometry: THREE.BufferGeometry,
  bounds: THREE.Box2
) => {
  const position = geometry.getAttribute("position")
  if (!position) return
  const width = Math.max(0.0001, bounds.max.x - bounds.min.x)
  const height = Math.max(0.0001, bounds.max.y - bounds.min.y)
  const uv = new Float32Array(position.count * 2)
  for (let i = 0; i < position.count; i++) {
    uv[i * 2] = (position.getX(i) - bounds.min.x) / width
    uv[i * 2 + 1] = (position.getY(i) - bounds.min.y) / height
  }
  geometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2))
  geometry.deleteAttribute("color")
  geometry.userData.iconGradientUvs = true
}
