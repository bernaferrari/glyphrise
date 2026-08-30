"use client"

import { memo } from "react"
import { Layers } from "lucide-react"
import { cn } from "@/lib/utils"
import { Switch } from "@/components/ui/switch"
import type { PathOverride } from "../3d/SvgTypes"
import { InspectorRow } from "./InspectorPrimitives"
import { InspectorSlider } from "./InspectorSlider"
import { ALL_LAYERS_ID, type SvgLayer } from "./SvgLayerModel"

type LayerSwitcherProps = {
  layers: SvgLayer[]
  selectedLayerId: string
  selectedLayerOverride: PathOverride | null
  onSelectLayer: (id: string) => void
  onToggleVisibility: () => void
  onScaleChange: (value: number) => void
  onDepthChange: (value: number) => void
}

type LayerChipProps = {
  active: boolean
  label: string
  title?: string
  color?: string
  onClick: () => void
}

const layerChipClass =
  "flex min-h-8 min-w-8 max-w-28 shrink-0 items-center justify-center gap-1.5 rounded-md px-2 text-[11px] font-medium tabular-nums transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"

function LayerChip({ active, label, title, color, onClick }: LayerChipProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      title={title}
      onClick={onClick}
      className={cn(
        layerChipClass,
        active
          ? "bg-foreground/[0.10] text-foreground shadow-[inset_0_0_0_1px_rgba(140,140,160,0.18)]"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {color ? (
        <span
          className="size-2.5 shrink-0 rounded-sm border border-black/10"
          style={{ backgroundColor: color }}
          aria-hidden="true"
        />
      ) : null}
      <span className="truncate">{label}</span>
    </button>
  )
}

function LayerSwitcherComponent({
  layers,
  selectedLayerId,
  selectedLayerOverride,
  onSelectLayer,
  onToggleVisibility,
  onScaleChange,
  onDepthChange,
}: LayerSwitcherProps) {
  const isAllLayers = selectedLayerId === ALL_LAYERS_ID
  const visible = selectedLayerOverride?.visible ?? true
  const showLayerControls = !isAllLayers && selectedLayerOverride

  if (layers.length === 0) return null

  return (
    <div className="flex flex-col">
      <div className="flex min-h-9 items-start gap-2 px-2.5 py-1.5">
        <span className="flex h-6 shrink-0 items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
          <Layers className="size-3.5" />
          SVG paths
        </span>

        <div className="editor-scrollbar ml-auto flex max-h-20 flex-wrap items-center justify-end gap-1 overflow-y-auto">
          <LayerChip
            active={isAllLayers}
            label="All paths"
            onClick={() => onSelectLayer(ALL_LAYERS_ID)}
          />
          {layers.map((layer, index) => (
            <LayerChip
              key={layer.id}
              active={layer.id === selectedLayerId}
              label={layer.name}
              title={`SVG path ${index + 1}: ${layer.name}`}
              color={layer.color}
              onClick={() => onSelectLayer(layer.id)}
            />
          ))}
        </div>
      </div>

      {showLayerControls ? (
        <div className="flex flex-col gap-0.5 border-t border-border/40 p-1">
          <InspectorRow label="Scale">
            <InspectorSlider
              value={selectedLayerOverride.scale?.x ?? 1}
              min={0.1}
              max={2.25}
              sliderMax={1.6}
              step={0.01}
              scrubStep={0.03}
              precision={2}
              ariaLabel="SVG path scale"
              onChange={onScaleChange}
            />
          </InspectorRow>
          <InspectorRow label="Depth">
            <InspectorSlider
              value={selectedLayerOverride.depthMultiplier}
              min={0.05}
              max={2.5}
              sliderMax={1.8}
              step={0.05}
              precision={2}
              ariaLabel="SVG path depth"
              onChange={onDepthChange}
            />
          </InspectorRow>
          <InspectorRow label="Visible">
            <div className="flex flex-1 justify-end pr-1">
              <Switch
                checked={visible}
                onCheckedChange={onToggleVisibility}
                size="sm"
                aria-label={visible ? "Hide SVG path" : "Show SVG path"}
              />
            </div>
          </InspectorRow>
        </div>
      ) : null}
    </div>
  )
}

export const LayerSwitcher = memo(LayerSwitcherComponent)
