"use client"

import React, { useEffect, useId, useRef, useState } from "react"
import { flushSync } from "react-dom"
import { bindWindowPointerDrag } from "@/lib/drag-events"
import {
  clampInspectorValue,
  setInspectorInputDragActive,
  useRafNumberChange,
} from "./InspectorControlModel"
import { cn } from "@/lib/utils"

export function NumberField({
  value,
  min,
  max,
  step,
  scrubStep,
  prefix,
  prefixColor,
  ariaLabel,
  suffix = "",
  precision = 1,
  className = "w-[62px]",
  inputClassName = "text-right",
  onChange,
}: {
  value: number
  min: number
  max: number
  step: number
  scrubStep?: number
  prefix?: string
  prefixColor?: string
  ariaLabel: string
  suffix?: string
  precision?: number
  className?: string
  inputClassName?: string
  onChange: (value: number) => void
}) {
  const [draft, setDraft] = useState<string | null>(null)
  const feedbackId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const { flush: flushScrubChange, schedule: scheduleScrubChange } =
    useRafNumberChange(onChange)
  const [feedback, setFeedback] = useState<string | null>(null)
  const feedbackTimeoutRef = useRef<number | null>(null)
  const displayValue = draft ?? value.toFixed(precision)

  const showFeedback = (message: string) => {
    setFeedback(message)
    if (feedbackTimeoutRef.current !== null) {
      window.clearTimeout(feedbackTimeoutRef.current)
    }
    feedbackTimeoutRef.current = window.setTimeout(() => {
      feedbackTimeoutRef.current = null
      setFeedback(null)
    }, 1200)
  }

  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current !== null) {
        window.clearTimeout(feedbackTimeoutRef.current)
      }
    }
  }, [])

  const commit = () => {
    if (draft === null) return

    const parsed = Number.parseFloat(draft)
    // A typed value is not authoritative until this commit boundary. Flush the
    // parent update now so pagehide can persist it even on an immediate reload.
    flushSync(() => {
      setDraft(null)
      if (Number.isFinite(parsed)) {
        onChange(clampInspectorValue(parsed, min, max))
      }
    })

    if (!Number.isFinite(parsed)) {
      showFeedback("Invalid number")
    } else {
      const clamped = clampInspectorValue(parsed, min, max)
      if (clamped.toFixed(precision) !== parsed.toFixed(precision)) {
        showFeedback(`Clamped to ${min}–${max}`)
      }
    }
  }

  const startScrub = (e: React.PointerEvent) => {
    if (e.button !== 0) return
    e.preventDefault()
    e.currentTarget.setPointerCapture?.(e.pointerId)
    const startX = e.clientX
    const startValue = value
    const effectiveScrubStep = scrubStep ?? (step < 0.05 ? step * 2 : step)
    let moved = false
    setInspectorInputDragActive(true)
    bindWindowPointerDrag({
      onMove: (ev) => {
        const dx = ev.clientX - startX
        if (Math.abs(dx) > 3) moved = true
        if (!moved) return
        document.body.style.cursor = "ew-resize"
        const next = clampInspectorValue(
          startValue + Math.round(dx / 3) * effectiveScrubStep,
          min,
          max
        )
        const rounded = Number(next.toFixed(precision))
        setDraft(rounded.toFixed(precision))
        scheduleScrubChange(rounded)
      },
      onEnd: () => {
        flushScrubChange()
        setInspectorInputDragActive(false)
        document.body.style.cursor = ""
        if (moved) setDraft(null)
        if (!moved) inputRef.current?.focus()
      },
    })
  }

  return (
    <div
      onPointerDown={startScrub}
      onLostPointerCapture={() => {
        document.body.style.cursor = ""
      }}
      title={feedback ?? "Drag to adjust · click to type"}
      className={cn(
        "flex h-10 cursor-ew-resize items-center rounded-lg border border-input/60 bg-muted/70 px-2.5 text-foreground transition-colors focus-within:bg-foreground/[0.07] hover:bg-foreground/[0.08] max-[720px]:min-h-[46px] pointer-coarse:min-h-[46px]",
        feedback
          ? "ring-1 ring-destructive/50 focus-within:ring-destructive/50"
          : "focus-within:ring-1 focus-within:ring-ring",
        className
      )}
    >
      {prefix && (
        <span
          className={`mr-1 text-[11px] leading-none ${prefixColor ? "font-medium" : "font-medium text-muted-foreground"}`}
          style={prefixColor ? { color: prefixColor } : undefined}
        >
          {prefix}
        </span>
      )}
      <input
        ref={inputRef}
        type="text"
        role="spinbutton"
        value={displayValue}
        aria-label={ariaLabel}
        inputMode="decimal"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={
          Number.isFinite(Number.parseFloat(draft ?? ""))
            ? Number.parseFloat(draft as string)
            : value
        }
        aria-valuetext={`${displayValue}${suffix}`}
        aria-invalid={feedback === "Invalid number" || undefined}
        aria-describedby={feedback ? feedbackId : undefined}
        onChange={(event) => setDraft(event.target.value)}
        onFocus={(event) => {
          event.currentTarget.select()
        }}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            commit()
            event.currentTarget.blur()
          }
          if (event.key === "ArrowUp" || event.key === "ArrowDown") {
            event.preventDefault()
            const direction = event.key === "ArrowUp" ? 1 : -1
            const base = Number.isFinite(Number.parseFloat(draft ?? ""))
              ? Number.parseFloat(draft as string)
              : value
            flushSync(() => {
              onChange(clampInspectorValue(base + step * direction, min, max))
            })
            setDraft(null)
          }
          if (event.key === "Escape") {
            event.preventDefault()
            setDraft(null)
            event.currentTarget.blur()
          }
        }}
        className={`min-w-0 flex-1 cursor-ew-resize self-stretch bg-transparent text-base text-foreground tabular-nums outline-none focus:cursor-text md:text-[13px] ${inputClassName}`}
      />
      <span
        id={feedbackId}
        role="status"
        aria-live="polite"
        className="sr-only"
      >
        {feedback}
      </span>
      {suffix && (
        <span className="pl-0.5 text-[11px] text-muted-foreground">
          {suffix}
        </span>
      )}
    </div>
  )
}
