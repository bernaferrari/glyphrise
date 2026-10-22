/**
 * The playhead as it moves. Playback advances this clock every animation
 * frame without touching React state, so only what draws the moving playhead
 * (the canvas, the timeline playhead, the timecode) re-renders; the rest of
 * the editor sees the time it stopped at.
 */
export type PlaybackClock = {
  get: () => number
  set: (time: number) => void
  subscribe: (listener: () => void) => () => void
}

export function createPlaybackClock(initialTime = 0): PlaybackClock {
  let time = initialTime
  const listeners = new Set<() => void>()
  return {
    get: () => time,
    set: (next) => {
      if (Object.is(next, time)) return
      time = next
      listeners.forEach((listener) => listener())
    },
    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}
