"use client"

import { Diamond } from "lucide-react"

type TimelineRailKeyframeButtonProps = {
  rowId: string
  color?: string
  isKeyedAtPlayhead: boolean
  isAnimated?: boolean
  hasKeyframes?: boolean
  addLabel: string
  removeLabel: string
  onToggle: () => void
}

export function TimelineRailKeyframeButton({
  rowId,
  isKeyedAtPlayhead,
  isAnimated = true,
  hasKeyframes,
  addLabel,
  removeLabel,
  onToggle,
}: TimelineRailKeyframeButtonProps) {
  const label = isKeyedAtPlayhead ? removeLabel : addLabel

  return (
    <button
      type="button"
      aria-label={label}
      data-rail-keyframe={rowId}
      title={
        isKeyedAtPlayhead
          ? "Remove keyframe at playhead"
          : "Add keyframe at playhead"
      }
      onPointerDown={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.stopPropagation()
        onToggle()
      }}
      className={`relative grid size-5 shrink-0 place-items-center rounded transition-[background-color,transform] duration-100 hover:bg-foreground/[0.08] focus-visible:outline-2 focus-visible:outline-ring active:scale-90 ${
        isAnimated || hasKeyframes ? "" : "opacity-80 group-hover:opacity-100"
      }`}
    >
      <Diamond
        strokeWidth={2.25}
        className={`size-3 ${isKeyedAtPlayhead ? "fill-(--timeline-accent) text-(--timeline-accent)" : "text-muted-foreground"}`}
      />
    </button>
  )
}
