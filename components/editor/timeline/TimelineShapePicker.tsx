"use client"

import { ShapePickerContent } from "./ShapePickerContent"
import type { TimelineShapeLaneProps } from "./TimelineLanesSurfaceTypes"

// The icon library belongs to the workspace, so both animation views can open it.
export function TimelineShapePicker({
  shapes,
  openShapePicker,
  selectedShapeId,
  shapePicker,
  onSelectShape,
  onOpenShapePicker,
  onShapeIconChange,
  onUploadShape,
}: Pick<
  TimelineShapeLaneProps,
  | "shapes"
  | "selectedShapeId"
  | "openShapePicker"
  | "shapePicker"
  | "onSelectShape"
  | "onOpenShapePicker"
  | "onShapeIconChange"
  | "onUploadShape"
>) {
  const stop =
    shapes.find((shape) => shape.id === openShapePicker) ??
    shapes.find((shape) => shape.id === selectedShapeId) ??
    shapes[0]
  if (!stop) return null
  return (
    <ShapePickerContent
      open={Boolean(openShapePicker)}
      onOpenChange={(open) => {
        if (!open) {
          onOpenShapePicker(null)
          return
        }
        onSelectShape(stop.id)
        onOpenShapePicker(stop.id)
      }}
      stop={stop}
      visibleShapeOptions={shapePicker.visibleShapeOptions}
      recentMaterialSymbols={shapePicker.recentMaterialSymbols}
      filteredMaterialSymbols={shapePicker.filteredMaterialSymbols}
      filteredWipePairs={shapePicker.filteredWipePairs}
      normalizedShapeQuery={shapePicker.normalizedShapeQuery}
      shapeSearchQuery={shapePicker.shapeSearchQuery}
      onShapeSearchQueryChange={shapePicker.setShapeSearchQuery}
      materialSymbolStyle={shapePicker.materialSymbolStyle}
      onMaterialSymbolStyleChange={shapePicker.setMaterialSymbolStyle}
      materialSymbolSettings={shapePicker.materialSymbolSettings}
      onMaterialSymbolSettingChange={shapePicker.updateMaterialSymbolSetting}
      materialSymbolOptionsOpen={shapePicker.materialSymbolOptionsOpen}
      onMaterialSymbolOptionsOpenChange={
        shapePicker.setMaterialSymbolOptionsOpen
      }
      materialSymbolStatus={shapePicker.materialSymbolStatus}
      onMaterialSymbolStatusChange={shapePicker.setMaterialSymbolStatus}
      onImportMaterialSymbol={shapePicker.importMaterialSymbol}
      onChooseMaterialSymbol={shapePicker.chooseMaterialSymbol}
      onChooseWipePair={shapePicker.chooseWipePair}
      onShapeIconChange={onShapeIconChange}
      onOpenShapePicker={onOpenShapePicker}
      onUploadShape={onUploadShape}
    />
  )
}
