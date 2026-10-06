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

  // Axes pointing away from the viewer fade back, so depth reads at a glance.
  const depthOpacity = (z: number) => (z < -0.05 ? "0.4" : "1")
  for (const [line, marker, point] of [
    [refs.lineXRef, refs.markerXRef, ptX],
    [refs.lineYRef, refs.markerYRef, ptY],
    [refs.lineZRef, refs.markerZRef, ptZ],
  ] as const) {
    line.current?.setAttribute("opacity", depthOpacity(point.z))
    marker.current?.setAttribute("opacity", depthOpacity(point.z))
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

const NUDGES = [
  {
    label: "Tilt up 45 degrees",
    Icon: ChevronUp,
    axis: "x",
    direction: 1,
    className: "col-start-2 row-start-1",
  },
  {
    label: "Tilt down 45 degrees",
    Icon: ChevronDown,
    axis: "x",
    direction: -1,
    className: "col-start-2 row-start-3",
  },
  {
    label: "Rotate left 45 degrees",
    Icon: ChevronLeft,
    axis: "y",
    direction: 1,
    className: "col-start-1 row-start-2",
  },
  {
    label: "Rotate right 45 degrees",
    Icon: ChevronRight,
    axis: "y",
    direction: -1,
    className: "col-start-3 row-start-2",
  },
] as const

export function OrientationGizmo({
  refs,
  onNudgeViewRotation,
  onAlignViewToAxis,
}: {
  refs: OrientationGizmoRefs
  onNudgeViewRotation: (axis: "x" | "y", direction: -1 | 1) => void
  onAlignViewToAxis: (axis: "x" | "y" | "z") => void
}) {
  return (
    // The axes in the middle, 45° nudges around them.
    <div
      role="group"
      aria-label="Artwork orientation"
      className="pointer-events-auto absolute right-2 bottom-2 z-20 grid size-28 touch-manipulation grid-cols-3 grid-rows-3 place-items-center select-none max-[720px]:right-1 max-[720px]:bottom-16"
    >
      <svg
        viewBox="0 0 80 80"
        className="pointer-events-none absolute inset-0 m-auto size-20 drop-shadow-xs drop-shadow-black/35"
      >
        <line
          ref={refs.lineXRef}
          x1="40"
          y1="40"
          x2="40"
          y2="40"
          className="stroke-axis-x-edge stroke-2"
          strokeLinecap="round"
        />
        <line
          ref={refs.lineYRef}
          x1="40"
          y1="40"
          x2="40"
          y2="40"
          className="stroke-axis-y-edge stroke-2"
          strokeLinecap="round"
        />
        <line
          ref={refs.lineZRef}
          x1="40"
          y1="40"
          x2="40"
          y2="40"
          className="stroke-axis-z-edge stroke-2"
          strokeLinecap="round"
        />

        <AxisMarker
          ref={refs.markerXRef}
          label="X"
          onClick={() => onAlignViewToAxis("x")}
          colorClass="fill-axis-x-surface"
        />
        <AxisMarker
          ref={refs.markerYRef}
          label="Y"
          onClick={() => onAlignViewToAxis("y")}
          colorClass="fill-axis-y-surface"
        />
        <AxisMarker
          ref={refs.markerZRef}
          label="Z"
          onClick={() => onAlignViewToAxis("z")}
          colorClass="fill-axis-z-surface"
        />

        <circle cx="40" cy="40" r="2" className="fill-white/70" />
      </svg>
      {NUDGES.map(({ label, Icon, axis, direction, className }) => (
        <Button
          key={label}
          variant="viewport-ghost"
          size="icon-sm"
          shape="pill"
          aria-label={label}
          title={label}
          className={className}
          onClick={() => onNudgeViewRotation(axis, direction)}
        >
          <Icon />
        </Button>
      ))}
    </div>
  )
}

const AxisMarker = React.forwardRef<
  SVGGElement,
  {
    label: string
    colorClass: string
    onClick: () => void
  }
>(({ label, colorClass, onClick }, ref) => (
  <g
    ref={ref}
    role="button"
    tabIndex={0}
    aria-label={`Align view to ${label} axis`}
    className="group/axis pointer-events-auto cursor-pointer outline-none"
    transform="translate(40 40)"
    onClick={onClick}
    onKeyDown={(event) => {
      if (event.key !== "Enter" && event.key !== " ") return
      event.preventDefault()
      onClick()
    }}
  >
    <circle cx="0" cy="0" r="11" className="fill-transparent" />
    <circle
      cx="0"
      cy="0"
      r="7"
      strokeWidth={0.75}
      className={`${colorClass} stroke-black/40 transition-[filter] group-hover/axis:brightness-125 group-focus-visible/axis:stroke-white`}
    />
    <text
      x="0"
      y="0.4"
      fontSize={7}
      className="fill-white font-sans font-bold select-none"
      textAnchor="middle"
      dominantBaseline="central"
    >
      {label}
    </text>
  </g>
))

AxisMarker.displayName = "AxisMarker"
