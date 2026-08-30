"use client"

import { Info } from "lucide-react"
import { ExportCodeBlock } from "./ExportCodeBlock"
import { ExportCopyButton } from "./ExportCopyButton"

type ExportReactCodeTabProps = {
  code: string
  copied: Record<string, boolean>
  onCopy: (key: string, text: string) => void
}

export function ExportReactCodeTab({
  code,
  copied,
  onCopy,
}: ExportReactCodeTabProps) {
  return (
    <div className="relative min-w-0 p-4 outline-none">
      <div className="absolute top-6 right-6 z-10">
        <ExportCopyButton
          copied={Boolean(copied.r3f)}
          onCopy={() => onCopy("r3f", code)}
        />
      </div>
      <div className="mb-3 flex items-start gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2.5 pr-24 text-xs leading-5 text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0" />
        <p>
          Starter code preserves timing, transforms, wipes, path visibility and
          depth, per-path colors, plus animated lighting. Mesh gradients, custom
          finish shaders, and crown roofs are simplified.
        </p>
      </div>
      <ExportCodeBlock code={code} lang="tsx" />
    </div>
  )
}

type ExportAndroidCodeTabProps = {
  gradleCode: string
  filamentCode: string
  copied: Record<string, boolean>
  onCopy: (key: string, text: string) => void
}

export function ExportAndroidCodeTab({
  gradleCode,
  filamentCode,
  copied,
  onCopy,
}: ExportAndroidCodeTabProps) {
  return (
    <div className="relative min-w-0 p-4 outline-none">
      <div className="absolute top-6 right-6 z-10">
        <ExportCopyButton
          label="Copy both files"
          copied={Boolean(copied.androidCombined)}
          onCopy={() =>
            onCopy("androidCombined", `${gradleCode}\n\n${filamentCode}`)
          }
        />
      </div>
      <div className="mb-3 rounded-lg border border-border bg-muted/30 px-3 py-2 text-[11px] text-muted-foreground">
        This is a static Filament viewer, not the editor timeline. Place the
        exported GLB at{" "}
        <span className="font-mono text-foreground">
          app/src/main/assets/exports/icon.glb
        </span>
        . The Gradle dependencies are pinned to a specific Filament release;
        bump them together with the{" "}
        <span className="font-mono text-foreground">
          com.google.android.filament
        </span>{" "}
        artifacts if your project uses a newer version.
      </div>
      <div className="editor-scrollbar flex max-h-[52vh] min-w-0 flex-col gap-3 overflow-auto">
        <div className="min-w-0">
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <div className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
              Gradle
            </div>
            <ExportCopyButton
              copied={Boolean(copied.gradle)}
              onCopy={() => onCopy("gradle", gradleCode)}
            />
          </div>
          <ExportCodeBlock
            code={gradleCode}
            lang="kotlin"
            className="max-h-none"
          />
        </div>
        <div className="min-w-0">
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <div className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
              Kotlin
            </div>
            <ExportCopyButton
              copied={Boolean(copied.filament)}
              onCopy={() => onCopy("filament", filamentCode)}
            />
          </div>
          <ExportCodeBlock
            code={filamentCode}
            lang="kotlin"
            className="max-h-none"
          />
        </div>
      </div>
    </div>
  )
}
