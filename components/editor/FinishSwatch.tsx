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

type Thumbnails = Partial<Record<MaterialPresetId, string | null>>

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

/**
 * Renders real 3D swatches in the current fill color. Work is spread over
 * frames so opening the picker never blocks the viewport, and color drags are
 * debounced; previous swatches stay visible until the whole batch is decoded.
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
  // Start with the same neutral placeholders on the server and client.
  const [thumbnails, setThumbnails] = useState<Thumbnails>({})

  useEffect(() => {
    fillRef.current = fill
  })

  useEffect(() => {
    if (!enabled || !presetsKey) return
    const requested = presetsKey.split(",") as MaterialPresetId[]
    const previewFill = fillRef.current
    const queue = requested.filter(
      (preset) => !cachedFinishThumbnail(preset, previewFill)
    )
    let cancelled = false
    let cancelScheduled = () => {}
    let timeout: number | undefined
    const next: Thumbnails = {}
    const decodeThumbnail = async (
      preset: MaterialPresetId,
      url: string | null
    ) => {
      if (url) {
        try {
          const image = new Image()
          image.src = url
          await image.decode()
        } catch {
          url = null
        }
      }
      next[preset] = url
    }
    const publish = () => {
      if (!cancelled) setThumbnails((previous) => ({ ...previous, ...next }))
    }
    const renderNext = async () => {
      if (cancelled) return
      const preset = queue.shift()
      if (!preset) {
        publish()
        return
      }
      let url: string | null = null
      try {
        url = await renderFinishThumbnail(preset, previewFill)
      } catch {
        // The CSS swatch is reserved for an unavailable GPU, not loading.
      }
      await decodeThumbnail(preset, url)
      if (cancelled) return
      if (queue.length)
        cancelScheduled = scheduleThumbnail(() => void renderNext())
      else publish()
    }
    // Restore decoded previews immediately; only missing previews wait for idle.
    void Promise.all(
      requested.map(async (preset) => {
        const url = cachedFinishThumbnail(preset, previewFill)
        if (url) await decodeThumbnail(preset, url)
      })
    ).then(() => {
      if (cancelled) return
      if (!queue.length) publish()
      else
        timeout = window.setTimeout(() => {
          cancelScheduled = scheduleThumbnail(() => void renderNext())
        }, 120)
    })
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
  thumbnail?: string | null
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
      ) : thumbnail === null ? (
        <span
          className="absolute inset-0 rounded-full shadow-[inset_0_1px_2px_rgb(255_255_255/50%),inset_0_-2px_3px_rgb(0_0_0/20%)]"
          style={{ background: MATERIAL_PREVIEW[preset] }}
        />
      ) : (
        <span className="absolute inset-0 rounded-full bg-muted ring-1 ring-border ring-inset" />
      )}
    </span>
  )
}
