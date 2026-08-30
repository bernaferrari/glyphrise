"use client"

import { ReactNode, RefObject } from "react"
import { EXTRUDE_DEFAULT, EXTRUDE_MAX, finiteNumber } from "./EditorModel"
import { InspectorRow, InspectorSection } from "./InspectorPrimitives"
import { InspectorSlider } from "./InspectorSlider"
import { MAX_BEVEL_SEGMENTS } from "./EditorModel"
import type { TimelineTrack } from "./TimelineModel"
import {
  curveDetailFromGeometryQuality,
  geometryQualityFromCurveDetail,
} from "./GeometryControlModel"

export type GeometryInspectorSectionProps = {
  extrusionRef: RefObject<HTMLDivElement | null>
  isActive: boolean
  extrusionTrack: TimelineTrack
  activeExtrusionDepth: number
  extrusionDepth: number
  activeGeometryQuality: number
  bevelEnabled: boolean
  bevelThickness: number
  bevelSize: number
  bevelSegments: number
  keyframeControl: ReactNode
  onActivate: () => void
  onDepthChange: (value: number) => void
  onBevelEnabledChange: (enabled: boolean) => void
  onBevelThicknessChange: (value: number) => void
  onBevelSizeChange: (value: number) => void
  onBevelSegmentsChange: (segments: number) => void
  onQualityChange: (value: number) => void
  onCustomEdit: () => void
}

export function GeometryInspectorSection({
  extrusionRef,
  isActive,
  extrusionTrack,
  activeExtrusionDepth,
  extrusionDepth,
  activeGeometryQuality,
  bevelEnabled,
  bevelThickness,
  bevelSize,
  bevelSegments,
  keyframeControl,
  onActivate,
  onDepthChange,
  onBevelEnabledChange,
  onBevelThicknessChange,
  onBevelSizeChange,
  onBevelSegmentsChange,
  onQualityChange,
  onCustomEdit,
}: GeometryInspectorSectionProps) {
  const depthValue = finiteNumber(
    extrusionTrack.keyframes.length > 0 ? activeExtrusionDepth : extrusionDepth,
    EXTRUDE_DEFAULT
  )
  const crownValue = bevelEnabled
    ? Math.max(
        0,
        Math.min(
          1,
          (finiteNumber(bevelSize, 0) / 0.2 +
            finiteNumber(bevelThickness, 0) / 0.36) /
            2
        )
      )
    : 0
  const curveDetail = curveDetailFromGeometryQuality(activeGeometryQuality)
  const qualityLabel =
    curveDetail < 34 ? "Fast" : curveDetail < 75 ? "Balanced" : "Detailed"
  const expensiveGeometry = curveDetail >= 75 || bevelSegments >= 9

  return (
    <InspectorSection title="GEOMETRY" action={keyframeControl}>
      <InspectorRow
        label="Extrude"
        rowRef={extrusionRef}
        dot={extrusionTrack.keyframes.length > 0 ? extrusionTrack.color : null}
        active={isActive}
        onClick={onActivate}
      >
        <InspectorSlider
          value={depthValue}
          min={0.2}
          max={EXTRUDE_MAX}
          sliderMax={40}
          step={0.25}
          scrubStep={1}
          precision={2}
          ariaLabel="Extrusion depth"
          onChange={(value) => {
            onDepthChange(value)
            onCustomEdit()
          }}
        />
      </InspectorRow>

      <InspectorRow label="Edge roundness">
        <InspectorSlider
          value={crownValue}
          min={0}
          max={1}
          sliderMax={1}
          step={0.02}
          precision={2}
          ariaLabel="Edge roundness"
          onChange={(value) => {
            const next = Math.max(0, Math.min(1, value))
            onBevelEnabledChange(next > 0)
            onBevelSizeChange(next * 0.2)
            onBevelThicknessChange(next * 0.36)
            if (next > 0 && bevelSegments < 2) {
              onBevelSegmentsChange(3)
            }
            onCustomEdit()
          }}
        />
      </InspectorRow>

      <InspectorRow label="Bevel detail">
        <InspectorSlider
          value={bevelEnabled ? bevelSegments : 0}
          min={0}
          max={MAX_BEVEL_SEGMENTS}
          sliderMax={12}
          step={1}
          precision={0}
          ariaLabel="Bevel segments"
          onChange={(value) => {
            const nextSegments = Math.max(0, Math.round(value))
            onBevelEnabledChange(nextSegments > 0)
            if (nextSegments > 0) {
              onBevelSegmentsChange(nextSegments)
            }
            onCustomEdit()
          }}
        />
      </InspectorRow>

      <InspectorRow label="Curve smoothness">
        <InspectorSlider
          value={curveDetail}
          min={0}
          max={100}
          sliderMin={0}
          sliderMax={100}
          step={1}
          precision={0}
          ariaLabel="Curve smoothness percent"
          onChange={(value) =>
            onQualityChange(geometryQualityFromCurveDetail(value))
          }
        />
      </InspectorRow>
      <div className="flex items-start justify-between gap-3 px-1 pt-1 text-[10px] leading-4 text-muted-foreground">
        <span>Preview quality</span>
        <span className="text-right font-medium text-foreground">
          {qualityLabel}
          {expensiveGeometry ? (
            <span className="block font-normal text-amber-600">
              Complex icons may preview more slowly
            </span>
          ) : null}
        </span>
      </div>
    </InspectorSection>
  )
}
