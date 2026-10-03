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
  inputClassName = "w-[68px] shrink-0 max-[720px]:w-[76px]",
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
  const progress =
    sliderMax > sliderMin
      ? clampInspectorValue(
          (sliderValue - sliderMin) / (sliderMax - sliderMin),
          0,
          1
        )
      : 0
  const thumbPosition = `calc(12px + ${progress} * (100% - 24px))`
  return (
    <div className={`flex min-w-0 items-center gap-2 ${className}`}>
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
      <label
        className={`relative flex h-11 min-w-0 items-center rounded-lg has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring ${sliderClassName}`}
        onClick={(event) => event.stopPropagation()}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none relative h-7 w-full rounded-lg"
          style={{
            background: `linear-gradient(to right, var(--inspector-slider-active) 0 ${thumbPosition}, var(--inspector-slider-track) ${thumbPosition} 100%)`,
          }}
        >
          <span
            className="absolute inset-y-0 w-6 -translate-x-1/2 rounded-lg bg-[var(--inspector-slider-thumb)] shadow-[inset_0_1px_0_rgba(255,255,255,0.26)]"
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
          onPointerUp={flush}
          onKeyUp={flush}
          onBlur={flush}
          className="absolute inset-0 h-full w-full cursor-ew-resize touch-none appearance-none opacity-0 [&::-moz-range-thumb]:size-6 [&::-webkit-slider-thumb]:size-6 [&::-webkit-slider-thumb]:appearance-none"
        />
      </label>
    </div>
  )
}
