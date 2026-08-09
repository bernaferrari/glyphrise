"use client"

import type { Dispatch, RefObject, SetStateAction } from "react"
import type { SvgCanvasRef } from "../3d/SvgCanvas"
import type { ExportSceneSnapshot } from "./ExportSceneSnapshot"
import type { ShapeStop } from "./TimelineModel"
import { useEditorFileSurface } from "./useEditorFileSurface"
import { useExportSceneSnapshot } from "./useExportSceneSnapshot"

type UseEditorExportSurfaceArgs = ExportSceneSnapshot & {
  selectedShapeId: string | null
  setShapes: Dispatch<SetStateAction<ShapeStop[]>>
  canvasRef: RefObject<SvgCanvasRef | null>
  exportTimelineVideo: () => Promise<void>
  isVideoExporting: boolean
  videoExportProgress: number
  markCustom: () => void
}

export function useEditorExportSurface({
  selectedShapeId,
  setShapes,
  canvasRef,
  exportTimelineVideo,
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
      onClose: closeExport,
      onExportGltf: () =>
        canvasRef.current?.exportGltf() ??
        Promise.reject(new Error("The 3D preview is not ready to export yet.")),
      onExportVideo: exportTimelineVideo,
      isVideoExporting,
      videoExportProgress,
      scene,
    },
  }
}
