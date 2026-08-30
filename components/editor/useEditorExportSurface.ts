"use client"

import type { Dispatch, RefObject, SetStateAction } from "react"
import type { SvgCanvasRef } from "../3d/SvgCanvas"
import type { ExportSceneSnapshot } from "./ExportSceneSnapshot"
import type { ShapeStop } from "./TimelineModel"
import { useEditorFileSurface } from "./useEditorFileSurface"
import { useExportSceneSnapshot } from "./useExportSceneSnapshot"
import type { ExportSettings } from "./ExportSettingsModel"

type UseEditorExportSurfaceArgs = ExportSceneSnapshot & {
  selectedShapeId: string | null
  setShapes: Dispatch<SetStateAction<ShapeStop[]>>
  canvasRef: RefObject<SvgCanvasRef | null>
  exportTimelineVideo: (settings: ExportSettings) => Promise<void>
  stopVideoExportRecording: () => void
  cancelVideoExport: () => void
  isVideoExporting: boolean
  videoExportProgress: number
  markCustom: () => void
}

export function useEditorExportSurface({
  selectedShapeId,
  setShapes,
  canvasRef,
  exportTimelineVideo,
  stopVideoExportRecording: _stopVideoExportRecording,
  cancelVideoExport,
  isVideoExporting,
  videoExportProgress,
  markCustom,
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
    setShapes,
    markCustom,
  })

  const scene = useExportSceneSnapshot(sceneArgs)

  const downloadPng = async (settings: ExportSettings) => {
    const preview = canvasRef.current
    if (!preview) throw new Error("The 3D preview is not ready to export yet.")
    const blob = await preview.exportPng({
      width: settings.width,
      height: settings.height,
      backgroundColor:
        settings.backgroundMode === "transparent"
          ? null
          : settings.backgroundColor,
    })
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
        cancelVideoExport()
        closeExport()
      },
      onExportGltf: () =>
        canvasRef.current?.exportGltf() ??
        Promise.reject(new Error("The 3D preview is not ready to export yet.")),
      onExportVideo: exportTimelineVideo,
      onExportPng: downloadPng,
      onCancelVideoExport: cancelVideoExport,
      isVideoExporting,
      videoExportProgress,
      scene,
    },
  }
}
