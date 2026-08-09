"use client"

import { Loader2, Plus } from "lucide-react"

type TimelineShapeHeaderRowProps = {
  selectedShapeId: string | null
  isPreviewLoading: boolean
  onAddShape: () => void
}

export function TimelineShapeHeaderRow({
  selectedShapeId,
  isPreviewLoading,
  onAddShape,
}: TimelineShapeHeaderRowProps) {
  return (
    <div
      className={`group flex h-9 items-center gap-2 border-b border-border px-3 transition-colors ${
        selectedShapeId ? "bg-muted/25" : "hover:bg-muted/40"
      }`}
    >
      <span className="flex-1 truncate text-[11px] font-semibold text-foreground">
        Icon clips
      </span>
      {isPreviewLoading && (
        <Loader2
          aria-label="Preparing 3D icon"
          className="size-3.5 shrink-0 animate-spin text-muted-foreground motion-reduce:animate-none"
        />
      )}
      <button
        type="button"
        aria-label="Add icon clip"
        title="Add icon clip at playhead"
        onClick={onAddShape}
        className="flex h-7 shrink-0 items-center gap-1 rounded-md bg-foreground/[0.045] px-2 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-foreground/[0.08] hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring/40 focus-visible:outline-none"
      >
        <Plus className="size-3.5" />
        Add
      </button>
    </div>
  )
}
