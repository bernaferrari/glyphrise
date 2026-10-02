"use client"

import { AXIS_COLORS, type LightPosition } from "./EditorModel"
import { NumberField } from "./NumberField"

type Axis = keyof LightPosition

const AXIS_ORDER: Array<{ label: "X" | "Y" | "Z"; axis: Axis }> = [
  { label: "X", axis: "x" },
  { label: "Y", axis: "y" },
  { label: "Z", axis: "z" },
]

export function Vector3NumberFields({
  size = "default",
  values,
  min,
  max,
  step,
  scrubStep,
  suffix,
  precision,
  ariaLabel,
  onChange,
}: {
  size?: "default" | "large"
  values: LightPosition
  min: number
  max: number
  step: number
  scrubStep?: number
  suffix?: string
  precision: number
  ariaLabel: string
  onChange: (axis: Axis, value: number) => void
}) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-1">
      {AXIS_ORDER.map(({ label: axisLabel, axis }) => (
        <NumberField
          key={axis}
          value={values[axis]}
          min={min}
          max={max}
          step={step}
          scrubStep={scrubStep}
          prefix={axisLabel}
          prefixColor={AXIS_COLORS[axisLabel]}
          suffix={suffix}
          precision={precision}
          ariaLabel={`${ariaLabel} ${axisLabel}`}
          className={
            size === "large" ? "min-h-11 min-w-0 flex-1" : "min-w-0 flex-1"
          }
          inputClassName="text-right"
          onChange={(value) => onChange(axis, value)}
        />
      ))}
    </div>
  )
}
