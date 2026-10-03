"use client"

import { MutableRefObject, RefObject, useRef } from "react"
import {
  bindWindowPointerDrag,
  safelyReleasePointerCapture,
  safelySetPointerCapture,
} from "@/lib/drag-events"
import type { ShapeStop } from "../TimelineModel"
import type { SnapTimeOptions } from "./TimelineSnapping"
import {
  adjacentShapeId,
  moveShapeStop,
  setShapeTransitionFraction,
  swapShapeIcons,
} from "./TimelineShapeModel"
import type { SelectedTimelineKeyframe } from "./TimelineTypes"

type RawTimeFromClientX = (clientX: number) => number
type SnapTime = (rawTime: number, options?: SnapTimeOptions) => number

type TimelineShapeDragOptions = {
  duration: number
  shapes: ShapeStop[]
  laneRef: RefObject<HTMLDivElement | null>
  rawTimeFromClientX: RawTimeFromClientX
  snapTime: SnapTime
  onScrubStart?: () => void
  onSelectShape: (id: string) => void
  onShapesChange: (shapes: ShapeStop[]) => void
  onSelectKeyframe: (keyframe: SelectedTimelineKeyframe) => void
}

type ShapeRetimeOptions = {
  select?: boolean
}

export function useTimelineShapeDrag({
  duration,
  shapes,
  laneRef,
  rawTimeFromClientX,
  snapTime,
  onScrubStart,
  onSelectShape,
  onShapesChange,
  onSelectKeyframe,
}: TimelineShapeDragOptions) {
  const shapeDraggedRef = useRef(false)
  const morphResizedRef = useRef(false)

  const retimeShapeByDrag = (
    event: React.PointerEvent<HTMLElement>,
    shapeId: string,
    draggedRef: MutableRefObject<boolean>,
    options: ShapeRetimeOptions = {}
  ) => {
    event.stopPropagation()
    event.preventDefault()
    if (!laneRef.current) return
    safelySetPointerCapture(event.currentTarget, event.pointerId)
    if (options.select) {
      onSelectShape(shapeId)
      onSelectKeyframe(null)
    }
    draggedRef.current = false
    const startX = event.clientX
    const startTime = shapes.find((shape) => shape.id === shapeId)?.time ?? 0
    const grabOffset = rawTimeFromClientX(event.clientX) - startTime
    // Reorder like a list: once the pointer crosses the middle of the
    // neighbouring clip (as laid out when the drag began, or at the last
    // swap), the two trade places and the drag carries on in the new slot.
    let working = shapes
    let homeTime = startTime
    const neighborMiddle = (direction: -1 | 1) => {
      const neighborId = adjacentShapeId(working, shapeId, direction)
      const neighbor = working.find((shape) => shape.id === neighborId)
      if (!neighbor) return null
      const end =
        direction === -1
          ? homeTime
          : (working.find(
              (shape) => shape.id === adjacentShapeId(working, neighbor.id, 1)
            )?.time ?? duration)
      return { neighbor, middle: neighbor.time + (end - neighbor.time) / 2 }
    }
    let previous = neighborMiddle(-1)
    let next = neighborMiddle(1)
    bindWindowPointerDrag({
      onMove: (moveEvent) => {
        if (Math.abs(moveEvent.clientX - startX) > 3) {
          if (!draggedRef.current) onScrubStart?.()
          draggedRef.current = true
        }
        const pointerTime = rawTimeFromClientX(moveEvent.clientX)
        const desired = pointerTime - grabOffset
        const target =
          previous && pointerTime < previous.middle
            ? previous.neighbor
            : next && pointerTime > next.middle
              ? next.neighbor
              : null
        if (target) {
          const vacatedSlotTime = homeTime
          homeTime = target.time
          working = swapShapeIcons(working, shapeId, target.id).map((shape) =>
            shape.id === target.id ? { ...shape, time: vacatedSlotTime } : shape
          )
          previous = neighborMiddle(-1)
          next = neighborMiddle(1)
        }
        const snapped = snapTime(desired, {
          bypass: moveEvent.altKey,
          excludeShapeId: shapeId,
          snapToPlayhead: true,
        })
        working = moveShapeStop({
          shapes: working,
          shapeId,
          time: snapped,
          duration,
        })
        onShapesChange(working)
      },
      onEnd: (endEvent) => {
        if (endEvent instanceof PointerEvent) {
          safelyReleasePointerCapture(event.currentTarget, endEvent.pointerId)
        }
      },
    })
  }

  const handleShapeDrag = (
    event: React.PointerEvent<HTMLElement>,
    shapeId: string
  ) => retimeShapeByDrag(event, shapeId, shapeDraggedRef, { select: true })

  const handleTransitionEdgeDrag = (
    event: React.PointerEvent<HTMLElement>,
    shapeId: string,
    edge: "start" | "end",
    fromTime: number,
    toTime: number
  ) => {
    event.stopPropagation()
    event.preventDefault()
    if (!laneRef.current) return
    safelySetPointerCapture(event.currentTarget, event.pointerId)
    morphResizedRef.current = false
    const startX = event.clientX
    const gap = Math.max(1e-6, toTime - fromTime)
    bindWindowPointerDrag({
      onMove: (moveEvent) => {
        if (Math.abs(moveEvent.clientX - startX) > 3) {
          if (!morphResizedRef.current) onScrubStart?.()
          morphResizedRef.current = true
        }
        const fraction = Math.max(
          0,
          Math.min(1, (rawTimeFromClientX(moveEvent.clientX) - fromTime) / gap)
        )
        onShapesChange(
          setShapeTransitionFraction({
            shapes,
            shapeId,
            edge,
            fraction,
          })
        )
      },
      onEnd: (endEvent) => {
        if (endEvent instanceof PointerEvent) {
          safelyReleasePointerCapture(event.currentTarget, endEvent.pointerId)
        }
      },
    })
  }

  return {
    shapeDraggedRef,
    handleShapeDrag,
    handleTransitionEdgeDrag,
  }
}
