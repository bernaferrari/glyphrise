"use client"

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
  inputClassName = "w-[68px]",
  sliderClassName = "flex-1",
  ariaLabel,
  onChange,
}: {
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
  return (
    <div className={`flex min-w-0 items-center gap-3 ${className}`}>
      <input
        type="range"
        min={sliderMin}
        max={sliderMax}
        step={step}
        value={sliderValue}
        aria-label={`${ariaLabel} slider`}
        aria-valuetext={value.toFixed(precision)}
        onChange={(event) => schedule(Number(event.currentTarget.value))}
        onPointerUp={flush}
        onKeyUp={flush}
        onBlur={flush}
        onClick={(event) => event.stopPropagation()}
        className={`h-10 min-w-0 cursor-ew-resize touch-none appearance-none rounded bg-transparent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring [&::-moz-range-thumb]:size-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-background [&::-moz-range-thumb]:bg-foreground [&::-moz-range-track]:h-1 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-border [&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-border [&::-webkit-slider-thumb]:-mt-1.5 [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-background [&::-webkit-slider-thumb]:bg-foreground ${sliderClassName}`}
      />
      <NumberField
        value={value}
        min={min}
        max={max}
        step={step}
        scrubStep={scrubStep}
        precision={precision}
        ariaLabel={ariaLabel}
        className={inputClassName}
        onChange={onChange}
      />
    </div>
  )
}
