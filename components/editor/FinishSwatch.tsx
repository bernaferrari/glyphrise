"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import type { MaterialPresetId } from "../3d/MaterialPresets"
import {
  cachedFinishThumbnail,
  finishPreviewFillKey,
  renderFinishThumbnail,
  type FinishPreviewFill,
} from "../3d/FinishThumbnails"
import { MATERIAL_PREVIEW } from "./FinishRegistry"

type Thumbnails = Partial<Record<MaterialPresetId, string>>

/** CSS-hidden phone panes must not create an offscreen WebGL renderer. */
export function useFinishThumbnailVisibility() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const element = ref.current
    if (!element) return
    if (typeof IntersectionObserver === "undefined") {
      setVisible(element.getClientRects().length > 0)
      return
    }
    const observer = new IntersectionObserver(([entry]) => {
      setVisible(entry.isIntersecting)
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  return { ref, visible }
}

const scheduleThumbnail = (callback: () => void) => {
  if (typeof window.requestIdleCallback === "function") {
    const id = window.requestIdleCallback(callback, { timeout: 500 })
    return () => window.cancelIdleCallback(id)
  }
  // Safari versions without idle callbacks still get a turn to paint and
  // process input between finishes, rather than a chain of microtasks.
  const id = window.setTimeout(callback, 32)
  return () => window.clearTimeout(id)
}

const readCached = (
  presets: readonly MaterialPresetId[],
  fill: FinishPreviewFill
) => {
  const next: Thumbnails = {}
  presets.forEach((preset) => {
    const url = cachedFinishThumbnail(preset, fill)
    if (url) next[preset] = url
  })
  return next
}

/**
 * Renders real 3D swatches in the current fill color. Work is spread over
 * frames so opening the picker never blocks the viewport, and color drags are
 * debounced; the previous swatches stay visible until new ones are ready.
 */
export function useFinishThumbnails(
  presets: readonly MaterialPresetId[],
  fill: FinishPreviewFill,
  enabled = true
) {
  const presetsKey = presets.join(",")
  // Keyed by content so a new-but-equal fill object never restarts work.
  const fillKey = finishPreviewFillKey(fill)
  const fillRef = useRef(fill)
  const [thumbnails, setThumbnails] = useState<Thumbnails>(() =>
    readCached(presets, fill)
  )

  useEffect(() => {
    fillRef.current = fill
  })

  useEffect(() => {
    if (!enabled || !presetsKey) return
    const queue = (
      presetsKey ? presetsKey.split(",") : []
    ) as MaterialPresetId[]
    let cancelled = false
    let cancelScheduled = () => {}
    const renderNext = async () => {
      if (cancelled) return
      const preset = queue.shift()
      if (!preset) return
      try {
        const url = await renderFinishThumbnail(preset, fillRef.current)
        if (cancelled) return
        if (url) setThumbnails((previous) => ({ ...previous, [preset]: url }))
      } catch {
        // The CSS swatch remains usable if the GPU context is unavailable.
      }
      if (!cancelled && queue.length) {
        cancelScheduled = scheduleThumbnail(() => void renderNext())
      }
    }
    const timeout = window.setTimeout(() => {
      cancelScheduled = scheduleThumbnail(() => void renderNext())
    }, 120)
    return () => {
      cancelled = true
      window.clearTimeout(timeout)
      cancelScheduled()
    }
  }, [enabled, fillKey, presetsKey])

  return thumbnails
}

export function FinishSwatch({
  preset,
  thumbnail,
  className,
}: {
  preset: MaterialPresetId
  thumbnail?: string
  className?: string
}) {
  return (
    <span
      aria-hidden="true"
      className={cn("relative block shrink-0 rounded-full", className)}
    >
      {thumbnail ? (
        <img
          src={thumbnail}
          alt=""
          draggable={false}
          className="absolute inset-0 size-full select-none"
        />
      ) : (
        <span
          className="absolute inset-0 rounded-full shadow-[inset_0_1px_2px_rgb(255_255_255/50%),inset_0_-2px_3px_rgb(0_0_0/20%)]"
          style={{ background: MATERIAL_PREVIEW[preset] }}
        />
      )}
    </span>
  )
}
