"use client"

import { cssLength } from "@/lib/utils"

import { useRef } from "react"
import { flushSync } from "react-dom"
import { beginDocumentEdit, endDocumentEdit } from "@/lib/editor-transactions"
import { horizontalIntent } from "@/lib/touch-intent"
import {
  clampInspectorValue,
  useRafNumberChange,
} from "./InspectorControlModel"
import { NumberField } from "./NumberField"

export function InspectorSlider({
  value,
  min,
  max,
  sliderMin = min,
  sliderMax = max,
  step,
  scrubStep,
  precision,
  className = "flex-1",
  inputClassName = "w-15 shrink-0",
  sliderClassName = "flex-1",
  ariaLabel,
  suffix,
  compact = false,
  onChange,
}: {
  suffix?: string
  /** Tighter variant for popover panels. */
  compact?: boolean
  value: number
  min: number
  max: number
  sliderMin?: number
  sliderMax?: number
  step: number
  scrubStep?: number
  precision: number
  className?: string
  inputClassName?: string
  sliderClassName?: string
  ariaLabel: string
  onChange: (value: number) => void
}) {
  const { flush, schedule } = useRafNumberChange(onChange)
  const sliderValue = clampInspectorValue(value, sliderMin, sliderMax)
  const progress =
    sliderMax > sliderMin
      ? clampInspectorValue(
          (sliderValue - sliderMin) / (sliderMax - sliderMin),
          0,
          1
        )
      : 0
  const thumbInset = 6
  const thumbPosition = `calc(${thumbInset}px + ${progress} * (100% - ${thumbInset * 2}px))`
  // Touch never lands on the native range (it jumps on contact and blocks
  // scrolling). The track reads the finger instead: sideways drags edit,
  // taps set, and vertical swipes scroll the panel.
  const pressRef = useRef<{
    pointerId: number
    x: number
    y: number
    editing: boolean
  } | null>(null)
  const valueAt = (clientX: number, track: Element) => {
    const rect = track.getBoundingClientRect()
    const fraction = clampInspectorValue(
      (clientX - rect.left - thumbInset) /
        Math.max(1, rect.width - thumbInset * 2),
      0,
      1
    )
    const raw = sliderMin + fraction * (sliderMax - sliderMin)
    const stepped = step > 0 ? Math.round(raw / step) * step : raw
    return clampInspectorValue(
      Number(stepped.toFixed(precision)),
      sliderMin,
      sliderMax
    )
  }
  const startEditing = (event: React.PointerEvent<HTMLLabelElement>) => {
    const press = pressRef.current
    if (!press || press.editing) return
    press.editing = true
    beginDocumentEdit()
    try {
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch {}
  }
  const finishPress = (cancelled: boolean) => {
    const press = pressRef.current
    pressRef.current = null
    if (!press?.editing) return
    flushSync(flush)
    endDocumentEdit(cancelled)
  }
  return (
    <div className={`flex min-w-0 items-center gap-2 ${className}`}>
      <NumberField
        value={value}
        min={min}
        max={max}
        step={step}
        scrubStep={scrubStep}
        precision={precision}
        suffix={suffix}
        ariaLabel={ariaLabel}
        className={compact ? "w-16 shrink-0" : inputClassName}
        onChange={onChange}
      />
      <label
        className={`relative flex h-8 min-w-0 cursor-ew-resize touch-pan-y items-center rounded-lg has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring ${sliderClassName}`}
        onClick={(event) => event.stopPropagation()}
        onPointerDown={(event) => {
          // Mouse and pen use the native range input underneath.
          if (event.target !== event.currentTarget || !event.isPrimary) return
          pressRef.current = {
            pointerId: event.pointerId,
            x: event.clientX,
            y: event.clientY,
            editing: false,
          }
          if (event.pointerType !== "touch") {
            startEditing(event)
            schedule(valueAt(event.clientX, event.currentTarget))
          }
        }}
        onPointerMove={(event) => {
          const press = pressRef.current
          if (!press || press.pointerId !== event.pointerId) return
          if (!press.editing) {
            const intent = horizontalIntent(press, {
              x: event.clientX,
              y: event.clientY,
            })
            if (intent === "scroll") pressRef.current = null
            if (intent !== "drag") return
            startEditing(event)
          }
          schedule(valueAt(event.clientX, event.currentTarget))
        }}
        onPointerUp={(event) => {
          const press = pressRef.current
          if (!press || press.pointerId !== event.pointerId) return
          if (!press.editing) {
            // A tap sets the value where the finger landed.
            startEditing(event)
            schedule(valueAt(event.clientX, event.currentTarget))
          }
          finishPress(false)
        }}
        onPointerCancel={() => finishPress(true)}
      >
        {/* A quiet fill with a slim handle — reads like the field beside it. */}
        <span
          aria-hidden="true"
          className="pointer-events-none relative h-full w-full overflow-hidden rounded-md bg-muted/80"
        >
          <span
            className="absolute inset-y-0 left-0 w-(--element-width) bg-(--inspector-slider-active)"
            style={
              {
                "--element-width": cssLength(thumbPosition),
              } as React.CSSProperties
            }
          />
          <span
            className="absolute top-1/2 left-(--position-x) h-3.5 w-0.75 -translate-x-1/2 -translate-y-1/2 rounded-full bg-(--inspector-slider-thumb) ring-1 ring-black/15"
            style={
              {
                "--position-x": cssLength(thumbPosition),
              } as React.CSSProperties
            }
          />
        </span>
        <input
          type="range"
          min={sliderMin}
          max={sliderMax}
          step={step}
          value={sliderValue}
          aria-label={`${ariaLabel} slider`}
          aria-valuetext={value.toFixed(precision)}
          onChange={(event) => schedule(Number(event.currentTarget.value))}
          onPointerDown={beginDocumentEdit}
          onPointerUp={() => {
            flushSync(flush)
            endDocumentEdit()
          }}
          onPointerCancel={() => {
            flushSync(flush)
            endDocumentEdit(true)
          }}
          onKeyUp={flush}
          onBlur={() => {
            flushSync(flush)
            endDocumentEdit()
          }}
          className="absolute inset-0 h-full w-full cursor-ew-resize touch-pan-y appearance-none opacity-0 pointer-coarse:pointer-events-none [&::-moz-range-thumb]:size-6 [&::-webkit-slider-thumb]:size-6 [&::-webkit-slider-thumb]:appearance-none"
        />
      </label>
    </div>
  )
}
