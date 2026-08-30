"use client"

import React from "react"
import { EDGE_INSET, formatTimelineTick, xForFrac } from "./TimelineGeometry"
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

const TIMELINE_KEYBOARD_STEP = 0.1
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
  const step = shiftKey ? TIMELINE_KEYBOARD_LARGE_STEP : TIMELINE_KEYBOARD_STEP
  let nextTime: number

  switch (key) {
    case "ArrowLeft":
    case "ArrowDown":
      nextTime = currentTime - step
      break
    case "ArrowRight":
    case "ArrowUp":
      nextTime = currentTime + step
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
      className="sticky top-0 h-7 cursor-col-resize touch-none bg-background select-none focus-visible:ring-2 focus-visible:ring-ring/45 focus-visible:outline-none focus-visible:ring-inset"
      style={{ zIndex: TIMELINE_LAYER.ruler }}
    >
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-border"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-y-0 left-0 bg-muted/70 dark:bg-muted/35"
        style={{ width: EDGE_INSET }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 bg-muted/70 dark:bg-muted/35"
        style={{ width: EDGE_INSET }}
        aria-hidden="true"
      />
      {ticks.map((tick) => {
        const isFinalTick = Math.abs(tick.time - duration) < 0.001
        return (
          <div
            key={`ruler-${tick.time}`}
            className="pointer-events-none absolute top-0 bottom-0"
            style={{ left: xForFrac(tick.time / duration) }}
          >
            {tick.time > 0 && (
              <div
                className={`absolute top-0 w-px ${
                  tick.major
                    ? "bottom-0 bg-border"
                    : "h-2 bg-muted-foreground/25"
                }`}
              />
            )}
            {tick.major && !isFinalTick && (
              <span className="absolute top-[13px] pl-1 font-mono text-[11px] leading-none text-muted-foreground">
                {formatTimelineTick(tick.time)}
              </span>
            )}
          </div>
        )
      })}
      <div
        className="pointer-events-none absolute top-0 bottom-0 w-px -translate-x-1/2 bg-red-500 dark:bg-red-400"
        style={{ left: playheadX, zIndex: TIMELINE_LAYER.rulerPlayheadLine }}
      >
        <div
          className="absolute top-1 left-1/2 h-4 w-4 -translate-x-1/2 rounded-[5px] border border-red-600/70 bg-red-500 shadow-[0_2px_6px_rgba(0,0,0,0.28)] dark:border-red-300/70 dark:bg-red-400"
          style={{ zIndex: TIMELINE_LAYER.rulerPlayheadHandle }}
        />
      </div>
    </div>
  )
)

TimelineRuler.displayName = "TimelineRuler"
