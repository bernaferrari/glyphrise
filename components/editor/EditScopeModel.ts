import { keyframeTimeMatches } from "./EditorKeyframeModel"

export type PropertyEditScope = {
  kind: "whole" | "keyframe" | "create"
  label: string
  description: string
}

export function propertyEditScope(
  times: number[],
  currentTime: number,
  autoKeyEnabled: boolean,
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
  // Animated properties (or Auto-key) key the playhead on edit, as in
  // Premiere once a property's stopwatch is on.
  if (animatable && (autoKeyEnabled || times.length > 0)) {
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
