"use client"

import { ChevronLeft, ChevronRight, Trash2, X } from "lucide-react"
import { useRef, type ReactNode } from "react"
import { Popover, PopoverContent, PopoverTitle } from "@/components/ui/popover"
import { NumberField } from "../NumberField"
import { InspectorSlider } from "../InspectorSlider"
import type { EasingType } from "../TimelineModel"
import { EasingChoices } from "./TimelineEasingControls"

export type ListFrame = {
  id: string
  time: number
  label?: string
  easing?: EasingType
  value?: number
}
export type ListRow = {
  id: string
  name: string
  color: string
  keyframes: ListFrame[]
  onMove: (frame: ListFrame, time: number) => void
  onRemove?: (frame: ListFrame) => void
  onEasing?: (frame: ListFrame, easing: EasingType) => void
  onEditValue?: (frame: ListFrame) => void
  valueRange?: {
    min: number
    max: number
    onChange: (frame: ListFrame, value: number) => void
  }
}

const headerButton =
  "grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-30"

/**
 * The selected keyframe's details, in a small panel anchored to its diamond
 * (as in Figma). Opens on selection; Esc or clicking elsewhere closes it.
 */
export function TimelineKeyframeEditor({
  row,
  frame,
  duration,
  open,
  anchor,
  onClose,
  onDelete,
  onEditValue,
  onNavigate,
  valueEditor,
}: {
  row: ListRow | undefined
  frame: ListFrame | undefined
  duration: number
  open: boolean
  anchor: () => Element | null
  onClose: () => void
  onDelete: () => void
  onEditValue: () => void
  onNavigate: (frame: ListFrame) => void
  valueEditor?: ReactNode
}) {
  const deletedRef = useRef(false)
  // Selection clears on delete, so remember which row to return focus to.
  const rowIdRef = useRef<string | null>(null)
  if (row) rowIdRef.current = row.id
  const sorted = row ? [...row.keyframes].sort((a, b) => a.time - b.time) : []
  const index = frame ? sorted.findIndex((item) => item.id === frame.id) : -1
  const previous = index > 0 ? sorted[index - 1] : undefined
  const next = index >= 0 ? sorted[index + 1] : undefined

  return (
    <Popover
      open={open && !!row && !!frame}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose()
      }}
      onOpenChangeComplete={(isOpen) => {
        if (!isOpen) deletedRef.current = false
      }}
    >
      <PopoverContent
        anchor={anchor}
        side="top"
        align="center"
        sideOffset={10}
        collisionPadding={8}
        initialFocus={false}
        // Closing returns focus to the keyframe so arrow keys keep working.
        finalFocus={() =>
          // The keyframe, or — if it was deleted — its row's ◆ toggle, or
          // the Add row when the whole row disappeared.
          (anchor() ??
            (rowIdRef.current &&
              document.querySelector(
                `[data-rail-keyframe="${rowIdRef.current}"]`
              )) ??
            document.getElementById(
              "timeline-add-property"
            )) as HTMLElement | null
        }
        aria-label={row ? `${row.name} keyframe` : "Keyframe"}
        className="w-80 gap-0 p-0"
        onPointerDown={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
      >
        {row && frame && (
          <>
            <div className="flex items-center gap-1 border-b border-border py-1.5 pr-1.5 pl-3">
              <svg
                aria-hidden="true"
                viewBox="0 0 16 16"
                className="size-3.5 fill-(--timeline-accent,currentColor)"
              >
                <rect
                  x="4"
                  y="4"
                  width="8"
                  height="8"
                  rx="1.2"
                  transform="rotate(45 8 8)"
                />
              </svg>
              <PopoverTitle className="ml-1 min-w-0 flex-1 truncate text-[13px] font-medium">
                {row.name}
                <span className="ml-1.5 font-normal text-muted-foreground tabular-nums">
                  {index + 1} of {sorted.length}
                </span>
              </PopoverTitle>
              <button
                type="button"
                aria-label="Previous keyframe in row"
                disabled={!previous}
                onClick={() => previous && onNavigate(previous)}
                className={headerButton}
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                aria-label="Next keyframe in row"
                disabled={!next}
                onClick={() => next && onNavigate(next)}
                className={headerButton}
              >
                <ChevronRight className="size-4" />
              </button>
              {row.onRemove && (
                <button
                  type="button"
                  aria-label={`Delete ${row.name} keyframe at ${frame.time.toFixed(2)}s`}
                  title="Delete keyframe (Delete)"
                  onClick={() => {
                    deletedRef.current = true
                    onDelete()
                  }}
                  className={`${headerButton} hover:text-destructive`}
                >
                  <Trash2 className="size-3.5" />
                </button>
              )}
              <button
                type="button"
                aria-label="Close keyframe editor"
                onClick={onClose}
                className={headerButton}
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="grid gap-3 p-3">
              {valueEditor ? (
                <div className="grid gap-1.5">
                  <span className="text-[11px] text-muted-foreground">
                    {row.name === "Rotation" ? "Angle" : "Position"}
                  </span>
                  {valueEditor}
                </div>
              ) : row.valueRange && frame.value !== undefined ? (
                <div className="grid gap-1.5">
                  <span className="text-[11px] text-muted-foreground">
                    Value
                  </span>
                  <InspectorSlider
                    value={frame.value}
                    min={row.valueRange.min}
                    max={row.valueRange.max}
                    step={0.05}
                    precision={2}
                    ariaLabel={`${row.name} keyframe value`}
                    onChange={(value) => row.valueRange?.onChange(frame, value)}
                  />
                </div>
              ) : row.onEditValue ? (
                <button
                  type="button"
                  onClick={onEditValue}
                  className="min-h-9 rounded-lg bg-muted text-xs font-medium hover:bg-muted/70 focus-visible:outline-2 focus-visible:outline-ring"
                >
                  Edit{" "}
                  {row.name === "Style" ? "appearance" : row.name.toLowerCase()}{" "}
                  at this moment
                </button>
              ) : null}

              <label className="flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
                Time
                <NumberField
                  value={frame.time}
                  min={0}
                  max={duration}
                  step={0.1}
                  precision={2}
                  suffix="s"
                  ariaLabel={`${row.name} keyframe time in seconds`}
                  className="h-8 w-24"
                  onChange={(time) => row.onMove(frame, time)}
                />
              </label>

              {row.onEasing && next && (
                <div className="grid gap-1.5">
                  <span className="text-[11px] text-muted-foreground">
                    Ease into next keyframe
                  </span>
                  <EasingChoices
                    label={`${row.name} keyframe easing`}
                    value={frame.easing ?? "ease-in-out"}
                    onChange={(easing) => row.onEasing?.(frame, easing)}
                  />
                </div>
              )}
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}
