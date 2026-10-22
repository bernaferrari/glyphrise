"use client"

import { useMemo, type SetStateAction } from "react"
import type { EditorDocumentStore } from "./EditorDocumentStore"
import {
  type EditorSnapshot,
  type MotionTrackId,
  clampNumber,
  quantizeTimeToFrame,
} from "./EditorModel"
import { KEYFRAME_TIME_EPSILON } from "./EditorKeyframeModel"
import { PRESET_ICONS } from "./IconLibrary"
import { mapDocumentKeyframes } from "./KeyframeChannelModel"
import type { PlaybackClock } from "./PlaybackClock"
import {
  createTimelineKeyMoments,
  getAdjacentTimelineKeyMoments,
} from "./TimelineNavigationModel"
import {
  addPropertyRowKeyframe,
  clearPropertyRowKeyframes,
  duplicatePropertyRowKeyframe,
  movePropertyRowKeyframe,
  removePropertyRowKeyframe,
  setPropertyRowKeyframeEasing,
  type TimelinePropertyKeyframeValues,
} from "./TimelinePropertyKeyframeModel"
import { createTimelinePropertyRows } from "./TimelinePropertyRowsModel"
import { closeTimelineLoops, openLoopIds } from "./TimelineLoopModel"
import {
  clampTimelineDuration,
  scaleKeyframeTimes,
  scaleShapeStopTimes,
  scaleTimelineTime,
} from "./TimelineDurationModel"
import type { EasingType, ShapeStop, TimelineTrack } from "./TimelineModel"
import { TIMELINE_WIPE_DIRECTIONS } from "./timeline/TimelineWipeDirections"
import type { ShapeOption, TimelineProps } from "./timeline/TimelineTypes"

type TimelineDockControllerOptions = {
  store: EditorDocumentStore
  document: EditorSnapshot
  playback: {
    currentTime: number
    clock: PlaybackClock
    setCurrentTime: (time: number) => void
    seekToTime: (time: number, options?: { animated?: boolean }) => void
    cancelAnimatedSeek: () => void
    stopPlayback: () => void
    isPlaying: boolean
    isPreviewModelReady: boolean
    loop: boolean
    setLoop: (loop: boolean) => void
  }
  selection: {
    selectedMotionTrackId: MotionTrackId
    selectTimelineTrack: (trackId: string) => void
    selectTimelinePropertyRow: (rowId: string) => void
  }
  shapes: {
    sortedShapes: ShapeStop[]
    selectedShapeId: string | null
    setSelectedShapeId: (id: string | null) => void
    openShapePicker: string | null
    setOpenShapePicker: (id: string | null) => void
    setShapeIcon: (id: string, option: ShapeOption) => void
    setShapeWipePair: (
      id: string,
      enabled: ShapeOption,
      disabled: ShapeOption
    ) => void
    addShapeAtPlayhead: () => void
    removeShape: (id: string) => void
    triggerShapeUpload: (id: string) => void
  }
  /** Values new keyframes capture: what the inspector shows at the playhead. */
  activeValuesAt: (
    time: number
  ) => Omit<TimelinePropertyKeyframeValues, "duration">
}

/** The timeline dock: every keyframe, clip and duration edit it can make. */
export function useTimelineDockController({
  store,
  document,
  playback,
  selection,
  shapes,
  activeValuesAt,
}: TimelineDockControllerOptions) {
  const { duration, tracks } = document
  const { currentTime, clock, seekToTime } = playback

  /** A timeline edit, applied as one document change that leaves the recipe. */
  const edit = (patch: (current: EditorSnapshot) => Partial<EditorSnapshot>) =>
    store.patch({ ...patch(store.get()), activeRecipeId: null })

  const keyMoments = useMemo(
    () =>
      createTimelineKeyMoments({ ...document, shapes: shapes.sortedShapes }),
    [document, shapes.sortedShapes]
  )
  const { previousKeyMoment, nextKeyMoment } = getAdjacentTimelineKeyMoments({
    keyMoments,
    currentTime,
  })
  // During playback `currentTime` is where it started; jump from the frame shown.
  const adjacentKeyMoments = () =>
    getAdjacentTimelineKeyMoments({ keyMoments, currentTime: clock.get() })

  const propertyRows = useMemo(
    () => createTimelinePropertyRows(document),
    [document]
  )
  const openLoops = useMemo(() => openLoopIds(document), [document])

  const goToTime = (time: number) => {
    seekToTime(quantizeTimeToFrame(clampNumber(time, 0, duration)))
  }
  const frameTime = (time: number) =>
    quantizeTimeToFrame(clampNumber(time, 0, duration))

  const changeDuration = (value: number) => {
    const nextDuration = clampTimelineDuration(value)
    if (Math.abs(nextDuration - duration) < 0.001) return
    const ratio = nextDuration / duration
    edit((current) => ({
      duration: nextDuration,
      shapes: scaleShapeStopTimes(current.shapes, ratio, nextDuration),
      ...mapDocumentKeyframes(current, (keyframes) =>
        scaleKeyframeTimes(keyframes, ratio, nextDuration)
      ),
    }))
    playback.cancelAnimatedSeek()
    playback.stopPlayback()
    playback.setCurrentTime(
      scaleTimelineTime({ time: clock.get(), ratio, duration: nextDuration })
    )
  }

  // Without a time, key the frame on screen (it moves during playback).
  const addPropertyKeyframe = (rowId: string, time?: number) => {
    const at = time ?? clock.get()
    edit((current) =>
      addPropertyRowKeyframe(current, rowId, frameTime(at), {
        ...activeValuesAt(at),
        duration,
      })
    )
  }
  const removePropertyKeyframe = (rowId: string, keyframeId: string) =>
    edit((current) => removePropertyRowKeyframe(current, rowId, keyframeId))

  const togglePropertyKeyframe = (rowId: string, keyframeId?: string | null) =>
    keyframeId
      ? removePropertyKeyframe(rowId, keyframeId)
      : addPropertyKeyframe(rowId)

  const setShapes = (action: SetStateAction<ShapeStop[]>) =>
    edit((current) => ({
      shapes: typeof action === "function" ? action(current.shapes) : action,
    }))

  const timelineProps: TimelineProps = {
    duration,
    onDurationChange: changeDuration,
    currentTime,
    clock,
    onTimeChange: playback.setCurrentTime,
    onScrubStart: () => {
      playback.cancelAnimatedSeek()
      playback.stopPlayback()
    },
    isPlaying: playback.isPlaying,
    isPreviewLoading: !playback.isPreviewModelReady,
    loop: playback.loop,
    onLoopChange: playback.setLoop,
    tracks,
    onTracksChange: (nextTracks: TimelineTrack[]) =>
      edit(() => ({ tracks: nextTracks })),
    propertyRows,
    onClearTrackKeyframes: (trackId) =>
      edit((current) => ({
        tracks: current.tracks.map((track) =>
          track.id === trackId ? { ...track, keyframes: [] } : track
        ),
      })),
    onClearPropertyRow: (rowId) =>
      edit((current) => clearPropertyRowKeyframes(current, rowId)),
    openLoops,
    /** Ends one row or track (or everything) where it starts; see TimelineLoopModel. */
    onCloseLoops: (id) => {
      const changes = closeTimelineLoops(store.get(), duration, id)
      if (Object.keys(changes).length > 0) edit(() => changes)
    },
    onTogglePropertyKeyframe: togglePropertyKeyframe,
    onAddPropertyKeyframeAtTime: addPropertyKeyframe,
    onRemovePropertyKeyframe: removePropertyKeyframe,
    onMovePropertyKeyframe: (rowId, keyframeId, time) =>
      edit((current) =>
        movePropertyRowKeyframe(current, rowId, keyframeId, frameTime(time))
      ),
    onSetPropertyEasing: (rowId, keyframeId, easing: EasingType) =>
      edit((current) =>
        setPropertyRowKeyframeEasing(current, rowId, keyframeId, easing)
      ),
    onDuplicatePropertyKeyframe: (rowId, keyframeId, time) =>
      edit((current) =>
        duplicatePropertyRowKeyframe(
          current,
          rowId,
          keyframeId,
          frameTime(time)
        )
      ),
    activeTrackId: selection.selectedMotionTrackId,
    onActiveTrackChange: selection.selectTimelineTrack,
    onActivePropertyRowChange: selection.selectTimelinePropertyRow,
    shapes: document.shapes,
    selectedShapeId: shapes.selectedShapeId,
    onSelectShape: (id) => {
      shapes.setSelectedShapeId(id)
      const shape = document.shapes.find((candidate) => candidate.id === id)
      if (shape) seekToTime(shape.time, { animated: false })
    },
    onShapesChange: setShapes,
    onAddShape: shapes.addShapeAtPlayhead,
    onRemoveShape: shapes.removeShape,
    onShapeEasingChange: (id, easing) =>
      setShapes((current) =>
        current.map((shape) => (shape.id === id ? { ...shape, easing } : shape))
      ),
    shapeOptions: PRESET_ICONS,
    onShapeIconChange: shapes.setShapeIcon,
    onShapeWipePairChange: shapes.setShapeWipePair,
    onUploadShape: shapes.triggerShapeUpload,
    onShapeBlendChange: (shapeId, patch) =>
      setShapes((current) =>
        current.map((shape) =>
          shape.id === shapeId ? { ...shape, ...patch } : shape
        )
      ),
    openShapePicker: shapes.openShapePicker,
    onOpenShapePicker: shapes.setOpenShapePicker,
    wipeDirections: TIMELINE_WIPE_DIRECTIONS,
  }

  return {
    timelineProps,
    togglePropertyKeyframe,
    previousKeyMoment,
    nextKeyMoment,
    atTimelineStart: currentTime <= KEYFRAME_TIME_EPSILON,
    atTimelineEnd: currentTime >= duration - KEYFRAME_TIME_EPSILON,
    goToPreviousKeyMoment: () => {
      const { previousKeyMoment: previous } = adjacentKeyMoments()
      if (previous !== undefined) goToTime(previous)
    },
    goToNextKeyMoment: () => {
      const { nextKeyMoment: next } = adjacentKeyMoments()
      if (next !== undefined) goToTime(next)
    },
    goToEnd: () => goToTime(duration),
  }
}
