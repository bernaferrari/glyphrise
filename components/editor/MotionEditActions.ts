import type { RefObject } from "react"
import type { SvgCanvasRef } from "../3d/SvgCanvas"
import type { EditorDocumentStore } from "./EditorDocumentStore"
import {
  type LightPosition,
  type MotionTrackId,
  SCALE_DEFAULT,
  clampNumber,
} from "./EditorModel"
import {
  clampRotation,
  editMove,
  editQuality,
  editRotation,
  editScalarTrack,
  editScaleAxis,
  type ScalarTrackId,
} from "./DocumentEditModel"

export type MotionEditActionsOptions = {
  store: EditorDocumentStore
  currentTime: number
  isPlaying: boolean
  /** The values shown at `currentTime`. */
  activeRotationOffset: LightPosition
  activeObjectScale: number
  activeMoveOffset: LightPosition
  setSelectedMotionTrackId: (trackId: MotionTrackId) => void
  setPreviewRotationOffset: (rotation: LightPosition | null) => void
  setIsScaleLocked: (locked: boolean) => void
  canvas3DRef: RefObject<SvgCanvasRef | null>
}

/**
 * Depth, transform, brightness and smoothness edits at `currentTime`, from the
 * inspector and the canvas.
 */
export function createMotionEditActions({
  store,
  currentTime,
  isPlaying,
  activeRotationOffset,
  activeObjectScale,
  activeMoveOffset,
  setSelectedMotionTrackId,
  setPreviewRotationOffset,
  setIsScaleLocked,
  canvas3DRef,
}: MotionEditActionsOptions) {
  const setTrackValue = (trackId: ScalarTrackId, value: number) => {
    setSelectedMotionTrackId(trackId)
    store.patch(editScalarTrack(store.get(), trackId, value, currentTime))
  }
  const handleScaleChange = (value: number) => setTrackValue("scale", value)

  const applyRotation = (rotation: LightPosition) => {
    setSelectedMotionTrackId("rotation")
    setPreviewRotationOffset(null)
    store.patch(editRotation(store.get(), clampRotation(rotation), currentTime))
  }

  /** Drags and momentum preview without an edit until `commit` isn't false. */
  const handleViewRotationSet = (
    target: Partial<LightPosition>,
    options: { commit?: boolean; updateTimeline?: boolean } = {}
  ) => {
    const rotation = clampRotation({ ...activeRotationOffset, ...target })
    if (options.updateTimeline === false || options.commit === false) {
      setPreviewRotationOffset(rotation)
      return
    }
    applyRotation(rotation)
  }

  const applyMove = (move: LightPosition) =>
    store.patch(editMove(store.get(), move, currentTime))

  return {
    handleDepthChange: (value: number) => setTrackValue("extrusion", value),
    handleScaleChange,
    handleBrightnessChange: (value: number) => setTrackValue("lighting", value),
    handleScaleAxisChange: (axis: keyof LightPosition, value: number) => {
      setSelectedMotionTrackId("scale")
      setIsScaleLocked(false)
      store.patch(editScaleAxis(store.get(), axis, value))
    },
    handleRotationAxisChange: (axis: keyof LightPosition, value: number) =>
      applyRotation({ ...activeRotationOffset, [axis]: value }),
    handleViewRotationCommit: (delta: LightPosition) =>
      applyRotation({
        x: activeRotationOffset.x + delta.x,
        y: activeRotationOffset.y + delta.y,
        z: activeRotationOffset.z + delta.z,
      }),
    handleViewRotationSet,
    updateMoveAxis: (axis: keyof LightPosition, value: number) => {
      setSelectedMotionTrackId("move")
      applyMove({
        ...activeMoveOffset,
        [axis]: clampNumber(value, -100, 100),
      })
    },
    updateQuality: (value: number) =>
      store.patch(editQuality(store.get(), value, currentTime)),
    resetView: () => {
      canvas3DRef.current?.resetRotation()
      // The sampled playback pose is not an authored edit.
      if (isPlaying) return
      if (Object.values(activeRotationOffset).some((value) => value !== 0))
        handleViewRotationSet({ x: 0, y: 0, z: 0 })
      if (Object.values(activeMoveOffset).some((value) => value !== 0))
        applyMove({ x: 0, y: 0, z: 0 })
      if (activeObjectScale !== SCALE_DEFAULT) handleScaleChange(SCALE_DEFAULT)
      const { objectScaleAxes } = store.get()
      if (
        Object.values(objectScaleAxes).some((value) => value !== SCALE_DEFAULT)
      )
        store.patch({
          activeRecipeId: null,
          objectScaleAxes: {
            x: SCALE_DEFAULT,
            y: SCALE_DEFAULT,
            z: SCALE_DEFAULT,
          },
        })
    },
  }
}

export type MotionEditActions = ReturnType<typeof createMotionEditActions>
