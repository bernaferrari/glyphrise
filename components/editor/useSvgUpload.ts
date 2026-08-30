import { useRef, useState } from "react"
import type {
  ChangeEvent,
  Dispatch,
  DragEvent,
  RefObject,
  SetStateAction,
} from "react"
import type { ShapeStop } from "./TimelineModel"
import {
  isSvgFile,
  svgImportMessage,
  validateAndSanitizeSvg,
} from "./SvgImportModel"

const readSvgFile = (
  file: File,
  onLoad: (content: string) => void,
  onError: (message: string) => void,
  onDone?: () => void
) => {
  const reader = new FileReader()
  reader.onload = (event) => {
    const content = event.target?.result
    if (typeof content === "string" && content) {
      try {
        onLoad(validateAndSanitizeSvg(content))
      } catch (error) {
        onError(svgImportMessage(error))
      }
    } else {
      onError("Glyphrise could not read this SVG file.")
    }
    onDone?.()
  }
  reader.onerror = () => {
    onError("Glyphrise could not read this SVG file.")
    onDone?.()
  }
  reader.readAsText(file)
}

export const useSvgUpload = ({
  selectedShapeId,
  setShapes,
  markCustom,
}: {
  selectedShapeId: string | null
  setShapes: Dispatch<SetStateAction<ShapeStop[]>>
  markCustom: () => void
}): {
  uploadFileRef: RefObject<HTMLInputElement | null>
  triggerShapeUpload: (shapeId: string) => void
  handleUploadInputChange: (event: ChangeEvent<HTMLInputElement>) => void
  uploadSvgToShape: (
    event: ChangeEvent<HTMLInputElement>,
    shapeId: string
  ) => void
  handleDropSvg: (event: DragEvent) => void
  svgImportError: string | null
  clearSvgImportError: () => void
} => {
  const uploadFileRef = useRef<HTMLInputElement>(null)
  const uploadTargetRef = useRef<string | null>(null)
  const [svgImportError, setSvgImportError] = useState<string | null>(null)

  const applyCustomSvg = (shapeId: string, svgContent: string) => {
    setSvgImportError(null)
    markCustom()
    setShapes((prev) =>
      prev.map((shape) =>
        shape.id === shapeId
          ? { ...shape, iconId: "custom", iconName: "Custom", svgContent }
          : shape
      )
    )
  }

  const uploadSvgToShape = (
    event: ChangeEvent<HTMLInputElement>,
    shapeId: string
  ) => {
    const input = event.currentTarget
    const file = input.files?.[0]
    if (!isSvgFile(file)) {
      setSvgImportError(
        file?.size && file.size > 1_000_000
          ? "This SVG is larger than the 1 MB import limit."
          : "Choose a plain .svg file. Other image formats are not supported."
      )
      input.value = ""
      return
    }

    readSvgFile(
      file!,
      (content) => applyCustomSvg(shapeId, content),
      setSvgImportError,
      () => {
        input.value = ""
      }
    )
  }

  const handleUploadInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const shapeId = uploadTargetRef.current
    if (!shapeId) {
      event.currentTarget.value = ""
      return
    }
    uploadSvgToShape(event, shapeId)
  }

  const handleDropSvg = (event: DragEvent) => {
    const file = event.dataTransfer.files[0]
    if (!selectedShapeId) return
    if (!isSvgFile(file)) {
      setSvgImportError(
        file?.size && file.size > 1_000_000
          ? "This SVG is larger than the 1 MB import limit."
          : "Drop a plain .svg file. Other image formats are not supported."
      )
      return
    }

    readSvgFile(
      file!,
      (content) => applyCustomSvg(selectedShapeId, content),
      setSvgImportError
    )
  }

  const triggerShapeUpload = (shapeId: string) => {
    uploadTargetRef.current = shapeId
    uploadFileRef.current?.click()
  }

  return {
    uploadFileRef,
    triggerShapeUpload,
    handleUploadInputChange,
    uploadSvgToShape,
    handleDropSvg,
    svgImportError,
    clearSvgImportError: () => setSvgImportError(null),
  }
}
