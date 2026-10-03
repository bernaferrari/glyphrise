"use client"

import React from "react"
import type { ShapeStop } from "../TimelineModel"
import { widthForSpan, xForFrac } from "./TimelineGeometry"
import type { ShapeClipBounds } from "./TimelineLayoutModel"
import type { TimelineMenuItem } from "./TimelineMenuModel"

export type TimelineShapeClipProps = {
  duration: number
  stop: ShapeStop
  shapeCount: number
  selectedShapeId: string | null
  bounds: ShapeClipBounds
  shapeDraggedRef: React.MutableRefObject<boolean>
  shapeLabel: (stop: ShapeStop) => string
  onSelectShape: (id: string) => void
  onSeek: (time: number) => void
  onOpenShapePicker: (id: string | null) => void
  onUploadShape: (id: string) => void
  onRemoveShape: (id: string) => void
  onShapeDrag: (event: React.PointerEvent<HTMLElement>, shapeId: string) => void
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
  onAddShape: () => void
}

export function TimelineShapeClip({
  duration,
  stop,
  shapeCount,
  selectedShapeId,
  bounds,
  shapeDraggedRef,
  shapeLabel,
  onSelectShape,
  onSeek,
  onOpenShapePicker,
  onUploadShape,
  onRemoveShape,
  onShapeDrag,
  onOpenContextMenu,
  createGoToMenuItem,
  onAddShape,
}: TimelineShapeClipProps) {
  const selected = stop.id === selectedShapeId
  const isOnly = bounds.isOnly

  return (
    <button
      type="button"
      aria-label={`${shapeLabel(stop)} icon clip`}
      aria-pressed={selected}
      data-clip-id={stop.id}
      title={
        isOnly
          ? `${shapeLabel(stop)} · double-click to change the icon`
          : `${shapeLabel(stop)} at ${stop.time.toFixed(2)}s · drag to retime, double-click to change the icon`
      }
      onMouseDown={(event) => event.stopPropagation()}
      onClick={() => {
        if (shapeDraggedRef.current) {
          shapeDraggedRef.current = false
          return
        }
        onSelectShape(stop.id)
        onSeek(stop.time)
      }}
      onDoubleClick={() => {
        onSelectShape(stop.id)
        onOpenShapePicker(stop.id)
      }}
      onContextMenu={(event) =>
        onOpenContextMenu(event, shapeLabel(stop), [
          createGoToMenuItem(event, stop.time, () => onSelectShape(stop.id)),
          { type: "separator" },
          {
            label: "Change icon…",
            onSelect: () => {
              onSelectShape(stop.id)
              onOpenShapePicker(stop.id)
            },
          },
          {
            label: "Upload SVG",
            onSelect: () => onUploadShape(stop.id),
          },
          { type: "separator" },
          {
            label: "Add icon clip at playhead",
            onSelect: onAddShape,
          },
          {
            label: "Remove icon clip",
            danger: true,
            disabled: shapeCount <= 1,
            onSelect: () => onRemoveShape(stop.id),
          },
        ])
      }
      onPointerDown={
        isOnly ? undefined : (event) => onShapeDrag(event, stop.id)
      }
      className={`timeline-icon-clip group/clip absolute inset-y-1.5 flex touch-none items-stretch overflow-hidden rounded-md border bg-(--timeline-clip) text-left transition-[box-shadow,border-color,filter] duration-100 hover:brightness-[1.06] focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
        isOnly ? "cursor-pointer" : "cursor-grab active:cursor-grabbing"
      } ${
        selected
          ? "z-[5] border-(--timeline-accent) shadow-[0_0_0_1px_var(--timeline-accent)]"
          : "border-(--timeline-clip-edge)"
      }`}
      style={{
        left: xForFrac(bounds.left / duration),
        width: widthForSpan(Math.max(0, bounds.right - bounds.left) / duration),
        minWidth: 36,
      }}
    >
      <span className="@container flex h-full w-full min-w-0 items-center gap-1.5 px-2 @max-[44px]:justify-center @max-[44px]:px-0">
        <span
          aria-hidden="true"
          className="grid size-4 shrink-0 place-items-center text-(--timeline-clip-fg) [&_svg]:size-4 [&_svg]:fill-current [&_svg]:stroke-current"
          dangerouslySetInnerHTML={{ __html: stop.svgContent }}
        />
        <span className="min-w-0 truncate text-xs font-medium text-(--timeline-clip-fg) @max-[72px]:hidden">
          {shapeLabel(stop)}
        </span>
        {isOnly && (
          <span className="ml-auto shrink truncate text-[11px] text-(--timeline-clip-fg)/65 @max-[420px]:hidden">
            Add another icon to morph between them
          </span>
        )}
      </span>
    </button>
  )
}
