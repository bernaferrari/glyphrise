"use client"

import { ExportCodeBlock } from "./ExportCodeBlock"
import { ExportCopyButton } from "./ExportCopyButton"

export type CodeTarget = "r3f" | "android"

const TARGETS: { id: CodeTarget; label: string }[] = [
  { id: "r3f", label: "React Three Fiber" },
  { id: "android", label: "Android" },
]

type ExportCodeViewProps = {
  target: CodeTarget
  onTargetChange: (target: CodeTarget) => void
  r3fCode: string
  gradleCode: string
  filamentCode: string
  copied: Record<string, boolean>
  onCopy: (key: string, text: string) => void
}

function CodeFile({
  name,
  code,
  lang,
  copied,
  onCopy,
}: {
  name: string
  code: string
  lang: string
  copied: boolean
  onCopy: () => void
}) {
  return (
    <div className="min-w-0 overflow-hidden rounded-xl border border-border bg-muted/30">
      <div className="flex items-center justify-between gap-2 border-b border-border py-1.5 pr-1.5 pl-3">
        <span className="truncate font-mono text-xs text-muted-foreground">
          {name}
        </span>
        <ExportCopyButton copied={copied} onCopy={onCopy} label="Copy" />
      </div>
      <ExportCodeBlock code={code} lang={lang} />
    </div>
  )
}

export function ExportCodeView({
  target,
  onTargetChange,
  r3fCode,
  gradleCode,
  filamentCode,
  copied,
  onCopy,
}: ExportCodeViewProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col border-t border-border">
      <div className="editor-scrollbar grid min-h-0 flex-1 content-start gap-4 overflow-y-auto p-5">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <div
            role="radiogroup"
            aria-label="Platform"
            className="flex rounded-lg bg-muted/70 p-0.5"
          >
            {TARGETS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={target === id}
                onClick={() => onTargetChange(id)}
                className="min-h-8 rounded-md px-3 text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring aria-checked:bg-background aria-checked:font-medium aria-checked:text-foreground aria-checked:shadow-sm"
              >
                {label}
              </button>
            ))}
          </div>
          <p className="min-w-0 text-xs text-muted-foreground">
            {target === "r3f"
              ? "Keeps timing, transforms, wipes, colors and lighting."
              : "A static Filament viewer for the exported GLB."}
          </p>
        </div>

        {target === "r3f" ? (
          <CodeFile
            name="App.tsx"
            code={r3fCode}
            lang="tsx"
            copied={Boolean(copied.r3f)}
            onCopy={() => onCopy("r3f", r3fCode)}
          />
        ) : (
          <>
            <ol className="grid gap-1.5 text-xs leading-5 text-muted-foreground">
              <li>
                1. Download the GLB model and save it as{" "}
                <code className="font-mono text-foreground">
                  app/src/main/assets/exports/icon.glb
                </code>
                .
              </li>
              <li>2. Add the Gradle dependencies, then the Kotlin viewer.</li>
            </ol>
            <CodeFile
              name="build.gradle.kts"
              code={gradleCode}
              lang="kotlin"
              copied={Boolean(copied.gradle)}
              onCopy={() => onCopy("gradle", gradleCode)}
            />
            <CodeFile
              name="FilamentIconView.kt"
              code={filamentCode}
              lang="kotlin"
              copied={Boolean(copied.filament)}
              onCopy={() => onCopy("filament", filamentCode)}
            />
          </>
        )}
      </div>
      <div className="flex shrink-0 items-center justify-end gap-4 border-t border-border px-5 py-3 max-sm:flex-col max-sm:items-stretch max-sm:gap-2 max-sm:pb-safe-bottom">
        {target === "r3f" ? (
          <p className="min-w-0 flex-1 text-xs text-muted-foreground max-sm:text-center">
            Mesh gradients and custom finishes are simplified.
          </p>
        ) : null}
        <ExportCopyButton
          variant="primary"
          label={target === "r3f" ? "Copy code" : "Copy both files"}
          copied={Boolean(
            target === "r3f" ? copied.r3f : copied.androidCombined
          )}
          onCopy={() =>
            target === "r3f"
              ? onCopy("r3f", r3fCode)
              : onCopy("androidCombined", `${gradleCode}\n\n${filamentCode}`)
          }
        />
      </div>
    </div>
  )
}
