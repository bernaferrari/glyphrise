"use client"

import { ChevronLeft, ChevronRight, Trash2, X } from "lucide-react"
import { useRef, type ReactNode } from "react"
import { Popover, PopoverContent, PopoverTitle } from "@/components/ui/popover"
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
  "grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-30"

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
        density="flush"
        className="w-116 max-w-(--spacing-screen-inset-2)"
        onPointerDown={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
      >
        {row && frame && (
          <>
            <div className="flex items-center gap-1 border-b border-border px-4 py-2">
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
              <PopoverTitle truncate={true} className="ml-1 min-w-0 flex-1">
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

            {/* Same label | control rows as the inspector. */}
            <div className="grid gap-3 p-4">
              {valueEditor ? (
                <PanelRow
                  label={row.name === "Rotation" ? "Angle" : "Position"}
                >
                  {valueEditor}
                </PanelRow>
              ) : row.valueRange && frame.value !== undefined ? (
                <PanelRow label="Value">
                  <InspectorSlider
                    compact
                    value={frame.value}
                    min={row.valueRange.min}
                    max={row.valueRange.max}
                    step={0.05}
                    precision={2}
                    ariaLabel={`${row.name} keyframe value`}
                    onChange={(value) => row.valueRange?.onChange(frame, value)}
                  />
                </PanelRow>
              ) : row.onEditValue ? (
                <PanelRow label="Value">
                  <button
                    type="button"
                    onClick={onEditValue}
                    className="h-8 w-full rounded-lg bg-muted text-xs font-medium hover:bg-muted/70 focus-visible:outline-2 focus-visible:outline-ring"
                  >
                    Edit{" "}
                    {row.name === "Style"
                      ? "appearance"
                      : row.name.toLowerCase()}
                  </button>
                </PanelRow>
              ) : null}

              <PanelRow label="Time">
                <InspectorSlider
                  compact
                  value={frame.time}
                  min={0}
                  max={duration}
                  step={0.01}
                  scrubStep={0.05}
                  precision={2}
                  suffix="s"
                  ariaLabel={`${row.name} keyframe time in seconds`}
                  onChange={(time) => row.onMove(frame, time)}
                />
              </PanelRow>

              {row.onEasing && next && (
                <PanelRow label="Easing">
                  <EasingChoices
                    compact
                    label={`${row.name} keyframe easing`}
                    value={frame.easing ?? "ease-in-out"}
                    onChange={(easing) => row.onEasing?.(frame, easing)}
                  />
                </PanelRow>
              )}
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}

function PanelRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid min-h-8 grid-cols-property items-center gap-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="min-w-0">{children}</div>
    </div>
  )
}
