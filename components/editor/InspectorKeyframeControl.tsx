"use client"

import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { KeyframeNavigator } from "./KeyframeNavigator"
import type { TimeKeyframe } from "./EditorModel"

const KeyframeDiamond = ({ active }: { active: boolean }) => (
  <span
    className={cn(
      `size-1.75 rotate-45 rounded-hairline border transition-[background-color,border-color] ${
        active ? "border-transparent" : "border-muted-foreground"
      }`,
      "bg-(--swatch-color)"
    )}
    style={
      {
        "--swatch-color": active ? "var(--timeline-accent)" : "transparent",
      } as React.CSSProperties
    }
  />
)

const KeyframeButton = ({
  isKeyedHere,
  currentTime,
  label,
  onToggle,
}: {
  isKeyedHere: boolean
  currentTime: number
  label: string
  onToggle: () => void
}) => (
  <Button
    variant="ghost"
    size="icon-sm"
    type="button"
    aria-label={`${isKeyedHere ? "Remove" : "Add"} ${label} keyframe at ${currentTime.toFixed(2)}s`}
    title={`${isKeyedHere ? "Remove" : "Add"} ${label} keyframe at ${currentTime.toFixed(2)}s`}
    onPointerDown={(event) => event.stopPropagation()}
    onMouseDown={(event) => event.stopPropagation()}
    onClick={(event) => {
      event.stopPropagation()
      onToggle()
    }}
    className="relative"
  >
    <KeyframeDiamond active={isKeyedHere} />
  </Button>
)

export function InspectorKeyframeControl({
  keyframes,
  label,
  currentTime,
  duration,
  isKeyedHere,
  onToggle,
  onJump,
}: {
  keyframes: TimeKeyframe[]
  label: string
  currentTime: number
  duration: number
  isKeyedHere: boolean
  /** Kept for callers; keyframes use the shared accent. */
  color?: string
  onToggle: () => void
  onJump: (time: number) => void
}) {
  return (
    <KeyframeNavigator
      keyframes={keyframes}
      label={label}
      currentTime={currentTime}
      duration={duration}
      onJump={onJump}
    >
      <KeyframeButton
        currentTime={currentTime}
        isKeyedHere={isKeyedHere}
        label={label}
        onToggle={onToggle}
      />
    </KeyframeNavigator>
  )
}
