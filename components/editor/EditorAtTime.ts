import type { RefObject } from "react"
import type { SvgCanvasRef } from "../3d/SvgCanvas"
import type { EditorDocumentStore } from "./EditorDocumentStore"
import type {
  EditorSnapshot,
  LightPosition,
  MotionTrackId,
} from "./EditorModel"
import { findKeyframeAtTime } from "./EditorKeyframeModel"
import { createFillEditActions } from "./FillEditActions"
import {
  interpolateLightPositionKeyframes,
  interpolateMaterialKeyframes,
} from "./KeyframeInterpolationModel"
import { createLightEditActions } from "./LightEditActions"
import { createMaterialEditActions } from "./MaterialEditActions"
import { createMotionEditActions } from "./MotionEditActions"
import type { scalarTimelineTracks } from "./PropertyRegistry"
import { evaluateActiveTimelineValues } from "./useActiveTimelineValues"
import {
  evaluateMorphRenderState,
  type MorphPreparation,
} from "./useMorphRenderState"

export type EditorAtTimeContext = {
  store: EditorDocumentStore
  document: EditorSnapshot
  /** Clip order and fill keyframes, prepared once per document. */
  preparation: MorphPreparation
  scalarTracks: ReturnType<typeof scalarTimelineTracks>
  previewRotationOffset: LightPosition | null
  isPlaying: boolean
  setSelectedMotionTrackId: (trackId: MotionTrackId) => void
  setPreviewRotationOffset: (rotation: LightPosition | null) => void
  setIsScaleLocked: (locked: boolean) => void
  canvas3DRef: RefObject<SvgCanvasRef | null>
}

/**
 * The editor at `time`: every animated value shown there, and the edits that
 * key that moment. The inspector is built from this at the moving playhead,
 * so it follows playback; edits made mid-playback key the frame on screen.
 */
export function createEditorAtTime(context: EditorAtTimeContext, time: number) {
  const { store, document, scalarTracks } = context
  const morph = evaluateMorphRenderState(
    { ...document, currentTime: time },
    context.preparation
  )
  const active = evaluateActiveTimelineValues({
    ...document,
    ...scalarTracks,
    currentTime: time,
    previewRotationOffset: context.previewRotationOffset,
  })
  const activeMaterialSettings = interpolateMaterialKeyframes(
    time,
    document.materialSettings,
    document.materialKeyframes
  )
  const activeKeyLightPosition = interpolateLightPositionKeyframes(
    time,
    document.keyLightPosition,
    document.keyLightPositionKeyframes
  )
  return {
    time,
    ...morph,
    ...active,
    activeMaterialSettings,
    activeKeyLightPosition,
    lightPositionIsKeyed: Boolean(
      findKeyframeAtTime(document.keyLightPositionKeyframes, time)
    ),
    fill: createFillEditActions({ store, currentTime: time }),
    material: createMaterialEditActions({
      store,
      currentTime: time,
      activeMaterialSettings,
    }),
    light: createLightEditActions({
      store,
      currentTime: time,
      activeKeyLightPosition,
    }),
    motion: createMotionEditActions({
      store,
      currentTime: time,
      isPlaying: context.isPlaying,
      activeRotationOffset: active.activeRotationOffset,
      activeObjectScale: active.activeObjectScale,
      activeMoveOffset: active.activeMoveOffset,
      setSelectedMotionTrackId: context.setSelectedMotionTrackId,
      setPreviewRotationOffset: context.setPreviewRotationOffset,
      setIsScaleLocked: context.setIsScaleLocked,
      canvas3DRef: context.canvas3DRef,
    }),
  }
}

export type EditorAtTime = ReturnType<typeof createEditorAtTime>
