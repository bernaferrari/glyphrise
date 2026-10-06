"use client"

import * as React from "react"
import { Popover, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import type { NormalizedColorStop } from "./color-stop-model"
import { type ColorStopEditorAnchor } from "./color-gradient-stop-rows"
import { ColorStopEditorPopover } from "./color-stop-editor-popover"
import type { StopEditorProps } from "./color-stop-editor-popover"

interface ColorGradientRailProps {
  railRef: React.RefObject<HTMLDivElement | null>
  stops: NormalizedColorStop[]
  gradientCss: string
  openStopEditor: number | null
  openStopEditorAnchor: ColorStopEditorAnchor
  stopContentRef: React.RefObject<HTMLDivElement | null>
  stopEditorProps: StopEditorProps
  onAddStopAtRailPosition: (clientX: number, clientY?: number) => void
  onStopPointerDown: (stop: number, event: React.PointerEvent) => void
  onStopEditorOpenIntent: () => void
  onActiveStopChange: (stop: number) => void
  onOpenStopEditorChange: (
    stop: number | null,
    anchor: ColorStopEditorAnchor
  ) => void
  onCaptureStopOutsidePointer: (event: Event) => void
}

export function ColorGradientRail({
  railRef,
  stops,
  gradientCss,
  openStopEditor,
  openStopEditorAnchor,
  stopContentRef,
  stopEditorProps,
  onAddStopAtRailPosition,
  onStopPointerDown,
  onStopEditorOpenIntent,
  onActiveStopChange,
  onOpenStopEditorChange,
  onCaptureStopOutsidePointer,
}: ColorGradientRailProps) {
  return (
    <div className="relative">
      <div
        ref={railRef}
        title="Click the bar to add a color stop"
        className="relative mx-4 mt-7 h-9 rounded-md border border-border bg-muted/35"
        onPointerDown={(event) => {
          if (event.button !== 0) return
          event.preventDefault()
          onAddStopAtRailPosition(event.clientX, event.clientY)
        }}
      >
        <div
          className="absolute inset-px rounded-direction bg-preview"
          style={{ "--preview-background": gradientCss } as React.CSSProperties}
        />
        <button
          type="button"
          aria-label="Add gradient stop in the middle"
          title="Add a color stop in the middle"
          className="absolute top-1/2 -right-3 z-10 flex size-5 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background text-control leading-none font-light text-muted-foreground shadow-sm hover:bg-muted hover:text-foreground"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={() => {
            const rect = railRef.current?.getBoundingClientRect()
            if (!rect || rect.width === 0) return
            onAddStopAtRailPosition(
              rect.left + rect.width / 2,
              rect.top + rect.height / 2
            )
          }}
        >
          +
        </button>
        {stops.map((stopItem, stop) => (
          <Popover
            key={`gradient-stop-${stopItem.id}`}
            open={openStopEditor === stop && openStopEditorAnchor === "rail"}
            onOpenChange={(open, eventDetails) => {
              if (!open && eventDetails.reason === "outside-press") {
                const event = eventDetails.event
                if ("clientX" in event && "clientY" in event) {
                  onCaptureStopOutsidePointer(event)
                  eventDetails.cancel()
                  return
                }
              }
              onOpenStopEditorChange(open ? stop : null, open ? "rail" : null)
              if (open) onActiveStopChange(stop)
            }}
          >
            <PopoverTrigger
              type="button"
              aria-label={`Edit gradient stop ${stop + 1} of ${stops.length}`}
              onPointerDown={(event) => {
                onStopEditorOpenIntent()
                onStopPointerDown(stop, event)
              }}
              className={cn(
                "absolute -top-5 flex size-7 -translate-x-1/2 touch-none items-center justify-center rounded-inset shadow-light-dial transition-colors after:absolute after:-bottom-1.25 after:left-1/2 after:h-0 after:w-0 after:-translate-x-1/2 after:border-x-5 after:border-t-6 after:border-x-transparent",
                openStopEditor === stop
                  ? "bg-primary after:border-t-primary"
                  : "bg-muted after:border-t-muted hover:bg-muted/80 hover:after:border-t-muted/80",
                "left-(--position-x)"
              )}
              style={
                {
                  "--position-x": `${stopItem.position * 100}%`,
                } as React.CSSProperties
              }
            >
              <span
                className="relative z-10 size-4.5 rounded-direction border border-background/65 bg-(--swatch-color) shadow-color-rail"
                style={
                  { "--swatch-color": stopItem.color } as React.CSSProperties
                }
              />
            </PopoverTrigger>
            <ColorStopEditorPopover
              {...stopEditorProps}
              contentRef={stopContentRef}
              align="center"
              side="top"
            />
          </Popover>
        ))}
      </div>
    </div>
  )
}
