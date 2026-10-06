"use client"

import { useCallback, useMemo, useRef, type RefObject } from "react"
import type { SvgCanvasRef } from "../3d/SvgCanvas"
import type { ExportSceneSnapshot } from "./ExportSceneSnapshot"
import type { PresetIcon } from "./IconLibrary"
import { useEditorFileSurface } from "./useEditorFileSurface"
import { useExportSceneSnapshot } from "./useExportSceneSnapshot"
import type { ExportSettings } from "./ExportSettingsModel"
import type { EditorSnapshot } from "./EditorModel"

type UseEditorExportSurfaceArgs = ExportSceneSnapshot & {
  previewState: {
    document: EditorSnapshot
    currentTime: number
    wireframe: boolean
    ambientColor: string
    rimLightColor: string
  }
  selectedShapeId: string | null
  onShapeIconChange: (shapeId: string, icon: PresetIcon) => void
  canvasRef: RefObject<SvgCanvasRef | null>
  exportTimelineVideo: (settings: ExportSettings) => Promise<void>
  stopVideoExportRecording: () => void
  cancelVideoExport: () => void
  isVideoExporting: boolean
  videoExportProgress: number
}

export function useEditorExportSurface({
  selectedShapeId,
  previewState,
  onShapeIconChange,
  canvasRef,
  exportTimelineVideo,
  stopVideoExportRecording: _stopVideoExportRecording,
  cancelVideoExport,
  isVideoExporting,
  videoExportProgress,
  ...sceneArgs
}: UseEditorExportSurfaceArgs) {
  const {
    isExportOpen,
    openExport,
    closeExport,
    uploadFileRef,
    handleUploadInputChange,
    handleDropSvg,
    triggerShapeUpload,
    svgImportError,
    clearSvgImportError,
  } = useEditorFileSurface({
    selectedShapeId,
    onShapeIconChange,
  })

  const scene = useExportSceneSnapshot(sceneArgs)
  // Document snapshots are immutable; compare their identity without serializing
  // SVGs and every keyframe on each playback tick.
  const {
    document: snapshot,
    currentTime,
    wireframe,
    ambientColor,
    rimLightColor,
  } = previewState
  const previewKey = useMemo(
    () => [snapshot, currentTime, wireframe, ambientColor, rimLightColor],
    [snapshot, currentTime, wireframe, ambientColor, rimLightColor]
  )

  const cancelRequestRef = useRef(0)
  const cancelExport = () => {
    cancelRequestRef.current++
    cancelVideoExport()
  }
  const capturesRef = useRef<Promise<unknown>>(Promise.resolve())
  const captureRef = useRef<{
    key: string
    previewKey: readonly unknown[]
    promise: Promise<Blob>
  } | null>(null)
  const capturePreview = useCallback(
    (settings: ExportSettings) => {
      const key = JSON.stringify([
        settings.width,
        settings.height,
        settings.backgroundMode,
        settings.backgroundColor,
      ])
      if (
        captureRef.current?.key === key &&
        captureRef.current.previewKey === previewKey
      )
        return captureRef.current.promise
      const promise = capturesRef.current
        .catch(() => {})
        .then(async () => {
          const canvas = canvasRef.current
          if (!canvas)
            throw new Error("The 3D preview is not ready to export yet.")
          return canvas.exportPng({
            width: settings.width,
            height: settings.height,
            backgroundColor:
              settings.backgroundMode === "transparent"
                ? null
                : settings.backgroundColor,
          })
        })
      capturesRef.current = promise
      captureRef.current = { key, previewKey, promise }
      void promise.catch(() => {
        if (captureRef.current?.promise === promise) captureRef.current = null
      })
      return promise
    },
    [canvasRef, previewKey]
  )

  const downloadPng = async (settings: ExportSettings) => {
    const blob = await capturePreview(settings)
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "glyphrise-still.png"
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return {
    openExport,
    uploadFileRef,
    handleUploadInputChange,
    handleDropSvg,
    triggerShapeUpload,
    svgImportError,
    clearSvgImportError,
    exportModalProps: {
      isOpen: isExportOpen,
      onClose: () => {
        cancelExport()
        closeExport()
      },
      onExportGltf: () =>
        canvasRef.current?.exportGltf() ??
        Promise.reject(new Error("The 3D preview is not ready to export yet.")),
      onCapturePreview: capturePreview,
      onExportVideo: async (settings: ExportSettings) => {
        const request = cancelRequestRef.current
        await capturesRef.current.catch(() => {})
        if (cancelRequestRef.current !== request)
          throw new Error("Video export was canceled.")
        await exportTimelineVideo(settings)
      },
      onExportPng: downloadPng,
      onCancelVideoExport: cancelExport,
      isVideoExporting,
      videoExportProgress,
      scene,
    },
  }
}
