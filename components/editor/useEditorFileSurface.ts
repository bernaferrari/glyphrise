"use client"

import { useState } from "react"
import type { PresetIcon } from "./IconLibrary"
import { useSvgUpload } from "./useSvgUpload"

export function useEditorFileSurface({
  selectedShapeId,
  onShapeIconChange,
}: {
  selectedShapeId: string | null
  onShapeIconChange: (shapeId: string, icon: PresetIcon) => void
}) {
  const [isExportOpen, setIsExportOpen] = useState(false)
  const upload = useSvgUpload({
    selectedShapeId,
    onShapeIconChange,
  })

  return {
    isExportOpen,
    setIsExportOpen,
    openExport: () => setIsExportOpen(true),
    closeExport: () => setIsExportOpen(false),
    ...upload,
  }
}
