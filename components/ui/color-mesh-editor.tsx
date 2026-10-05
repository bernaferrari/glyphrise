"use client"

import * as React from "react"
import { Popover, PopoverTrigger } from "@/components/ui/popover"
import { bindWindowPointerDrag } from "@/lib/drag-events"
import type { MeshPoint } from "../../lib/mesh-warp"
import { cn } from "@/lib/utils"
import type { ColorStopEditorAnchor } from "./color-gradient-stop-rows"
import { MeshPreviewCanvas } from "./color-mesh-preview"
import { ColorStopEditorPopover } from "./color-stop-editor-popover"
import type { NormalizedColorStop } from "./color-stop-model"
import type { StopEditorProps } from "./color-stop-editor-popover"

const DRAG_THRESHOLD_PX = 3

interface ColorMeshEditorProps {
  stops: NormalizedColorStop[]
  /** One position per stop: the nine grid nodes, then any free points. */
  points: MeshPoint[]
  fallback: string
  highlightedPoint: number | null
  openStopEditor: number | null
  openStopEditorAnchor: ColorStopEditorAnchor
  stopContentRef: React.RefObject<HTMLDivElement | null>
  stopEditorProps: StopEditorProps
  onStopEditorOpenIntent: () => void
  onActiveStopChange: (stop: number) => void
  onOpenStopEditorChange: (
    stop: number | null,
    anchor: ColorStopEditorAnchor
  ) => void
  onCaptureStopOutsidePointer: (event: Event) => void
  onCloseStopEditor: () => void
  onMovePoint: (index: number, x: number, y: number) => void
  onAddPoint: (point: { x: number; y: number }) => void
}

export function ColorMeshEditor({
  stops,
  points,
  fallback,
  highlightedPoint,
  openStopEditor,
  openStopEditorAnchor,
  stopContentRef,
  stopEditorProps,
  onStopEditorOpenIntent,
  onActiveStopChange,
  onOpenStopEditorChange,
  onCaptureStopOutsidePointer,
  onCloseStopEditor,
  onMovePoint,
  onAddPoint,
}: ColorMeshEditorProps) {
  const surfaceRef = React.useRef<HTMLDivElement>(null)
  const suppressOpenRef = React.useRef(false)
  const [dragging, setDragging] = React.useState<number | null>(null)

  // A click opens the point's color editor; a drag moves the point.
  const startDrag = (index: number, event: React.PointerEvent) => {
    if (event.button !== 0) return
    onStopEditorOpenIntent()
    const startX = event.clientX
    const startY = event.clientY
    let moved = false
    // Coalesce pointer moves to one project update per frame: each update
    // recolors the 3D model, so pointer-rate updates make dragging lag.
    let pending: { x: number; y: number } | null = null
    let frame = 0
    const flush = () => {
      frame = 0
      if (!pending) return
      onMovePoint(index, pending.x, pending.y)
      pending = null
    }

    bindWindowPointerDrag({
      documentEdit: true,
      pointerId: event.pointerId,
      onMove: (moveEvent) => {
        const rect = surfaceRef.current?.getBoundingClientRect()
        if (!rect || rect.width === 0 || rect.height === 0) return
        if (
          !moved &&
          Math.hypot(moveEvent.clientX - startX, moveEvent.clientY - startY) <
            DRAG_THRESHOLD_PX
        )
          return
        if (!moved) {
          moved = true
          onCloseStopEditor()
          setDragging(index)
        }
        const clamp = (value: number) =>
          Number(Math.max(0, Math.min(1, value)).toFixed(3))
        pending = {
          x: clamp((moveEvent.clientX - rect.left) / rect.width),
          y: clamp((moveEvent.clientY - rect.top) / rect.height),
        }
        if (!frame) frame = window.requestAnimationFrame(flush)
      },
      onEnd: () => {
        if (frame) window.cancelAnimationFrame(frame)
        flush()
        if (!moved) return
        suppressOpenRef.current = true
        window.setTimeout(() => {
          suppressOpenRef.current = false
        }, 0)
        setDragging(null)
        onCloseStopEditor()
      },
    })
  }

  return (
    // Padding keeps corner handles inside the popover; the surface is the
    // 0–1 coordinate space the points live in.
    <div className="relative aspect-[3/2]">
      <MeshPreviewCanvas
        stops={stops}
        fallback={fallback}
        width={60}
        height={40}
        className="absolute inset-0 size-full rounded-lg shadow-[inset_0_0_0_1px_rgb(255_255_255/8%)]"
      />
      <div
        ref={surfaceRef}
        title="Double-click to add a point"
        className={cn(
          "absolute inset-0",
          dragging !== null && "cursor-grabbing"
        )}
        onDoubleClick={(event) => {
          if (event.target !== event.currentTarget) return
          const rect = event.currentTarget.getBoundingClientRect()
          onAddPoint({
            x: Math.max(
              0,
              Math.min(1, (event.clientX - rect.left) / rect.width)
            ),
            y: Math.max(
              0,
              Math.min(1, (event.clientY - rect.top) / rect.height)
            ),
          })
        }}
      >
        {stops.map((stop, index) => {
          const open = openStopEditor === index
          const active = dragging === index
          const highlighted = highlightedPoint === index
          return (
            <Popover
              key={stop.id}
              open={open && openStopEditorAnchor === "rail"}
              onOpenChange={(nextOpen, eventDetails) => {
                if (nextOpen && suppressOpenRef.current) {
                  eventDetails.cancel()
                  return
                }
                if (!nextOpen && eventDetails.reason === "outside-press") {
                  const event = eventDetails.event
                  if ("clientX" in event && "clientY" in event) {
                    onCaptureStopOutsidePointer(event)
                    eventDetails.cancel()
                    return
                  }
                }
                onOpenStopEditorChange(
                  nextOpen ? index : null,
                  nextOpen ? "rail" : null
                )
                if (nextOpen) onActiveStopChange(index)
              }}
            >
              {/* Fixed-size hit area: only the inner dot scales, so the
                  popover anchored here never shifts. */}
              <PopoverTrigger
                type="button"
                aria-label={`Mesh point ${index + 1}: click to edit color, drag to move`}
                onPointerDown={(event) => startDrag(index, event)}
                className={cn(
                  "group/point absolute grid size-7 -translate-x-1/2 -translate-y-1/2 touch-none place-items-center rounded-full focus-visible:outline-none",
                  active ? "z-20 cursor-grabbing" : "z-10 cursor-grab"
                )}
                style={{
                  left: `${(points[index]?.x ?? 0.5) * 100}%`,
                  top: `${(points[index]?.y ?? 0.5) * 100}%`,
                }}
              >
                <span
                  className={cn(
                    "size-4 rounded-full border-2 border-white shadow-[0_0_0_1px_rgb(0_0_0/18%),0_2px_6px_rgb(0_0_0/35%)] transition-transform duration-150 ease-out group-hover/point:scale-125 group-focus-visible/point:ring-2 group-focus-visible/point:ring-white/70",
                    (open || highlighted) && "scale-125",
                    active &&
                      "scale-140 shadow-[0_0_0_1px_rgb(0_0_0/18%),0_6px_14px_rgb(0_0_0/40%)]"
                  )}
                  style={{ backgroundColor: stop.color }}
                />
              </PopoverTrigger>
              <ColorStopEditorPopover
                {...stopEditorProps}
                contentRef={stopContentRef}
                align="center"
                side="left"
              />
            </Popover>
          )
        })}
      </div>
    </div>
  )
}
