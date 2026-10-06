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
import { hexToRgb, type ColorFormat } from "./color-picker-utils"
import {
  formatSolidColorValueEdit,
  getSolidColorFormatValues,
} from "./color-solid-editor-model"

const ENABLE_ALPHA = false

export interface SolidColorEditorProps {
  h: number
  s: number
  v: number
  hex: string
  alpha: number
  inputText: string
  format: ColorFormat
  setFormat: (format: ColorFormat) => void
  canvasRef: React.RefObject<HTMLDivElement | null>
  hueRef: React.RefObject<HTMLDivElement | null>
  alphaRef: React.RefObject<HTMLDivElement | null>
  handleCanvasStart: (e: React.MouseEvent | React.TouchEvent) => void
  handleHueStart: (e: React.MouseEvent | React.TouchEvent) => void
  handleAlphaStart: (e: React.MouseEvent | React.TouchEvent) => void
  handleAlphaChange: (value: string) => void
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
  alpha,
  inputText,
  format,
  setFormat,
  canvasRef,
  hueRef,
  alphaRef,
  handleCanvasStart,
  handleHueStart,
  handleAlphaStart,
  handleAlphaChange,
  handleTextChange,
  handleKeyDown,
  handleBlur,
  framed = true,
  compact = false,
}: SolidColorEditorProps) {
  const rgb = hexToRgb(hex)
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
          "relative w-full cursor-crosshair overflow-hidden rounded-lg border border-border bg-muted shadow-color-area select-none",
          compact ? "h-40" : "h-56"
        )}
      >
        <div
          className="absolute inset-px rounded-inset bg-color-area"
          style={
            {
              "--color-hue": h,
            } as React.CSSProperties
          }
        />
        <div
          className="absolute top-(--position-y) left-(--position-x) z-10 flex size-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-background bg-transparent shadow-color-area-handle"
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
        className="relative h-4.5 w-full cursor-pointer rounded-full border border-border shadow-inner bg-preview"
        style={
          {
            "--preview-background": "var(--background-hue-spectrum)",
          } as React.CSSProperties
        }
      >
        <div
          className="absolute top-1/2 left-(--position-x) size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background bg-transparent shadow-color-slider-handle"
          style={
            {
              "--position-x": `clamp(8px, ${(h / 360) * 100}%, calc(100% - 8px))`,
            } as React.CSSProperties
          }
        />
      </div>

      {ENABLE_ALPHA && (
        <div
          ref={alphaRef}
          onMouseDown={handleAlphaStart}
          onTouchStart={handleAlphaStart}
          className="relative h-4.5 w-full cursor-pointer rounded-full border border-border bg-color-alpha shadow-inner"
          style={
            {
              "--color-red": rgb.r,
              "--color-green": rgb.g,
              "--color-blue": rgb.b,
            } as React.CSSProperties
          }
        >
          <div
            className="absolute top-1/2 left-(--position-x) size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background bg-transparent shadow-color-slider-handle"
            style={
              {
                "--position-x": `clamp(8px, ${alpha * 100}%, calc(100% - 8px))`,
              } as React.CSSProperties
            }
          />
        </div>
      )}

      {format === "HEX" ? null : (
        <div className="flex items-center gap-2 text-xs">
          {formatSelect}
          <div
            className={cn(
              "grid min-w-0 flex-1 gap-px rounded-lg bg-border",
              ENABLE_ALPHA ? "grid-cols-4" : "grid-cols-3"
            )}
          >
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
                  index === formatValues.length - 1 &&
                    !ENABLE_ALPHA &&
                    "rounded-r-lg"
                )}
              />
            ))}
            {ENABLE_ALPHA && (
              <div className="flex h-8 min-w-0 items-center rounded-r-lg border border-border bg-muted/45 px-1 font-mono text-foreground">
                <input
                  type="text"
                  aria-label="Alpha percentage"
                  value={Math.round(alpha * 100)}
                  onChange={(event) => handleAlphaChange(event.target.value)}
                  className="min-w-0 flex-1 border-0 bg-transparent p-0 text-center font-mono text-foreground outline-none"
                />
                <span className="text-muted-foreground">%</span>
              </div>
            )}
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
