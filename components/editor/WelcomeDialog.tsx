"use client"

import { useRef, useState } from "react"
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
import { MotionPresetPreview } from "./MotionPresetPreview"
import {
  STARTERS,
  slashedIcon,
  type StarterMotion,
} from "./StarterProjectModel"
import type { PresetIcon } from "./IconLibrary"

/** Each card shows its motion, so choosing reads as "how should it move?". */
function StarterPreview({
  motion,
  icon,
}: {
  motion: StarterMotion
  icon: PresetIcon
}) {
  if (motion !== "slash")
    return (
      <span style={{ color: icon.defaultTint }}>
        <MotionPresetPreview preset={motion} svgContent={icon.svgContent} />
      </span>
    )
  return (
    <span
      aria-hidden="true"
      className="relative grid size-12 shrink-0 place-items-center [&_svg]:size-9 [&_svg_*]:fill-current"
      style={{ color: icon.defaultTint }}
    >
      <span
        className="col-start-1 row-start-1 grid place-items-center"
        dangerouslySetInnerHTML={{ __html: icon.svgContent }}
      />
      <span
        className="starter-slash-off col-start-1 row-start-1 grid place-items-center"
        dangerouslySetInnerHTML={{ __html: slashedIcon(icon).svgContent }}
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
  onCreate: (iconId: string, name: string, svgContent?: string) => boolean
  error?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [selectedMotion, setSelectedMotion] = useState<StarterMotion>("spin")
  const selected = STARTERS.find(
    (starter) => starter.motion === selectedMotion
  )!
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
            Pick how it moves. Make it yours with color and depth, then download
            it.
          </DialogDescription>
        </DialogHeader>
        <div
          className="grid gap-2 sm:grid-cols-3 sm:gap-3"
          aria-label="Starter motion"
        >
          {STARTERS.map(({ motion, label, hint, icon }) => (
            <button
              type="button"
              key={motion}
              aria-pressed={motion === selectedMotion}
              onClick={() => setSelectedMotion(motion)}
              className="group relative flex min-h-16 items-center gap-4 rounded-2xl border border-border bg-muted/30 px-4 py-3 text-left text-sm font-medium transition-[background-color,border-color,box-shadow] duration-150 hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring aria-pressed:border-primary aria-pressed:bg-primary/10 aria-pressed:ring-1 aria-pressed:ring-primary sm:min-h-44 sm:flex-col sm:justify-center sm:gap-3 sm:p-3 sm:text-center"
            >
              <StarterPreview motion={motion} icon={icon} />
              <span className="flex flex-1 flex-col gap-0.5 sm:flex-none">
                <span>{label}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {hint}
                </span>
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
        {(error || importError) && (
          <p role="alert" className="text-sm text-destructive">
            {importError || error}
          </p>
        )}
        <div className="grid gap-2">
          <Button
            className="min-h-12 w-full rounded-xl"
            disabled={isImporting}
            onClick={() =>
              onCreate(
                selected.icon.id,
                `${selected.icon.name} ${selected.label.toLowerCase()}`
              )
            }
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
            variant="outline"
            disabled={isImporting}
            className="min-h-11 w-full rounded-xl"
            onClick={() => inputRef.current?.click()}
          >
            {isImporting ? "Reading your SVG…" : "Use my SVG"}
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
