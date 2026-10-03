import { keyframeTimeMatches } from "./EditorKeyframeModel"

export type PropertyEditScope = {
  kind: "whole" | "keyframe" | "create" | "animated"
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
  if (animatable && autoKeyEnabled) {
    return {
      kind: "create",
      label: `Add keyframe at ${time}`,
      description: "Your next edit creates a keyframe here.",
    }
  }
  if (animatable && times.length > 0) {
    return {
      kind: "animated",
      label: "Between keyframes",
      description: "Choose Edit here to save a new value at this moment.",
    }
  }
  return {
    kind: "whole",
    label: "Entire animation",
    description: "One value throughout the animation.",
  }
}
