"use client"

import { useEffect, useRef, useState } from "react"
import { ArrowRight, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  validateAndSanitizeSvg,
  isSvgFile,
  svgImportMessage,
} from "./SvgImportModel"
import { STARTERS, type Starter } from "./StarterProjectModel"

/** Real editor renders, encoded ahead of time instead of four live WebGL scenes. */
function StarterPreview({ starter }: { starter: Starter }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    let visible = false
    const syncPlayback = () => {
      if (visible && !document.hidden) {
        void video.play().catch(() => {})
      } else {
        video.pause()
      }
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
    <span
      aria-hidden="true"
      className="relative block aspect-video w-full overflow-hidden rounded-xl bg-starter-background sm:aspect-square"
    >
      <video
        ref={videoRef}
        src={`/starter-previews/${starter.id}.mp4`}
        poster={`/starter-previews/${starter.id}.png`}
        width={512}
        height={512}
        muted
        loop
        playsInline
        preload="none"
        className="h-full w-full object-cover"
      />
    </span>
  )
}

export function WelcomeDialog({
  open,
  onDismiss,
  onCreate,
  error,
  currentProjectName,
}: {
  /** Set when reopened from Help: creating starts a separate project. */
  currentProjectName?: string
  open: boolean
  onDismiss: () => void
  onCreate: (starterId: string, name: string, svgContent?: string) => boolean
  error?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [selectedId, setSelectedId] = useState(STARTERS[0].id)
  const selected =
    STARTERS.find((starter) => starter.id === selectedId) ?? STARTERS[0]
  return (
    <Dialog open={open} onOpenChange={(value) => !value && onDismiss()}>
      <DialogContent
        variant="welcome"
        scrollable={true}
        className="max-h-(--spacing-dialog-height) overflow-y-auto sm:max-w-2xl"
      >
        <DialogHeader variant="welcome">
          <span className="text-xs font-medium text-primary">
            Glyphrise · Icon motion
          </span>
          <DialogTitle variant="welcome">Make something move.</DialogTitle>
          <DialogDescription variant="welcome" className="sm:max-w-md">
            Start from a look you like. Every color, layer and keyframe stays
            editable.
          </DialogDescription>
        </DialogHeader>
        <div
          role="group"
          className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3"
          aria-label="Starter"
        >
          {STARTERS.map((starter) => (
            <button
              type="button"
              key={starter.id}
              aria-pressed={starter.id === selectedId}
              aria-label={`${starter.label}, ${starter.hint}`}
              onClick={() => setSelectedId(starter.id)}
              style={
                {
                  "--starter-accent": starter.fill.stops.at(-1)!.color,
                } as React.CSSProperties
              }
              className="group relative flex flex-col gap-2.5 overflow-hidden rounded-2xl border border-border bg-muted/30 bg-starter-glow p-2 pb-3 text-left transition-[background-color,border-color,box-shadow] duration-150 hover:bg-muted/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring aria-pressed:border-primary aria-pressed:bg-primary/10 aria-pressed:ring-1 aria-pressed:ring-primary"
            >
              <StarterPreview starter={starter} />
              <span className="flex flex-col gap-0.5 px-1.5">
                <span className="text-sm font-medium">{starter.label}</span>
                <span className="text-xs text-muted-foreground">
                  {starter.hint}
                </span>
              </span>
              <span
                aria-hidden="true"
                className="absolute top-3.5 right-3.5 grid size-5 place-items-center rounded-full bg-primary text-primary-foreground opacity-0 transition-opacity duration-150 group-aria-pressed:opacity-100"
              >
                <Check className="size-3" strokeWidth={3} />
              </span>
            </button>
          ))}
        </div>
        {(error || importError) && (
          <p role="alert" className="text-sm text-destructive">
            {importError || error}
          </p>
        )}
        <div className="grid gap-2 max-sm:sticky max-sm:bottom-0 max-sm:-mx-5 max-sm:-mb-5 max-sm:bg-popover max-sm:px-5 max-sm:pt-3 max-sm:pb-5 sm:flex sm:flex-wrap">
          <Button
            shape="rounded"
            className="min-h-12 w-full sm:flex-1"
            disabled={isImporting}
            onClick={() => onCreate(selected.id, selected.label)}
          >
            Start with {selected.label}
            <ArrowRight aria-hidden="true" className="size-4" />
          </Button>
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
            disabled={isImporting}
            size="lg"
            className="min-h-12 w-full sm:w-auto sm:min-w-36"
            onClick={() => inputRef.current?.click()}
          >
            {isImporting ? "Reading your SVG…" : "Use my SVG"}
          </Button>
          <button
            type="button"
            onClick={onDismiss}
            className="min-h-11 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring sm:w-full"
          >
            {currentProjectName
              ? `Keep working on ${currentProjectName}`
              : "Explore the editor"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
