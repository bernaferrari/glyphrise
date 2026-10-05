import { type RefObject, useCallback, useEffect, useRef, useState } from "react"
import { flushSync } from "react-dom"
import type { SvgCanvasProps, SvgCanvasRef } from "../3d/SvgCanvas"
import { MAX_TIMELINE_DURATION, MIN_TIMELINE_DURATION } from "./EditorModel"
import { exportRenderOptions, type ExportSettings } from "./ExportSettingsModel"
import { encodeTimelineVideo } from "./VideoEncoder"

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
  setIsPlaying: (playing: boolean) => void
  setCurrentTime: (time: number) => void
}) => {
  const activeRef = useRef<AbortController | null>(null)
  const mountedRef = useRef(true)
  const pendingRef = useRef<(() => void) | null>(null)
  const [videoExportProgress, setVideoExportProgress] = useState(0)
  const [isVideoExporting, setIsVideoExporting] = useState(false)
  const cancelVideoExport = useCallback(() => activeRef.current?.abort(), [])

  const exportTimelineVideo = useCallback(
    async (
      requestedSettings: ExportSettings,
      evaluateFrame: (time: number) => SvgCanvasProps
    ) => {
      if (activeRef.current) throw new Error("Video export is already running.")
      if (
        !Number.isFinite(duration) ||
        duration < MIN_TIMELINE_DURATION ||
        duration > MAX_TIMELINE_DURATION
      )
        throw new Error("Video duration is outside the supported range.")
      if (![24, 30, 60].includes(requestedSettings.frameRate))
        throw new Error("Video frame rate must be 24, 30, or 60 fps.")
      const canvas = canvasRef.current
      if (!canvas) throw new Error("The 3D preview is not ready.")
      const settings = {
        ...requestedSettings,
        backgroundMode: "color" as const,
      }
      const renderOptions = exportRenderOptions(settings)
      settings.width = renderOptions.width
      settings.height = renderOptions.height
      const controller = new AbortController()
      activeRef.current = controller
      pendingRef.current = () => {}
      const playback = { currentTime, isPlaying, loop }
      let prepared = false
      flushSync(() => {
        setIsPlaying(false)
        setIsVideoExporting(true)
        setVideoExportProgress(0)
      })
      try {
        canvas.prepareExportRender(renderOptions)
        prepared = true
        const blob = await encodeTimelineVideo({
          duration,
          settings,
          signal: controller.signal,
          renderFrame: (time) => canvas.renderExportFrame(evaluateFrame(time)),
          onProgress: (progress) => {
            if (mountedRef.current) setVideoExportProgress(progress)
          },
        })
        if (controller.signal.aborted)
          throw new Error("Video export was canceled.")
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = `glyphrise-motion.${settings.container}`
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      } finally {
        if (prepared) canvas.restorePreviewRender()
        activeRef.current = null
        pendingRef.current = null
        if (mountedRef.current) {
          setIsVideoExporting(false)
          setLoop(playback.loop)
          setCurrentTime(playback.currentTime)
          setIsPlaying(playback.isPlaying)
        }
      }
    },
    [
      canvasRef,
      currentTime,
      duration,
      isPlaying,
      loop,
      setCurrentTime,
      setIsPlaying,
      setLoop,
    ]
  )

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      activeRef.current?.abort()
    }
  }, [])

  return {
    isVideoExportPendingRef: pendingRef,
    isVideoExporting,
    videoExportProgress,
    exportTimelineVideo,
    cancelVideoExport,
    stopVideoExportRecording: cancelVideoExport,
  }
}
