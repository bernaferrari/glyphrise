"use client"

import React from "react"
import * as THREE from "three"
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"

export type OrientationGizmoRefs = {
  lineXRef: React.RefObject<SVGLineElement | null>
  lineYRef: React.RefObject<SVGLineElement | null>
  lineZRef: React.RefObject<SVGLineElement | null>
  markerXRef: React.RefObject<SVGGElement | null>
  markerYRef: React.RefObject<SVGGElement | null>
  markerZRef: React.RefObject<SVGGElement | null>
}

export const updateOrientationGizmo = (
  refs: OrientationGizmoRefs,
  orientation: THREE.Quaternion
) => {
  const centerX = 40
  const centerY = 40
  const axisLength = 22

  const project = (x: number, y: number, z: number) => {
    const vector = new THREE.Vector3(x, y, z).applyQuaternion(orientation)
    return {
      x: centerX + vector.x * axisLength,
      y: centerY - vector.y * axisLength,
      z: vector.z,
    }
  }

  const ptX = project(1, 0, 0)
  const ptY = project(0, 1, 0)
  const ptZ = project(0, 0, 1)

  if (refs.lineXRef.current) {
    refs.lineXRef.current.setAttribute("x2", ptX.x.toFixed(1))
    refs.lineXRef.current.setAttribute("y2", ptX.y.toFixed(1))
  }
  if (refs.lineYRef.current) {
    refs.lineYRef.current.setAttribute("x2", ptY.x.toFixed(1))
    refs.lineYRef.current.setAttribute("y2", ptY.y.toFixed(1))
  }
  if (refs.lineZRef.current) {
    refs.lineZRef.current.setAttribute("x2", ptZ.x.toFixed(1))
    refs.lineZRef.current.setAttribute("y2", ptZ.y.toFixed(1))
  }

  refs.markerXRef.current?.setAttribute(
    "transform",
    `translate(${ptX.x.toFixed(1)} ${ptX.y.toFixed(1)})`
  )
  refs.markerYRef.current?.setAttribute(
    "transform",
    `translate(${ptY.x.toFixed(1)} ${ptY.y.toFixed(1)})`
  )
  refs.markerZRef.current?.setAttribute(
    "transform",
    `translate(${ptZ.x.toFixed(1)} ${ptZ.y.toFixed(1)})`
  )
}

export function OrientationGizmo({
  refs,
  onNudgeViewRotation,
}: {
  refs: OrientationGizmoRefs
  onNudgeViewRotation: (axis: "x" | "y", direction: -1 | 1) => void
}) {
  return (
    <div
      role="group"
      aria-label="Artwork orientation"
      className="pointer-events-auto absolute right-3 bottom-2 z-20 grid size-28 touch-manipulation grid-cols-3 grid-rows-3 place-items-center gap-3.5 select-none max-[720px]:right-1 max-[720px]:bottom-16"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 80 80"
        className="pointer-events-none absolute inset-3.5 size-21"
      >
        <line
          ref={refs.lineXRef}
          x1="40"
          y1="40"
          x2="40"
          y2="40"
          className="stroke-axis-x-edge/70 stroke-axis"
          strokeLinecap="round"
        />
        <line
          ref={refs.lineYRef}
          x1="40"
          y1="40"
          x2="40"
          y2="40"
          className="stroke-axis-y-edge/70 stroke-axis"
          strokeLinecap="round"
        />
        <line
          ref={refs.lineZRef}
          x1="40"
          y1="40"
          x2="40"
          y2="40"
          className="stroke-axis-z-edge/70 stroke-axis"
          strokeLinecap="round"
        />

        <AxisMarker
          ref={refs.markerXRef}
          label="X"
          colorClass="fill-axis-x-surface/18 stroke-axis-x-edge/85"
          textClass="fill-axis-x-label"
        />
        <AxisMarker
          ref={refs.markerYRef}
          label="Y"
          colorClass="fill-axis-y-surface/18 stroke-axis-y-edge/85"
          textClass="fill-axis-y-label"
        />
        <AxisMarker
          ref={refs.markerZRef}
          label="Z"
          colorClass="fill-axis-z-surface/18 stroke-axis-z-edge/85"
          textClass="fill-axis-z-label"
        />

        <circle cx="40" cy="40" r="1.5" className="fill-white/50" />
      </svg>
      <Button
        variant="viewport-ghost"
        size="icon-sm"
        aria-label="Tilt up 45 degrees"
        className="col-start-2 row-start-1"
        onClick={() => onNudgeViewRotation("x", 1)}
      >
        <ChevronUp />
      </Button>
      <Button
        variant="viewport-ghost"
        size="icon-sm"
        aria-label="Tilt down 45 degrees"
        className="col-start-2 row-start-3"
        onClick={() => onNudgeViewRotation("x", -1)}
      >
        <ChevronDown />
      </Button>
      <Button
        variant="viewport-ghost"
        size="icon-sm"
        aria-label="Rotate left 45 degrees"
        className="col-start-1 row-start-2"
        onClick={() => onNudgeViewRotation("y", 1)}
      >
        <ChevronLeft />
      </Button>
      <Button
        variant="viewport-ghost"
        size="icon-sm"
        aria-label="Rotate right 45 degrees"
        className="col-start-3 row-start-2"
        onClick={() => onNudgeViewRotation("y", -1)}
      >
        <ChevronRight />
      </Button>
    </div>
  )
}

const AxisMarker = React.forwardRef<
  SVGGElement,
  {
    label: string
    colorClass: string
    textClass: string
  }
>(({ label, colorClass, textClass }, ref) => (
  <g ref={ref} transform="translate(40 40)">
    <circle cx="0" cy="0" r="8" className="fill-black/35 blur-hairline" />
    <circle cx="0" cy="0" r="7" className={`${colorClass} stroke-1`} />
    <text
      x="0"
      y="0.3"
      className={`${textClass} font-sans text-gizmo font-semibold select-none`}
      textAnchor="middle"
      dominantBaseline="central"
    >
      {label}
    </text>
  </g>
))

AxisMarker.displayName = "AxisMarker"
