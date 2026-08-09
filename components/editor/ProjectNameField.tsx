"use client"

import { useEffect, useRef, useState } from "react"

export function ProjectNameField({
  value,
  onCommit,
}: {
  value: string
  onCommit: (value: string) => void
}) {
  const [draft, setDraft] = useState(value)
  const cancelBlurRef = useRef(false)

  useEffect(() => setDraft(value), [value])

  const commit = () => {
    if (cancelBlurRef.current) {
      cancelBlurRef.current = false
      setDraft(value)
      return
    }
    const next = draft.trim()
    if (!next) {
      setDraft(value)
      return
    }
    onCommit(next)
  }

  return (
    <input
      value={draft}
      maxLength={80}
      aria-label="Project name"
      title="Rename project"
      onChange={(event) => setDraft(event.currentTarget.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur()
        if (event.key === "Escape") {
          cancelBlurRef.current = true
          setDraft(value)
          event.currentTarget.blur()
        }
      }}
      className="h-8 w-28 min-w-0 rounded-md border border-transparent bg-transparent px-2 text-sm font-medium text-foreground transition-[background-color,border-color,box-shadow] outline-none hover:bg-muted/60 focus:border-input focus:bg-background focus:ring-2 focus:ring-ring/20 sm:w-36 xl:w-44"
    />
  )
}
