"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { clampNumber, quantizeTimeToFrame } from "./EditorModel"
import type { PlaybackClock } from "./PlaybackClock"

const SEEK_DURATION_MS = 180

const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

/**
 * Glides the playhead to a new time. The glide only moves the playback clock
 * (canvas and playhead); the editor's time commits once, on arrival.
 */
export function useAnimatedTimeSeek({
  clock,
  duration,
  setCurrentTime,
  stopPlayback,
}: {
  clock: PlaybackClock
  duration: number
  setCurrentTime: (time: number) => void
  stopPlayback: () => void
}) {
  const [animatedSeekEnabled, setAnimatedSeekEnabled] = useState(true)
  const animationRef = useRef<number | null>(null)

  const stopGlide = useCallback(() => {
    if (animationRef.current === null) return false
    cancelAnimationFrame(animationRef.current)
    animationRef.current = null
    return true
  }, [])

  // Interrupted mid-glide, the editor stays where the playhead got to.
  const cancelAnimatedSeek = useCallback(() => {
    if (stopGlide()) setCurrentTime(clock.get())
  }, [clock, setCurrentTime, stopGlide])

  useEffect(
    () => () => {
      stopGlide()
    },
    [stopGlide]
  )

  const updateAnimatedSeekEnabled = useCallback(
    (enabled: boolean) => {
      setAnimatedSeekEnabled(enabled)
      if (!enabled) cancelAnimatedSeek()
    },
    [cancelAnimatedSeek]
  )

  const seekToTime = useCallback(
    (time: number, options?: { animated?: boolean }) => {
      stopPlayback()
      stopGlide()

      const target = quantizeTimeToFrame(clampNumber(time, 0, duration))
      const start = clock.get()
      const shouldAnimate =
        (options?.animated ?? animatedSeekEnabled) &&
        Math.abs(target - start) > 0.001

      if (!shouldAnimate) {
        setCurrentTime(target)
        return
      }

      const startedAt = performance.now()
      const tick = (now: number) => {
        const progress = clampNumber((now - startedAt) / SEEK_DURATION_MS, 0, 1)
        const eased = easeInOutCubic(progress)
        if (progress < 1) {
          clock.set(quantizeTimeToFrame(start + (target - start) * eased))
          animationRef.current = requestAnimationFrame(tick)
        } else {
          animationRef.current = null
          setCurrentTime(target)
        }
      }

      animationRef.current = requestAnimationFrame(tick)
    },
    [
      animatedSeekEnabled,
      stopGlide,
      clock,
      duration,
      setCurrentTime,
      stopPlayback,
    ]
  )

  return {
    animatedSeekEnabled,
    setAnimatedSeekEnabled: updateAnimatedSeekEnabled,
    cancelAnimatedSeek,
    seekToTime,
  }
}
