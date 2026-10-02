"use client"

import {
  Diamond,
  Layers3,
  Move3D,
  Palette,
  Plus,
  Rotate3D,
  Sun,
  Scaling,
} from "lucide-react"
import { keyframeTimeMatches } from "../EditorKeyframeModel"
import type { EasingType } from "../TimelineModel"
import { getEasingLabel } from "./TimelineEasingControls"

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
  selectedId?: string
  onSelect: (frame: ListFrame) => void
  onMove: (frame: ListFrame, time: number) => void
  onRemove?: (frame: ListFrame) => void
  onEasing?: (frame: ListFrame, easing: EasingType) => void
  onAdd?: () => void
  onEditValue?: (frame: ListFrame) => void
  valueRange?: {
    min: number
    max: number
    onChange: (frame: ListFrame, value: number) => void
  }
}

export function KeyframeListRow({
  row,
  duration,
  currentTime,
  onFrameElement,
  onAddElement,
}: {
  row: ListRow
  duration: number
  currentTime: number
  onFrameElement: (id: string, element: HTMLButtonElement | null) => void
  onAddElement: (element: HTMLButtonElement | null) => void
}) {
  const Icon =
    row.id === "rotation"
      ? Rotate3D
      : row.id === "move"
        ? Move3D
        : row.id === "style"
          ? Palette
          : row.id === "extrusion"
            ? Layers3
            : row.id === "light-position" || row.id === "lighting"
              ? Sun
              : Scaling
  const keyedHere = row.keyframes.some((frame) =>
    keyframeTimeMatches(frame.time, currentTime)
  )
  return (
    <section
      aria-label={`${row.name} keyframes`}
      className="border-b border-border/60 py-3 min-[720px]:grid min-[720px]:grid-cols-[180px_1fr] min-[720px]:items-center min-[720px]:gap-5"
    >
      <div className="flex items-center gap-3">
        <Icon
          aria-hidden="true"
          className="size-5 shrink-0 text-muted-foreground"
        />
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-medium">{row.name}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {row.keyframes.length} keyframes<span aria-hidden="true"> · </span>
            {getEasingLabel(row.keyframes[0]?.easing ?? "ease-in-out")}
          </p>
        </div>
        {row.onAdd && (
          <button
            ref={onAddElement}
            type="button"
            disabled={keyedHere}
            aria-label={`Add ${row.name} keyframe at ${currentTime.toFixed(2)}s`}
            title={
              keyedHere
                ? "A keyframe already exists here"
                : "Add keyframe at current time"
            }
            onClick={row.onAdd}
            className="flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring disabled:text-muted-foreground/40"
          >
            <Plus className="size-4" />
            <span className="min-[720px]:hidden">Add key</span>
          </button>
        )}
      </div>
      <div className="editor-scrollbar mt-3 overflow-x-auto overscroll-x-contain min-[720px]:mt-0 min-[720px]:max-w-xl">
        <div
          className="relative grid gap-2"
          style={{
            gridTemplateColumns: `repeat(${Math.max(1, row.keyframes.length)}, minmax(96px,1fr))`,
          }}
        >
          {row.keyframes.map((frame) => (
            <button
              key={frame.id}
              ref={(element) => onFrameElement(frame.id, element)}
              type="button"
              aria-label={`Edit ${row.name} keyframe at ${frame.time.toFixed(2)}s`}
              aria-pressed={row.selectedId === frame.id}
              onClick={() => row.onSelect(frame)}
              className="group relative flex min-h-18 min-w-24 flex-col items-start justify-center gap-1 rounded-xl border border-border bg-muted/30 px-3 py-2 text-[13px] font-medium text-foreground tabular-nums transition-[background-color,border-color,color] hover:border-ring hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring aria-pressed:border-foreground aria-pressed:bg-foreground aria-pressed:text-background"
            >
              <span className="absolute top-3 right-3 grid size-4 place-items-center">
                <Diamond
                  aria-hidden="true"
                  className="size-3 fill-transparent stroke-current group-aria-pressed:fill-current"
                />
              </span>
              <span>
                {keyframeTimeMatches(frame.time, 0)
                  ? "Start"
                  : keyframeTimeMatches(frame.time, duration)
                    ? "End"
                    : `${frame.time.toFixed(2)}s`}
              </span>
              <span className="text-xs font-normal opacity-70">
                {frame.time.toFixed(2)}s
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
