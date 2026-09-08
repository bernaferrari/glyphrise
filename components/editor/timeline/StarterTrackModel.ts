import { createEditorId } from "../EditorModel"
import type { TimelineTrack } from "../TimelineModel"

export function withStarterAnimation(
  track: TimelineTrack,
  duration: number
): TimelineTrack {
  if (track.keyframes.length) return track
  const start = track.defaultValue
  const change =
    track.id === "extrusion" ? 5 : track.id === "scale" ? 0.25 : 0.5
  const peak =
    start + change <= track.max
      ? start + change
      : Math.max(track.min, start - change)
  return {
    ...track,
    keyframes: [
      {
        id: createEditorId(track.id),
        time: 0,
        value: start,
        easing: "ease-in-out",
      },
      {
        id: createEditorId(track.id),
        time: duration / 2,
        value: peak,
        easing: "ease-in-out",
      },
      {
        id: createEditorId(track.id),
        time: duration,
        value: start,
        easing: "ease-in-out",
      },
    ],
  }
}
