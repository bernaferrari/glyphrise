"use client"

import { KeyframeNavigator } from "./KeyframeNavigator"
import type { TimeKeyframe } from "./EditorModel"

const KeyframeDiamond = ({ active }: { active: boolean }) => (
  <span
    className={`size-1.75 rotate-45 rounded-[1px] border transition-[background-color,border-color] ${
      active ? "border-transparent" : "border-muted-foreground"
    }`}
    style={{
      backgroundColor: active ? "var(--timeline-accent)" : "transparent",
    }}
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
  <button
    type="button"
    aria-label={`${isKeyedHere ? "Remove" : "Add"} ${label} keyframe at ${currentTime.toFixed(2)}s`}
    title={`${isKeyedHere ? "Remove" : "Add"} ${label} keyframe at ${currentTime.toFixed(2)}s`}
    onPointerDown={(event) => event.stopPropagation()}
    onMouseDown={(event) => event.stopPropagation()}
    onClick={(event) => {
      event.stopPropagation()
      onToggle()
    }}
    className={`relative flex size-8 shrink-0 items-center justify-center rounded-md transition-colors duration-100 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring max-[720px]:size-11 pointer-coarse:size-11 ${
      isKeyedHere ? "" : "hover:bg-muted/40"
    }`}
  >
    <KeyframeDiamond active={isKeyedHere} />
  </button>
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
