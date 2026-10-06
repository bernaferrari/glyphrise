"use client"

import type { CSSProperties } from "react"
import { cn } from "@/lib/utils"
import type { AnimationPresetId } from "./AnimationPresetModel"

// Sized natively rather than CSS-scaled, so the icon stays centered in
// whatever tile holds it and spins around its own middle.
const SIZES = {
  sm: { box: "size-8 [perspective:110px]", icon: "size-5.5 [&_svg]:size-5.5" },
  md: { box: "size-12 [perspective:160px]", icon: "size-9 [&_svg]:size-9" },
}

export function MotionPresetPreview({
  preset,
  svgContent,
  duration = 2.5,
  intensity = 1,
  size = "md",
}: {
  preset: AnimationPresetId
  svgContent?: string
  duration?: number
  intensity?: number
  size?: keyof typeof SIZES
}) {
  return (
    <span
      aria-hidden="true"
      className={cn("grid shrink-0 place-items-center", SIZES[size].box)}
    >
      <span
        className={cn(
          "motion-preview grid place-items-center text-foreground drop-shadow-sm [&_svg]:block [&_svg_*]:fill-current",
          `motion-preview-${preset}`,
          SIZES[size].icon,
          "duration-motion"
        )}
        style={
          {
            "--motion-duration": `${duration}s`,
            "--motion-amount": intensity,
          } as CSSProperties
        }
      >
        {svgContent ? (
          <span
            className="grid place-items-center"
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        ) : (
          <span className={size === "sm" ? "text-lg" : "text-3xl"}>✦</span>
        )}
      </span>
    </span>
  )
}
