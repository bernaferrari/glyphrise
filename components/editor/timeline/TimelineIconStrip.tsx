"use client"

import { Plus } from "lucide-react"
import type { TimelineShapeLaneProps } from "./TimelineLanesSurfaceTypes"

export function TimelineIconStrip({
  shapeLane,
}: {
  shapeLane: TimelineShapeLaneProps
}) {
  return (
    <div
      aria-label="Icons in your animation"
      className="editor-scrollbar flex shrink-0 items-center gap-2 overflow-x-auto overscroll-x-contain border-b border-border/50 px-3 py-2"
    >
      <span className="shrink-0 text-xs font-medium text-muted-foreground">
        Icons
      </span>
      {shapeLane.sortedShapes.map((shape) => (
        <button
          key={shape.id}
          type="button"
          aria-label={`Select ${shapeLane.shapeLabel(shape)} icon at ${shape.time.toFixed(2)}s`}
          aria-pressed={shapeLane.selectedShapeId === shape.id}
          onClick={() => {
            shapeLane.onScrubStart?.()
            shapeLane.onClearSelectedKeyframe()
            shapeLane.onSelectShape(shape.id)
            shapeLane.onTimeChange(shape.time)
          }}
          className="flex min-h-11 min-w-28 shrink-0 items-center gap-2 rounded-lg border border-border bg-muted/40 px-2 text-left hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring aria-pressed:border-primary aria-pressed:bg-primary/10"
        >
          <span
            aria-hidden="true"
            className="grid size-8 shrink-0 place-items-center [&_svg]:size-6 [&_svg_*]:fill-current"
            style={{ color: shape.color }}
            dangerouslySetInnerHTML={{ __html: shape.svgContent }}
          />
          <span className="grid max-w-28 gap-0.5">
            <span className="truncate text-xs font-medium">
              {shapeLane.shapeLabel(shape)}
            </span>
            <span className="text-[11px] text-muted-foreground tabular-nums">
              {shape.time.toFixed(2)}s
            </span>
          </span>
        </button>
      ))}
      <button
        type="button"
        aria-label="Add icon to animation"
        onClick={shapeLane.onAddShape}
        className="grid size-11 shrink-0 place-items-center rounded-lg border border-dashed border-border text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
      >
        <Plus aria-hidden="true" className="size-4" />
      </button>
    </div>
  )
}
