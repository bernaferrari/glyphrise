import type { SvgCanvasProps } from "../3d/SvgTypes"
import type { EditorSnapshot, Vec3 } from "./EditorModel"
import { scalarTimelineTracks } from "./PropertyRegistry"
import {
  evaluateMorphRenderState,
  prepareMorphRenderState,
} from "./useMorphRenderState"
import { evaluateActiveTimelineValues } from "./useActiveTimelineValues"
import {
  interpolateMaterialKeyframes,
  interpolateLightPositionKeyframes,
} from "./KeyframeInterpolationModel"

export type DocumentFrame = Omit<
  SvgCanvasProps,
  | "wireframe"
  | "isPlaying"
  | "ambientColor"
  | "ambientIntensity"
  | "rimLightColor"
  | "rimLightIntensity"
  | "zoom"
  | `on${string}`
  | `show${string}`
  | "viewInertiaEnabled"
  | "selectedLayerId"
  | "selectedIconColorRole"
>

/**
 * What the canvas draws for `document` at `time`. The same evaluation feeds
 * the live preview, playback, and every export, so they cannot drift apart.
 * Preparation (sorting clips, preparing fill keyframes) happens once per
 * document; evaluating a frame is then cheap enough to run every frame.
 */
export function createDocumentFrameEvaluator(document: EditorSnapshot) {
  const preparation = prepareMorphRenderState(
    document.shapes,
    document.fillKeyframes
  )
  const tracks = scalarTimelineTracks(document.tracks)

  return (
    time: number,
    previewRotationOffset: Vec3 | null = null
  ): DocumentFrame => {
    const morph = evaluateMorphRenderState(
      { ...document, currentTime: time },
      preparation
    )
    const active = evaluateActiveTimelineValues({
      ...document,
      ...tracks,
      currentTime: time,
      previewRotationOffset,
    })
    return {
      ...interpolateMaterialKeyframes(
        time,
        document.materialSettings,
        document.materialKeyframes
      ),
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
      exportAnimation: {
        duration: document.duration,
        tracks: document.tracks,
        extrusionDepth: active.activeExtrusionDepth,
        rotationOffset: document.rotationOffset,
        rotationAxisKeyframes: document.rotationAxisKeyframes,
        objectScale: document.objectScale,
        objectScaleAxes: document.objectScaleAxes,
        moveOffset: document.moveOffset,
        moveKeyframes: document.moveKeyframes,
      },
    }
  }
}

/** Evaluate authored data without editor snapping or live interaction offsets. */
export function evaluateExportFrame(
  document: EditorSnapshot,
  time: number,
  studio: SvgCanvasProps
): SvgCanvasProps {
  return {
    ...studio,
    ...createDocumentFrameEvaluator(document)(time),
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
