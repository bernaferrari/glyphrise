"use client"

import { Loader2, Plus, Shapes } from "lucide-react"

type TimelineShapeHeaderRowProps = {
  shapeCount: number
  selectedShapeId: string | null
  isPreviewLoading: boolean
  onAddShape: () => void
}

export function TimelineShapeHeaderRow({
  shapeCount,
  selectedShapeId,
  isPreviewLoading,
  onAddShape,
}: TimelineShapeHeaderRowProps) {
  return (
    <div
      className={`group flex h-(--timeline-shape-height) items-center gap-2 border-b border-border pr-1.5 pl-3 transition-colors ${
        selectedShapeId ? "bg-foreground/[0.03]" : ""
      }`}
    >
      <Shapes
        aria-hidden="true"
        className="size-3.5 shrink-0 text-muted-foreground"
      />
      <span className="min-w-0 flex-1 truncate text-xs font-medium text-foreground">
        Icons
        <span className="ml-1.5 font-normal text-muted-foreground tabular-nums">
          {shapeCount}
        </span>
      </span>
      {isPreviewLoading && (
        <Loader2
          aria-label="Preparing 3D icon"
          className="size-3.5 shrink-0 animate-spin text-muted-foreground"
        />
      )}
      <button
        type="button"
        aria-label="Add icon clip"
        title="Add an icon clip at the playhead"
        onClick={onAddShape}
        className="grid size-6 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-foreground/[0.08] hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring active:scale-95"
      >
        <Plus className="size-4" />
      </button>
    </div>
  )
}
