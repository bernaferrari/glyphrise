"use client"

import React, { type DragEvent } from "react"
import { AlertTriangle, Upload, X } from "lucide-react"
import {
  SvgCanvas,
  type SvgCanvasProps,
  type SvgCanvasRef,
} from "../3d/SvgCanvas"
import {
  PlaybackControls,
  type PlaybackControlsProps,
  ViewOptionsPopover,
  type ViewOptionsPopoverProps,
} from "./ViewportControls"

type ViewportStageProps = {
  zenMode: boolean
  presentation?: "workspace" | "motion-preview"
  workspaceActive?: boolean
  isDragging: boolean
  canvasProps: SvgCanvasProps
  viewOptionsProps: ViewOptionsPopoverProps
  playbackProps: PlaybackControlsProps
  svgImportError: string | null
  onSvgImportErrorDismiss: () => void
  onDragStateChange: (isDragging: boolean) => void
  onDropSvg: (event: DragEvent<HTMLElement>) => void
}

export const ViewportStage = React.forwardRef<SvgCanvasRef, ViewportStageProps>(
  (
    {
      zenMode,
      workspaceActive = true,
      presentation = "workspace",
      isDragging,
      canvasProps,
      viewOptionsProps,
      playbackProps,
      svgImportError,
      onSvgImportErrorDismiss,
      onDragStateChange,
      onDropSvg,
    },
    ref
  ) => {
    const handleDragOver = (event: DragEvent<HTMLElement>) => {
      event.preventDefault()
      onDragStateChange(true)
    }

    const handleDragLeave = (event: DragEvent<HTMLElement>) => {
      event.preventDefault()
      const rect = event.currentTarget.getBoundingClientRect()
      if (
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom
      ) {
        onDragStateChange(false)
      }
    }

    const handleDrop = (event: DragEvent<HTMLElement>) => {
      event.preventDefault()
      onDragStateChange(false)
      onDropSvg(event)
    }

    return (
      <div
        id="glyphrise-preview-pane"
        inert={workspaceActive ? undefined : true}
        aria-hidden={workspaceActive ? undefined : true}
        className={`relative isolate flex min-w-0 flex-1 flex-col ${
          presentation === "motion-preview"
            ? "p-0"
            : zenMode
              ? "gap-0 p-0"
              : "gap-2 p-3 max-[720px]:p-2"
        }`}
      >
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative min-h-0 flex-1 transition-[background-color,border-color] duration-150 ${
            zenMode || presentation === "motion-preview"
              ? "rounded-none border-0"
              : "overflow-hidden rounded-2xl border border-border/60 bg-muted/40 shadow-sm"
          }`}
        >
          <SvgCanvas
            ref={ref}
            {...canvasProps}
            showOrientationGizmo={presentation !== "motion-preview"}
          />

          {svgImportError ? (
            <div
              role="alert"
              className="absolute top-16 left-1/2 z-40 flex w-[min(34rem,calc(100%-2rem))] -translate-x-1/2 items-center gap-3 rounded-xl border border-destructive/40 bg-background/95 px-4 py-3 text-sm text-foreground shadow-xl backdrop-blur-md"
            >
              <AlertTriangle
                aria-hidden="true"
                className="size-4 shrink-0 text-destructive"
              />
              <span className="min-w-0 flex-1 text-pretty">
                {svgImportError}
              </span>
              <button
                type="button"
                aria-label="Dismiss SVG import error"
                onClick={onSvgImportErrorDismiss}
                className="flex size-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:scale-95"
              >
                <X aria-hidden="true" className="size-4" />
              </button>
            </div>
          ) : null}

          {isDragging && (
            <div className="absolute inset-0 z-30 flex animate-in items-center justify-center bg-black/75 backdrop-blur-md fade-in-0">
              <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-white/25 p-8">
                <Upload className="size-8 text-white/70" />
                <div className="text-center">
                  <span className="block text-sm font-semibold text-white">
                    Drop SVG here
                  </span>
                  <span className="mt-1 block text-[11px] tracking-wider text-muted-foreground uppercase">
                    Replaces the selected shape
                  </span>
                </div>
              </div>
            </div>
          )}

          {presentation === "workspace" && (
            <ViewOptionsPopover {...viewOptionsProps} />
          )}
          {presentation === "motion-preview" && (
            <div className="pointer-events-none absolute inset-x-4 top-3 flex items-center justify-between text-xs text-white/60">
              <span>Live preview</span>
            </div>
          )}
          {presentation === "workspace" && (
            <PlaybackControls {...playbackProps} />
          )}
        </div>
      </div>
    )
  }
)

ViewportStage.displayName = "ViewportStage"
