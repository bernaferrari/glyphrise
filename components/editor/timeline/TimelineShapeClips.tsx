"use client"

import React from "react"
import type { ShapeStop } from "../TimelineModel"
import { TimelineShapeClip } from "./TimelineShapeClip"
import type { ShapeClipBounds } from "./TimelineLayoutModel"
import type { TimelineMenuItem } from "./TimelineMenuModel"

export function TimelineShapeClips({
  duration,
  sortedShapes,
  shapes,
  selectedShapeId,
  clipBounds,
  shapeLabel,
  shapeDraggedRef,
  onSelectShape,
  onSeek,
  onOpenShapePicker,
  onUploadShape,
  onMoveShapeOrder,
  onRemoveShape,
  onShapeDrag,
  onOpenContextMenu,
  createGoToMenuItem,
  onAddShape,
}: {
  duration: number
  sortedShapes: ShapeStop[]
  shapes: ShapeStop[]
  selectedShapeId: string | null
  clipBounds: ShapeClipBounds[]
  shapeLabel: (stop: ShapeStop) => string
  shapeDraggedRef: React.MutableRefObject<boolean>
  onSelectShape: (id: string) => void
  onSeek: (time: number) => void
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
}) {
  return (
    <>
      {sortedShapes.map((stop, index) => {
        const bounds = clipBounds[index]
        return (
          <TimelineShapeClip
            key={stop.id}
            index={index}
            duration={duration}
            stop={stop}
            shapeCount={shapes.length}
            selectedShapeId={selectedShapeId}
            bounds={bounds}
            shapeDraggedRef={shapeDraggedRef}
            shapeLabel={shapeLabel}
            onSelectShape={onSelectShape}
            onSeek={onSeek}
            onOpenShapePicker={onOpenShapePicker}
            onUploadShape={onUploadShape}
            onMoveShapeOrder={onMoveShapeOrder}
            onRemoveShape={onRemoveShape}
            onShapeDrag={onShapeDrag}
            onOpenContextMenu={onOpenContextMenu}
            createGoToMenuItem={createGoToMenuItem}
            onAddShape={onAddShape}
          />
        )
      })}
    </>
  )
}
