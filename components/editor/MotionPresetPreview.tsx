"use client"

import type { CSSProperties } from "react"
import type { AnimationPresetId } from "./AnimationPresetModel"

export function MotionPresetPreview({
  preset,
  svgContent,
  duration = 2.5,
  intensity = 1,
}: {
  preset: AnimationPresetId
  svgContent?: string
  duration?: number
  intensity?: number
}) {
  return (
    <span
      aria-hidden="true"
      className="grid size-12 shrink-0 place-items-center [perspective:160px]"
    >
      <span
        className={`motion-preview motion-preview-${preset} grid size-9 place-items-center text-primary drop-shadow-sm [&_svg]:size-9 [&_svg_*]:fill-current`}
        style={
          {
            animationDuration: `${duration}s`,
            "--motion-amount": intensity,
          } as CSSProperties
        }
      >
        {svgContent ? (
          <span dangerouslySetInnerHTML={{ __html: svgContent }} />
        ) : (
          <span className="text-3xl">✦</span>
        )}
      </span>
    </span>
  )
}
