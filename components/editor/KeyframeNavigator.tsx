import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { ReactNode } from "react"
import { TimeKeyframe, clampNumber } from "./EditorModel"
import { KEYFRAME_TIME_EPSILON } from "./EditorKeyframeModel"

const getAdjacentKeyframeTimes = (
  keyframes: TimeKeyframe[],
  currentTime: number,
  duration: number
) => {
  const sortedTimes = Array.from(
    new Set(
      keyframes
        .map((keyframe) =>
          Number(clampNumber(keyframe.time, 0, duration).toFixed(2))
        )
        .filter(Number.isFinite)
    )
  ).sort((a, b) => a - b)

  let previous: number | undefined
  let next: number | undefined
  for (const time of sortedTimes) {
    if (time < currentTime - KEYFRAME_TIME_EPSILON) {
      previous = time
    } else if (time > currentTime + KEYFRAME_TIME_EPSILON) {
      next = time
      break
    }
  }

  return {
    previous,
    next,
  }
}

const PropertyKeyframeNavButton = ({
  direction,
  time,
  label,
  onJump,
}: {
  direction: "previous" | "next"
  time: number | undefined
  label: string
  onJump: (time: number) => void
}) => {
  const title =
    time !== undefined ? `${direction} ${label} keyframe` : undefined
  const Icon = direction === "previous" ? ChevronLeft : ChevronRight

  return (
    <Button
      variant="muted-ghost"
      size="icon-narrow-sm"
      type="button"
      aria-label={`${direction} ${label} keyframe`}
      title={title}
      disabled={time === undefined}
      onClick={(event) => {
        event.stopPropagation()
        if (time !== undefined) onJump(time)
      }}
      className={time === undefined ? "invisible" : undefined}
    >
      <Icon className="size-3" />
    </Button>
  )
}

export const KeyframeNavigator = ({
  keyframes,
  label,
  currentTime,
  duration,
  onJump,
  children,
}: {
  keyframes: TimeKeyframe[]
  label: string
  currentTime: number
  duration: number
  onJump: (time: number) => void
  children: ReactNode
}) => {
  const { previous, next } =
    keyframes.length === 0
      ? { previous: undefined, next: undefined }
      : getAdjacentKeyframeTimes(keyframes, currentTime, duration)

  return (
    <div className="flex shrink-0 items-center justify-end gap-0">
      {/* ‹ ◆ › — previous, add/remove here, next (After Effects order). */}
      {/* Unanimated properties show only the diamond, flush right. */}
      {keyframes.length > 0 && (
        <PropertyKeyframeNavButton
          direction="previous"
          time={previous}
          label={label}
          onJump={onJump}
        />
      )}
      {children}
      {keyframes.length > 0 && (
        <PropertyKeyframeNavButton
          direction="next"
          time={next}
          label={label}
          onJump={onJump}
        />
      )}
    </div>
  )
}
