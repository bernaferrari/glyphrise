import * as THREE from "three"
import {
  finishEmissiveIntensity,
  finishEnvMapIntensity,
  finishMetalness,
  isGraphiteCutPreset,
  type MaterialPresetId,
} from "./MaterialPresets"
import { gradientStopsFromFill } from "./SvgColor"
import {
  applyIconGradientUvs,
  clearIconGradientTexture,
  iconGradientTexture,
} from "./SvgGradientTexture"
import { ICON_VIEWBOX_SIZE } from "./SvgSceneUtils"
import { finiteNumber } from "./SvgGeometry"
import type { SvgCanvasProps } from "./SvgTypes"

export const updateGroupMaterialState = (
  group: THREE.Group | null,
  {
    opacity,
    clippingPlanes = null,
    transparent = opacity < 1,
  }: {
    opacity: number
    clippingPlanes?: THREE.Plane[] | null
    transparent?: boolean
  }
) => {
  if (!group) return
  const materialStateKey = `${Math.round(opacity * 1000)}:${
    transparent ? 1 : 0
  }:${clippingPlanes?.length ?? 0}`
  if (group.userData.materialStateKey === materialStateKey) return
  group.userData.materialStateKey = materialStateKey
  group.traverse((object) => {
    const mesh = object as THREE.Mesh
    if (!mesh.isMesh || !mesh.material || mesh.userData.wipeCap) return
    const materials = Array.isArray(mesh.material)
      ? mesh.material
      : [mesh.material]
    materials.forEach((material) => {
      const baseOpacity = finiteNumber(material.userData?.baseOpacity, 1)
      const baseTransparent = Boolean(material.userData?.baseTransparent)
      const nextOpacity = Math.max(0, Math.min(1, baseOpacity * opacity))
      const nextTransparent = baseTransparent || transparent || nextOpacity < 1
      const currentPlanes = material.clippingPlanes
      const nextPlaneCount = clippingPlanes?.length ?? 0
      const currentPlaneCount = currentPlanes?.length ?? 0
      const samePlanes =
        currentPlaneCount === nextPlaneCount &&
        (nextPlaneCount === 0 ||
          clippingPlanes?.every(
            (plane, index) => currentPlanes?.[index] === plane
          ))

      if (Math.abs(material.opacity - nextOpacity) > 0.0005) {
        material.opacity = nextOpacity
      }
      if (material.transparent !== nextTransparent) {
        material.transparent = nextTransparent
        material.needsUpdate = true
      }
      if (!samePlanes) {
        material.clippingPlanes = clippingPlanes
        material.clipShadows = nextPlaneCount > 0
        material.needsUpdate = true
      }
    })
  })
}

export const updateGroupMaterialSettings = (
  group: THREE.Group | null,
  {
    materialPreset,
    roughness,
    metalness,
    reflectance,
    clearcoat,
    clearcoatRoughness,
    transmission,
    thickness,
    emissiveIntensity,
    wireframe,
  }: Pick<
    SvgCanvasProps,
    | "roughness"
    | "metalness"
    | "reflectance"
    | "clearcoat"
    | "clearcoatRoughness"
    | "transmission"
    | "thickness"
    | "emissiveIntensity"
    | "wireframe"
  > & { materialPreset: MaterialPresetId }
) => {
  if (!group) return
  const envMapIntensity = finishEnvMapIntensity(materialPreset, reflectance)
  const presetMetalness = finishMetalness(materialPreset, metalness)
  const presetEmissive = finishEmissiveIntensity(
    materialPreset,
    emissiveIntensity
  )

  group.traverse((object) => {
    const mesh = object as THREE.Mesh
    if (!mesh.isMesh || !mesh.material) return
    const materials = Array.isArray(mesh.material)
      ? mesh.material
      : [mesh.material]

    materials.forEach((material) => {
      const writable = material as THREE.Material & {
        roughness?: number
        metalness?: number
        reflectivity?: number
        envMapIntensity?: number
        clearcoat?: number
        clearcoatRoughness?: number
        transmission?: number
        thickness?: number
        emissiveIntensity?: number
        wireframe?: boolean
      }
      let needsUpdate = false

      if (writable.roughness !== undefined) writable.roughness = roughness
      if (writable.metalness !== undefined) {
        writable.metalness = presetMetalness
      }
      if (writable.reflectivity !== undefined)
        writable.reflectivity = reflectance
      if (writable.envMapIntensity !== undefined) {
        writable.envMapIntensity = envMapIntensity
      }
      if (writable.clearcoat !== undefined) writable.clearcoat = clearcoat
      if (writable.clearcoatRoughness !== undefined) {
        writable.clearcoatRoughness = clearcoatRoughness
      }
      if (writable.transmission !== undefined)
        writable.transmission = transmission
      if (writable.thickness !== undefined) writable.thickness = thickness
      if (writable.emissiveIntensity !== undefined) {
        writable.emissiveIntensity = presetEmissive
      }
      const surfaceEmissiveUniform = material.userData
        ?.surfaceEmissiveUniform as { value?: number } | undefined
      if (surfaceEmissiveUniform) {
        surfaceEmissiveUniform.value = presetEmissive
      }
      if (writable.wireframe !== wireframe) {
        writable.wireframe = wireframe
        needsUpdate = true
      }
      if (needsUpdate) material.needsUpdate = true
    })
  })
}

export const updateGroupFillColors = (
  group: THREE.Group | null,
  {
    color,
    colorSecondary,
    colorStops,
    enableGradient,
    gradientType,
    materialPreset,
    emissiveIntensity,
  }: {
    color: string
    colorSecondary?: string
    colorStops?: SvgCanvasProps["colorAStops"]
    enableGradient?: boolean
    gradientType?: SvgCanvasProps["gradientType"]
    materialPreset: MaterialPresetId
    emissiveIntensity: number
  }
) => {
  if (!group) return
  const forceGraphiteCut = isGraphiteCutPreset(materialPreset)
  const useGradient = Boolean(enableGradient && !forceGraphiteCut)
  const stops = gradientStopsFromFill(
    colorStops,
    color,
    colorSecondary ?? color
  )
  const iconBounds = new THREE.Box2(
    new THREE.Vector2(0, 0),
    new THREE.Vector2(ICON_VIEWBOX_SIZE, ICON_VIEWBOX_SIZE)
  )

  const map = useGradient
    ? iconGradientTexture(
        group,
        gradientType ?? "linear",
        stops,
        materialPreset
      )
    : null
  if (!useGradient) clearIconGradientTexture(group)

  group.traverse((object) => {
    const mesh = object as THREE.Mesh
    if (!mesh.isMesh || !mesh.geometry || !mesh.material) return

    if (useGradient && !mesh.geometry.userData.iconGradientUvs) {
      applyIconGradientUvs(mesh.geometry, iconBounds)
    }

    const materials = Array.isArray(mesh.material)
      ? mesh.material
      : [mesh.material]
    materials.forEach((material) => {
      const writable = material as THREE.Material & {
        color?: THREE.Color
        emissive?: THREE.Color
        emissiveIntensity?: number
        vertexColors?: boolean
        map?: THREE.Texture | null
      }
      let needsUpdate = false
      if (
        writable.vertexColors !== undefined &&
        writable.vertexColors !== false
      ) {
        writable.vertexColors = false
        needsUpdate = true
      }
      if (writable.map !== undefined && writable.map !== map) {
        writable.map = map
        needsUpdate = true
      }
      if (writable.color) {
        writable.color.set(
          forceGraphiteCut ? "#2f3031" : useGradient ? "#ffffff" : color
        )
      }
      if (writable.emissive && emissiveIntensity > 0 && !useGradient) {
        writable.emissive.set(color)
      }
      if (needsUpdate) material.needsUpdate = true
    })
  })
}
