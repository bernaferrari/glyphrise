"use client"

import { moveShapeOrder, moveShapeStop } from "./TimelineShapeModel"
import { withStarterAnimation } from "./StarterTrackModel"

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import type { SelectedTimelineKeyframe, TimelineProps } from "./TimelineTypes"
import { useShapePickerCatalog } from "./useShapePickerCatalog"
import { useTimelineContextMenu } from "./useTimelineContextMenu"
import { useTimelineKeyframeShortcuts } from "./useTimelineKeyframeShortcuts"
import { useTimelineDeletion } from "./useTimelineDeletion"
import { useTimelineDerivedState } from "./useTimelineDerivedState"
import { useTimelinePlayheadFollow } from "./useTimelinePlayheadFollow"
import { useTimelinePinchZoom } from "./useTimelinePinchZoom"
import { useTimelineRailScrollSync } from "./useTimelineRailScrollSync"
import { useTimelineScrubbing } from "./useTimelineScrubbing"
import { useTimelineSelectionGuards } from "./useTimelineSelectionGuards"
import { useTimelineShapeDrag } from "./useTimelineShapeDrag"
import { useTimelineTrackKeyframes } from "./useTimelineTrackKeyframes"
import { useTimelineViewportState } from "./useTimelineViewportState"
import { useTimelineZoomAndDuration } from "./useTimelineZoomAndDuration"

export function useTimelineController({
  duration,
  onDurationChange,
  currentTime,
  onTimeChange,
  onScrubStart,
  isPlaying = false,
  isPreviewLoading = false,
  loop,
  onLoopChange,
  compactMode = false,
  playback,
  onApplyMotionPreset,
  presetArtwork,
  tracks,
  onTracksChange,
  propertyRows = [],
  onClearTrackKeyframes,
  onClearPropertyRow,
  openLoops = [],
  onCloseLoops,
  onTogglePropertyKeyframe,
  onAddPropertyKeyframeAtTime,
  onRemovePropertyKeyframe,
  onMovePropertyKeyframe,
  onSetPropertyEasing,
  onDuplicatePropertyKeyframe,
  onActivePropertyRowChange,
  activeTrackId,
  onActiveTrackChange,
  shapes,
  selectedShapeId,
  onSelectShape,
  onShapesChange,
  onAddShape,
  onRemoveShape,
  onShapeEasingChange,
  shapeOptions,
  onShapeIconChange,
  onShapeWipePairChange,
  onUploadShape,
  onShapeBlendChange,
  openShapePicker,
  onOpenShapePicker,
  wipeDirections,
}: TimelineProps) {
  const [selectedKeyframe, setSelectedKeyframe] =
    useState<SelectedTimelineKeyframe>(null)
  // What Delete acts on: a keyframe, a whole row (picked in the rail), or
  // the icon clip last clicked in the timeline.
  const [selectedRow, setSelectedRow] = useState<string | null>(null)
  // The keyframe panel follows selection; closing it keeps the selection
  // (so Delete still works) until a keyframe is picked again.
  const [dismissedKeyframe, setDismissedKeyframe] = useState<string | null>(
    null
  )
  const [clipSelected, setClipSelected] = useState(false)
  const [clipPanelDismissed, setClipPanelDismissed] = useState(false)
  const selectKeyframe = (keyframe: SelectedTimelineKeyframe) => {
    setSelectedKeyframe(keyframe)
    setSelectedRow(null)
    setClipSelected(false)
    if (keyframe) setDismissedKeyframe(null)
  }
  const clearSelection = () => selectKeyframe(null)
  const [openClipEditor, setOpenClipEditor] = useState<string | null>(null)
  const selectedKeyframeKey = selectedKeyframe
    ? `${selectedKeyframe.type}:${
        selectedKeyframe.type === "track"
          ? selectedKeyframe.trackId
          : selectedKeyframe.rowId
      }:${selectedKeyframe.kfId}`
    : null
  const openKeyframeEditor = (keyframe: SelectedTimelineKeyframe) => {
    selectKeyframe(keyframe)
    setDismissedKeyframe(null)
  }
  const [snapEnabled, setSnapEnabled] = useState(true)
  const shapePicker = useShapePickerCatalog({
    openShapePicker,
    shapeOptions,
    onShapeIconChange,
    onShapeWipePairChange,
    onOpenShapePicker,
  })
  const laneRef = useRef<HTMLDivElement>(null)
  const leftRailBodyRef = useRef<HTMLDivElement>(null)
  const timelineScrollRef = useRef<HTMLDivElement>(null)
  const {
    timelineZoom,
    setZoom,
    durationEditor,
    setDurationEditor,
    fitTimeline,
    commitDurationEditor,
    openDurationEditor,
    applyDuration,
    adjustTimelineZoom,
    durationInvalid,
    durationNotice,
  } = useTimelineZoomAndDuration({
    duration,
    onDurationChange,
    timelineScrollRef,
  })

  const {
    contextMenu,
    setContextMenu,
    goToEditor,
    setGoToEditor,
    openContextMenu,
    createGoToMenuItem: goToMenuItem,
    commitGoToEditor,
    cancelGoToEditor,
  } = useTimelineContextMenu({
    duration,
    onScrubStart,
    onTimeChange,
  })
  // A right-click shows its menu alone, not the keyframe panel behind it.
  const openTimelineContextMenu: typeof openContextMenu = (...args) => {
    setDismissedKeyframe(selectedKeyframeKey)
    openContextMenu(...args)
  }

  const {
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
  } = useTimelineDerivedState({
    duration,
    timelineZoom,
    shapes,
    tracks,
    propertyRows,
    shapeOptions,
    activeTrackId,
  })
  const visibleRowIds = useMemo(
    () => [
      ...visiblePropertyRows.map((row) => `property:${row.id}`),
      ...visibleTracks.map((track) => `track:${track.id}`),
    ],
    [visiblePropertyRows, visibleTracks]
  )
  const previousVisibleRowIdsRef = useRef<string[] | null>(null)
  const revealRowTimeoutRef = useRef<number | null>(null)
  const [revealedRowId, setRevealedRowId] = useState<string | null>(null)

  const { snapTime, rawTimeFromClientX, timeFromClientX, handleScrubStart } =
    useTimelineScrubbing({
      duration,
      currentTime,
      timelineZoom,
      snapEnabled,
      frameSnapActive,
      baseKeyMomentTimes,
      getKeyMomentTimes: keyMomentTimes,
      laneRef,
      timelineScrollRef,
      onTimeChange,
      onScrubStart,
      onClearSelectedKeyframe: clearSelection,
    })

  const {
    timeEditor,
    setTimeEditor,
    timeClampNotice,
    keyframeDraggedRef,
    selectTrack,
    toggleKeyframeAtPlayhead,
    addTrackKeyframe,
    removeTrackKeyframe,
    handleKeyframeDrag,
    handleBlockDrag,
    commitTimeEditor,
    setTrackEasing,
    setSingleKeyframeEasing,
  } = useTimelineTrackKeyframes({
    duration,
    currentTime,
    tracks,
    snapEnabled,
    frameSnapActive,
    laneRef,
    setSelectedKeyframe,
    keyMomentTimes,
    snapTime,
    onTracksChange,
    onTimeChange,
    onScrubStart,
    onActiveTrackChange,
  })

  useTimelineKeyframeShortcuts({
    selectedKeyframe,
    currentTime,
    duration,
    tracks,
    propertyRows,
    onTracksChange,
    onSetSingleKeyframeEasing: setSingleKeyframeEasing,
    onSetPropertyEasing,
    onDuplicatePropertyKeyframe,
  })

  useTimelineSelectionGuards({
    selectedKeyframe,
    setSelectedKeyframe,
    timeEditor,
    setTimeEditor,
    tracks,
    propertyRows,
  })

  useTimelineDeletion({
    selectedKeyframe,
    selectedRow,
    clipSelected,
    onClearPropertyRow,
    onClearTrackKeyframes,
    selectedShapeId,
    shapes,
    tracks,
    propertyRows,
    onClearSelection: clearSelection,
    onRemoveShape,
    onRemoveTrackKeyframe: removeTrackKeyframe,
    onRemovePropertyKeyframe,
  })

  const { shapeDraggedRef, handleShapeDrag, handleTransitionEdgeDrag } =
    useTimelineShapeDrag({
      duration,
      shapes,
      laneRef,
      rawTimeFromClientX,
      snapTime,
      onScrubStart,
      onSelectShape,
      onShapesChange,
      onSelectKeyframe: setSelectedKeyframe,
    })
  const { handleLeftRailScroll, syncLeftRailScroll } =
    useTimelineRailScrollSync({
      leftRailBodyRef,
      timelineScrollRef,
    })

  const { visibleCurrentTime, playheadX, timelineTicks, secondGridTicks } =
    useTimelineViewportState({
      currentTime,
      duration,
      timelineZoom,
      frameSnapActive,
      timelineScrollRef,
    })
  useTimelinePinchZoom({
    scrollRef: timelineScrollRef,
    zoom: timelineZoom,
    setZoom,
  })

  useTimelinePlayheadFollow({
    duration,
    isPlaying,
    timelineZoom,
    visibleCurrentTime,
    laneRef,
    timelineScrollRef,
  })

  useLayoutEffect(() => {
    syncLeftRailScroll(timelineScrollRef.current?.scrollTop ?? 0)
  }, [syncLeftRailScroll, visibleRowIds])

  useEffect(() => {
    const previousRowIds = previousVisibleRowIdsRef.current
    previousVisibleRowIdsRef.current = visibleRowIds
    if (!previousRowIds) return

    const newRowId = visibleRowIds.find(
      (rowId) => !previousRowIds.includes(rowId)
    )
    if (!newRowId) return

    const rowIndex = visibleRowIds.indexOf(newRowId)
    const scroller = timelineScrollRef.current
    const styles = scroller ? getComputedStyle(scroller) : null
    const shapeHeight =
      Number.parseFloat(
        styles?.getPropertyValue("--timeline-shape-height") ?? ""
      ) || 36
    const rowHeight =
      Number.parseFloat(
        styles?.getPropertyValue("--timeline-property-height") ?? ""
      ) || 36
    // Keep 12px of context above the row in both mouse and touch layouts.
    const targetScrollTop = Math.max(
      0,
      48 + shapeHeight - 12 + rowIndex * rowHeight
    )
    if (scroller) {
      const maxScrollTop = Math.max(
        0,
        scroller.scrollHeight - scroller.clientHeight
      )
      const nextScrollTop = Math.min(targetScrollTop, maxScrollTop)
      scroller.scrollTo({ top: nextScrollTop, behavior: "auto" })
      syncLeftRailScroll(nextScrollTop)
    }

    setRevealedRowId(newRowId)
    if (revealRowTimeoutRef.current !== null) {
      window.clearTimeout(revealRowTimeoutRef.current)
    }
    revealRowTimeoutRef.current = window.setTimeout(() => {
      setRevealedRowId(null)
      revealRowTimeoutRef.current = null
    }, 900)
  }, [syncLeftRailScroll, timelineScrollRef, visibleRowIds])

  useEffect(
    () => () => {
      if (revealRowTimeoutRef.current !== null) {
        window.clearTimeout(revealRowTimeoutRef.current)
      }
    },
    []
  )

  const addProperty = (trackId: string) => {
    onScrubStart?.()
    onTracksChange(
      tracks.map((track) =>
        track.id === trackId ? withStarterAnimation(track, duration) : track
      )
    )
    onTimeChange(0)
    selectTrack(trackId)
  }

  return {
    contextMenu,
    setContextMenu,
    toolbarProps: {
      compactMode,
      currentTime: visibleCurrentTime,
      duration,
      durationEditor,
      durationInvalid,
      durationNotice,
      snapEnabled,
      loop,
      zoom: timelineZoom,
      playback,
      openLoopCount: openLoops.length,
      onCloseLoops: onCloseLoops ? () => onCloseLoops() : undefined,
      onDurationEditorChange: setDurationEditor,
      onOpenDurationEditor: openDurationEditor,
      onCommitDurationEditor: commitDurationEditor,
      onApplyDuration: applyDuration,
      onSnapEnabledChange: setSnapEnabled,
      onLoopChange,
      onZoomChange: setZoom,
      onFitTimeline: fitTimeline,
      onFocusTimeline: () => laneRef.current?.focus({ preventScroll: true }),
      onSeek: (time: number) => {
        clearSelection()
        onScrubStart?.()
        onTimeChange(time)
      },
    },
    goToPopoverProps: {
      editor: goToEditor,
      onEditorChange: setGoToEditor,
      onCommit: commitGoToEditor,
      onCancel: cancelGoToEditor,
    },
    leftRailProps: {
      selectedRow,
      onSelectRow: setSelectedRow,
      onApplyMotionPreset,
      presetArtwork,
      shapeCount: shapes.length,
      onSeek: (time: number) => {
        clearSelection()
        onScrubStart?.()
        onTimeChange(time)
      },
      activeTrackId,
      currentTime,
      duration,
      durationEditor,
      durationInvalid,
      durationNotice,
      isPreviewLoading,
      leftRailBodyRef,
      loop,
      selectedShapeId,
      snapEnabled,
      tracks: visibleTracks,
      hiddenTracks,
      visiblePropertyRows,
      revealedRowId,
      onActivePropertyRowChange,
      onAddShape,
      onApplyDuration: applyDuration,
      onClearPropertyRow,
      onTogglePropertyKeyframe,
      onClearSelection: clearSelection,
      onClearTrackKeyframes,
      onCommitDurationEditor: commitDurationEditor,
      onDurationEditorChange: setDurationEditor,
      onLeftRailScroll: handleLeftRailScroll,
      onLoopChange,
      onOpenContextMenu: openTimelineContextMenu,
      onOpenDurationEditor: openDurationEditor,
      onAddProperty: addProperty,
      onSelectTrack: selectTrack,
      onSetPropertyEasing,
      onSetTrackEasing: setTrackEasing,
      onSnapEnabledChange: setSnapEnabled,
      onToggleTrackKeyframe: toggleKeyframeAtPlayhead,
      createGoToMenuItem: goToMenuItem,
    },
    clipPanelProps: {
      open:
        clipSelected &&
        !clipPanelDismissed &&
        !isPlaying &&
        !openShapePicker &&
        openClipEditor === null,
      stop: shapes.find((shape) => shape.id === selectedShapeId),
      label: (() => {
        const stop = shapes.find((shape) => shape.id === selectedShapeId)
        return stop ? shapeLabel(stop) : ""
      })(),
      canRemove: shapes.length > 1,
      onClose: () => setClipPanelDismissed(true),
      onChangeIcon: () => {
        if (selectedShapeId) onOpenShapePicker(selectedShapeId)
      },
      onUpload: () => {
        if (selectedShapeId) onUploadShape(selectedShapeId)
      },
      onRemove: () => {
        if (!selectedShapeId) return
        setClipSelected(false)
        onRemoveShape(selectedShapeId)
      },
      duration,
      onTimeChange: (time: number) => {
        if (!selectedShapeId) return
        onShapesChange(
          moveShapeStop({ shapes, shapeId: selectedShapeId, time, duration })
        )
      },
    },
    keyframeEditorProps: {
      open:
        selectedKeyframeKey !== null &&
        dismissedKeyframe !== selectedKeyframeKey &&
        !isPlaying,
      onOpenChange: (open: boolean) =>
        setDismissedKeyframe(open ? null : selectedKeyframeKey),
      selectedKeyframe,
      duration,
      tracks,
      propertyRows: visiblePropertyRows,
      onSelectKeyframe: selectKeyframe,
      onScrubStart,
      onTimeChange,
      onTracksChange,
      onRemoveTrackKeyframe: removeTrackKeyframe,
      onSetSingleKeyframeEasing: setSingleKeyframeEasing,
      onMovePropertyKeyframe,
      onRemovePropertyKeyframe,
      onSetPropertyEasing,
    },
    lanesSurfaceProps: {
      viewport: {
        currentTime: visibleCurrentTime,
        duration,
        timelineZoom,
        playheadX,
        timelineTicks,
        secondGridTicks,
        laneRef,
        timelineScrollRef,
        timeFromClientX,
        handleScrubStart,
        syncLeftRailScroll,
        onAdjustTimelineZoom: adjustTimelineZoom,
        onFitTimeline: fitTimeline,
      },
      shapeLane: {
        shapes,
        sortedShapes,
        selectedShapeId,
        openShapePicker,
        openClipEditor,
        wipeDirections,
        transitionWindows,
        clipBounds,
        shapePicker,
        shapeDraggedRef,
        shapeLabel,
        onClearSelectedKeyframe: clearSelection,
        onScrubStart,
        onTimeChange,
        onOpenClipEditorChange: setOpenClipEditor,
        onShapeBlendChange,
        onShapeEasingChange,
        onTransitionEdgeDrag: handleTransitionEdgeDrag,
        onSelectShape: (id: string) => {
          onSelectShape(id)
          setSelectedKeyframe(null)
          setSelectedRow(null)
          setClipSelected(true)
          setClipPanelDismissed(false)
        },
        onOpenShapePicker,
        onShapeIconChange,
        onUploadShape,
        onMoveShapeOrder: (id: string, direction: -1 | 1) =>
          onShapesChange(moveShapeOrder(shapes, id, direction)),
        onRemoveShape,
        onShapeDrag: handleShapeDrag,
        onAddShape,
      },
      propertyLane: {
        visiblePropertyRows,
        revealedRowId,
        selectedKeyframe,
        onActivePropertyRowChange,
        onRemovePropertyKeyframe,
        onMovePropertyKeyframe,
        onSetPropertyEasing,
        onAddPropertyKeyframeAtTime,
        onSelectKeyframe: selectKeyframe,
        onOpenKeyframeEditor: openKeyframeEditor,
        onScrubStart,
        onTimeChange,
      },
      trackLane: {
        tracks: visibleTracks,
        showAddPropertyRow: hiddenTracks.length > 0,
        revealedRowId,
        activeTrackId,
        selectedKeyframe,
        timeEditor,
        keyframeDraggedRef,
        keyframeTimeClampNotice: timeClampNotice,
        onSelectTrack: selectTrack,
        onSelectKeyframe: selectKeyframe,
        onOpenKeyframeEditor: openKeyframeEditor,
        onTimeEditorChange: setTimeEditor,
        onCommitTimeEditor: commitTimeEditor,
        onScrubStart,
        onTimeChange,
        onAddTrackKeyframeAtTime: addTrackKeyframe,
        onRemoveTrackKeyframe: removeTrackKeyframe,
        onClearTrackKeyframes,
        onSetTrackEasing: setTrackEasing,
        onSetSingleKeyframeEasing: setSingleKeyframeEasing,
        onBlockDrag: handleBlockDrag,
        onKeyframeDrag: handleKeyframeDrag,
      },
      menu: {
        onOpenContextMenu: openTimelineContextMenu,
        createGoToMenuItem: goToMenuItem,
      },
      // A one-shot animation needn't return; only looping asks for it.
      loop:
        loop && onCloseLoops
          ? { openIds: openLoops, onClose: (id: string) => onCloseLoops(id) }
          : undefined,
    },
  }
}
