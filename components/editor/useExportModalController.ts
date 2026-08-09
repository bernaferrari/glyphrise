"use client"

import { useCallback, useMemo, useState } from "react"
import confetti from "canvas-confetti"
import {
  type ExportCodeTemplateParams,
  generateAndroidFilamentCode,
  generateAndroidGradleCode,
  generateR3fCode,
} from "./ExportCodeTemplates"
import type { ExportSceneSnapshot } from "./ExportSceneSnapshot"

export type ExportTab = "options" | "r3f" | "android"

export const isExportTab = (value: string): value is ExportTab =>
  value === "options" || value === "r3f" || value === "android"

export function useExportModalController({
  scene,
  onExportGltf,
  onExportVideo,
  isVideoExporting,
}: {
  scene: ExportSceneSnapshot
  onExportGltf: () => Promise<void>
  onExportVideo: () => Promise<void>
  isVideoExporting: boolean
}) {
  const [activeTab, setActiveTab] = useState<ExportTab>("options")
  const [isRecording, setIsRecording] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [isGltfExporting, setIsGltfExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

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
    async (text: string) => {
      try {
        setExportError(null)
        await navigator.clipboard.writeText(text)
        setIsCopied(true)
        celebrate({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
          colors: ["#7c5cff", "#ff5b9a", "#ffd700"],
        })
        window.setTimeout(() => setIsCopied(false), 2000)
      } catch {
        setIsCopied(false)
        setExportError(
          "Code was not copied. Allow clipboard access, or select the code and copy it manually."
        )
      }
    },
    [celebrate]
  )

  const handleGltfExport = useCallback(async () => {
    if (isGltfExporting) return
    try {
      setExportError(null)
      setIsGltfExporting(true)
      await onExportGltf()
    } catch (error) {
      setExportError(
        error instanceof Error
          ? `GLB export failed: ${error.message}`
          : "GLB export failed. Try simplifying the SVG paths."
      )
    } finally {
      setIsGltfExporting(false)
    }
  }, [isGltfExporting, onExportGltf])

  const handleVideoExport = useCallback(async () => {
    if (isRecording || isVideoExporting) return
    try {
      setExportError(null)
      setIsRecording(true)
      await onExportVideo()
      celebrate({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#4ee2a3", "#7c5cff", "#ffffff"],
      })
    } catch (error) {
      setExportError(
        error instanceof Error
          ? `Video export failed: ${error.message}`
          : "Video export failed. Keep this window visible and try again."
      )
    } finally {
      setIsRecording(false)
    }
  }, [celebrate, isRecording, isVideoExporting, onExportVideo])

  return {
    activeTab,
    androidFilamentCode,
    androidGradleCode,
    handleCopyCode,
    handleGltfExport,
    handleTabChange,
    handleVideoExport,
    isCopied,
    isGltfExporting,
    isRecording: isRecording || isVideoExporting,
    exportError,
    clearExportError: () => setExportError(null),
    r3fCode,
  }
}
