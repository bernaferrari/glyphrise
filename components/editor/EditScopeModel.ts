import { keyframeTimeMatches } from "./EditorKeyframeModel"

export type PropertyEditScope = {
  kind: "whole" | "keyframe" | "create"
  label: string
  description: string
}

export function propertyEditScope(
  times: number[],
  currentTime: number,
  animatable = true
): PropertyEditScope {
  const time = `${currentTime.toFixed(2)}s`
  if (
    animatable &&
    times.some((value) => keyframeTimeMatches(value, currentTime))
  ) {
    return {
      kind: "keyframe",
      label: `Keyframe at ${time}`,
      description: "Changes update this keyframe.",
    }
  }
  // As in After Effects: once a property's stopwatch (◇) is on, edits key
  // the playhead.
  if (animatable && times.length > 0) {
    return {
      kind: "create",
      label: `Add keyframe at ${time}`,
      description: "Your next edit adds a keyframe here.",
    }
  }
  return {
    kind: "whole",
    label: "Entire animation",
    description: "One value throughout the animation.",
  }
}
