"use client"

import { cssLength } from "@/lib/utils"

import React from "react"
import {
  EDGE_INSET,
  formatTimelineTick,
  xForFrac,
  TIMELINE_FRAME_RATE,
} from "./TimelineGeometry"
import { TIMELINE_LAYER } from "./TimelineLayering"

type TimelineTick = {
  time: number
  major: boolean
}

type TimelineRulerProps = {
  currentTime: number
  duration: number
  ticks: TimelineTick[]
  playheadX: string
  onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => void
  onContextMenu: (event: React.MouseEvent<HTMLDivElement>) => void
  onKeyboardTimeChange: (time: number) => void
}

const TIMELINE_KEYBOARD_STEP = 1 / TIMELINE_FRAME_RATE
const TIMELINE_KEYBOARD_LARGE_STEP = 1

export const timelineTimeForKeyboardKey = ({
  currentTime,
  duration,
  key,
  shiftKey = false,
}: {
  currentTime: number
  duration: number
  key: string
  shiftKey?: boolean
}) => {
  const step = TIMELINE_KEYBOARD_STEP * (shiftKey ? 10 : 1)
  const frameTime =
    Math.round(currentTime * TIMELINE_FRAME_RATE) / TIMELINE_FRAME_RATE
  let nextTime: number

  switch (key) {
    case "ArrowLeft":
    case "ArrowDown":
      nextTime = frameTime - step
      break
    case "ArrowRight":
    case "ArrowUp":
      nextTime = frameTime + step
      break
    case "PageDown":
      nextTime = currentTime - TIMELINE_KEYBOARD_LARGE_STEP
      break
    case "PageUp":
      nextTime = currentTime + TIMELINE_KEYBOARD_LARGE_STEP
      break
    case "Home":
      nextTime = 0
      break
    case "End":
      nextTime = duration
      break
    default:
      return null
  }

  return Number(Math.max(0, Math.min(duration, nextTime)).toFixed(3))
}

export const TimelineRuler = React.forwardRef<
  HTMLDivElement,
  TimelineRulerProps
>(
  (
    {
      currentTime,
      duration,
      ticks,
      playheadX,
      onPointerDown,
      onContextMenu,
      onKeyboardTimeChange,
    },
    ref
  ) => (
    <div
      ref={ref}
      role="slider"
      data-timeline-playback-surface
      aria-keyshortcuts="Space ArrowLeft ArrowRight Shift+ArrowLeft Shift+ArrowRight"
      tabIndex={0}
      aria-label="Timeline playhead"
      aria-orientation="horizontal"
      aria-valuemin={0}
      aria-valuemax={duration}
      aria-valuenow={currentTime}
      aria-valuetext={`${currentTime.toFixed(2)} seconds of ${duration.toFixed(2)} seconds`}
      onPointerDown={(event) => {
        event.currentTarget.focus({ preventScroll: true })
        onPointerDown(event)
      }}
      onContextMenu={onContextMenu}
      onKeyDown={(event) => {
        if (event.metaKey || event.ctrlKey || event.altKey) return
        const nextTime = timelineTimeForKeyboardKey({
          currentTime,
          duration,
          key: event.key,
          shiftKey: event.shiftKey,
        })
        if (nextTime === null) return
        event.preventDefault()
        onKeyboardTimeChange(nextTime)
      }}
      className="sticky top-0 z-(--stack-order) h-(--timeline-ruler-height) shrink-0 cursor-ew-resize touch-none bg-(--timeline-surface) outline-none select-none"
      style={{ "--stack-order": TIMELINE_LAYER.ruler } as React.CSSProperties}
    >
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-border"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-(--element-width) bg-foreground/[0.03]"
        style={
          { "--element-width": cssLength(EDGE_INSET) } as React.CSSProperties
        }
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-(--element-width) bg-foreground/[0.03]"
        style={
          { "--element-width": cssLength(EDGE_INSET) } as React.CSSProperties
        }
        aria-hidden="true"
      />
      {ticks.map((tick) => (
        <div
          key={`ruler-${tick.time}`}
          className="pointer-events-none absolute top-0 bottom-0 left-(--position-x)"
          style={
            {
              "--position-x": cssLength(xForFrac(tick.time / duration)),
            } as React.CSSProperties
          }
        >
          <div
            className={`absolute bottom-0 w-px ${
              tick.major
                ? "h-2.5 bg-muted-foreground/55"
                : "h-1 bg-muted-foreground/30"
            }`}
          />
          {tick.major && Math.abs(tick.time - duration) > 0.001 && (
            <span
              className={`absolute top-1.75 font-mono text-3xs leading-none text-muted-foreground tabular-nums ${"left-2"}`}
            >
              {formatTimelineTick(tick.time)}
            </span>
          )}
        </div>
      ))}
      <div
        className="pointer-events-none absolute top-0 bottom-0 left-(--position-x) z-(--stack-order) w-px -translate-x-1/2 bg-(--timeline-playhead)"
        style={
          {
            "--position-x": cssLength(playheadX),
            "--stack-order": TIMELINE_LAYER.rulerPlayheadLine,
          } as React.CSSProperties
        }
      >
        <svg
          viewBox="0 0 13 17"
          aria-hidden="true"
          className="absolute top-1 left-1/2 z-(--stack-order) h-4.25 w-3.25 -translate-x-1/2 fill-(--timeline-playhead) drop-shadow-gizmo"
          style={
            {
              "--stack-order": TIMELINE_LAYER.rulerPlayheadHandle,
            } as React.CSSProperties
          }
        >
          <path d="M2.5 0h8A2.5 2.5 0 0 1 13 2.5v8.3a2.5 2.5 0 0 1-.8 1.8L7.4 16.6a1.3 1.3 0 0 1-1.8 0L.8 12.6A2.5 2.5 0 0 1 0 10.8V2.5A2.5 2.5 0 0 1 2.5 0Z" />
        </svg>
      </div>
    </div>
  )
)

TimelineRuler.displayName = "TimelineRuler"
