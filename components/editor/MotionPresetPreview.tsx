"use client"

import type { CSSProperties } from "react"
import { cn } from "@/lib/utils"
import type { AnimationPresetId } from "./AnimationPresetModel"

// Sized natively rather than CSS-scaled, so the icon stays centered in
// whatever tile holds it and spins around its own middle.
const SIZES = {
  sm: { box: "size-8 [perspective:110px]", icon: "size-5.5 [&_svg]:size-5.5" },
  md: { box: "size-12 [perspective:160px]", icon: "size-9 [&_svg]:size-9" },
  lg: { box: "size-16 [perspective:220px]", icon: "size-12 [&_svg]:size-12" },
}

const ANIMATIONS: Record<AnimationPresetId, string> = {
  spin: "animate-motion-spin",
  tilt: "animate-motion-tilt",
  pulse: "animate-motion-pulse",
}

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
  return (
    <span
      aria-hidden="true"
      className={cn("grid shrink-0 place-items-center", SIZES[size].box)}
    >
      <span
        data-slot="motion-preview"
        className={cn(
          "grid place-items-center text-foreground drop-shadow-sm [&_svg]:block [&_svg_*]:fill-current",
          ANIMATIONS[preset],
          SIZES[size].icon,
          className
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
          <span
            className={
              size === "sm"
                ? "text-lg"
                : size === "md"
                  ? "text-3xl"
                  : "text-5xl"
            }
          >
            ✦
          </span>
        )}
      </span>
    </span>
  )
}
