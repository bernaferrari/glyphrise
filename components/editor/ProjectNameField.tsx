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
      aria-label="File name"
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
      className="project-name-field h-7 w-full min-w-0 truncate rounded-md border border-transparent bg-transparent px-1.5 font-medium tracking-tight text-foreground transition-[background-color,border-color,box-shadow] outline-none hover:bg-muted/60 focus:border-input focus:bg-background focus:ring-2 focus:ring-ring/20 min-[720px]:field-sizing-content min-[720px]:w-auto min-[720px]:max-w-40"
    />
  )
}
