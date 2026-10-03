"use client"

import { KeyframeNavigator } from "./KeyframeNavigator"
import type { TimeKeyframe } from "./EditorModel"

const KeyframeDiamond = ({
  active,
  color,
}: {
  active: boolean
  color: string
}) => (
  <span
    className={`size-[7px] rotate-45 rounded-[1px] border transition-[background-color,border-color] ${
      active ? "border-transparent" : "border-muted-foreground"
    }`}
    style={{ backgroundColor: active ? color : "transparent" }}
  />
)

const KeyframeButton = ({
  isKeyedHere,
  currentTime,
  label,
  color,
  onToggle,
}: {
  isKeyedHere: boolean
  currentTime: number
  label: string
  color: string
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
    className={`relative flex size-10 shrink-0 items-center justify-center rounded-md transition-colors duration-100 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring max-[720px]:size-11 pointer-coarse:size-11 ${
      isKeyedHere ? "" : "hover:bg-muted/40"
    }`}
  >
    <KeyframeDiamond active={isKeyedHere} color={color} />
  </button>
)

export function InspectorKeyframeControl({
  keyframes,
  label,
  currentTime,
  duration,
  isKeyedHere,
  color,
  onToggle,
  onJump,
}: {
  keyframes: TimeKeyframe[]
  label: string
  currentTime: number
  duration: number
  isKeyedHere: boolean
  color: string
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
        color={color}
        onToggle={onToggle}
      />
    </KeyframeNavigator>
  )
}
