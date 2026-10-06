"use client"

import * as React from "react"
import { bindWindowTouchMouseDrag } from "@/lib/drag-events"
import { hexToHsv, hsvToHex, type ColorFormat } from "./color-picker-utils"

interface SolidColorEditorOptions {
  value: string
  onChange: (hex: string) => void
}

const normalizeHex = (value: string) =>
  value.startsWith("#") ? value : `#${value}`

const parseHexWithOptionalAlpha = (value: string) => {
  let formatted = value.trim()
  if (!formatted.startsWith("#")) formatted = `#${formatted}`
  return formatted.match(/^#([0-9A-Fa-f]{6})([0-9A-Fa-f]{2})?$/)
}

export function useSolidColorEditor({
  value,
  onChange,
}: SolidColorEditorOptions) {
  const [format, setFormat] = React.useState<ColorFormat>("HEX")
  const canvasRef = React.useRef<HTMLDivElement>(null)
  const hueRef = React.useRef<HTMLDivElement>(null)
  const hex = normalizeHex(value)

  const { h, s, v } = React.useMemo(() => {
    try {
      return hexToHsv(hex)
    } catch {
      return { h: 0, s: 0, v: 100 }
    }
  }, [hex])

  const hexInputValue = `#${hex.replace(/^#/, "").slice(0, 6)}`

  const [inputText, setInputText] = React.useState(hexInputValue)

  React.useEffect(() => {
    setInputText(hexInputValue)
  }, [hexInputValue])

  const handleCanvasDrag = React.useCallback(
    (clientX: number, clientY: number) => {
      if (!canvasRef.current) return
      const rect = canvasRef.current.getBoundingClientRect()
      const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
      const y = Math.max(0, Math.min(1, 1 - (clientY - rect.top) / rect.height))

      onChange(hsvToHex(h, Math.round(x * 100), Math.round(y * 100)))
    },
    [h, onChange]
  )

  const handleCanvasStart = (event: React.MouseEvent | React.TouchEvent) => {
    event.preventDefault()
    const clientX =
      "touches" in event ? event.touches[0].clientX : event.clientX
    const clientY =
      "touches" in event ? event.touches[0].clientY : event.clientY
    handleCanvasDrag(clientX, clientY)

    bindWindowTouchMouseDrag({
      onMove: (moveEvent) => {
        const moveX =
          "touches" in moveEvent
            ? moveEvent.touches[0].clientX
            : moveEvent.clientX
        const moveY =
          "touches" in moveEvent
            ? moveEvent.touches[0].clientY
            : moveEvent.clientY
        handleCanvasDrag(moveX, moveY)
      },
    })
  }

  const handleHueDrag = React.useCallback(
    (clientX: number) => {
      if (!hueRef.current) return
      const rect = hueRef.current.getBoundingClientRect()
      const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
      onChange(hsvToHex(Math.round(x * 360), s, v))
    },
    [onChange, s, v]
  )

  const handleHueStart = (event: React.MouseEvent | React.TouchEvent) => {
    event.preventDefault()
    const clientX =
      "touches" in event ? event.touches[0].clientX : event.clientX
    handleHueDrag(clientX)

    bindWindowTouchMouseDrag({
      onMove: (moveEvent) => {
        const moveX =
          "touches" in moveEvent
            ? moveEvent.touches[0].clientX
            : moveEvent.clientX
        handleHueDrag(moveX)
      },
    })
  }

  const applyTextColor = (nextText: string) => {
    const hexMatch = parseHexWithOptionalAlpha(nextText)
    if (!hexMatch) return false
    onChange(`#${hexMatch[1]}`)
    return true
  }

  const handleTextChange = (nextText: string) => {
    setInputText(nextText)
    applyTextColor(nextText)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return
    if (!applyTextColor(inputText)) setInputText(hexInputValue)
    event.currentTarget.blur()
  }

  const handleBlur = () => {
    if (!applyTextColor(inputText)) setInputText(hexInputValue)
  }

  return {
    h,
    s,
    v,
    hex,
    inputText,
    format,
    setFormat,
    canvasRef,
    hueRef,
    handleCanvasStart,
    handleHueStart,
    handleTextChange,
    handleKeyDown,
    handleBlur,
  }
}
