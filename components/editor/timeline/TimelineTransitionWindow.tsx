"use client"

import React from "react"
import { holdToDrag } from "@/lib/touch-intent"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cssLength, cn } from "@/lib/utils"
import type { EasingType, ShapeStop } from "../TimelineModel"
import { easingMenuItems } from "./TimelineEasingControls"
import { widthForSpan, xForFrac } from "./TimelineGeometry"
import type { TransitionWindow } from "./TimelineLayoutModel"
import type { TimelineMenuItem } from "./TimelineMenuModel"
import {
  type TransitionEdge,
  transitionIconForMode,
  transitionModeForShape,
} from "./TimelineTransitionModel"
import { TimelineTransitionEditor } from "./TimelineTransitionEditor"
import type { WipeDirectionOption } from "./TimelineTypes"

export type TimelineTransitionWindowProps = {
  duration: number
  window: TransitionWindow
  openClipEditor: string | null
  wipeDirections: WipeDirectionOption[]
  onOpenClipEditorChange: (shapeId: string | null) => void
  onShapeBlendChange: (
    id: string,
    patch: Partial<
      Pick<
        ShapeStop,
        "transitionType" | "wipeDirection" | "transitionStart" | "transitionEnd"
      >
    >
  ) => void
  onShapeEasingChange: (id: string, easing: EasingType) => void
  onTransitionEdgeDrag: (
    event: React.PointerEvent<HTMLElement>,
    shapeId: string,
    edge: TransitionEdge,
    fromTime: number,
    toTime: number
  ) => void
  onOpenContextMenu: (
    event: React.MouseEvent,
    title: string,
    items: TimelineMenuItem[]
  ) => void
  createGoToMenuItem: (
    event: React.MouseEvent,
    time: number,
    onBeforeOpen?: () => void
  ) => TimelineMenuItem
  shapeLabel: (stop: ShapeStop) => string
  timeFromClientX: (
    clientX: number,
    options?: { bypass?: boolean; clampToViewport?: boolean }
  ) => number
}

export function TimelineTransitionWindow({
  duration,
  window,
  openClipEditor,
  wipeDirections,
  onOpenClipEditorChange,
  onShapeBlendChange,
  onShapeEasingChange,
  onTransitionEdgeDrag,
  onOpenContextMenu,
  createGoToMenuItem,
  shapeLabel,
  timeFromClientX,
}: TimelineTransitionWindowProps) {
  const { stop, next, startTime, endTime } = window
  const mode = transitionModeForShape(stop)
  const isCut = mode === "cut"
  const BlockIcon = transitionIconForMode(mode)

  return (
    <React.Fragment>
      <Popover
        open={openClipEditor === stop.id}
        onOpenChange={(open) => onOpenClipEditorChange(open ? stop.id : null)}
      >
        <PopoverTrigger
          aria-label={`Edit ${shapeLabel(stop)} transition`}
          title={`Transition: ${mode} - drag edges to set duration, click to edit`}
          onMouseDown={(event) => event.stopPropagation()}
          onContextMenu={(event) => {
            const time = timeFromClientX(event.clientX, {
              bypass: event.altKey,
            })

            onOpenContextMenu(event, `${shapeLabel(stop)} transition`, [
              createGoToMenuItem(event, time),
              { type: "separator" },
              {
                label: "Edit transition",
                onSelect: () => onOpenClipEditorChange(stop.id),
              },
              { type: "separator" },
              {
                label: "Fade",
                onSelect: () =>
                  onShapeBlendChange(stop.id, {
                    transitionType: "fade",
                  }),
              },
              {
                label: "Wipe",
                onSelect: () =>
                  onShapeBlendChange(stop.id, {
                    transitionType: "wipe",
                    wipeDirection:
                      stop.wipeDirection.x === 0 && stop.wipeDirection.y === 0
                        ? { x: 1, y: 0 }
                        : stop.wipeDirection,
                  }),
              },
              {
                label: "Cut",
                onSelect: () =>
                  onShapeBlendChange(stop.id, {
                    transitionType: "cut",
                  }),
              },
              ...easingMenuItems(stop.easing, (easing) =>
                onShapeEasingChange(stop.id, easing)
              ),
            ])
          }}
          className={cn(
            "group/transition @container absolute inset-y-1.5 flex cursor-pointer items-center justify-center gap-1 text-2xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring",
            isCut
              ? "-translate-x-1/2 rounded-md bg-muted"
              : "rounded-md bg-transition-window hover:bg-transition-window-hover",
            "left-(--position-x) w-(--element-width) min-w-(--element-min-width)"
          )}
          style={
            {
              "--position-x": cssLength(xForFrac(startTime / duration)),
              "--element-width": cssLength(
                isCut
                  ? 22
                  : widthForSpan(Math.max(0, endTime - startTime) / duration)
              ),
              "--element-min-width": "22px",
            } as React.CSSProperties
          }
        >
          <span className="flex items-center gap-1 rounded bg-(--timeline-lane)/85 px-1.5 py-0.5">
            <BlockIcon className="size-3.5 shrink-0" strokeWidth={2} />
            {!isCut && (
              <span className="capitalize @max-[88px]:hidden">{mode}</span>
            )}
          </span>
        </PopoverTrigger>
        <PopoverContent
          align="center"
          side="top"
          sideOffset={10}
          onPointerDown={(event) => event.stopPropagation()}
          onMouseDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
          onContextMenu={(event) => event.stopPropagation()}
        >
          <TimelineTransitionEditor
            mode={mode}
            stop={stop}
            next={next}
            startTime={startTime}
            endTime={endTime}
            wipeDirections={wipeDirections}
            onShapeBlendChange={onShapeBlendChange}
            onShapeEasingChange={onShapeEasingChange}
          />
        </PopoverContent>
      </Popover>

      <TransitionEdgeHandle
        title={
          isCut
            ? "Drag to set the cut point"
            : "Drag to set when the transition starts"
        }
        left={xForFrac(startTime / duration)}
        onPointerDown={(event) =>
          onTransitionEdgeDrag(event, stop.id, "start", stop.time, next.time)
        }
      />
      {!isCut && (
        <TransitionEdgeHandle
          title="Drag to set when the transition ends"
          left={xForFrac(endTime / duration)}
          onPointerDown={(event) =>
            onTransitionEdgeDrag(event, stop.id, "end", stop.time, next.time)
          }
        />
      )}
    </React.Fragment>
  )
}

function TransitionEdgeHandle({
  title,
  left,
  onPointerDown,
}: {
  title: string
  left: string
  onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => void
}) {
  return (
    <div
      title={title}
      onPointerDown={holdToDrag(onPointerDown)}
      className="group/edge absolute inset-y-1.5 left-(--position-x) z-6 flex w-3 -translate-x-1/2 cursor-trim touch-pan-x touch-pan-y items-center justify-center max-md:hidden"
      style={{ "--position-x": cssLength(left) } as React.CSSProperties}
    >
      <span className="h-full w-0.5 rounded-full bg-foreground opacity-0 transition-opacity group-hover/edge:opacity-80" />
    </div>
  )
}
