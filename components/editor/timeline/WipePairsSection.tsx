import type { MaterialSymbolPreviewStyle } from "../IconLibrary"
import type { MaterialWipeIconPair } from "../MaterialWipePairs"
import type { ShapeStop } from "../TimelineModel"
import { cn } from "@/lib/utils"
import { PICKER_GRID_CLASS, PickerTile } from "./PickerTile"
import { WipePairPreview } from "./WipePairPreview"

export function WipePairsSection({
  stop,
  filteredWipePairs,
  materialSymbolClass,
  symbolStyle,
  className,
  onChooseWipePair,
}: {
  stop: ShapeStop
  filteredWipePairs: MaterialWipeIconPair[]
  materialSymbolClass: string
  symbolStyle: MaterialSymbolPreviewStyle
  className?: string
  onChooseWipePair: (shapeId: string, pair: MaterialWipeIconPair) => void
}) {
  if (filteredWipePairs.length === 0) return null

  return (
    <div className={cn(PICKER_GRID_CLASS, "mb-3 pr-1", className)}>
      {filteredWipePairs.map((pair) => (
        <PickerTile
          key={`wipe-pair-${stop.id}-${pair.label}`}
          label={pair.label}
          title={`${pair.label}: ${pair.enabled}`}
          className="wipe-pair-option"
          onClick={() => onChooseWipePair(stop.id, pair)}
        >
          <WipePairPreview
            pair={pair}
            className={materialSymbolClass}
            style={
              {
                "--symbol-variation": symbolStyle["--symbol-variation"],
              } as React.CSSProperties
            }
          />
        </PickerTile>
      ))}
    </div>
  )
}
