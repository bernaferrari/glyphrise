"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

type ExportCodeBlockProps = {
  code: string
  lang: string
  className?: string
}

const sanitizeHighlightedHtml = (value: string) =>
  value
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+\s*=\s*(?:"[^"]*"|'[^']*')/gi, "")

export function ExportCodeBlock({
  code,
  lang,
  className,
}: ExportCodeBlockProps) {
  const { resolvedTheme } = useTheme()
  const [html, setHtml] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setHtml(null)
    void import("shiki")
      .then(({ codeToHtml }) =>
        codeToHtml(code, {
          lang,
          theme: resolvedTheme === "light" ? "github-light" : "github-dark",
        })
      )
      .then((nextHtml) => {
        if (!cancelled) setHtml(sanitizeHighlightedHtml(nextHtml))
      })
      .catch(() => {
        if (!cancelled) setHtml(null)
      })
    return () => {
      cancelled = true
    }
  }, [code, lang, resolvedTheme])

  const surfaceClass = `editor-scrollbar block max-h-(--spacing-code) w-full max-w-full overflow-auto font-mono text-2xs leading-relaxed text-muted-foreground select-text ${className ?? ""}`

  if (!html) {
    return (
      <pre className={`${surfaceClass} p-4`}>
        <code>{code}</code>
      </pre>
    )
  }

  return (
    <div
      className={`${surfaceClass} [&_pre]:m-0 [&_pre]:min-w-max [&_pre]:!bg-transparent [&_pre]:p-4 [&_pre]:font-mono [&_pre]:text-2xs [&_pre]:leading-relaxed`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
