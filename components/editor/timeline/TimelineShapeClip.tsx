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
  /** Position in time order, for Move earlier/later. */
  index: number
  selectedShapeId: string | null
  bounds: ShapeClipBounds
  shapeDraggedRef: React.MutableRefObject<boolean>
  shapeLabel: (stop: ShapeStop) => string
  onSelectShape: (id: string) => void
  onOpenShapePicker: (id: string | null) => void
  onUploadShape: (id: string) => void
  onMoveShapeOrder: (id: string, direction: -1 | 1) => void
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
  index,
  selectedShapeId,
  bounds,
  shapeDraggedRef,
  shapeLabel,
  onSelectShape,
  onOpenShapePicker,
  onUploadShape,
  onMoveShapeOrder,
  onRemoveShape,
  onShapeDrag,
  onOpenContextMenu,
  createGoToMenuItem,
  onAddShape,
}: TimelineShapeClipProps) {
  const selected = stop.id === selectedShapeId
  const isOnly = bounds.isOnly
  const isFirst = index === 0
  const isLast = index === shapeCount - 1

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
            label: "Move earlier",
            disabled: isFirst,
            onSelect: () => onMoveShapeOrder(stop.id, -1),
          },
          {
            label: "Move later",
            disabled: isLast,
            onSelect: () => onMoveShapeOrder(stop.id, 1),
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
      className={`timeline-icon-clip group/clip absolute inset-y-1.5 flex touch-none items-stretch overflow-hidden rounded-md text-left transition-[background-color,box-shadow] duration-100 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
        isOnly ? "cursor-pointer" : "cursor-grab active:cursor-grabbing"
      } ${
        // Rings sit inside the clip so neighbours never overlap.
        selected
          ? "z-[5] bg-[color-mix(in_oklab,var(--timeline-accent)_32%,var(--timeline-lane))] shadow-[inset_0_0_0_1.5px_var(--timeline-accent)]"
          : "bg-(--timeline-clip) shadow-[inset_0_0_0_1px_var(--timeline-clip-edge),inset_0_1px_0_rgb(255_255_255/0.06)] hover:bg-[color-mix(in_oklab,var(--timeline-accent)_24%,var(--timeline-lane))]"
      }`}
      style={{
        // A hairline gap keeps adjacent clips visibly separate.
        left: xForFrac(bounds.left / duration, 1),
        width: `calc(${widthForSpan(Math.max(0, bounds.right - bounds.left) / duration)} - 2px)`,
        minWidth: 32,
      }}
    >
      <span className="@container flex h-full w-full min-w-0 items-center gap-2 pr-2.5 pl-1.5 @max-[48px]:justify-center @max-[48px]:px-0">
        <span
          aria-hidden="true"
          className="grid size-6 shrink-0 place-items-center rounded-[5px] bg-black/20 text-(--timeline-clip-fg) [&_svg]:size-3.5 [&_svg]:fill-current [&_svg]:stroke-current"
          dangerouslySetInnerHTML={{ __html: stop.svgContent }}
        />
        <span className="min-w-0 truncate text-xs font-medium text-(--timeline-clip-fg) @max-[80px]:hidden">
          {shapeLabel(stop)}
        </span>
        {isOnly && (
          <span className="ml-auto shrink truncate text-[11px] text-(--timeline-clip-fg)/60 @max-[420px]:hidden">
            Add another icon to morph between them
          </span>
        )}
      </span>
    </button>
  )
}
