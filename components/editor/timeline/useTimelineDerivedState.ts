import { useCallback, useMemo } from "react"
import {
  DEFAULT_TRANSITION_END,
  DEFAULT_TRANSITION_START,
  ShapeStop,
  TimelinePropertyRow,
  TimelineTrack,
} from "../TimelineModel"
import {
  KeyMomentTimeOptions,
  collectKeyMomentTimes,
  computeTransitionWindows,
  computeShapeClipBounds,
} from "./TimelineLayoutModel"
import { TIMELINE_FRAME_SNAP_ZOOM } from "./TimelineGeometry"
import type { ShapeOption } from "./TimelineTypes"

export const useTimelineDerivedState = ({
  duration,
  timelineZoom,
  shapes,
  tracks,
  propertyRows,
  shapeOptions,
  activeTrackId,
}: {
  duration: number
  timelineZoom: number
  shapes: ShapeStop[]
  tracks: TimelineTrack[]
  propertyRows: TimelinePropertyRow[]
  shapeOptions: ShapeOption[]
  activeTrackId?: string | null
}) => {
  const sortedShapes = useMemo(
    () => [...shapes].sort((a, b) => a.time - b.time),
    [shapes]
  )
  const visiblePropertyRows = useMemo(
    () => propertyRows.filter((row) => row.keyframes.length > 0),
    [propertyRows]
  )
  const visibleTracks = useMemo(
    () =>
      tracks.filter(
        (track) => track.keyframes.length > 0 || track.id === activeTrackId
      ),
    [activeTrackId, tracks]
  )
  const hiddenTracks = useMemo(
    () => tracks.filter((track) => !visibleTracks.includes(track)),
    [tracks, visibleTracks]
  )
  const frameSnapActive = timelineZoom >= TIMELINE_FRAME_SNAP_ZOOM - 0.001

  const transitionWindows = useMemo(
    () =>
      computeTransitionWindows(
        sortedShapes,
        DEFAULT_TRANSITION_START,
        DEFAULT_TRANSITION_END
      ),
    [sortedShapes]
  )
  const clipBounds = useMemo(
    () => computeShapeClipBounds(sortedShapes, transitionWindows, duration),
    [duration, transitionWindows, sortedShapes]
  )

  const keyMomentTimes = useCallback(
    (options: KeyMomentTimeOptions = {}) =>
      collectKeyMomentTimes({
        duration,
        transitionWindows,
        shapes,
        tracks,
        propertyRows: visiblePropertyRows,
        ...options,
      }),
    [duration, transitionWindows, shapes, tracks, visiblePropertyRows]
  )

  const baseKeyMomentTimes = useMemo(() => keyMomentTimes(), [keyMomentTimes])

  const shapeLabel = useCallback(
    (stop: ShapeStop) =>
      stop.iconName ??
      shapeOptions.find((option) => option.id === stop.iconId)?.name ??
      "Custom",
    [shapeOptions]
  )

  return {
    sortedShapes,
    visiblePropertyRows,
    visibleTracks,
    hiddenTracks,
    frameSnapActive,
    transitionWindows,
    clipBounds,
    keyMomentTimes,
    baseKeyMomentTimes,
    shapeLabel,
  }
}
