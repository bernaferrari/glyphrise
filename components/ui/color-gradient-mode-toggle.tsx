"use client"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export type GradientType = "linear" | "radial" | "conic" | "mesh"

export const GRADIENT_TYPES: Array<{
  id: GradientType
  label: string
}> = [
  { id: "linear", label: "Linear" },
  { id: "radial", label: "Radial" },
  { id: "conic", label: "Conic" },
  { id: "mesh", label: "Mesh" },
]

export const SHOW_EXPERIMENTAL_GRADIENT_TYPES = false
export const VISIBLE_GRADIENT_TYPES = SHOW_EXPERIMENTAL_GRADIENT_TYPES
  ? GRADIENT_TYPES
  : GRADIENT_TYPES.filter((type) => type.id === "mesh")

interface ColorGradientModeToggleProps {
  isGradient: boolean
  gradientType: GradientType
  onGradientToggle?: (enabled: boolean) => void
  onGradientTypeChange?: (type: GradientType) => void
}

export function ColorGradientModeToggle({
  isGradient,
  gradientType,
  onGradientToggle,
  onGradientTypeChange,
}: ColorGradientModeToggleProps) {
  return (
    <Tabs
      value={isGradient ? gradientType : "solid"}
      onValueChange={(value: GradientType | "solid") => {
        if (value === "solid") {
          onGradientToggle?.(false)
          return
        }
        onGradientToggle?.(true)
        onGradientTypeChange?.(value)
      }}
    >
      <TabsList aria-label="Fill type" className="w-full">
        <TabsTrigger value="solid" size="compact">
          Solid
        </TabsTrigger>
        {VISIBLE_GRADIENT_TYPES.map((type) => (
          <TabsTrigger key={type.id} value={type.id} size="compact">
            {type.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
