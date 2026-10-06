"use client"

import type React from "react"
import { OrientationGizmo, type OrientationGizmoRefs } from "./OrientationGizmo"

type SvgCanvasOverlaysProps = {
  showOrientationGizmo?: boolean
  modelReady: boolean
  modelError: string | null
  orientationGizmoRefs: OrientationGizmoRefs
  rotationDragTooltipRef: React.RefObject<HTMLDivElement | null>
  onNudgeViewRotation: (axis: "x" | "y", direction: -1 | 1) => void
  onAlignViewToAxis: (axis: "x" | "y" | "z") => void
}

export function SvgCanvasOverlays({
  showOrientationGizmo = true,
  modelReady,
  modelError,
  orientationGizmoRefs,
  rotationDragTooltipRef,
  onNudgeViewRotation,
  onAlignViewToAxis,
}: SvgCanvasOverlaysProps) {
  return (
    <>
      {!modelReady && !modelError ? <SvgCanvasLoading /> : null}
      {modelError ? (
        <div
          role="alert"
          className="pointer-events-none absolute top-4 left-1/2 z-30 w-(--spacing-preview-message) -translate-x-1/2 rounded-xl border border-destructive/35 bg-black/80 px-4 py-3 text-center text-xs leading-5 text-white shadow-2xl backdrop-blur-md"
        >
          <span className="font-semibold text-destructive">
            3D preview unavailable.
          </span>{" "}
          {modelError} Choose another SVG or simplify its paths.
        </div>
      ) : null}
      <div
        ref={rotationDragTooltipRef}
        className="pointer-events-none fixed top-0 left-0 z-50 rounded-md border border-white/10 bg-black/75 px-2 py-1 text-2xs font-medium text-white tabular-nums opacity-0 shadow-xl transition-opacity duration-75"
      />

      {showOrientationGizmo && (
        <OrientationGizmo
          refs={orientationGizmoRefs}
          onNudgeViewRotation={onNudgeViewRotation}
          onAlignViewToAxis={onAlignViewToAxis}
        />
      )}

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-preview-shade/80 via-transparent to-preview-glow/20 mix-blend-overlay" />
    </>
  )
}

export function SvgCanvasLoading() {
  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-background/5">
      <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/45 px-3 py-2 text-xs font-medium text-white/75 shadow-2xl">
        <span className="size-2 animate-pulse rounded-full bg-white/70" />
        Preparing 3D icon
      </div>
    </div>
  )
}
