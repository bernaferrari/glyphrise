"use client"

import { ReactNode, RefObject } from "react"
import { ColorPicker } from "@/components/ui/color-picker"
import type { MaterialPresetId } from "../3d/MaterialPresets"
import { FillMode, MaterialSettingKey, MaterialSettings } from "./EditorModel"
import { AdvancedMaterialControls } from "./AdvancedMaterialControls"
import { FinishPresetPicker } from "./FinishPresetPicker"
import { FinishPresetStrip } from "./FinishPresetStrip"
import { InspectorRow, InspectorSection } from "./InspectorPrimitives"
import type { FillGradientType, FillStop } from "./TimelineModel"

export type StyleInspectorSectionProps = {
  fillRef: RefObject<HTMLDivElement | null>
  materialRef: RefObject<HTMLDivElement | null>
  materialPreset: MaterialPresetId
  materialKeyframeCount: number
  activeMaterialSettings: MaterialSettings
  isAdvancedMaterialOpen: boolean
  selectedShapeFill: string
  selectedShapeFillSecondary: string
  selectedShapeGradientType: FillGradientType
  selectedShapeFillStops: FillStop[]
  fillMode: FillMode
  styleKeyframeControl: ReactNode
  onFillColorChange: (value: string, secondary?: boolean) => void
  onGradientToggle: (enabled: boolean) => void
  onGradientTypeChange: (gradientType: FillGradientType) => void
  onStopsChange: (
    stops: Array<{ id?: string; color: string; position: number }>
  ) => void
  onMaterialPresetChange: (preset: MaterialPresetId) => void
  onAdvancedMaterialOpenChange: (open: boolean) => void
  onMaterialSettingChange: (
    key: MaterialSettingKey,
    value: number,
    min: number,
    max: number
  ) => void
}

export function StyleInspectorSection({
  fillRef,
  materialRef,
  materialPreset,
  materialKeyframeCount,
  activeMaterialSettings,
  isAdvancedMaterialOpen,
  selectedShapeFill,
  selectedShapeFillSecondary,
  selectedShapeGradientType,
  selectedShapeFillStops,
  fillMode,
  styleKeyframeControl,
  onFillColorChange,
  onGradientToggle,
  onGradientTypeChange,
  onStopsChange,
  onMaterialPresetChange,
  onAdvancedMaterialOpenChange,
  onMaterialSettingChange,
}: StyleInspectorSectionProps) {
  return (
    <InspectorSection title="STYLE" action={styleKeyframeControl}>
      <InspectorRow
        label="Fill"
        rowRef={fillRef}
        editProperty="Fill"
        scopeLabel="Colors"
      >
        <div className="min-w-0 flex-1">
          <ColorPicker
            value={selectedShapeFill}
            onChange={(value) => onFillColorChange(value)}
            gradient={fillMode === "gradient"}
            onGradientToggle={onGradientToggle}
            gradientType={selectedShapeGradientType}
            onGradientTypeChange={onGradientTypeChange}
            stops={selectedShapeFillStops}
            onStopsChange={onStopsChange}
            secondaryValue={selectedShapeFillSecondary}
            onSecondaryChange={(value) => onFillColorChange(value, true)}
            className="min-h-10 w-full rounded-lg border border-input/60 bg-muted/70 px-3 py-0 text-foreground hover:bg-foreground/[0.09]"
          />
        </div>
      </InspectorRow>

      <div ref={materialRef}>
        <FinishPresetStrip
          value={materialPreset}
          onChange={onMaterialPresetChange}
        />
      </div>
      <InspectorRow
        label="All finishes"
        editProperty="Finish"
        scopeLabel="Settings"
      >
        <FinishPresetPicker
          value={materialPreset}
          onChange={onMaterialPresetChange}
        />
      </InspectorRow>
      <div>
        <AdvancedMaterialControls
          isOpen={isAdvancedMaterialOpen}
          keyframeCount={materialKeyframeCount}
          settings={activeMaterialSettings}
          onOpenChange={onAdvancedMaterialOpenChange}
          onSettingChange={onMaterialSettingChange}
        />
      </div>
    </InspectorSection>
  )
}
