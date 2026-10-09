import React, { useMemo } from "react"
import {
  LightPosition,
  MaterialKeyframe,
  MaterialSettings,
  ScalarKeyframe,
  Vector3Keyframe,
  clampNumber,
  quantizeTimeToFrame,
} from "./EditorModel"
import {
  createTimelineKeyMoments,
  getAdjacentTimelineKeyMoments,
} from "./TimelineNavigationModel"
import { clearTrackKeyframes } from "./TimelineDockKeyframeModel"
import {
  addPropertyRowKeyframe,
  clearPropertyRowKeyframes,
  duplicatePropertyRowKeyframe,
  movePropertyRowKeyframe,
  removePropertyRowKeyframe,
  setPropertyRowKeyframeEasing,
} from "./TimelinePropertyKeyframeModel"
import type { TimelinePropertyKeyframeSetters } from "./TimelinePropertyKeyframeModel"
import { createTimelinePropertyRows } from "./TimelinePropertyRowsModel"
import {
  closeTimelineLoops,
  openLoopIds,
  type TimelineLoopState,
} from "./TimelineLoopModel"
import { KEYFRAME_TIME_EPSILON } from "./EditorKeyframeModel"
import {
  clampTimelineDuration,
  scaleShapeStopTimes,
  scaleTimelineKeyframeState,
  scaleTimelineTime,
  scaleTimelineTrackTimes,
} from "./TimelineDurationModel"
import type {
  EasingType,
  FillKeyframe,
  ShapeStop,
  TimelineTrack,
} from "./TimelineModel"

export function useTimelineDockController({
  currentTime,
  seekToTime,
  duration,
  setDuration,
  tracks,
  setTracks,
  sortedShapes,
  setShapes,
  fillKeyframes,
  setFillKeyframes,
  materialKeyframes,
  setMaterialKeyframes,
  keyLightPositionKeyframes,
  setKeyLightPositionKeyframes,
  rotationAxisKeyframes,
  setRotationAxisKeyframes,
  moveKeyframes,
  setMoveKeyframes,
  qualityKeyframes,
  setQualityKeyframes,
  innerScaleKeyframes,
  setInnerScaleKeyframes,
  selectedShapeFillStops,
  selectedShapeGradientType,
  activeMaterialSettings,
  activeKeyLightPosition,
  activeRotationOffset,
  activeMoveOffset,
  markCustom,
}: {
  currentTime: number
  seekToTime: (time: number, options?: { animated?: boolean }) => void
  duration: number
  setDuration: React.Dispatch<React.SetStateAction<number>>
  tracks: TimelineTrack[]
  setTracks: React.Dispatch<React.SetStateAction<TimelineTrack[]>>
  sortedShapes: ShapeStop[]
  setShapes: React.Dispatch<React.SetStateAction<ShapeStop[]>>
  fillKeyframes: FillKeyframe[]
  setFillKeyframes: React.Dispatch<React.SetStateAction<FillKeyframe[]>>
  materialKeyframes: MaterialKeyframe[]
  setMaterialKeyframes: React.Dispatch<React.SetStateAction<MaterialKeyframe[]>>
  keyLightPositionKeyframes: Vector3Keyframe[]
  setKeyLightPositionKeyframes: React.Dispatch<
    React.SetStateAction<Vector3Keyframe[]>
  >
  rotationAxisKeyframes: Vector3Keyframe[]
  setRotationAxisKeyframes: React.Dispatch<
    React.SetStateAction<Vector3Keyframe[]>
  >
  moveKeyframes: Vector3Keyframe[]
  setMoveKeyframes: React.Dispatch<React.SetStateAction<Vector3Keyframe[]>>
  qualityKeyframes: ScalarKeyframe[]
  setQualityKeyframes: React.Dispatch<React.SetStateAction<ScalarKeyframe[]>>
  innerScaleKeyframes: Vector3Keyframe[]
  setInnerScaleKeyframes: React.Dispatch<
    React.SetStateAction<Vector3Keyframe[]>
  >
  selectedShapeFillStops: FillKeyframe["stops"]
  selectedShapeGradientType: FillKeyframe["gradientType"]
  activeMaterialSettings: MaterialSettings
  activeKeyLightPosition: LightPosition
  activeRotationOffset: LightPosition
  activeMoveOffset: LightPosition
  markCustom: () => void
}) {
  const timelineKeyMoments = useMemo(
    () =>
      createTimelineKeyMoments({
        duration,
        shapes: sortedShapes,
        fillKeyframes,
        tracks,
        rotationAxisKeyframes,
        moveKeyframes,
        keyLightPositionKeyframes,
        materialKeyframes,
      }),
    [
      duration,
      sortedShapes,
      fillKeyframes,
      tracks,
      rotationAxisKeyframes,
      moveKeyframes,
      keyLightPositionKeyframes,
      materialKeyframes,
    ]
  )

  const timelinePropertyRows = useMemo(
    () =>
      createTimelinePropertyRows({
        fillKeyframes,
        materialKeyframes,
        keyLightPositionKeyframes,
        rotationAxisKeyframes,
        moveKeyframes,
        duration,
      }),
    [
      fillKeyframes,
      materialKeyframes,
      keyLightPositionKeyframes,
      rotationAxisKeyframes,
      moveKeyframes,
      duration,
    ]
  )

  const { previousKeyMoment, nextKeyMoment } = getAdjacentTimelineKeyMoments({
    keyMoments: timelineKeyMoments,
    currentTime,
  })

  const propertyKeyframeSetters = useMemo<TimelinePropertyKeyframeSetters>(
    () => ({
      setFillKeyframes,
      setMaterialKeyframes,
      setKeyLightPositionKeyframes,
      setRotationAxisKeyframes,
      setMoveKeyframes,
      setQualityKeyframes,
    }),
    [
      setFillKeyframes,
      setMaterialKeyframes,
      setKeyLightPositionKeyframes,
      setRotationAxisKeyframes,
      setMoveKeyframes,
      setQualityKeyframes,
    ]
  )

  const goToTime = (time: number) => {
    seekToTime(quantizeTimeToFrame(clampNumber(time, 0, duration)))
  }

  const handleDurationChange = (value: number) => {
    const nextDuration = clampTimelineDuration(value)
    if (Math.abs(nextDuration - duration) < 0.001) return

    const ratio = nextDuration / duration
    setDuration(nextDuration)
    setShapes((prev) => scaleShapeStopTimes(prev, ratio, nextDuration))
    setTracks((prev) => scaleTimelineTrackTimes(prev, ratio, nextDuration))
    scaleTimelineKeyframeState({
      ratio,
      duration: nextDuration,
      setters: {
        setFillKeyframes,
        setMaterialKeyframes,
        setKeyLightPositionKeyframes,
        setRotationAxisKeyframes,
        setMoveKeyframes,
        setQualityKeyframes,
        setInnerScaleKeyframes,
      },
    })
    seekToTime(
      scaleTimelineTime({ time: currentTime, ratio, duration: nextDuration }),
      { animated: false }
    )
    markCustom()
  }

  const loopState: TimelineLoopState = {
    tracks,
    fillKeyframes,
    materialKeyframes,
    keyLightPositionKeyframes,
    rotationAxisKeyframes,
    moveKeyframes,
    qualityKeyframes,
    innerScaleKeyframes,
  }
  const openLoops = useMemo(
    () =>
      openLoopIds({
        tracks,
        fillKeyframes,
        materialKeyframes,
        keyLightPositionKeyframes,
        rotationAxisKeyframes,
        moveKeyframes,
        qualityKeyframes,
        innerScaleKeyframes,
      }),
    [
      tracks,
      fillKeyframes,
      materialKeyframes,
      keyLightPositionKeyframes,
      rotationAxisKeyframes,
      moveKeyframes,
      qualityKeyframes,
      innerScaleKeyframes,
    ]
  )

  /** Ends one row or track (or everything) where it starts; see TimelineLoopModel. */
  const closeLoops = (id?: string) => {
    const changes = closeTimelineLoops(loopState, duration, id)
    if (Object.keys(changes).length === 0) return
    if (changes.tracks) setTracks(changes.tracks)
    if (changes.fillKeyframes) setFillKeyframes(changes.fillKeyframes)
    if (changes.materialKeyframes)
      setMaterialKeyframes(changes.materialKeyframes)
    if (changes.keyLightPositionKeyframes)
      setKeyLightPositionKeyframes(changes.keyLightPositionKeyframes)
    if (changes.rotationAxisKeyframes)
      setRotationAxisKeyframes(changes.rotationAxisKeyframes)
    if (changes.moveKeyframes) setMoveKeyframes(changes.moveKeyframes)
    if (changes.qualityKeyframes) setQualityKeyframes(changes.qualityKeyframes)
    if (changes.innerScaleKeyframes)
      setInnerScaleKeyframes(changes.innerScaleKeyframes)
    markCustom()
  }

  const clearTimelineTrackRow = (trackId: string) => {
    setTracks((prev) => clearTrackKeyframes(prev, trackId))
    markCustom()
  }

  const clearTimelinePropertyRow = (rowId: string) => {
    clearPropertyRowKeyframes(rowId, propertyKeyframeSetters)
    markCustom()
  }

  const removeTimelinePropertyKeyframe = (
    rowId: string,
    keyframeId: string
  ) => {
    removePropertyRowKeyframe(rowId, keyframeId, propertyKeyframeSetters)
    markCustom()
  }

  const addTimelinePropertyKeyframe = (rowId: string, time?: number) => {
    const keyframeTime = quantizeTimeToFrame(
      clampNumber(time ?? currentTime, 0, duration)
    )
    markCustom()
    addPropertyRowKeyframe(
      rowId,
      keyframeTime,
      {
        duration,
        selectedShapeFillStops,
        selectedShapeGradientType,
        activeMaterialSettings,
        activeKeyLightPosition,
        activeRotationOffset,
        activeMoveOffset,
      },
      propertyKeyframeSetters
    )
  }

  const toggleTimelinePropertyKeyframe = (
    rowId: string,
    keyframeId?: string | null
  ) => {
    if (keyframeId) {
      removeTimelinePropertyKeyframe(rowId, keyframeId)
      return
    }
    addTimelinePropertyKeyframe(rowId)
  }

  const moveTimelinePropertyKeyframe = (
    rowId: string,
    keyframeId: string,
    time: number
  ) => {
    const nextTime = quantizeTimeToFrame(clampNumber(time, 0, duration))
    movePropertyRowKeyframe(
      rowId,
      keyframeId,
      nextTime,
      propertyKeyframeSetters
    )
    markCustom()
  }

  const duplicateTimelinePropertyKeyframe = (
    rowId: string,
    keyframeId: string,
    time: number
  ) => {
    duplicatePropertyRowKeyframe(
      rowId,
      keyframeId,
      quantizeTimeToFrame(clampNumber(time, 0, duration)),
      propertyKeyframeSetters
    )
    markCustom()
  }

  const setTimelinePropertyEasing = (
    rowId: string,
    keyframeId: string | null,
    easing: EasingType
  ) => {
    setPropertyRowKeyframeEasing(
      rowId,
      keyframeId,
      easing,
      propertyKeyframeSetters
    )
    markCustom()
  }

  const setShapeBlend = (
    shapeId: string,
    patch: Partial<Pick<ShapeStop, "transitionType" | "wipeDirection">>
  ) => {
    markCustom()
    setShapes((prev) =>
      prev.map((shape) =>
        shape.id === shapeId ? { ...shape, ...patch } : shape
      )
    )
  }

  return {
    timelinePropertyRows,
    previousKeyMoment,
    nextKeyMoment,
    atTimelineStart: currentTime <= KEYFRAME_TIME_EPSILON,
    atTimelineEnd: currentTime >= duration - KEYFRAME_TIME_EPSILON,
    playbackProgress:
      duration > 0 ? clampNumber(currentTime / duration, 0, 1) : 0,
    goToPreviousKeyMoment: () => {
      if (previousKeyMoment !== undefined) goToTime(previousKeyMoment)
    },
    goToNextKeyMoment: () => {
      if (nextKeyMoment !== undefined) goToTime(nextKeyMoment)
    },
    goToEnd: () => goToTime(duration),
    handleDurationChange,
    handleTracksChange: (nextTracks: TimelineTrack[]) => {
      setTracks(nextTracks)
      markCustom()
    },
    clearTimelineTrackRow,
    clearTimelinePropertyRow,
    toggleTimelinePropertyKeyframe,
    removeTimelinePropertyKeyframe,
    addTimelinePropertyKeyframeAtTime: addTimelinePropertyKeyframe,
    moveTimelinePropertyKeyframe,
    setTimelinePropertyEasing,
    duplicateTimelinePropertyKeyframe,
    setShapeBlend,
    openLoops,
    closeLoops,
  }
}
