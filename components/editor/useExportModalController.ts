"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import confetti from "canvas-confetti"
import {
  type ExportCodeTemplateParams,
  generateAndroidFilamentCode,
  generateAndroidGradleCode,
  generateR3fCode,
} from "./ExportCodeTemplates"
import type { ExportSceneSnapshot } from "./ExportSceneSnapshot"
import {
  DEFAULT_EXPORT_SETTINGS,
  availableVideoContainers,
  type ExportSettings,
} from "./ExportSettingsModel"
import type { VideoContainer } from "../3d/SvgTypes"

export type ExportTab = "options" | "r3f" | "android"

export const isExportTab = (value: string): value is ExportTab =>
  value === "options" || value === "r3f" || value === "android"

export function useExportModalController({
  scene,
  onExportGltf,
  onExportPng,
  onExportVideo,
  isVideoExporting,
  onCodeCopied,
}: {
  scene: ExportSceneSnapshot
  onExportGltf: () => Promise<void>
  onExportPng: (settings: ExportSettings) => Promise<void>
  onExportVideo: (settings: ExportSettings) => Promise<void>
  isVideoExporting: boolean
  onCodeCopied?: () => void
}) {
  const [activeTab, setActiveTab] = useState<ExportTab>("options")
  const [isRecording, setIsRecording] = useState(false)
  const [isCopied, setIsCopied] = useState<Record<string, boolean>>({})
  const [isGltfExporting, setIsGltfExporting] = useState(false)
  const [isPngExporting, setIsPngExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const [justExported, setJustExported] = useState<Record<string, boolean>>({})
  const [videoExportCanceled, setVideoExportCanceled] = useState(false)
  const [settings, setSettings] = useState(DEFAULT_EXPORT_SETTINGS)
  const [supportedVideoContainers, setSupportedVideoContainers] = useState<
    VideoContainer[]
  >(["webm"])

  useEffect(() => {
    if (typeof MediaRecorder === "undefined") {
      setSupportedVideoContainers([])
      return
    }
    const supported = availableVideoContainers((mimeType) =>
      MediaRecorder.isTypeSupported(mimeType)
    )
    setSupportedVideoContainers([...supported])
    if (supported.length > 0 && !supported.includes(settings.container)) {
      setSettings((current) => ({ ...current, container: supported[0] }))
    }
  }, [settings.container])

  const updateSettings = useCallback((patch: Partial<ExportSettings>) => {
    setSettings((current) => ({ ...current, ...patch }))
  }, [])

  const codeTemplateParams = useMemo<ExportCodeTemplateParams>(
    () => ({ ...scene }),
    [scene]
  )

  const r3fCode = useMemo(
    () => generateR3fCode(codeTemplateParams),
    [codeTemplateParams]
  )
  const androidGradleCode = useMemo(() => generateAndroidGradleCode(), [])
  const androidFilamentCode = useMemo(
    () => generateAndroidFilamentCode(codeTemplateParams),
    [codeTemplateParams]
  )

  const handleTabChange = useCallback((value: string) => {
    if (isExportTab(value)) setActiveTab(value)
  }, [])

  const celebrate = useCallback((options: Parameters<typeof confetti>[0]) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    void confetti(options)
  }, [])

  const handleCopyCode = useCallback(
    async (key: string, text: string) => {
      try {
        setExportError(null)
        await navigator.clipboard.writeText(text)
        setIsCopied((current) => ({ ...current, [key]: true }))
        onCodeCopied?.()
        celebrate({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
          colors: ["#7c5cff", "#ff5b9a", "#ffd700"],
        })
        window.setTimeout(
          () =>
            setIsCopied((current) =>
              current[key] ? { ...current, [key]: false } : current
            ),
          2000
        )
      } catch {
        setIsCopied((current) => ({ ...current, [key]: false }))
        setExportError(
          "Code was not copied. Allow clipboard access, or select the code and copy it manually."
        )
      }
    },
    [celebrate, onCodeCopied]
  )

  const flashExported = useCallback((key: string) => {
    setJustExported((current) => ({ ...current, [key]: true }))
    window.setTimeout(
      () =>
        setJustExported((current) =>
          current[key] ? { ...current, [key]: false } : current
        ),
      2000
    )
  }, [])

  const handleGltfExport = useCallback(async () => {
    if (isGltfExporting) return
    try {
      setExportError(null)
      setIsGltfExporting(true)
      await onExportGltf()
      flashExported("gltf")
    } catch (error) {
      setExportError(
        error instanceof Error
          ? `GLB export failed: ${error.message}`
          : "GLB export failed. Try simplifying the SVG paths."
      )
    } finally {
      setIsGltfExporting(false)
    }
  }, [flashExported, isGltfExporting, onExportGltf])

  const handlePngExport = useCallback(async () => {
    if (isPngExporting) return
    try {
      setExportError(null)
      setIsPngExporting(true)
      await onExportPng(settings)
      flashExported("png")
    } catch (error) {
      setExportError(
        error instanceof Error
          ? `PNG export failed: ${error.message}`
          : "PNG export failed. Try a smaller output size."
      )
    } finally {
      setIsPngExporting(false)
    }
  }, [flashExported, isPngExporting, onExportPng, settings])

  const handleVideoExport = useCallback(async () => {
    if (isRecording || isVideoExporting) return
    try {
      setExportError(null)
      setVideoExportCanceled(false)
      setIsRecording(true)
      await onExportVideo(settings)
      flashExported("video")
    } catch (error) {
      // User-initiated stops/cancels reject the promise on purpose; they are
      // expected outcomes, not failures worth an error banner.
      if (error instanceof Error && /cancel|stopped/i.test(error.message)) {
        setVideoExportCanceled(true)
        window.setTimeout(() => setVideoExportCanceled(false), 2000)
        return
      }
      setExportError(
        error instanceof Error
          ? `Video export failed: ${error.message}`
          : "Video export failed. Keep this window visible and try again."
      )
    } finally {
      setIsRecording(false)
    }
  }, [flashExported, isRecording, isVideoExporting, onExportVideo, settings])

  return {
    activeTab,
    androidFilamentCode,
    androidGradleCode,
    handleCopyCode,
    handleGltfExport,
    handlePngExport,
    handleTabChange,
    handleVideoExport,
    isCopied,
    justExported,
    videoExportCanceled,
    isGltfExporting,
    isPngExporting,
    isRecording: isRecording || isVideoExporting,
    exportError,
    clearExportError: () => setExportError(null),
    r3fCode,
    settings,
    supportedVideoContainers,
    updateSettings,
  }
}
