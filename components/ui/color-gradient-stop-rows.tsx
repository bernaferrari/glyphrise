"use client"

import * as React from "react"
import { GripVertical, Minus } from "lucide-react"
import { Popover, PopoverTrigger } from "@/components/ui/popover"
import { bindWindowPointerDrag } from "@/lib/drag-events"
import { cn } from "@/lib/utils"
import type { NormalizedColorStop } from "./color-stop-model"
import { ColorStopEditorPopover } from "./color-stop-editor-popover"
import type { StopEditorProps } from "./color-stop-editor-popover"

export type ColorStopEditorAnchor = "rail" | "row" | null

// h-8 row + space-y-1 gap.
const ROW_PITCH = 36

interface ColorGradientStopRowsProps {
  stops: NormalizedColorStop[]
  openStopEditor: number | null
  openStopEditorAnchor: ColorStopEditorAnchor
  canRemoveStop: boolean
  stopContentRef: React.RefObject<HTMLDivElement | null>
  stopEditorProps: StopEditorProps
  onActiveStopChange: (stop: number) => void
  onStopEditorOpenIntent: () => void
  onOpenStopEditorChange: (
    stop: number | null,
    anchor: ColorStopEditorAnchor
  ) => void
  onCaptureStopOutsidePointer: (event: Event) => void
  onCommitStopPositionInput: (stopId: string, rawValue: string) => void
  onCommitStopColorInput: (
    stopId: string,
    rawValue: string,
    input?: HTMLInputElement
  ) => void
  onRemoveStop?: (stop: number) => void
  /** Mesh mode: rows are reordered by dragging instead of by position. */
  onReorder?: (from: number, to: number) => void
  removeLabel?: string
  onHoverStop?: (stop: number | null) => void
}

export function ColorGradientStopRows({
  stops,
  openStopEditor,
  openStopEditorAnchor,
  canRemoveStop,
  stopContentRef,
  stopEditorProps,
  onActiveStopChange,
  onStopEditorOpenIntent,
  onOpenStopEditorChange,
  onCaptureStopOutsidePointer,
  onCommitStopPositionInput,
  onCommitStopColorInput,
  onRemoveStop,
  onReorder,
  removeLabel = "Remove gradient stop",
  onHoverStop,
}: ColorGradientStopRowsProps) {
  const reorderable = Boolean(onReorder)
  const [drag, setDrag] = React.useState<{
    from: number
    offset: number
  } | null>(null)
  const dragTarget = drag
    ? Math.max(
        0,
        Math.min(
          stops.length - 1,
          drag.from + Math.round(drag.offset / ROW_PITCH)
        )
      )
    : null

  const startReorder = (from: number, event: React.PointerEvent) => {
    if (event.button !== 0 || !onReorder) return
    event.preventDefault()
    event.stopPropagation()
    const startY = event.clientY
    let latest = 0
    setDrag({ from, offset: 0 })
    bindWindowPointerDrag({
      documentEdit: true,
      pointerId: event.pointerId,
      onMove: (moveEvent) => {
        latest = moveEvent.clientY - startY
        setDrag({ from, offset: latest })
      },
      onEnd: () => {
        const to = Math.max(
          0,
          Math.min(stops.length - 1, from + Math.round(latest / ROW_PITCH))
        )
        setDrag(null)
        if (to !== from) onReorder(from, to)
      },
    })
  }

  return (
    <div className="space-y-1">
      {stops.map((stopItem, stop) => {
        const active = openStopEditor === stop
        const stopColor = stopItem.color
        const dragging = drag?.from === stop
        // Rows between the dragged row and its target slide out of the way.
        const shift =
          drag && dragTarget !== null && !dragging
            ? stop > drag.from && stop <= dragTarget
              ? -ROW_PITCH
              : stop < drag.from && stop >= dragTarget
                ? ROW_PITCH
                : 0
            : 0
        return (
          <div
            key={`stop-row-${stopItem.id}`}
            style={
              {
                "--element-transform": dragging
                  ? `translateY(${drag.offset}px)`
                  : shift
                    ? `translateY(${shift}px)`
                    : undefined,
              } as React.CSSProperties
            }
            onClick={() => {
              onActiveStopChange(stop)
            }}
            onPointerEnter={() => onHoverStop?.(stop)}
            onPointerLeave={() => onHoverStop?.(null)}
            className={cn(
              "group/row relative -mx-1.5 grid h-8 items-center gap-x-1 rounded-md px-1.5 text-left text-control",
              reorderable
                ? "grid-cols-[16px_minmax(0,1fr)_24px]"
                : "grid-cols-[52px_minmax(0,1fr)_28px]",
              dragging
                ? "z-10 bg-muted shadow-mesh-handle"
                : drag
                  ? "transition-transform duration-150"
                  : active
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-muted/60",
              "transform-(--element-transform)"
            )}
          >
            {reorderable && (
              <span
                role="button"
                tabIndex={-1}
                aria-label={`Drag to reorder point ${stop + 1}`}
                title="Drag to reorder"
                className={cn(
                  "grid h-7 touch-none place-items-center rounded text-muted-foreground/50 transition-colors hover:text-foreground",
                  dragging ? "cursor-grabbing text-foreground" : "cursor-grab"
                )}
                onPointerDown={(event) => startReorder(stop, event)}
                onClick={(event) => event.stopPropagation()}
              >
                <GripVertical aria-hidden="true" className="size-3.5" />
              </span>
            )}
            {!reorderable && (
              <PercentField
                key={`${stopItem.id}-${Math.round(stopItem.position * 1000)}`}
                label={`Stop ${stop + 1} position`}
                value={stopItem.position}
                onFocus={() => onActiveStopChange(stop)}
                onCommit={(raw) => onCommitStopPositionInput(stopItem.id, raw)}
              />
            )}
            <span
              className="flex h-7 min-w-0 items-center gap-1.5 rounded-md bg-muted/60 px-1.5 font-mono text-foreground uppercase focus-within:ring-2 focus-within:ring-ring/35"
              onClick={(event) => event.stopPropagation()}
            >
              <Popover
                open={openStopEditor === stop && openStopEditorAnchor === "row"}
                onOpenChange={(open, eventDetails) => {
                  if (!open && eventDetails.reason === "outside-press") {
                    const event = eventDetails.event
                    if ("clientX" in event && "clientY" in event) {
                      onCaptureStopOutsidePointer(event)
                      eventDetails.cancel()
                      return
                    }
                  }
                  onOpenStopEditorChange(
                    open ? stop : null,
                    open ? "row" : null
                  )
                  if (open) onActiveStopChange(stop)
                }}
              >
                <PopoverTrigger
                  className="size-4.5 shrink-0 rounded-preview border border-border bg-(--swatch-color) focus:ring-2 focus:ring-ring/35 focus:outline-none"
                  style={{ "--swatch-color": stopColor } as React.CSSProperties}
                  onPointerDown={(event) => {
                    event.stopPropagation()
                    onStopEditorOpenIntent()
                  }}
                />
                <ColorStopEditorPopover
                  {...stopEditorProps}
                  contentRef={stopContentRef}
                  align="start"
                  side="left"
                />
              </Popover>
              <input
                key={`${stopItem.id}-${stopColor}`}
                type="text"
                spellCheck={false}
                aria-label={`Stop ${stop + 1} color`}
                defaultValue={stopColor.replace(/^#/, "").toUpperCase()}
                className="h-full min-w-0 flex-1 bg-transparent p-0 font-mono text-xs text-foreground uppercase outline-none"
                onFocus={(event) => {
                  onActiveStopChange(stop)
                  event.currentTarget.select()
                }}
                onBlur={(event) =>
                  onCommitStopColorInput(
                    stopItem.id,
                    event.currentTarget.value,
                    event.currentTarget
                  )
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    onCommitStopColorInput(
                      stopItem.id,
                      event.currentTarget.value,
                      event.currentTarget
                    )
                    event.currentTarget.blur()
                  }
                  if (event.key === "Escape") {
                    event.currentTarget.value = stopColor
                      .replace(/^#/, "")
                      .toUpperCase()
                    event.currentTarget.blur()
                  }
                }}
                onClick={(event) => event.stopPropagation()}
                onPointerDown={(event) => event.stopPropagation()}
              />
            </span>
            {
              <button
                type="button"
                aria-label={removeLabel}
                title={canRemoveStop ? removeLabel : undefined}
                disabled={!canRemoveStop}
                className={cn(
                  "flex size-6 items-center justify-center rounded-md focus:ring-2 focus:ring-ring/35 focus:outline-none",
                  canRemoveStop
                    ? "text-muted-foreground hover:bg-muted hover:text-foreground"
                    : "cursor-default text-muted-foreground/35"
                )}
                onClick={(event) => {
                  event.stopPropagation()
                  if (!canRemoveStop) return
                  onRemoveStop?.(stop)
                }}
              >
                <Minus className="size-3.5" aria-hidden="true" />
              </button>
            }
          </div>
        )
      })}
    </div>
  )
}

/** A compact 0–100% field that commits on Enter or blur and reverts on Escape. */
export function PercentField({
  label,
  prefix,
  value,
  onFocus,
  onCommit,
}: {
  label: string
  prefix?: string
  value: number
  onFocus: () => void
  onCommit: (raw: string) => void
}) {
  const display = String(Math.round(value * 100))
  return (
    <label
      className="flex h-7 min-w-0 items-center gap-0.5 rounded-md px-1.5 font-mono text-2xs text-foreground/80 tabular-nums transition-colors focus-within:bg-muted/70 focus-within:text-foreground focus-within:ring-2 focus-within:ring-ring/35 hover:bg-muted/50"
      onClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
    >
      {prefix && (
        <span className="text-3xs font-medium text-muted-foreground/70">
          {prefix}
        </span>
      )}
      <input
        type="text"
        inputMode="decimal"
        aria-label={label}
        defaultValue={display}
        className="h-full min-w-0 flex-1 bg-transparent p-0 text-right text-inherit outline-none"
        onFocus={(event) => {
          onFocus()
          event.currentTarget.select()
        }}
        onBlur={(event) => onCommit(event.currentTarget.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur()
          if (event.key === "Escape") {
            event.currentTarget.value = display
            event.currentTarget.blur()
          }
        }}
      />
      <span className="text-3xs text-muted-foreground/60">%</span>
    </label>
  )
}
