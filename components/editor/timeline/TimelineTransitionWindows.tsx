"use client"

import React from "react"
import type { EasingType, ShapeStop } from "../TimelineModel"
import type { TransitionWindow } from "./TimelineLayoutModel"
import type { WipeDirectionOption } from "./TimelineTypes"
import type { TimelineMenuItem } from "./TimelineMenuModel"
import { TimelineTransitionWindow } from "./TimelineTransitionWindow"
import type { TransitionEdge } from "./TimelineTransitionModel"

type TimelineTransitionWindowsProps = {
  duration: number
  transitionWindows: TransitionWindow[]
  openClipEditor: string | null
  wipeDirections: WipeDirectionOption[]
  onOpenClipEditorChange: (shapeId: string | null) => void
  onShapeBlendChange: (
    id: string,
    patch: Partial<Pick<ShapeStop, "transitionType" | "wipeDirection">>
  ) => void
  onShapeEasingChange: (id: string, easing: EasingType) => void
  onTransitionEdgeDrag: (
    event: React.PointerEvent<HTMLElement>,
    shapeId: string,
    edge: TransitionEdge,
    fromTime: number,
    toTime: number
  ) => void
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
  shapeLabel: (stop: ShapeStop) => string
  timeFromClientX: (
    clientX: number,
    options?: { bypass?: boolean; clampToViewport?: boolean }
  ) => number
}

export function TimelineTransitionWindows({
  duration,
  transitionWindows,
  openClipEditor,
  wipeDirections,
  onOpenClipEditorChange,
  onShapeBlendChange,
  onShapeEasingChange,
  onTransitionEdgeDrag,
  onOpenContextMenu,
  createGoToMenuItem,
  shapeLabel,
  timeFromClientX,
}: TimelineTransitionWindowsProps) {
  return (
    <>
      {transitionWindows.map((window) => (
        <TimelineTransitionWindow
          key={`transition-${window.stop.id}`}
          duration={duration}
          window={window}
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
      ))}
    </>
  )
}
