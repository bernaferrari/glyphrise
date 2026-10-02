"use client"

import React from "react"
import type { EasingType, ShapeStop } from "../TimelineModel"
import type { ShapeClipBounds, TransitionWindow } from "./TimelineLayoutModel"
import type { TimelineMenuItem } from "./TimelineMenuModel"
import { TimelineTransitionWindows } from "./TimelineTransitionWindows"
import { TimelineShapeClips } from "./TimelineShapeClips"
import type { WipeDirectionOption } from "./TimelineTypes"

type TimelineShapeLaneProps = {
  duration: number
  shapes: ShapeStop[]
  sortedShapes: ShapeStop[]
  selectedShapeId: string | null
  openClipEditor: string | null
  wipeDirections: WipeDirectionOption[]
  transitionWindows: TransitionWindow[]
  clipBounds: ShapeClipBounds[]
  shapeDraggedRef: React.MutableRefObject<boolean>
  shapeLabel: (stop: ShapeStop) => string
  timeFromClientX: (
    clientX: number,
    options?: { bypass?: boolean; clampToViewport?: boolean }
  ) => number
  onClearSelectedKeyframe: () => void
  onScrubStart?: () => void
  onTimeChange: (time: number) => void
  onOpenClipEditorChange: (shapeId: string | null) => void
  onShapeBlendChange: (
    id: string,
    patch: Partial<
      Pick<
        ShapeStop,
        "transitionType" | "wipeDirection" | "transitionStart" | "transitionEnd"
      >
    >
  ) => void
  onShapeEasingChange: (id: string, easing: EasingType) => void
  onTransitionEdgeDrag: (
    event: React.PointerEvent<HTMLElement>,
    shapeId: string,
    edge: "start" | "end",
    fromTime: number,
    toTime: number
  ) => void
  onSelectShape: (id: string) => void
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

export function TimelineShapeLane({
  duration,
  shapes,
  sortedShapes,
  selectedShapeId,
  openClipEditor,
  wipeDirections,
  transitionWindows,
  clipBounds,
  shapeDraggedRef,
  shapeLabel,
  timeFromClientX,
  onClearSelectedKeyframe,
  onScrubStart,
  onTimeChange,
  onOpenClipEditorChange,
  onShapeBlendChange,
  onShapeEasingChange,
  onTransitionEdgeDrag,
  onSelectShape,
  onOpenShapePicker,
  onUploadShape,
  onRemoveShape,
  onShapeDrag,
  onOpenContextMenu,
  createGoToMenuItem,
  onAddShape,
}: TimelineShapeLaneProps) {
  return (
    <div
      className={`relative h-[var(--timeline-shape-height)] border-b border-border transition-colors ${
        selectedShapeId ? "bg-muted/45" : "hover:bg-muted/35"
      }`}
      onMouseDown={(event) => {
        if (event.button !== 0) return
        onClearSelectedKeyframe()
        onScrubStart?.()
        onTimeChange(timeFromClientX(event.clientX))
      }}
      onContextMenu={(event) => {
        const time = timeFromClientX(event.clientX, {
          bypass: event.altKey,
        })
        onOpenContextMenu(event, "Icon clips", [
          createGoToMenuItem(event, time),
        ])
      }}
    >
      <TimelineTransitionWindows
        duration={duration}
        transitionWindows={transitionWindows}
        openClipEditor={openClipEditor}
        wipeDirections={wipeDirections}
        onOpenClipEditorChange={onOpenClipEditorChange}
        onShapeBlendChange={onShapeBlendChange}
        onShapeEasingChange={onShapeEasingChange}
        onTransitionEdgeDrag={onTransitionEdgeDrag}
        onOpenContextMenu={onOpenContextMenu}
        createGoToMenuItem={createGoToMenuItem}
        shapeLabel={shapeLabel}
        timeFromClientX={timeFromClientX}
      />
      <TimelineShapeClips
        duration={duration}
        sortedShapes={sortedShapes}
        shapes={shapes}
        selectedShapeId={selectedShapeId}
        clipBounds={clipBounds}
        shapeLabel={shapeLabel}
        shapeDraggedRef={shapeDraggedRef}
        onSelectShape={onSelectShape}
        onOpenShapePicker={onOpenShapePicker}
        onUploadShape={onUploadShape}
        onRemoveShape={onRemoveShape}
        onShapeDrag={onShapeDrag}
        onOpenContextMenu={onOpenContextMenu}
        createGoToMenuItem={createGoToMenuItem}
        onAddShape={onAddShape}
      />
    </div>
  )
}
