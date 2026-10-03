import React from "react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import type { EasingType } from "../TimelineModel"
import {
  EasingChoices,
  easingCurvePath,
  getEasingLabel,
} from "./TimelineEasingControls"
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

export const TimelineDiamond = ({
  selected = false,
  className = "",
}: {
  color?: string
  borderColor?: string
  selected?: boolean
  className?: string
}) => (
  <svg
    viewBox="0 0 16 16"
    className={`size-4 overflow-visible ${className}`}
    aria-hidden="true"
  >
    <rect
      x="4"
      y="4"
      width="8"
      height="8"
      rx="1.2"
      className={
        selected
          ? "fill-(--timeline-accent) stroke-(--timeline-accent)"
          : "fill-(--timeline-lane) stroke-(--timeline-accent)"
      }
      strokeWidth={1.5}
      transform="rotate(45 8 8)"
    />
  </svg>
)

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
        className="pointer-events-none absolute top-1/2 h-px -translate-y-1/2 bg-(--timeline-accent) opacity-70"
        style={{ left, width }}
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
        className={`group/segment absolute top-1/2 flex h-4 -translate-y-1/2 items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-ring ${
          onDragStart
            ? "cursor-grab touch-none active:cursor-grabbing"
            : "cursor-pointer"
        }`}
        style={{ left, width }}
        onPointerDown={(event) => {
          if (!event.isPrimary || event.button !== 0) return
          event.stopPropagation()
          pressRef.current = { x: event.clientX }
          onDragStart?.(event)
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
        side="top"
        sideOffset={8}
        initialFocus={false}
        className="gap-2"
        onPointerDown={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
      >
        <p className="text-[11px] text-muted-foreground tabular-nums">
          {name} · {from.time.toFixed(2)}s → {to.time.toFixed(2)}s
        </p>
        <EasingChoices
          label={`${name} segment easing`}
          value={easing}
          onChange={(next) => {
            onEasingChange(from.id, next)
            setOpen(false)
          }}
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
        if (target.closest(".timeline-keyframe")) {
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
      className="pointer-events-none absolute top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-40"
      style={{ left: x }}
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
