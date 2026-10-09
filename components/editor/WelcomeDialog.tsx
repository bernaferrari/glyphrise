"use client"

import { useEffect, useRef, useState } from "react"
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { useMediaQuery } from "@/lib/use-compact-viewport"
import {
  validateAndSanitizeSvg,
  isSvgFile,
  svgImportMessage,
} from "./SvgImportModel"
import { STARTERS, type Starter } from "./StarterProjectModel"

/** A real editor render, encoded ahead of time; plays only while on screen. */
function StarterVideo({ starter }: { starter: Starter }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    let visible = false
    const syncPlayback = () => {
      if (visible && !document.hidden) void video.play().catch(() => {})
      else video.pause()
    }
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      syncPlayback()
    })
    observer.observe(video)
    document.addEventListener("visibilitychange", syncPlayback)
    return () => {
      observer.disconnect()
      document.removeEventListener("visibilitychange", syncPlayback)
      video.pause()
    }
  }, [])
  return (
    <video
      ref={videoRef}
      src={`/starter-previews/${starter.id}.mp4`}
      poster={`/starter-previews/${starter.id}.png`}
      width={512}
      height={512}
      muted
      loop
      playsInline
      preload="auto"
      aria-hidden="true"
      className="size-full animate-in object-cover duration-200 fade-in-0"
    />
  )
}

function StarterPoster({ starter }: { starter: Starter }) {
  return (
    <img
      src={`/starter-previews/${starter.id}.png`}
      alt=""
      width={512}
      height={512}
      draggable={false}
      className="size-full object-cover"
    />
  )
}

function StarterCaption({ starter }: { starter: Starter }) {
  return (
    <span className="absolute inset-x-0 bottom-0 flex items-baseline gap-2 bg-linear-to-t from-black/70 to-transparent px-4 pt-10 pb-3.5 text-left text-white">
      <span className="text-base font-semibold">{starter.label}</span>
      <span className="text-sm text-white/70">{starter.hint}</span>
    </span>
  )
}

/** Desktop: the chosen (or hovered) starter plays large beside the choices. */
function StarterStage({ starter }: { starter: Starter }) {
  return (
    <div
      style={
        {
          "--starter-accent": starter.fill.stops.at(-1)!.color,
        } as React.CSSProperties
      }
      className="relative aspect-square overflow-hidden rounded-2xl bg-starter-background bg-starter-glow ring-1 ring-border"
    >
      <StarterVideo key={starter.id} starter={starter} />
      <StarterCaption starter={starter} />
    </div>
  )
}

/**
 * Phones: swipe through full-size starters. Neighbours peek in at the edges;
 * the centred card is the choice and the only one playing.
 */
function StarterCarousel({
  selectedId,
  onSelect,
}: {
  selectedId: string
  onSelect: (id: string) => void
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  // Mouse drag (touch already swipes natively). Snapping pauses while the
  // pointer moves the track, then the nearest card snaps into place.
  const dragRef = useRef<{ x: number; left: number; moved: boolean } | null>(
    null
  )
  const [dragging, setDragging] = useState(false)
  const suppressClickRef = useRef(false)
  const selectedIdRef = useRef(selectedId)
  selectedIdRef.current = selectedId
  const scrollTo = (id: string) =>
    trackRef.current
      ?.querySelector<HTMLElement>(`[data-starter="${id}"]`)
      ?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      })
  const index = STARTERS.findIndex((starter) => starter.id === selectedId)
  // For anyone who'd rather tap than swipe.
  const go = (step: number) => {
    const next = STARTERS[index + step]
    if (!next) return
    onSelect(next.id)
    scrollTo(next.id)
  }

  return (
    <div className="-mx-5 grid gap-4 pb-1">
      <div className="relative">
        <div
          ref={trackRef}
          role="radiogroup"
          aria-label="Starter"
          className={cn(
            "flex snap-x snap-mandatory scrollbar-none gap-3 overflow-x-auto overscroll-x-contain scroll-smooth select-none",
            dragging
              ? "cursor-grabbing snap-none scroll-auto"
              : "pointer-fine:cursor-grab"
          )}
          onPointerDown={(event) => {
            if (event.pointerType !== "mouse" || event.button !== 0) return
            dragRef.current = {
              x: event.clientX,
              left: event.currentTarget.scrollLeft,
              moved: false,
            }
          }}
          onPointerMove={(event) => {
            const drag = dragRef.current
            if (!drag) return
            const dx = event.clientX - drag.x
            if (!drag.moved && Math.abs(dx) < 4) return
            if (!drag.moved) {
              drag.moved = true
              setDragging(true)
              event.currentTarget.setPointerCapture(event.pointerId)
            }
            event.currentTarget.scrollLeft = drag.left - dx
          }}
          onPointerUp={(event) => {
            const drag = dragRef.current
            dragRef.current = null
            if (!drag?.moved) return
            setDragging(false)
            suppressClickRef.current = true
            window.setTimeout(() => (suppressClickRef.current = false))
            // Snap back on after the drag, landing on the chosen card.
            requestAnimationFrame(() => scrollTo(selectedIdRef.current))
            event.currentTarget.releasePointerCapture(event.pointerId)
          }}
          onClickCapture={(event) => {
            // A drag that ends on a card isn't a tap on it.
            if (suppressClickRef.current) event.stopPropagation()
          }}
          onScroll={(event) => {
            // The card nearest the middle is the choice.
            const track = event.currentTarget
            const middle = track.scrollLeft + track.clientWidth / 2
            let nearest = selectedId
            let distance = Infinity
            for (const card of track.querySelectorAll<HTMLElement>(
              "[data-starter]"
            )) {
              const center = card.offsetLeft + card.offsetWidth / 2
              if (Math.abs(center - middle) < distance) {
                distance = Math.abs(center - middle)
                nearest = card.dataset.starter!
              }
            }
            if (nearest !== selectedId) onSelect(nearest)
          }}
        >
          <span aria-hidden="true" className="w-1/10 shrink-0" />
          {STARTERS.map((starter) => {
            const checked = starter.id === selectedId
            return (
              <button
                key={starter.id}
                type="button"
                role="radio"
                data-starter={starter.id}
                aria-checked={checked}
                aria-label={`${starter.label}, ${starter.hint}`}
                onClick={() => {
                  onSelect(starter.id)
                  scrollTo(starter.id)
                }}
                style={
                  {
                    "--starter-accent": starter.fill.stops.at(-1)!.color,
                  } as React.CSSProperties
                }
                className={cn(
                  "relative aspect-square w-4/5 shrink-0 snap-center overflow-hidden rounded-3xl bg-starter-background bg-starter-glow ring-1 ring-border transition-[opacity,scale] duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                  !checked && "scale-92 opacity-55"
                )}
              >
                {checked ? (
                  <StarterVideo starter={starter} />
                ) : (
                  <StarterPoster starter={starter} />
                )}
                <StarterCaption starter={starter} />
              </button>
            )
          })}
          <span aria-hidden="true" className="w-1/10 shrink-0" />
        </div>
        <button
          type="button"
          aria-label="Previous starter"
          disabled={index === 0}
          onClick={() => go(-1)}
          className="absolute top-1/2 left-3 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-black/55 text-white shadow-lg ring-1 ring-white/15 backdrop-blur-md transition-opacity duration-200 focus-visible:outline-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-0"
        >
          <ChevronLeft aria-hidden="true" className="size-5" />
        </button>
        <button
          type="button"
          aria-label="Next starter"
          disabled={index === STARTERS.length - 1}
          onClick={() => go(1)}
          className="absolute top-1/2 right-3 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-black/55 text-white shadow-lg ring-1 ring-white/15 backdrop-blur-md transition-opacity duration-200 focus-visible:outline-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-0"
        >
          <ChevronRight aria-hidden="true" className="size-5" />
        </button>
      </div>
      <div className="flex justify-center gap-1.5" aria-hidden="true">
        {STARTERS.map((starter) => (
          <button
            key={starter.id}
            type="button"
            tabIndex={-1}
            onClick={() => {
              onSelect(starter.id)
              scrollTo(starter.id)
            }}
            className={cn(
              "h-1.5 rounded-full transition-[width,background-color] duration-200",
              starter.id === selectedId
                ? "w-5 bg-foreground"
                : "w-1.5 bg-muted-foreground/40"
            )}
          />
        ))}
      </div>
    </div>
  )
}

/** Desktop choices: calm posters; pointing at one previews it on the stage. */
function StarterTiles({
  selectedId,
  onSelect,
  onPreview,
  onStart,
}: {
  selectedId: string
  onSelect: (id: string) => void
  onPreview: (id: string | null) => void
  onStart: (starter: Starter) => void
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Starter"
      className="grid grid-cols-2 gap-2.5"
      onPointerLeave={() => onPreview(null)}
      onKeyDown={(event) => {
        const step =
          event.key === "ArrowRight" || event.key === "ArrowDown"
            ? 1
            : event.key === "ArrowLeft" || event.key === "ArrowUp"
              ? -1
              : 0
        if (!step) return
        event.preventDefault()
        const index = STARTERS.findIndex((starter) => starter.id === selectedId)
        const next =
          STARTERS[(index + step + STARTERS.length) % STARTERS.length]
        onSelect(next.id)
        event.currentTarget
          .querySelector<HTMLElement>(`[data-starter="${next.id}"]`)
          ?.focus()
      }}
    >
      {STARTERS.map((starter) => {
        const checked = starter.id === selectedId
        return (
          <button
            type="button"
            role="radio"
            key={starter.id}
            data-starter={starter.id}
            aria-checked={checked}
            aria-label={`${starter.label}, ${starter.hint}`}
            title="Double-click to start"
            tabIndex={checked ? 0 : -1}
            onClick={() => onSelect(starter.id)}
            onDoubleClick={() => onStart(starter)}
            onKeyDown={(event) => {
              if (event.key !== "Enter") return
              event.preventDefault()
              onStart(starter)
            }}
            onPointerEnter={(event) => {
              if (event.pointerType === "mouse") onPreview(starter.id)
            }}
            className="flex min-w-0 items-center gap-2.5 rounded-xl border border-border bg-muted/30 p-1.5 text-left transition-[background-color,border-color,box-shadow] duration-150 hover:bg-muted/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring aria-checked:border-primary aria-checked:bg-primary/10 aria-checked:ring-1 aria-checked:ring-primary"
          >
            <span className="aspect-square w-14 shrink-0 overflow-hidden rounded-lg bg-starter-background">
              <StarterPoster starter={starter} />
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-medium">
                {starter.label}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                {starter.hint}
              </span>
            </span>
          </button>
        )
      })}
    </div>
  )
}

export function WelcomeDialog({
  open,
  onDismiss,
  onCreate,
  error,
}: {
  open: boolean
  onDismiss: () => void
  onCreate: (starterId: string, name: string, svgContent?: string) => boolean
  error?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const phone = useMediaQuery("(width < 640px)")
  const [importError, setImportError] = useState<string | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [selectedId, setSelectedId] = useState(STARTERS[0].id)
  const [previewId, setPreviewId] = useState<string | null>(null)
  const find = (id: string | null) =>
    STARTERS.find((starter) => starter.id === id)
  const selected = find(selectedId) ?? STARTERS[0]
  const start = (starter: Starter) => {
    if (!isImporting) onCreate(starter.id, starter.label)
  }

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onDismiss()}>
      <DialogContent
        variant="welcome"
        scrollable={true}
        className="max-h-(--spacing-dialog-height) overflow-x-hidden overflow-y-auto sm:max-w-3xl"
      >
        <div className="grid gap-5 sm:grid-cols-2 sm:gap-8">
          {!phone && <StarterStage starter={find(previewId) ?? selected} />}

          <div className="flex min-w-0 flex-col gap-5">
            <DialogHeader variant="welcome">
              <span className="text-xs font-medium text-primary max-sm:hidden">
                Glyphrise · Icon motion
              </span>
              <DialogTitle variant="welcome">Make something move.</DialogTitle>
              <DialogDescription variant="welcome">
                {phone
                  ? "Swipe to pick a starter. Everything stays editable."
                  : "Pick a starter. Every color, layer and keyframe stays editable."}
              </DialogDescription>
            </DialogHeader>

            {phone ? (
              <StarterCarousel
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
            ) : (
              <StarterTiles
                selectedId={selectedId}
                onSelect={setSelectedId}
                onPreview={setPreviewId}
                onStart={start}
              />
            )}

            {(error || importError) && (
              <p role="alert" className="text-sm text-destructive">
                {importError || error}
              </p>
            )}

            <div className="mt-auto flex gap-2 max-sm:sticky max-sm:bottom-0 max-sm:-mx-5 max-sm:bg-popover max-sm:px-5 max-sm:pt-3">
              <input
                ref={inputRef}
                type="file"
                accept=".svg,image/svg+xml"
                className="hidden"
                aria-label="Use my SVG file"
                onChange={async (event) => {
                  const input = event.currentTarget
                  const file = input.files?.[0]
                  input.value = ""
                  if (!file) return
                  setImportError(null)
                  setIsImporting(true)
                  try {
                    if (!isSvgFile(file))
                      throw new Error("Choose an SVG file smaller than 1 MB.")
                    const content = validateAndSanitizeSvg(await file.text())
                    onCreate(
                      "custom",
                      file.name.replace(/\.svg$/i, "") || "My icon",
                      content
                    )
                  } catch (error) {
                    setImportError(svgImportMessage(error))
                  } finally {
                    setIsImporting(false)
                  }
                }}
              />
              <Button
                shape="rounded"
                variant="outline"
                size="lg"
                disabled={isImporting}
                className="min-h-12 shrink-0"
                onClick={() => inputRef.current?.click()}
              >
                {isImporting ? "Reading…" : "Use my SVG"}
              </Button>
              <Button
                shape="rounded"
                className="min-h-12 min-w-0 flex-1"
                disabled={isImporting}
                onClick={() => start(selected)}
              >
                <span className="truncate">Start with {selected.label}</span>
                <ArrowRight aria-hidden="true" className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
