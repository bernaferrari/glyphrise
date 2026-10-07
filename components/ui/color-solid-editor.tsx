"use client"

import * as React from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type { ColorFormat } from "./color-picker-utils"
import {
  formatSolidColorValueEdit,
  getSolidColorFormatValues,
} from "./color-solid-editor-model"

export interface SolidColorEditorProps {
  h: number
  s: number
  v: number
  hex: string
  inputText: string
  format: ColorFormat
  setFormat: (format: ColorFormat) => void
  canvasRef: React.RefObject<HTMLDivElement | null>
  hueRef: React.RefObject<HTMLDivElement | null>
  handleCanvasStart: (e: React.MouseEvent | React.TouchEvent) => void
  handleHueStart: (e: React.MouseEvent | React.TouchEvent) => void
  handleTextChange: (value: string) => void
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void
  handleBlur: () => void
  framed?: boolean
  compact?: boolean
}

export function SolidColorEditor({
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
  framed = true,
  compact = false,
}: SolidColorEditorProps) {
  const formatValues = getSolidColorFormatValues({ format, hex, h, s, v })

  const updateFormatValue = (index: number, rawValue: string) => {
    const nextHex = formatSolidColorValueEdit({
      format,
      hex,
      h,
      s,
      v,
      index,
      rawValue,
    })
    if (nextHex) handleTextChange(nextHex)
  }

  const formatSelect = (
    <Select
      value={format}
      onValueChange={(next) => setFormat(next as ColorFormat)}
    >
      <SelectTrigger
        variant="color-format"
        size="sm"
        className="h-8 w-18 shrink-0"
      >
        <SelectValue>{format}</SelectValue>
      </SelectTrigger>
      <SelectContent align="start" className="min-w-18">
        <SelectItem value="HEX">HEX</SelectItem>
        <SelectItem value="RGB">RGB</SelectItem>
        <SelectItem value="HSL">HSL</SelectItem>
        <SelectItem value="HSB">HSB</SelectItem>
      </SelectContent>
    </Select>
  )

  return (
    <div
      className={cn(
        "space-y-3",
        framed &&
          "rounded-xl border border-border bg-popover p-3 pb-2 text-popover-foreground shadow-xl"
      )}
    >
      <div
        ref={canvasRef}
        onMouseDown={handleCanvasStart}
        onTouchStart={handleCanvasStart}
        className={cn(
          "relative w-full cursor-crosshair overflow-hidden rounded-lg border border-border bg-muted select-none",
          compact ? "h-40" : "h-56"
        )}
      >
        <div
          className="absolute inset-px rounded-md pattern-color-area"
          style={
            {
              "--color-hue": h,
            } as React.CSSProperties
          }
        />
        <div
          className="absolute top-(--position-y) left-(--position-x) z-10 flex size-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-background bg-transparent shadow-sm shadow-black/40"
          style={
            {
              "--position-x": `${s}%`,
              "--position-y": `${100 - v}%`,
            } as React.CSSProperties
          }
        />
      </div>

      <div
        ref={hueRef}
        onMouseDown={handleHueStart}
        onTouchStart={handleHueStart}
        className="relative h-4.5 w-full cursor-pointer rounded-full border border-border shadow-inner [background:var(--preview-background)]"
        style={
          {
            "--preview-background": "var(--background-hue-spectrum)",
          } as React.CSSProperties
        }
      >
        <div
          className="absolute top-1/2 left-(--position-x) size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background bg-transparent shadow-sm shadow-black/40"
          style={
            {
              "--position-x": `clamp(8px, ${(h / 360) * 100}%, calc(100% - 8px))`,
            } as React.CSSProperties
          }
        />
      </div>

      {format === "HEX" ? null : (
        <div className="flex items-center gap-2 text-xs">
          {formatSelect}
          <div className="grid min-w-0 flex-1 grid-cols-3 gap-px rounded-lg bg-border">
            {formatValues.map((value, index) => (
              <input
                key={`${format}-${index}`}
                type="text"
                aria-label={`${format} channel ${index + 1}`}
                value={Math.round(value)}
                onChange={(event) =>
                  updateFormatValue(index, event.target.value)
                }
                className={cn(
                  "h-8 min-w-0 border border-border bg-muted/45 text-center font-mono text-foreground outline-none",
                  index === 0 && "rounded-l-lg",
                  index === formatValues.length - 1 && "rounded-r-lg"
                )}
              />
            ))}
          </div>
        </div>
      )}

      {format === "HEX" && (
        <div className="flex items-center gap-2">
          {formatSelect}
          <div className="flex h-8 min-w-0 flex-1 items-center gap-1 rounded-lg border border-border bg-muted/45 px-2.5">
            <span className="font-mono text-2xs font-bold text-muted-foreground">
              #
            </span>
            <input
              type="text"
              aria-label="Hex color"
              value={inputText.replace(/^#/, "")}
              onChange={(e) => handleTextChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              placeholder="FFFFFF"
              className="min-w-0 flex-1 border-0 bg-transparent p-0 font-mono text-xs text-foreground uppercase outline-none focus:ring-0"
            />
          </div>
        </div>
      )}
    </div>
  )
}
