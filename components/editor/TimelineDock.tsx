"use client"

import { Timeline } from "./Timeline"
import type { TimelineProps } from "./timeline/TimelineTypes"
import { useState } from "react"

type TimelineDockProps = {
  zenMode: boolean
  compactOpen?: boolean
  timelineProps: TimelineProps
}

export function TimelineDock({
  zenMode,
  compactOpen = false,
  timelineProps,
}: TimelineDockProps) {
  const [height, setHeight] = useState(300)
  const [dragging, setDragging] = useState(false)
  return (
    <div
      id="glyphrise-timeline-pane"
      aria-label="Motion timeline"
      inert={zenMode}
      aria-hidden={zenMode}
      className={`compact-sheet-pane relative shrink-0 overflow-hidden ${
        zenMode
          ? "h-0 border-t-0"
          : `border-t border-border bg-background ${
              compactOpen
                ? "max-[720px]:h-(--compact-pane-height) max-[720px]:min-h-0 max-[720px]:flex-none"
                : "max-[720px]:hidden"
            }`
      }`}
      style={
        !zenMode
          ? {
              height:
                timelineProps.compactMode && compactOpen
                  ? "var(--compact-pane-height)"
                  : `${height}px`,
            }
          : undefined
      }
    >
      {!zenMode && (
        <div className="absolute inset-x-0 top-0 z-30 hidden h-2 -translate-y-1/2 items-center justify-center min-[720px]:flex">
          <div
            role="separator"
            aria-label="Resize timeline"
            aria-orientation="horizontal"
            aria-valuemin={120}
            aria-valuemax={480}
            aria-valuenow={height}
            tabIndex={0}
            className="relative h-4 w-16 cursor-row-resize rounded-full after:absolute after:inset-x-0 after:top-1/2 after:h-1 after:-translate-y-1/2 after:rounded-full after:bg-border/80 hover:after:bg-foreground/50 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
            onPointerDown={(event) => {
              event.preventDefault()
              event.currentTarget.setPointerCapture(event.pointerId)
              setDragging(true)
              const startY = event.clientY
              const startHeight = height
              const move = (moveEvent: PointerEvent) => {
                setHeight(
                  Math.max(
                    120,
                    Math.min(480, startHeight - (moveEvent.clientY - startY))
                  )
                )
              }
              const up = () => {
                setDragging(false)
                window.removeEventListener("pointermove", move)
                window.removeEventListener("pointerup", up)
              }
              window.addEventListener("pointermove", move)
              window.addEventListener("pointerup", up)
            }}
            onKeyDown={(event) => {
              const step = event.shiftKey ? 40 : 16
              if (event.key === "ArrowUp" || event.key === "ArrowDown") {
                event.preventDefault()
                setHeight((current) =>
                  Math.max(
                    120,
                    Math.min(
                      480,
                      current + (event.key === "ArrowUp" ? step : -step)
                    )
                  )
                )
              }
              if (event.key === "Home") setHeight(164)
              if (event.key === "End") {
                setHeight(480)
              }
            }}
          />
          {dragging ? <span className="sr-only">Resizing timeline</span> : null}
        </div>
      )}
      <Timeline {...timelineProps} />
    </div>
  )
}
