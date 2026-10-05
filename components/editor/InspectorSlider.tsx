"use client"

import { flushSync } from "react-dom"
import { beginDocumentEdit, endDocumentEdit } from "@/lib/editor-transactions"
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
  inputClassName = "w-[60px] shrink-0 max-[720px]:w-[72px]",
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
        className={`relative flex h-8 min-w-0 ${compact ? "" : "max-[720px]:h-11 pointer-coarse:h-11"} items-center rounded-lg has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring ${sliderClassName}`}
        onClick={(event) => event.stopPropagation()}
      >
        {/* A quiet fill with a slim handle — reads like the field beside it. */}
        <span
          aria-hidden="true"
          className="pointer-events-none relative h-full w-full overflow-hidden rounded-md bg-muted/80"
        >
          <span
            className="absolute inset-y-0 left-0 bg-(--inspector-slider-active)"
            style={{ width: thumbPosition }}
          />
          <span
            className="absolute top-1/2 h-3.5 w-0.75 -translate-x-1/2 -translate-y-1/2 rounded-full bg-(--inspector-slider-thumb) shadow-[0_0_0_1px_rgba(0,0,0,0.15)]"
            style={{ left: thumbPosition }}
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
          className="absolute inset-0 h-full w-full cursor-ew-resize touch-none appearance-none opacity-0 [&::-moz-range-thumb]:size-6 [&::-webkit-slider-thumb]:size-6 [&::-webkit-slider-thumb]:appearance-none"
        />
      </label>
    </div>
  )
}
