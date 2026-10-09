import { cssLength, cn } from "@/lib/utils"
import React from "react"
import { holdToDrag } from "@/lib/touch-intent"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import type { EasingType } from "../TimelineModel"
import {
  EasingEditor,
  easingCurvePath,
  getEasingLabel,
} from "./TimelineEasingControls"
import { widthForSpan, xForFrac } from "./TimelineGeometry"
import type { TimelineTrack } from "../TimelineModel"

export const formatValueLabel = (track: TimelineTrack, value: number) => {
  if (track.id === "transition") return `${Math.round(value * 100)}%`
  if (track.id === "rotation") return `${Math.round(value)}°`
  if (track.id === "scale") return `${value.toFixed(2)}x`
  if (track.id === "lighting") return value.toFixed(1)
  return value.toFixed(2)
}

/** "10.00 → 15.00 → 10.00" — what adding this property will do. */
export const describeStarterMotion = (track: TimelineTrack, peak: number) =>
  `${formatValueLabel(track, track.defaultValue)} → ${formatValueLabel(track, peak)} → back`

/** The easing of the segment that leaves a keyframe; none after the last. */
export const outgoingEasing = (
  keyframes: ReadonlyArray<{ id: string; time: number; easing?: EasingType }>,
  id: string
) => {
  const sorted = [...keyframes].sort((a, b) => a.time - b.time)
  const index = sorted.findIndex((keyframe) => keyframe.id === id)
  return index >= 0 && index < sorted.length - 1
    ? sorted[index].easing
    : undefined
}

/** The easing of the segment that arrives at a keyframe, if any. */
export const incomingEasing = (
  keyframes: ReadonlyArray<{ id: string; time: number; easing?: EasingType }>,
  id: string
) => {
  const sorted = [...keyframes].sort((a, b) => a.time - b.time)
  const index = sorted.findIndex((keyframe) => keyframe.id === id)
  return index > 0 ? sorted[index - 1].easing : undefined
}

type KeyframeGlyph = "linear" | "eased" | "overshoot" | "hold"

/** After Effects' keyframe shapes: the curve's character, at a glance. */
const keyframeGlyph = (easing?: EasingType): KeyframeGlyph =>
  !easing || easing === "linear"
    ? "linear"
    : easing === "hold"
      ? "hold"
      : easing === "spring" || easing === "bounce"
        ? "overshoot"
        : "eased"

// Each half runs between the glyph's top (8, 3.5) and bottom (8, 12.5).
const RIGHT_HALF: Record<KeyframeGlyph, string> = {
  linear: "L 12.5 8 L 8 12.5",
  eased: "L 12 3.5 L 9.6 8 L 12 12.5 L 8 12.5",
  overshoot: "A 4.5 4.5 0 0 1 8 12.5",
  hold: "L 12 3.5 L 12 12.5 L 8 12.5",
}
const LEFT_HALF: Record<KeyframeGlyph, string> = {
  linear: "L 3.5 8 L 8 3.5",
  eased: "L 4 12.5 L 6.4 8 L 4 3.5 L 8 3.5",
  overshoot: "A 4.5 4.5 0 0 1 8 3.5",
  hold: "L 4 12.5 L 4 3.5 L 8 3.5",
}

/**
 * A keyframe drawn the After Effects way: the left half shows how motion
 * arrives (the previous segment's easing), the right half how it leaves —
 * diamond for linear, hourglass for eased, round for overshoot, square for
 * hold.
 */
export const TimelineDiamond = ({
  selected = false,
  inEasing,
  outEasing,
  className = "",
}: {
  color?: string
  borderColor?: string
  selected?: boolean
  /** Easing of the segment arriving here; defaults to `outEasing`. */
  inEasing?: EasingType
  /** Easing of the segment leaving here; defaults to `inEasing`. */
  outEasing?: EasingType
  className?: string
}) => {
  const right = keyframeGlyph(outEasing ?? inEasing)
  const left = keyframeGlyph(inEasing ?? outEasing)
  return (
    <svg
      viewBox="0 0 16 16"
      className={`size-4 overflow-visible ${className}`}
      aria-hidden="true"
    >
      <path
        d={`M 8 3.5 ${RIGHT_HALF[right]} ${LEFT_HALF[left]} Z`}
        className={
          selected
            ? "fill-(--timeline-accent) stroke-(--timeline-accent)"
            : "fill-(--timeline-lane) stroke-(--timeline-accent)"
        }
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
    </svg>
  )
}

/**
 * One segment per pair of neighbouring keyframes. Click a segment to choose
 * how the motion eases between them (After Effects / DaVinci style); drag it
 * to move the whole row's keyframes when the row supports that.
 */
export const TimelineMotionSegments = ({
  name,
  keyframes,
  duration,
  xForTime,
  widthForTime,
  onEasingChange,
  onDragStart,
}: {
  name: string
  keyframes: Array<{ id: string; time: number; easing?: EasingType }>
  duration: number
  xForTime: (fraction: number) => string
  widthForTime: (span: number) => string
  onEasingChange?: (keyframeId: string, easing: EasingType) => void
  onDragStart?: (event: React.PointerEvent<HTMLElement>) => void
}) => {
  const sorted = [...keyframes].sort((a, b) => a.time - b.time)
  return (
    <>
      {sorted.slice(0, -1).map((from, index) => {
        const to = sorted[index + 1]
        if (to.time <= from.time) return null
        return (
          <MotionSegment
            key={from.id}
            name={name}
            from={from}
            to={to}
            left={xForTime(from.time / duration)}
            width={widthForTime((to.time - from.time) / duration)}
            onEasingChange={onEasingChange}
            onDragStart={onDragStart}
          />
        )
      })}
    </>
  )
}

function MotionSegment({
  name,
  from,
  to,
  left,
  width,
  onEasingChange,
  onDragStart,
}: {
  name: string
  from: { id: string; time: number; easing?: EasingType }
  to: { time: number }
  left: string
  width: string
  onEasingChange?: (keyframeId: string, easing: EasingType) => void
  onDragStart?: (event: React.PointerEvent<HTMLElement>) => void
}) {
  const [open, setOpen] = React.useState(false)
  const pressRef = React.useRef<{ x: number } | null>(null)
  const draggedRef = React.useRef(false)
  const easing = from.easing ?? "ease-in-out"
  const label = `${name} ease from ${from.time.toFixed(2)}s to ${to.time.toFixed(2)}s: ${getEasingLabel(easing)}`
  if (!onEasingChange)
    return (
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-(--position-x) h-px w-(--element-width) -translate-y-1/2 bg-(--timeline-accent) opacity-70"
        style={
          {
            "--position-x": cssLength(left),
            "--element-width": cssLength(width),
          } as React.CSSProperties
        }
      />
    )
  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        // A drag that moved the keyframes is not a click on the segment.
        if (next && draggedRef.current) {
          draggedRef.current = false
          return
        }
        setOpen(next)
      }}
    >
      <PopoverTrigger
        aria-label={label}
        title={`${getEasingLabel(easing)} · click to change easing${onDragStart ? ", drag to move" : ""}`}
        className={cn(
          `group/segment absolute top-1/2 flex h-4 -translate-y-1/2 items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            onDragStart
              ? "cursor-grab touch-pan-x touch-pan-y active:cursor-grabbing"
              : "cursor-pointer"
          }`,
          "left-(--position-x) w-(--element-width)"
        )}
        style={
          {
            "--position-x": cssLength(left),
            "--element-width": cssLength(width),
          } as React.CSSProperties
        }
        onPointerDown={(event) => {
          if (!event.isPrimary || event.button !== 0) return
          event.stopPropagation()
          pressRef.current = { x: event.clientX }
          if (onDragStart) holdToDrag(onDragStart)(event)
        }}
        onPointerUp={(event) => {
          draggedRef.current = Boolean(
            pressRef.current && Math.abs(event.clientX - pressRef.current.x) > 3
          )
          pressRef.current = null
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <span
          className={`absolute inset-x-1.5 top-1/2 -translate-y-1/2 bg-(--timeline-accent) transition-[height,opacity] group-hover/segment:h-0.5 group-hover/segment:opacity-100 ${
            open ? "h-0.5 opacity-100" : "h-px opacity-70"
          }`}
        />
        <span
          className={`relative grid h-4 place-items-center rounded-sm bg-(--timeline-lane) px-0.5 text-(--timeline-accent) transition-opacity group-hover/segment:opacity-100 ${
            open ? "opacity-100" : "opacity-0"
          }`}
        >
          <svg
            aria-hidden="true"
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="none"
          >
            <path
              d={easingCurvePath(easing)}
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </PopoverTrigger>
      <PopoverContent
        density="spacious"
        side="top"
        sideOffset={8}
        initialFocus={false}
        size="easing"
        onPointerDown={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-baseline justify-between">
          <span className="text-xs font-semibold">Easing</span>
          <span className="truncate text-2xs text-muted-foreground tabular-nums">
            {name} · {from.time.toFixed(2)}–{to.time.toFixed(2)}s
          </span>
        </div>
        <EasingEditor
          label={`${name} segment easing`}
          value={easing}
          onChange={(next) => onEasingChange(from.id, next)}
        />
      </PopoverContent>
    </Popover>
  )
}

/**
 * Desktop affordance: a faint diamond follows the pointer along an empty
 * part of the lane, showing where a double-click will add a keyframe.
 */
export function useLaneGhost() {
  const [ghostX, setGhostX] = React.useState<number | null>(null)
  return {
    ghostX,
    laneHandlers: {
      onPointerMove: (event: React.PointerEvent<HTMLDivElement>) => {
        if (event.pointerType !== "mouse") return
        const target = event.target as HTMLElement
        if (target.closest("[data-keyframe-row]")) {
          setGhostX(null)
          return
        }
        setGhostX(
          event.clientX - event.currentTarget.getBoundingClientRect().left
        )
      },
      onPointerLeave: () => setGhostX(null),
    },
  }
}

export const TimelineLaneGhost = ({
  x,
}: {
  x: number | null
  color?: string
}) =>
  x === null ? null : (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute top-1/2 left-(--position-x) -translate-x-1/2 -translate-y-1/2 opacity-40"
      style={{ "--position-x": cssLength(x) } as React.CSSProperties}
    >
      <svg viewBox="0 0 16 16" className="size-4 overflow-visible">
        <rect
          x="4.25"
          y="4.25"
          width="7.5"
          height="7.5"
          rx="1.1"
          fill="none"
          className="stroke-(--timeline-accent)"
          strokeWidth="1.5"
          strokeDasharray="2 1.5"
          transform="rotate(45 8 8)"
        />
      </svg>
    </div>
  )

/**
 * Shown while looping when a row doesn't end where it starts: a dashed path
 * from its last keyframe to the end, finished by a dashed diamond. Clicking
 * the diamond adds the closing keyframe (see TimelineLoopModel).
 */
export const TimelineLoopClosure = ({
  name,
  keyframes,
  duration,
  onClose,
}: {
  name: string
  keyframes: Array<{ time: number }>
  duration: number
  onClose: () => void
}) => {
  const lastTime = Math.max(...keyframes.map((keyframe) => keyframe.time))
  // A keyframe already at the end is the user's; closing it from here would
  // overwrite it, so that case is left to the row's context menu.
  if (!(lastTime < duration - 1 / 120)) return null
  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-(--from) w-(--span) border-t border-dashed border-(--timeline-accent) opacity-35"
        style={
          {
            "--from": xForFrac(lastTime / duration),
            "--span": widthForSpan((duration - lastTime) / duration),
          } as React.CSSProperties
        }
      />
      <button
        type="button"
        data-keyframe-row
        aria-label={`End ${name} where it starts`}
        title="End where it starts, so the loop is seamless"
        onPointerDown={(event) => event.stopPropagation()}
        onDoubleClick={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation()
          onClose()
        }}
        className="absolute top-1/2 left-(--position-x) grid size-6 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-sm opacity-55 transition-[opacity,scale] duration-100 hover:scale-125 hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-ring"
        style={{ "--position-x": xForFrac(1) } as React.CSSProperties}
      >
        <svg viewBox="0 0 16 16" className="size-4 overflow-visible">
          <rect
            x="4.25"
            y="4.25"
            width="7.5"
            height="7.5"
            rx="1.1"
            className="fill-(--timeline-lane) stroke-(--timeline-accent)"
            strokeWidth="1.5"
            strokeDasharray="2 1.5"
            transform="rotate(45 8 8)"
          />
        </svg>
      </button>
    </>
  )
}
