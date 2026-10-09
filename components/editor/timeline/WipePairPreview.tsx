"use client"

import React from "react"
import type { MaterialWipeIconPair } from "../MaterialWipePairs"

export const WipePairPreview: React.FC<{
  pair: MaterialWipeIconPair
  className: string
  style: React.CSSProperties & { "--symbol-variation"?: string }
}> = ({ pair, className, style }) => {
  return (
    <span className="relative grid size-8 shrink-0 place-items-center overflow-hidden">
      <span className="wipe-pair-preview-layer wipe-pair-preview-base absolute inset-0 grid place-items-center">
        <span
          className={`${className} absolute top-1/2 left-1/2 grid size-6 -translate-x-1/2 -translate-y-1/2 place-items-center text-center text-2xl leading-6 text-foreground`}
          style={
            {
              "--symbol-variation": style["--symbol-variation"],
            } as React.CSSProperties
          }
        >
          {pair.enabled}
        </span>
      </span>
      <span className="wipe-pair-preview-layer wipe-pair-preview-wiped absolute inset-0 grid place-items-center">
        <span
          className={`${className} absolute top-1/2 left-1/2 grid size-6 -translate-x-1/2 -translate-y-1/2 place-items-center text-center text-2xl leading-6 text-foreground`}
          style={
            {
              "--symbol-variation": style["--symbol-variation"],
            } as React.CSSProperties
          }
        >
          {pair.enabled}
        </span>
        <span
          aria-hidden="true"
          className="absolute top-1/2 left-1/2 h-6.25 w-0.5 -translate-x-1/2 -translate-y-1/2 -rotate-45 rounded-full bg-foreground ring-1 ring-background"
        />
      </span>
    </span>
  )
}
