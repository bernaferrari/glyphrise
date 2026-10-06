"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { createMeshRgbSampler } from "./color-picker-utils"

type MeshStop = { color: string; position: number; x?: number; y?: number }

/**
 * Paints a mesh with the same math as the 3D vertex colors. Rendered small;
 * the browser's bilinear upscale keeps the blend smooth.
 */
export function MeshPreviewCanvas({
  stops,
  fallback = "#ffffff",
  width = 48,
  height = 32,
  className,
  variant = "default",
}: {
  stops: MeshStop[]
  fallback?: string
  width?: number
  height?: number
  className?: string
  variant?: "default" | "preset" | "swatch" | "editor"
}) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)

  React.useEffect(() => {
    const context = canvasRef.current?.getContext("2d")
    if (!context) return
    const image = context.createImageData(width, height)
    const sample = createMeshRgbSampler(stops, fallback)
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const [r, g, b] = sample(x / (width - 1), y / (height - 1))
        const offset = (y * width + x) * 4
        image.data[offset] = r
        image.data[offset + 1] = g
        image.data[offset + 2] = b
        image.data[offset + 3] = 255
      }
    }
    context.putImageData(image, 0, 0)
  }, [fallback, height, stops, width])

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      aria-hidden="true"
      className={cn(
        "block",
        variant === "preset" && "rounded-lg",
        variant === "swatch" && "rounded-preview shadow-sm",
        variant === "editor" && "rounded-lg shadow-mesh-preview",
        className
      )}
    />
  )
}
