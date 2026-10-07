"use client"

import type { CSSProperties, ReactNode } from "react"
import { cn } from "@/lib/utils"
import type { AnimationPresetId } from "./AnimationPresetModel"

// Sized natively rather than CSS-scaled, so the icon stays centered in
// whatever tile holds it and spins around its own middle.
const SIZES = {
  sm: {
    box: "size-8 perspective-near",
    icon: "size-5.5 [&_svg]:size-5.5",
    glyph: "text-lg",
    depth: 3,
  },
  md: {
    box: "size-12 perspective-near",
    icon: "size-9 [&_svg]:size-9",
    glyph: "text-3xl",
    depth: 4,
  },
  lg: {
    box: "size-16 perspective-normal",
    icon: "size-12 [&_svg]:size-12",
    glyph: "text-5xl",
    depth: 6,
  },
}

const ANIMATIONS: Record<AnimationPresetId, string> = {
  spin: "animate-motion-spin",
  tilt: "animate-motion-tilt",
  pulse: "animate-motion-pulse",
}

// Stacked copies behind the face read as the extruded side of the icon
// while it turns, like the 3D render does.
const LAYERS = 6

export function MotionPresetPreview({
  preset,
  svgContent,
  duration = 2.5,
  intensity = 1,
  size = "md",
  className,
}: {
  preset: AnimationPresetId
  svgContent?: string
  duration?: number
  intensity?: number
  size?: keyof typeof SIZES
  /** Applied to the animated element, e.g. to pause it until hovered. */
  className?: string
}) {
  const { box, icon, glyph, depth } = SIZES[size]
  const art: ReactNode = svgContent ? (
    <span
      className="grid place-items-center"
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  ) : (
    <span className={glyph}>✦</span>
  )
  return (
    <span
      aria-hidden="true"
      className={cn("grid shrink-0 place-items-center", box)}
    >
      <span
        data-slot="motion-preview"
        className={cn(
          "relative grid place-items-center transform-3d [&_svg]:block [&_svg_*]:fill-current",
          ANIMATIONS[preset],
          icon,
          className
        )}
        style={
          {
            "--motion-duration": `${duration}s`,
            "--motion-amount": intensity,
          } as CSSProperties
        }
      >
        {Array.from({ length: LAYERS }, (_, index) => (
          <span
            key={index}
            data-slot="motion-preview-depth"
            className="absolute inset-0 grid translate-z-(--layer-z) place-items-center text-muted-foreground"
            style={
              {
                "--layer-z": `${-((index + 1) * depth) / LAYERS}px`,
              } as CSSProperties
            }
          >
            {art}
          </span>
        ))}
        <span
          data-slot="motion-preview-face"
          className="relative grid place-items-center text-foreground"
        >
          {art}
        </span>
      </span>
    </span>
  )
}
