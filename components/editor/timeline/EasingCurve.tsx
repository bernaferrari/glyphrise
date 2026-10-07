"use client"

import React from "react"
import { cn } from "@/lib/utils"
import {
  applyEasing,
  easingPoints,
  type BezierPoints,
  type EasingType,
} from "../TimelineModel"

/**
 * Figma/Framer-style easing editor, after ShapeShifter's. Time runs left to
 * right between the start and end levels. Bézier easings show two draggable
 * handles; the others (flow, spring, bounce) are drawn from their formula.
 * A dot loops along the curve so overshoot and bounce read at a glance.
 */
export function EasingCurve({
  easing,
  onChange,
  onEditStart,
  onEditEnd,
  onEditCancel,
  className,
  size = 208,
}: {
  easing: EasingType
  /** When set, bézier handles become draggable and emit a custom curve. */
  onChange?: (points: BezierPoints) => void
  onEditStart?: () => void
  onEditEnd?: () => void
  onEditCancel?: () => void
  className?: string
  size?: number
}) {
  const points = easingPoints(easing)
  const editable = Boolean(onChange && points)
  const samples = React.useMemo(
    () =>
      Array.from({ length: 65 }, (_, index) => {
        const t = index / 64
        return [t, applyEasing(easing, t)] as const
      }),
    [easing]
  )
  const pad = 12
  const span = size - pad * 2
  const values = samples.map(([, value]) => value)
  const minY = Math.min(
    editable ? -0.4 : -0.1,
    ...values,
    ...(points ? [points[1], points[3]] : [])
  )
  const maxY = Math.max(
    editable ? 1.4 : 1.1,
    ...values,
    ...(points ? [points[1], points[3]] : [])
  )
  const yRange = maxY - minY
  const px = (x: number) => pad + x * span
  const py = (y: number) => pad + ((maxY - y) / yRange) * span

  const path = points
    ? `M ${px(0)} ${py(0)} C ${px(points[0])} ${py(points[1])}, ${px(points[2])} ${py(points[3])}, ${px(1)} ${py(1)}`
    : `M ${samples.map(([t, value]) => `${px(t).toFixed(1)} ${py(value).toFixed(1)}`).join(" L ")}`

  const svgRef = React.useRef<SVGSVGElement>(null)
  const dotRef = React.useRef<SVGCircleElement>(null)
  const dragging = React.useRef<1 | 2 | null>(null)

  React.useEffect(() => {
    const place = (t: number) => {
      dotRef.current?.setAttribute("cx", String(px(t)))
      dotRef.current?.setAttribute("cy", String(py(applyEasing(easing, t))))
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      place(1)
      return
    }
    const move = 1200
    const hold = 600
    const start = performance.now()
    let frame = requestAnimationFrame(function tick(now) {
      place(Math.min(1, ((now - start) % (move + hold)) / move))
      frame = requestAnimationFrame(tick)
    })
    return () => cancelAnimationFrame(frame)
    // px/py derive from the easing and size alone.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [easing, size, minY, maxY])

  const round = (value: number, precise: boolean) =>
    Number(value.toFixed(precise ? 3 : 2))

  const update = (which: 1 | 2, x: number, y: number) => {
    if (!points || !onChange) return
    const [x1, y1, x2, y2] = points
    onChange(which === 1 ? [x, y, x2, y2] : [x1, y1, x, y])
  }

  const handlePointerDown = (which: 1 | 2) => (event: React.PointerEvent) => {
    if (!editable) return
    event.preventDefault()
    event.stopPropagation()
    dragging.current = which
    onEditStart?.()
    ;(event.target as Element).setPointerCapture?.(event.pointerId)
  }

  const handlePointerMove = (event: React.PointerEvent) => {
    if (!editable || !dragging.current) return
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const nx = (((event.clientX - rect.left) / rect.width) * size - pad) / span
    const ny =
      maxY -
      ((((event.clientY - rect.top) / rect.height) * size - pad) / span) *
        yRange
    update(
      dragging.current,
      round(Math.max(0, Math.min(1, nx)), event.altKey),
      round(Math.max(minY, Math.min(maxY, ny)), event.altKey)
    )
  }

  const endDrag = (event: React.PointerEvent, cancelled = false) => {
    if (!dragging.current) return
    try {
      ;(event.target as Element).releasePointerCapture?.(event.pointerId)
    } catch {}
    dragging.current = null
    if (cancelled) onEditCancel?.()
    else onEditEnd?.()
  }

  return (
    <svg
      ref={svgRef}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={cn("shrink-0", editable && "touch-none", className)}
      onPointerMove={editable ? handlePointerMove : undefined}
      onPointerUp={editable ? (event) => endDrag(event) : undefined}
      onPointerCancel={editable ? (event) => endDrag(event, true) : undefined}
    >
      {/* start and end levels: the handles slide between these */}
      <g
        stroke="currentColor"
        strokeOpacity={0.22}
        strokeWidth={1.5}
        strokeLinecap="round"
      >
        <line x1={px(0)} y1={py(0)} x2={px(1)} y2={py(0)} />
        <line x1={px(0)} y1={py(1)} x2={px(1)} y2={py(1)} />
      </g>
      {points && (
        <g
          className="stroke-primary"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeOpacity={0.8}
        >
          <line x1={px(0)} y1={py(0)} x2={px(points[0])} y2={py(points[1])} />
          <line x1={px(1)} y1={py(1)} x2={px(points[2])} y2={py(points[3])} />
        </g>
      )}
      <path
        d={path}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        ref={dotRef}
        r={3.5}
        className="pointer-events-none fill-primary"
      />
      {points &&
        ([1, 2] as const).map((which) => {
          const x = points[which === 1 ? 0 : 2]
          const y = points[which === 1 ? 1 : 3]
          return (
            <g key={which}>
              {editable && (
                <circle
                  cx={px(x)}
                  cy={py(y)}
                  r={12}
                  fill="transparent"
                  aria-hidden="true"
                  className="cursor-grab active:cursor-grabbing"
                  onPointerDown={handlePointerDown(which)}
                />
              )}
              <circle
                cx={px(x)}
                cy={py(y)}
                r={editable ? 5 : 2.5}
                className={cn(
                  editable
                    ? "cursor-grab fill-popover stroke-primary outline-none focus-visible:stroke-ring active:cursor-grabbing"
                    : "fill-primary"
                )}
                strokeWidth={editable ? 2 : undefined}
                tabIndex={editable ? 0 : undefined}
                role={editable ? "slider" : undefined}
                aria-label={
                  editable ? `Easing control point ${which}` : undefined
                }
                aria-valuemin={editable ? 0 : undefined}
                aria-valuemax={editable ? 1 : undefined}
                aria-valuenow={editable ? x : undefined}
                aria-valuetext={editable ? `Time ${x}, value ${y}` : undefined}
                onKeyDown={
                  editable
                    ? (event) => {
                        const key = event.key
                        if (
                          ![
                            "ArrowLeft",
                            "ArrowRight",
                            "ArrowUp",
                            "ArrowDown",
                          ].includes(key)
                        )
                          return
                        event.preventDefault()
                        event.stopPropagation()
                        const step = event.altKey
                          ? 0.001
                          : event.shiftKey
                            ? 0.1
                            : 0.01
                        const nextX = Math.max(
                          0,
                          Math.min(
                            1,
                            x +
                              (key === "ArrowRight"
                                ? step
                                : key === "ArrowLeft"
                                  ? -step
                                  : 0)
                          )
                        )
                        const nextY =
                          y +
                          (key === "ArrowUp"
                            ? step
                            : key === "ArrowDown"
                              ? -step
                              : 0)
                        update(
                          which,
                          Number(nextX.toFixed(3)),
                          Number(nextY.toFixed(3))
                        )
                      }
                    : undefined
                }
                onPointerDown={editable ? handlePointerDown(which) : undefined}
              />
            </g>
          )
        })}
    </svg>
  )
}
