import type { MaterialPresetId } from "../3d/MaterialPresets"
import type { DocumentFrame } from "./EditorFrameModel"
import type {
  EditorSnapshot,
  LightPosition,
  MaterialKeyframe,
  MaterialSettings,
  Vector3Keyframe,
} from "./EditorModel"
import type { FillKeyframe, ShapeStop, TimelineTrack } from "./TimelineModel"

export interface ExportSceneSnapshot {
  duration: number
  materialPreset: MaterialPresetId
  colorA: string
  colorB: string
  fillKeyframes: FillKeyframe[]
  materialSettings: MaterialSettings
  materialKeyframes: MaterialKeyframe[]
  roughness: number
  metalness: number
  reflectance: number
  clearcoat: number
  clearcoatRoughness: number
  transmission: number
  thickness: number
  emissiveIntensity: number
  extrusionDepth: number
  bevelEnabled: boolean
  bevelThickness: number
  bevelSize: number
  bevelSegments: number
  layerSpacing: number
  ambientIntensity: number
  keyLightIntensity: number
  rimLightIntensity: number
  svgPathA: string
  svgPathB: string
  shapes: ShapeStop[]
  tracks: TimelineTrack[]
  rotationOffset: LightPosition
  rotationAxisKeyframes: Vector3Keyframe[]
  objectScale: number
  objectScaleAxes: LightPosition
  moveOffset: LightPosition
  moveKeyframes: Vector3Keyframe[]
  keyLightPosition: LightPosition
  keyLightPositionKeyframes: Vector3Keyframe[]
}

/** The scene code exports describe: the document, posed at the playhead. */
export const createExportSceneSnapshot = (
  document: EditorSnapshot,
  frame: DocumentFrame,
  studio: { ambientIntensity: number; rimLightIntensity: number }
): ExportSceneSnapshot => ({
  duration: document.duration,
  materialPreset: document.materialPreset,
  colorA: frame.colorA,
  colorB: frame.colorB,
  fillKeyframes: document.fillKeyframes,
  materialSettings: {
    roughness: frame.roughness,
    metalness: frame.metalness,
    reflectance: frame.reflectance,
    clearcoat: frame.clearcoat,
    clearcoatRoughness: frame.clearcoatRoughness,
    transmission: frame.transmission,
    thickness: frame.thickness,
    emissiveIntensity: frame.emissiveIntensity,
  },
  materialKeyframes: document.materialKeyframes,
  roughness: frame.roughness,
  metalness: frame.metalness,
  reflectance: frame.reflectance,
  clearcoat: frame.clearcoat,
  clearcoatRoughness: frame.clearcoatRoughness,
  transmission: frame.transmission,
  thickness: frame.thickness,
  emissiveIntensity: frame.emissiveIntensity,
  extrusionDepth: frame.extrusionDepth,
  bevelEnabled: document.bevelEnabled,
  bevelThickness: document.bevelThickness,
  bevelSize: document.bevelSize,
  bevelSegments: document.bevelSegments,
  layerSpacing: document.layerSpacing,
  ambientIntensity: studio.ambientIntensity,
  keyLightIntensity: frame.keyLightIntensity,
  rimLightIntensity: studio.rimLightIntensity,
  svgPathA: frame.iconAContent,
  svgPathB: frame.iconBContent,
  shapes: document.shapes,
  tracks: document.tracks,
  rotationOffset: document.rotationOffset,
  rotationAxisKeyframes: document.rotationAxisKeyframes,
  objectScale: document.objectScale,
  objectScaleAxes: document.objectScaleAxes,
  moveOffset: document.moveOffset,
  moveKeyframes: document.moveKeyframes,
  keyLightPosition: frame.keyLightPosition,
  keyLightPositionKeyframes: document.keyLightPositionKeyframes,
})
