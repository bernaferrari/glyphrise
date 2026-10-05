import type { SvgCanvasProps } from "../3d/SvgTypes"
import type { EditorSnapshot } from "./EditorModel"
import { createInitialTimelineTracks } from "./PropertyRegistry"
import { evaluateMorphRenderState } from "./useMorphRenderState"
import { evaluateActiveTimelineValues } from "./useActiveTimelineValues"
import {
  interpolateMaterialKeyframes,
  interpolateLightPositionKeyframes,
} from "./KeyframeInterpolationModel"

/** Evaluate authored data without editor snapping or live interaction offsets. */
export function evaluateExportFrame(
  document: EditorSnapshot,
  time: number,
  studio: SvgCanvasProps
): SvgCanvasProps {
  const morph = evaluateMorphRenderState({ ...document, currentTime: time })
  const track = (id: string) =>
    document.tracks.find((t) => t.id === id) ??
    createInitialTimelineTracks().find((t) => t.id === id)!
  const active = evaluateActiveTimelineValues({
    ...document,
    currentTime: time,
    previewRotationOffset: null,
    extrusionTrack: track("extrusion"),
    scaleTrack: track("scale"),
    lightingTrack: track("lighting"),
  })
  const material = interpolateMaterialKeyframes(
    time,
    document.materialSettings,
    document.materialKeyframes
  )
  return {
    ...studio,
    ...material,
    materialPreset: document.materialPreset,
    iconAContent: morph.iconAContent,
    iconBContent: morph.iconBContent,
    colorA: morph.colorA,
    colorB: morph.renderColorB,
    colorASecondary: morph.renderColorASecondary,
    colorBSecondary: morph.renderColorBSecondary,
    colorAStops: morph.renderColorAStops,
    colorBStops: morph.renderColorBStops,
    enableGradient: morph.renderEnableGradient,
    gradientType: morph.renderGradientType,
    transitionType: morph.transitionType,
    transitionProgress: morph.activeTransitionProgress,
    wipeDirection: morph.wipeDirection,
    pathOverridesA: morph.morph.from.pathOverrides,
    pathOverridesB: morph.morph.to.pathOverrides,
    extrusionDepth: active.activeExtrusionDepth,
    geometryQuality: active.activeGeometryQuality,
    innerElementScale: active.activeInnerScale,
    layerSpacing: document.layerSpacing,
    bevelEnabled: document.bevelEnabled,
    bevelThickness: document.bevelThickness,
    bevelSize: document.bevelSize,
    bevelSegments: document.bevelSegments,
    rotationOffset: active.activeRotationOffset,
    objectScale: active.activeObjectScale,
    objectScaleAxes: document.objectScaleAxes,
    moveOffset: active.activeMoveOffset,
    keyLightIntensity: active.activeKeyLightIntensity,
    keyLightColor: document.keyLightColor,
    keyLightSoftness: document.keyLightSoftness,
    keyLightPosition: interpolateLightPositionKeyframes(
      time,
      document.keyLightPosition,
      document.keyLightPositionKeyframes
    ),
    isPlaying: false,
  }
}

/** [0, duration): no duplicated loop endpoint; a final partial frame fills the interval. */
export function videoFrameSchedule(duration: number, fps: number) {
  return Array.from({ length: Math.ceil(duration * fps) }, (_, index) => ({
    time: index / fps,
    duration: Math.min(1 / fps, duration - index / fps),
  }))
}
