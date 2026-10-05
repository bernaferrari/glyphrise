"use client"

import { useState } from "react"
import { ArrowRight, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { STARTER_ARTWORK } from "./StarterProjectModel"

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
  onCreate: (iconId: string, name: string) => boolean
  error?: string
}) {
  const [selectedId, setSelectedId] = useState("heart")
  const selected = STARTER_ARTWORK.find((icon) => icon.id === selectedId)!
  return (
    <Dialog open={open} onOpenChange={(value) => !value && onDismiss()}>
      <DialogContent className="editor-scrollbar max-h-[calc(100dvh-32px)] gap-5 overflow-y-auto p-5 sm:max-w-xl sm:gap-6 sm:p-8">
        <DialogHeader className="gap-2 pr-8 sm:gap-3">
          <span className="text-xs font-medium text-primary">
            Glyphrise · Icon motion
          </span>
          <DialogTitle className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            Make something move.
          </DialogTitle>
          <DialogDescription className="leading-6 text-pretty sm:max-w-sm">
            Start with an icon. Make it yours with color and depth, add a little
            motion, then download it.
          </DialogDescription>
        </DialogHeader>
        <div
          className="grid gap-2 sm:grid-cols-3 sm:gap-3"
          aria-label="Starter artwork"
        >
          {STARTER_ARTWORK.map((icon) => (
            <button
              type="button"
              key={icon.id}
              aria-label={`Start with ${icon.name}`}
              aria-pressed={icon.id === selectedId}
              onClick={() => setSelectedId(icon.id)}
              className="group relative flex min-h-16 items-center gap-4 rounded-2xl border border-border bg-muted/30 px-4 py-3 text-left text-sm font-medium transition-[background-color,border-color,box-shadow] duration-150 hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring aria-pressed:border-primary aria-pressed:bg-primary/10 aria-pressed:ring-1 aria-pressed:ring-primary sm:min-h-44 sm:flex-col sm:justify-center sm:p-3 sm:text-center"
            >
              <span
                aria-hidden="true"
                className="grid size-9 shrink-0 place-items-center sm:size-18 [&_svg]:size-full [&_svg_*]:fill-current"
                style={{ color: icon.defaultTint }}
                dangerouslySetInnerHTML={{ __html: icon.svgContent }}
              />
              <span className="flex-1 sm:flex-none">
                {icon.name === "Lightning Bolt" ? "Bolt" : icon.name}
              </span>
              <span
                aria-hidden="true"
                className="grid size-5 shrink-0 place-items-center rounded-full border-2 border-muted-foreground/40 text-primary-foreground transition-[background-color,border-color,opacity] duration-150 group-aria-pressed:border-primary group-aria-pressed:bg-primary sm:absolute sm:top-3 sm:right-3 sm:opacity-0 sm:group-aria-pressed:opacity-100"
              >
                <Check
                  className="size-3 scale-50 opacity-0 transition-[opacity,scale] duration-150 group-aria-pressed:scale-100 group-aria-pressed:opacity-100"
                  strokeWidth={3}
                />
              </span>
            </button>
          ))}
        </div>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <div className="grid gap-2">
          <Button
            className="min-h-12 w-full rounded-xl"
            onClick={() => onCreate(selectedId, `${selected.name} motion`)}
          >
            Create with{" "}
            {selected.name === "Lightning Bolt" ? "Bolt" : selected.name}
            <ArrowRight aria-hidden="true" className="size-4" />
          </Button>
          <button
            type="button"
            onClick={onDismiss}
            className="min-h-11 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
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
