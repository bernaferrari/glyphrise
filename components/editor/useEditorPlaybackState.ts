"use client"

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type SetStateAction,
} from "react"
import type { SvgCanvasRef } from "../3d/SvgCanvas"
import { clampNumber, quantizeTimeToFrame } from "./EditorModel"
import type { EditorDocumentStore } from "./EditorDocumentStore"
import { createPlaybackClock, type PlaybackClock } from "./PlaybackClock"
import { useAnimatedTimeSeek } from "./useAnimatedTimeSeek"
import { useVideoExport } from "./useVideoExport"

const subscribeToNothing = () => () => {}

/**
 * The moving playhead, for the few views that draw it during playback.
 * Without a clock (isolated views and tests) it is just `fallback`.
 */
export const usePlaybackClockTime = (
  clock: PlaybackClock | undefined,
  fallback = 0
) => {
  const read = () => (clock ? clock.get() : fallback)
  return useSyncExternalStore(
    clock?.subscribe ?? subscribeToNothing,
    read,
    read
  )
}

export function useEditorPlaybackState({
  store,
  duration,
}: {
  store: EditorDocumentStore
  duration: number
}) {
  const [clock] = useState(() => createPlaybackClock(0))
  // The editor's time: where the playhead rests. Playback only moves `clock`
  // and commits here when it stops, so the inspector and timeline rows don't
  // re-render on every frame.
  const [currentTime, setCommittedTime] = useState(0)
  const [isPlaying, setIsPlayingState] = useState(false)
  const isPlayingRef = useRef(false)
  const [loop, setLoop] = useState(true)
  const [isPreviewModelReady, setIsPreviewModelReady] = useState(false)
  const canvas3DRef = useRef<SvgCanvasRef>(null)
  const playheadFrameRef = useRef<number | null>(null)

  const setDuration = useCallback(
    (action: SetStateAction<number>) => store.set("duration", action),
    [store]
  )

  const setCurrentTime = useCallback(
    (action: SetStateAction<number>) => {
      const next = typeof action === "function" ? action(clock.get()) : action
      clock.set(next)
      setCommittedTime(next)
    },
    [clock]
  )

  const setIsPlaying = useCallback(
    (playing: boolean) => {
      if (isPlayingRef.current === playing) return
      isPlayingRef.current = playing
      // Stopping lands the editor on the frame playback reached.
      if (!playing) setCommittedTime(clock.get())
      setIsPlayingState(playing)
    },
    [clock]
  )

  const {
    isVideoExportPendingRef,
    isVideoExporting,
    videoExportProgress,
    exportTimelineVideo,
    stopVideoExportRecording,
    cancelVideoExport,
  } = useVideoExport({
    canvasRef: canvas3DRef,
    duration,
    getCurrentTime: clock.get,
    isPlaying,
    loop,
    setLoop,
    setIsPlaying,
    setCurrentTime,
  })

  useEffect(() => {
    if (!isPlaying) return
    let lastFrameAt = performance.now()
    let playbackTime = clampNumber(clock.get(), 0, duration)

    const tick = () => {
      if (!isPlayingRef.current) return
      const now = performance.now()
      let nextTime = playbackTime + (now - lastFrameAt) / 1000
      lastFrameAt = now
      let finished = false
      if (nextTime >= duration) {
        if (loop) nextTime %= duration
        else {
          nextTime = duration
          finished = true
        }
      }
      playbackTime = nextTime
      clock.set(quantizeTimeToFrame(nextTime))

      if (!finished) {
        playheadFrameRef.current = requestAnimationFrame(tick)
        return
      }
      playheadFrameRef.current = null
      setIsPlaying(false)
      if (isVideoExportPendingRef.current)
        window.requestAnimationFrame(stopVideoExportRecording)
    }

    playheadFrameRef.current = requestAnimationFrame(tick)
    return () => {
      if (playheadFrameRef.current !== null)
        cancelAnimationFrame(playheadFrameRef.current)
      playheadFrameRef.current = null
    }
  }, [
    clock,
    duration,
    isPlaying,
    isVideoExportPendingRef,
    loop,
    setIsPlaying,
    stopVideoExportRecording,
  ])

  const stopPlayback = useCallback(() => setIsPlaying(false), [setIsPlaying])

  const {
    animatedSeekEnabled,
    setAnimatedSeekEnabled,
    cancelAnimatedSeek,
    seekToTime,
  } = useAnimatedTimeSeek({
    clock,
    duration,
    setCurrentTime,
    stopPlayback,
  })

  const resetPlayback = useCallback(() => {
    seekToTime(0)
  }, [seekToTime])

  const togglePlayback = useCallback(() => {
    cancelAnimatedSeek()
    if (isPlayingRef.current) {
      setIsPlaying(false)
      return
    }
    if (clock.get() >= duration - 0.001) setCurrentTime(0)
    setIsPlaying(true)
  }, [cancelAnimatedSeek, clock, duration, setCurrentTime, setIsPlaying])

  return {
    canvas3DRef,
    clock,
    duration,
    setDuration,
    currentTime,
    setCurrentTime,
    isPlaying,
    setIsPlaying,
    loop,
    setLoop,
    isPreviewModelReady,
    setIsPreviewModelReady,
    isVideoExporting,
    videoExportProgress,
    exportTimelineVideo,
    stopVideoExportRecording,
    cancelVideoExport,
    stopPlayback,
    togglePlayback,
    resetPlayback,
    animatedSeekEnabled,
    setAnimatedSeekEnabled,
    cancelAnimatedSeek,
    seekToTime,
  }
}
