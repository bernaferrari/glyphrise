import { RefObject, useCallback, useEffect, useRef, useState } from "react"
import type { SvgCanvasRef } from "../3d/SvgCanvas"
import { quantizeTimeToFrame } from "./EditorModel"
import {
  exportRenderOptions,
  extensionForVideoBlob,
  resolveVideoMimeType,
  type ExportSettings,
} from "./ExportSettingsModel"

const VIDEO_EXPORT_TIMEOUT_BUFFER_MS = 5000

type PlaybackSnapshot = {
  currentTime: number
  isPlaying: boolean
  loop: boolean
}

type ExportResult =
  | { blob: Blob; error?: never }
  | { blob?: never; error: Error }

const toExportError = (error: unknown) =>
  error instanceof Error ? error : new Error("Video export failed.")

const downloadVideoBlob = (blob: Blob, settings: ExportSettings) => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  const extension = extensionForVideoBlob(blob, settings.container)
  link.download = `glyphrise-motion.${extension}`
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export const useVideoExport = ({
  canvasRef,
  duration,
  currentTime,
  isPlaying,
  loop,
  setLoop,
  setIsPlaying,
  setCurrentTime,
}: {
  canvasRef: RefObject<SvgCanvasRef | null>
  duration: number
  currentTime: number
  isPlaying: boolean
  loop: boolean
  setLoop: (loop: boolean) => void
  setIsPlaying: (isPlaying: boolean) => void
  setCurrentTime: (time: number) => void
}) => {
  const resolveRef = useRef<(() => void) | null>(null)
  const rejectRef = useRef<((error: Error) => void) | null>(null)
  const playbackSnapshotRef = useRef<PlaybackSnapshot | null>(null)
  const recordingCanvasRef = useRef<SvgCanvasRef | null>(null)
  const timeoutRef = useRef<number | null>(null)
  const frameRef = useRef<number | null>(null)
  const paintResolveRef = useRef<(() => void) | null>(null)
  const activeExportIdRef = useRef(0)
  const recordingStartedRef = useRef(false)
  const recordingStopRequestedRef = useRef(false)
  const exportSettingsRef = useRef<ExportSettings | null>(null)
  const exportRenderPreparedRef = useRef(false)
  const mountedRef = useRef(true)
  const [videoExportProgress, setVideoExportProgress] = useState(0)
  const [isVideoExporting, setIsVideoExporting] = useState(false)

  const clearExportTimeout = useCallback(() => {
    if (timeoutRef.current === null) return
    window.clearTimeout(timeoutRef.current)
    timeoutRef.current = null
  }, [])

  const clearExportFrame = useCallback(() => {
    if (frameRef.current !== null) {
      window.cancelAnimationFrame(frameRef.current)
      frameRef.current = null
    }

    // Resolving the pending paint wait lets its async task observe the changed
    // export id and exit instead of retaining a promise forever.
    const resolvePaint = paintResolveRef.current
    paintResolveRef.current = null
    resolvePaint?.()
  }, [])

  const waitForPaint = useCallback(
    () =>
      new Promise<void>((resolve) => {
        let complete = false
        const resolveOnce = () => {
          if (complete) return
          complete = true
          if (paintResolveRef.current === resolveOnce) {
            paintResolveRef.current = null
          }
          resolve()
        }

        paintResolveRef.current = resolveOnce
        frameRef.current = window.requestAnimationFrame(() => {
          frameRef.current = null
          resolveOnce()
        })
      }),
    []
  )

  const cancelActiveRecorder = useCallback(() => {
    const recordingCanvas = recordingCanvasRef.current
    recordingCanvasRef.current = null
    recordingStartedRef.current = false
    recordingStopRequestedRef.current = false
    if (!recordingCanvas) return

    try {
      recordingCanvas.cancelRecording()
    } catch {
      // Promise settlement and playback restoration must still finish even if
      // a browser recorder throws while being torn down.
    }
  }, [])

  const settleVideoExport = useCallback(
    (result: ExportResult, exportId: number) => {
      if (activeExportIdRef.current !== exportId) return

      const resolve = resolveRef.current
      const reject = rejectRef.current
      if (!resolve || !reject) return

      const playbackSnapshot = playbackSnapshotRef.current
      const recordingCanvas = recordingCanvasRef.current
      let finalError = result.error ?? null

      // Invalidate all asynchronous frame/error/stop callbacks before doing
      // anything that can call into browser or user code.
      activeExportIdRef.current += 1
      clearExportTimeout()
      clearExportFrame()
      resolveRef.current = null
      rejectRef.current = null
      playbackSnapshotRef.current = null

      if (finalError) {
        cancelActiveRecorder()
      } else {
        recordingCanvasRef.current = null
        recordingStartedRef.current = false
        recordingStopRequestedRef.current = false
      }

      try {
        if (!finalError && result.blob && exportSettingsRef.current) {
          downloadVideoBlob(result.blob, exportSettingsRef.current)
        }
      } catch (error) {
        finalError = toExportError(error)
        cancelActiveRecorder()
      } finally {
        if (exportRenderPreparedRef.current) {
          recordingCanvas?.restorePreviewRender()
          exportRenderPreparedRef.current = false
        }
        exportSettingsRef.current = null
        if (mountedRef.current) {
          setVideoExportProgress(finalError ? 0 : 1)
          setIsVideoExporting(false)
          if (playbackSnapshot) {
            setLoop(playbackSnapshot.loop)
            setCurrentTime(playbackSnapshot.currentTime)
            setIsPlaying(playbackSnapshot.isPlaying)
          }
        }

        if (finalError) reject(finalError)
        else resolve()
      }
    },
    [
      cancelActiveRecorder,
      clearExportFrame,
      clearExportTimeout,
      setCurrentTime,
      setIsPlaying,
      setLoop,
    ]
  )

  const failVideoExport = useCallback(
    (error: unknown, exportId: number) => {
      settleVideoExport({ error: toExportError(error) }, exportId)
    },
    [settleVideoExport]
  )

  const stopVideoExportRecording = useCallback(() => {
    const exportId = activeExportIdRef.current
    if (!resolveRef.current || recordingStopRequestedRef.current) return

    clearExportFrame()
    if (!recordingStartedRef.current || !recordingCanvasRef.current) {
      failVideoExport(
        new Error("Video export stopped before recording started."),
        exportId
      )
      return
    }

    recordingStopRequestedRef.current = true
    try {
      recordingCanvasRef.current.stopRecording((blob) => {
        if (!blob) {
          failVideoExport(
            new Error("The browser returned an empty video recording."),
            exportId
          )
          return
        }
        settleVideoExport({ blob }, exportId)
      })
    } catch (error) {
      failVideoExport(error, exportId)
    }
  }, [clearExportFrame, failVideoExport, settleVideoExport])

  const exportTimelineVideo = useCallback(
    (settings: ExportSettings) =>
      new Promise<void>((resolve, reject) => {
        const recordingCanvas = canvasRef.current
        if (!recordingCanvas) {
          reject(new Error("Canvas is not ready."))
          return
        }
        if (resolveRef.current) {
          reject(new Error("Video export is already running."))
          return
        }

        const exportId = activeExportIdRef.current + 1
        activeExportIdRef.current = exportId
        resolveRef.current = resolve
        rejectRef.current = reject
        playbackSnapshotRef.current = { currentTime, isPlaying, loop }
        recordingCanvasRef.current = recordingCanvas
        recordingStartedRef.current = false
        recordingStopRequestedRef.current = false
        exportSettingsRef.current = settings

        setLoop(false)
        setIsPlaying(false)
        setCurrentTime(0)
        setVideoExportProgress(0)
        setIsVideoExporting(true)

        const frameCount = Math.max(
          2,
          Math.round(Math.max(0, duration) * settings.frameRate) + 1
        )
        const lastFrameIndex = Math.max(0, frameCount - 1)

        timeoutRef.current = window.setTimeout(
          () => failVideoExport(new Error("Video export timed out."), exportId),
          Math.ceil((frameCount / settings.frameRate) * 1000) * 4 +
            VIDEO_EXPORT_TIMEOUT_BUFFER_MS
        )

        void (async () => {
          try {
            const mimeType = resolveVideoMimeType(
              settings.container,
              (candidate) => MediaRecorder.isTypeSupported(candidate)
            )
            if (!mimeType) {
              throw new Error(
                `${settings.container.toUpperCase()} recording is not supported in this browser.`
              )
            }
            recordingCanvas.prepareExportRender(exportRenderOptions(settings))
            exportRenderPreparedRef.current = true
            await waitForPaint()
            if (activeExportIdRef.current !== exportId) return

            recordingCanvas.startRecording({
              frameRate: settings.frameRate,
              manualFrames: true,
              mimeType,
              videoBitsPerSecond: settings.videoBitsPerSecond,
              onError: (error) => failVideoExport(error, exportId),
            })
            if (activeExportIdRef.current !== exportId) return
            recordingStartedRef.current = true

            for (
              let frameIndex = 0;
              frameIndex <= lastFrameIndex;
              frameIndex++
            ) {
              if (activeExportIdRef.current !== exportId) return
              const frameStart = performance.now()

              const progress =
                lastFrameIndex === 0
                  ? 1
                  : frameIndex / Math.max(1, lastFrameIndex)
              setCurrentTime(quantizeTimeToFrame(duration * progress))
              setVideoExportProgress(progress)

              await waitForPaint()
              if (activeExportIdRef.current !== exportId) return
              const remainingFrameTime =
                1000 / settings.frameRate - (performance.now() - frameStart)
              if (remainingFrameTime > 1) {
                await new Promise<void>((resolveFrame) =>
                  window.setTimeout(resolveFrame, remainingFrameTime)
                )
              }
              if (activeExportIdRef.current !== exportId) return
              recordingCanvas.requestRecordingFrame()
            }

            if (activeExportIdRef.current !== exportId) return
            setVideoExportProgress(1)
            stopVideoExportRecording()
          } catch (error) {
            failVideoExport(error, exportId)
          }
        })()
      }),
    [
      canvasRef,
      currentTime,
      duration,
      failVideoExport,
      isPlaying,
      loop,
      setCurrentTime,
      setIsPlaying,
      setLoop,
      stopVideoExportRecording,
      waitForPaint,
    ]
  )

  // Aborts a running export outright: the recorder is torn down instead of
  // being asked for a final blob, and playback state is restored via the
  // normal settlement path.
  const cancelVideoExport = useCallback(() => {
    if (!resolveRef.current) return
    failVideoExport(
      new Error("Video export was canceled."),
      activeExportIdRef.current
    )
  }, [failVideoExport])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      const exportId = activeExportIdRef.current
      if (resolveRef.current) {
        settleVideoExport(
          {
            error: new Error(
              "Video export was canceled because the editor closed."
            ),
          },
          exportId
        )
      } else {
        clearExportTimeout()
        clearExportFrame()
        cancelActiveRecorder()
      }
    }
  }, [
    cancelActiveRecorder,
    clearExportFrame,
    clearExportTimeout,
    settleVideoExport,
  ])

  return {
    isVideoExportPendingRef: resolveRef,
    isVideoExporting,
    videoExportProgress,
    exportTimelineVideo,
    stopVideoExportRecording,
    cancelVideoExport,
  }
}
