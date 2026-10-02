"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import { Plus } from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { keyframeTimeMatches } from "../EditorKeyframeModel"
import { TimelineIconStrip } from "./TimelineIconStrip"
import { TimelineKeyframeEditor } from "./TimelineKeyframeEditor"
import { NumberField } from "../NumberField"
import type { TimelineTrack } from "../TimelineModel"
import { KeyframeListRow, type ListRow } from "./TimelineKeyframeListRow"
import { quantizeTimeToFrame } from "./TimelineGeometry"
import { setTrackKeyframeTime } from "./TimelineKeyframeModel"
import type { TimelineLanesSurfaceProps } from "./TimelineLanesSurfaceTypes"
import { formatValueLabel } from "./TimelinePrimitives"
import type { SelectedTimelineKeyframe } from "./TimelineTypes"

type TimelineKeyframeListProps = {
  motionPresets?: ReactNode
  surface: TimelineLanesSurfaceProps
  duration: number
  tracks: TimelineTrack[]
  hiddenTracks: TimelineTrack[]
  onAddProperty: (trackId: string) => void
  onTracksChange: (tracks: TimelineTrack[]) => void
  renderPropertyValueEditor?: (rowId: string) => ReactNode
  onEditValue?: (selection: NonNullable<SelectedTimelineKeyframe>) => void
}

export function TimelineKeyframeList({
  motionPresets,
  surface,
  duration,
  tracks,
  hiddenTracks,
  onAddProperty,
  onTracksChange,
  onEditValue,
  renderPropertyValueEditor,
}: TimelineKeyframeListProps) {
  const { viewport, propertyLane, trackLane } = surface
  const [addOpen, setAddOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const frameButtons = useRef(new Map<string, HTMLButtonElement>())
  const addButtons = useRef(new Map<string, HTMLButtonElement>())
  const returnFocus = useRef<HTMLElement | null>(null)
  const navigationClosing = useRef(false)
  const [addedFrame, setAddedFrame] = useState<{
    rowId: string
    time: number
  } | null>(null)
  useEffect(() => {
    if (!addedFrame) return
    const row = propertyLane.visiblePropertyRows.find(
      (candidate) => candidate.id === addedFrame.rowId
    )
    const frame = row?.keyframes.find((candidate) =>
      keyframeTimeMatches(candidate.time, addedFrame.time)
    )
    if (frame) {
      propertyLane.onSelectKeyframe({
        type: "property",
        rowId: addedFrame.rowId,
        kfId: frame.id,
      })
      setEditing(true)
      setAddedFrame(null)
    }
  }, [
    addedFrame,
    propertyLane.visiblePropertyRows,
    propertyLane.onSelectKeyframe,
  ])
  const addPropertyRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const [propertySelection, trackSelection] = [
    propertyLane.selectedKeyframe,
    trackLane.selectedKeyframe,
  ]
  const seek = (time: number) => {
    propertyLane.onScrubStart?.()
    propertyLane.onTimeChange(time)
  }
  const rows: ListRow[] = [
    ...propertyLane.visiblePropertyRows.map((row): ListRow => ({
      ...row,
      selectedId:
        propertySelection?.type === "property" &&
        propertySelection.rowId === row.id
          ? propertySelection.kfId
          : undefined,
      onSelect: (frame) => {
        navigationClosing.current = false
        setEditing(true)
        seek(frame.time)
        propertyLane.onSelectKeyframe({
          type: "property",
          rowId: row.id,
          kfId: frame.id,
        })
        propertyLane.onActivePropertyRowChange?.(row.id)
      },
      onMove: (frame, time) => {
        const nextTime = quantizeTimeToFrame(time)
        propertyLane.onMovePropertyKeyframe?.(row.id, frame.id, nextTime)
        seek(nextTime)
        if (row.id === "style")
          propertyLane.onSelectKeyframe({
            type: "property",
            rowId: row.id,
            kfId: `style-${nextTime.toFixed(3)}`,
          })
      },
      onRemove: propertyLane.onRemovePropertyKeyframe
        ? (frame) => {
            propertyLane.onRemovePropertyKeyframe?.(row.id, frame.id)
            propertyLane.onSelectKeyframe(null)
          }
        : undefined,
      onEasing: propertyLane.onSetPropertyEasing
        ? (frame, easing) =>
            propertyLane.onSetPropertyEasing?.(row.id, frame.id, easing)
        : undefined,
      onAdd: propertyLane.onAddPropertyKeyframeAtTime
        ? () => {
            navigationClosing.current = false
            propertyLane.onScrubStart?.()
            propertyLane.onAddPropertyKeyframeAtTime?.(
              row.id,
              viewport.currentTime
            )
            setAddedFrame({ rowId: row.id, time: viewport.currentTime })
          }
        : undefined,
      onEditValue: onEditValue
        ? (frame) => {
            seek(frame.time)
            onEditValue({ type: "property", rowId: row.id, kfId: frame.id })
          }
        : undefined,
    })),
    ...trackLane.tracks.map((track): ListRow => ({
      ...track,
      keyframes: track.keyframes.map((frame) => ({
        ...frame,
        label: formatValueLabel(track, frame.value),
      })),
      selectedId:
        trackSelection?.type === "track" && trackSelection.trackId === track.id
          ? trackSelection.kfId
          : undefined,
      onSelect: (frame) => {
        navigationClosing.current = false
        setEditing(true)
        seek(frame.time)
        trackLane.onSelectTrack(track.id)
        trackLane.onSelectKeyframe({
          type: "track",
          trackId: track.id,
          kfId: frame.id,
        })
      },
      onMove: (frame, time) => {
        onTracksChange(
          setTrackKeyframeTime({
            tracks,
            trackId: track.id,
            keyframeId: frame.id,
            time,
            duration,
            frameSnapActive: false,
          })
        )
        seek(time)
      },
      onRemove: (frame) => trackLane.onRemoveTrackKeyframe(track.id, frame.id),
      onEasing: (frame, easing) =>
        trackLane.onSetSingleKeyframeEasing(track.id, frame.id, easing),
      onAdd: () => {
        navigationClosing.current = false
        propertyLane.onScrubStart?.()
        trackLane.onAddTrackKeyframeAtTime(track.id, viewport.currentTime)
        setEditing(true)
      },
      valueRange: {
        min: track.min,
        max: track.max,
        onChange: (frame, value) => {
          seek(frame.time)
          onTracksChange(
            tracks.map((candidate) =>
              candidate.id === track.id
                ? {
                    ...candidate,
                    keyframes: candidate.keyframes.map((keyframe) =>
                      keyframe.id === frame.id
                        ? { ...keyframe, value }
                        : keyframe
                    ),
                  }
                : candidate
            )
          )
        },
      },
    })),
  ]

  const selectedRow = rows.find((row) =>
    row.keyframes.some((frame) => frame.id === row.selectedId)
  )
  const selectedFrame = selectedRow?.keyframes.find(
    (frame) => frame.id === selectedRow.selectedId
  )
  const closeEditor = () => {
    returnFocus.current =
      selectedRow && selectedFrame
        ? (frameButtons.current.get(`${selectedRow.id}:${selectedFrame.id}`) ??
          null)
        : null
    setEditing(false)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col" aria-label="Keyframe list">
      <div className="flex shrink-0 items-center gap-2 border-b border-border/50 px-3">
        <NumberField
          value={viewport.currentTime}
          min={0}
          max={duration}
          step={0.1}
          precision={2}
          suffix="s"
          ariaLabel="Playhead time in seconds"
          className="min-h-11 w-20 bg-transparent"
          onChange={seek}
        />
        <input
          type="range"
          min={0}
          max={duration}
          step={1 / 60}
          value={viewport.currentTime}
          aria-label="Animation playhead"
          onChange={(event) => seek(Number(event.currentTarget.value))}
          className="h-11 min-w-0 flex-1 appearance-none bg-transparent focus-visible:outline-2 focus-visible:outline-ring [&::-moz-range-thumb]:size-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-foreground [&::-moz-range-track]:h-1 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-border [&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-border [&::-webkit-slider-thumb]:-mt-1 [&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-foreground"
        />
        <span className="text-xs text-muted-foreground tabular-nums">
          {duration.toFixed(1)}s
        </span>
      </div>
      <TimelineIconStrip shapeLane={surface.shapeLane} />
      <div
        className="editor-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4"
        ref={listRef}
        tabIndex={-1}
      >
        <div className="flex min-h-11 items-center justify-between gap-2 border-b border-border/60">
          <h2 className="sr-only">Animated properties</h2>
          <span className="text-xs font-medium text-muted-foreground min-[720px]:hidden">
            Animated properties
          </span>
          <div className="hidden min-[720px]:contents">
            {motionPresets ?? (
              <span className="text-xs font-medium text-muted-foreground">
                Animated properties
              </span>
            )}
          </div>
          {hiddenTracks.length > 0 && (
            <Popover open={addOpen} onOpenChange={setAddOpen}>
              <PopoverTrigger
                render={
                  <button
                    ref={addPropertyRef}
                    type="button"
                    aria-label="Add property"
                    className="flex min-h-11 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
                  />
                }
              >
                <Plus className="size-3.5" />
                Add
              </PopoverTrigger>
              <PopoverContent
                align="end"
                className="grid max-h-(--available-height) gap-1 overflow-y-auto p-2"
              >
                <p className="px-2 py-1 text-xs text-muted-foreground">
                  Animate a property
                </p>
                {hiddenTracks.map((track) => (
                  <button
                    key={track.id}
                    type="button"
                    className="min-h-11 rounded-md px-2 text-left text-sm hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
                    onClick={() => {
                      onAddProperty(track.id)
                      setAddOpen(false)
                    }}
                  >
                    {track.name}
                  </button>
                ))}
              </PopoverContent>
            </Popover>
          )}
        </div>
        <div className="divide-y divide-border/50">
          {rows.map((row) => (
            <KeyframeListRow
              key={`${row.valueRange ? "track" : "property"}-${row.id}`}
              row={row}
              duration={duration}
              currentTime={viewport.currentTime}
              onFrameElement={(id, element) => {
                const key = `${row.id}:${id}`
                if (element) frameButtons.current.set(key, element)
                else frameButtons.current.delete(key)
              }}
              onAddElement={(element) => {
                if (element) addButtons.current.set(row.id, element)
                else addButtons.current.delete(row.id)
              }}
            />
          ))}
        </div>
        {rows.length === 0 && (
          <div className="grid gap-2 py-6">
            <h3 className="text-sm font-medium">Bring your icon to life</h3>
            <p className="max-w-64 text-xs leading-5 text-muted-foreground">
              Choose Animate for a ready-made motion, or add a property to make
              your own.
            </p>
          </div>
        )}
      </div>
      <TimelineKeyframeEditor
        row={selectedRow}
        frame={selectedFrame}
        duration={duration}
        open={editing && !!selectedFrame}
        onClose={closeEditor}
        valueEditor={
          selectedRow && !selectedRow.valueRange
            ? renderPropertyValueEditor?.(selectedRow.id)
            : undefined
        }
        finalFocus={() =>
          navigationClosing.current
            ? false
            : returnFocus.current?.isConnected
              ? returnFocus.current
              : (addPropertyRef.current ?? listRef.current ?? false)
        }
        onEditValue={() => {
          if (!selectedRow || !selectedFrame) return
          navigationClosing.current = true
          closeEditor()
          selectedRow.onEditValue?.(selectedFrame)
        }}
        onDelete={() => {
          if (!selectedRow || !selectedFrame) return
          const rowId = selectedRow.id
          selectedRow.onRemove?.(selectedFrame)
          setEditing(false)
          propertyLane.onSelectKeyframe(null)
          requestAnimationFrame(() => {
            returnFocus.current =
              addButtons.current.get(rowId) ??
              addPropertyRef.current ??
              listRef.current
            returnFocus.current?.focus()
          })
        }}
      />
    </div>
  )
}
