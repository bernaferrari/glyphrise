import { memo, useState, type RefObject } from "react"
import { Check, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  type MaterialSymbolFontSettings,
  type MaterialSymbolStyle,
} from "../IconLibrary"
import type { MaterialWipeIconPair } from "../MaterialWipePairs"
import type { ShapeStop } from "../TimelineModel"
import { MaterialSymbolGrid } from "./MaterialSymbolGrid"
import { ShapePresetGrid } from "./ShapePresetGrid"
import {
  type MaterialSymbolStatus,
  shapePickerSymbolStyle,
} from "./ShapePickerSymbolModel"
import { SymbolSearchRow } from "./SymbolSearchRow"
import type { ShapeOption } from "./TimelineTypes"
import { WipePairsSection } from "./WipePairsSection"
import { useMaterialSymbolFont } from "./useMaterialSymbolFont"

function ShapePickerDialog({
  open,
  finalFocusRef,
  onOpenChange,
  stop,
  visibleShapeOptions,
  recentMaterialSymbols,
  filteredMaterialSymbols,
  filteredWipePairs,
  normalizedShapeQuery,
  shapeSearchQuery,
  onShapeSearchQueryChange,
  materialSymbolStyle,
  onMaterialSymbolStyleChange,
  materialSymbolSettings,
  onMaterialSymbolSettingChange,
  materialSymbolOptionsOpen,
  onMaterialSymbolOptionsOpenChange,
  materialSymbolStatus,
  onMaterialSymbolStatusChange,
  onImportMaterialSymbol,
  onChooseMaterialSymbol,
  onChooseWipePair,
  onShapeIconChange,
  onOpenShapePicker,
  onUploadShape,
}: {
  open: boolean
  finalFocusRef?: RefObject<HTMLElement | null>
  onOpenChange: (open: boolean) => void
  stop: ShapeStop
  visibleShapeOptions: ShapeOption[]
  recentMaterialSymbols: string[]
  filteredMaterialSymbols: string[]
  filteredWipePairs: MaterialWipeIconPair[]
  normalizedShapeQuery: string
  shapeSearchQuery: string
  onShapeSearchQueryChange: (value: string) => void
  materialSymbolStyle: MaterialSymbolStyle
  onMaterialSymbolStyleChange: (style: MaterialSymbolStyle) => void
  materialSymbolSettings: MaterialSymbolFontSettings
  onMaterialSymbolSettingChange: <K extends keyof MaterialSymbolFontSettings>(
    key: K,
    value: MaterialSymbolFontSettings[K]
  ) => void
  materialSymbolOptionsOpen: boolean
  onMaterialSymbolOptionsOpenChange: (open: boolean) => void
  materialSymbolStatus: MaterialSymbolStatus
  onMaterialSymbolStatusChange: (status: MaterialSymbolStatus) => void
  onImportMaterialSymbol: (shapeId: string) => void
  onChooseMaterialSymbol: (shapeId: string, symbolName: string) => void
  onChooseWipePair: (shapeId: string, pair: MaterialWipeIconPair) => void
  onShapeIconChange: (id: string, option: ShapeOption) => void
  onOpenShapePicker: (id: string | null) => void
  onUploadShape: (id: string) => void
}) {
  const materialSymbolClass = `material-symbols-${materialSymbolStyle}`
  const symbolStyle = shapePickerSymbolStyle(materialSymbolSettings)
  const [activeTab, setActiveTab] = useState("symbols")
  useMaterialSymbolFont(
    open && (activeTab === "symbols" || activeTab === "wipe"),
    materialSymbolStyle
  )
  const searching = shapeSearchQuery.trim().length > 0
  const searchSymbols = [...recentMaterialSymbols, ...filteredMaterialSymbols]
  // Each tab searches only its own content; Enter picks from Symbols.
  const chooseSearchResult = (shapeId: string) => {
    if (searchSymbols.includes(normalizedShapeQuery)) {
      onChooseMaterialSymbol(shapeId, normalizedShapeQuery)
    } else if (searchSymbols[0]) {
      onChooseMaterialSymbol(shapeId, searchSymbols[0])
    } else {
      onImportMaterialSymbol(shapeId)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        variant="picker"
        finalFocus={finalFocusRef}
        className="!flex h-(--spacing-shape-picker-height) !w-(--spacing-shape-picker) !max-w-(--spacing-shape-picker) flex-col overflow-hidden"
        onPointerDown={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
        onContextMenu={(event) => event.stopPropagation()}
      >
        <DialogHeader variant="picker" className="shrink-0">
          <div className="flex min-w-0 items-center gap-2.5">
            <span
              aria-hidden="true"
              className="grid size-7 shrink-0 place-items-center rounded-md bg-muted text-(--element-color) [&_svg]:size-4 [&_svg]:fill-current [&_svg]:stroke-current"
              style={{ "--element-color": stop.color } as React.CSSProperties}
              dangerouslySetInnerHTML={{ __html: stop.svgContent }}
            />
            <DialogTitle truncate={true} variant="editor" className="min-w-0">
              Choose icon
              <span className="ml-1.5 font-normal text-muted-foreground">
                replacing {stop.iconName ?? stop.iconId}
              </span>
            </DialogTitle>
            <DialogDescription className="sr-only">
              Choose the symbol, wipe pair, preset, or uploaded SVG for this
              icon clip.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background px-3">
          <Tabs
            spacing="comfortable"
            value={activeTab}
            onValueChange={setActiveTab}
            className="min-h-0 flex-1"
          >
            <TabsList
              density="picker"
              variant="line"
              className="w-full shrink-0 justify-start group-data-horizontal/tabs:h-10"
            >
              <TabsTrigger size="compact" value="symbols" className="flex-none">
                Symbols
              </TabsTrigger>
              <TabsTrigger size="compact" value="wipe" className="flex-none">
                Wipe pairs
              </TabsTrigger>
              <TabsTrigger size="compact" value="presets" className="flex-none">
                Presets
              </TabsTrigger>
              <TabsTrigger size="compact" value="upload" className="flex-none">
                Upload
              </TabsTrigger>
            </TabsList>
            {activeTab !== "upload" ? (
              <SymbolSearchRow
                searchScope={
                  activeTab === "presets"
                    ? "presets"
                    : activeTab === "wipe"
                      ? "wipe"
                      : "symbols"
                }
                stop={stop}
                materialSymbolClass={materialSymbolClass}
                symbolStyle={symbolStyle}
                materialSymbolStyle={materialSymbolStyle}
                materialSymbolSettings={materialSymbolSettings}
                materialSymbolOptionsOpen={materialSymbolOptionsOpen}
                materialSymbolStatus={materialSymbolStatus}
                normalizedShapeQuery={normalizedShapeQuery}
                shapeSearchQuery={shapeSearchQuery}
                onMaterialSymbolOptionsOpenChange={
                  onMaterialSymbolOptionsOpenChange
                }
                onMaterialSymbolStyleChange={onMaterialSymbolStyleChange}
                onMaterialSymbolSettingChange={onMaterialSymbolSettingChange}
                onMaterialSymbolStatusChange={onMaterialSymbolStatusChange}
                onShapeSearchQueryChange={onShapeSearchQueryChange}
                onImportMaterialSymbol={chooseSearchResult}
              />
            ) : null}

            {materialSymbolStatus.state === "error" && (
              <p role="alert" className="mb-2 text-xs text-destructive">
                {materialSymbolStatus.message}
              </p>
            )}

            {/* The full symbol grid is virtualized and must own its scroll, so
                this tab is a column: sections on top, the grid fills the rest. */}
            <TabsContent
              value="symbols"
              className="flex min-h-0 flex-col overflow-hidden"
            >
              {recentMaterialSymbols.length > 0 && (
                <section className="mb-3 shrink-0">
                  <div className="mb-1.5 px-0.5 text-2xs font-medium tracking-label text-muted-foreground uppercase">
                    Recent
                  </div>
                  <MaterialSymbolGrid
                    stop={stop}
                    filteredMaterialSymbols={recentMaterialSymbols}
                    normalizedShapeQuery={normalizedShapeQuery}
                    materialSymbolClass={materialSymbolClass}
                    symbolStyle={symbolStyle}
                    materialSymbolStatus={materialSymbolStatus}
                    className="mb-0 max-h-24"
                    onChooseMaterialSymbol={onChooseMaterialSymbol}
                    onImportMaterialSymbol={onImportMaterialSymbol}
                  />
                </section>
              )}

              {!searching && (
                <div className="mb-1.5 flex shrink-0 items-baseline gap-1.5 px-0.5 text-2xs font-medium tracking-label text-muted-foreground uppercase">
                  All symbols
                  <span className="font-normal tracking-normal normal-case tabular-nums">
                    {filteredMaterialSymbols.length.toLocaleString()}
                  </span>
                </div>
              )}
              <MaterialSymbolGrid
                stop={stop}
                filteredMaterialSymbols={filteredMaterialSymbols}
                normalizedShapeQuery={normalizedShapeQuery}
                materialSymbolClass={materialSymbolClass}
                symbolStyle={symbolStyle}
                materialSymbolStatus={materialSymbolStatus}
                className="mb-0 max-h-none min-h-0 flex-1"
                onChooseMaterialSymbol={onChooseMaterialSymbol}
                onImportMaterialSymbol={onImportMaterialSymbol}
              />
            </TabsContent>

            <TabsContent
              scrollable={true}
              value="wipe"
              className="min-h-0 overflow-y-auto"
            >
              {filteredWipePairs.length > 0 ? (
                <WipePairsSection
                  stop={stop}
                  filteredWipePairs={filteredWipePairs}
                  materialSymbolClass={materialSymbolClass}
                  symbolStyle={symbolStyle}
                  className="mb-0 border-t-0 pt-0"
                  onChooseWipePair={onChooseWipePair}
                />
              ) : (
                <div className="flex h-full min-h-32 items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 text-xs text-muted-foreground">
                  No wipe pairs match
                </div>
              )}
            </TabsContent>

            <TabsContent
              scrollable={true}
              value="presets"
              className="min-h-0 overflow-y-auto"
            >
              {visibleShapeOptions.length > 0 ? (
                <ShapePresetGrid
                  stop={stop}
                  visibleShapeOptions={visibleShapeOptions}
                  className="max-h-none overflow-visible"
                  onShapeIconChange={onShapeIconChange}
                  onOpenShapePicker={onOpenShapePicker}
                />
              ) : (
                <div className="flex h-full min-h-32 items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 text-xs text-muted-foreground">
                  No presets match
                </div>
              )}
            </TabsContent>

            <TabsContent
              scrollable={true}
              value="upload"
              className="min-h-0 overflow-y-auto"
            >
              <div className="flex h-full min-h-60 flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border bg-muted/20 px-6 py-8 text-center">
                <span className="grid size-11 place-items-center rounded-full bg-muted text-foreground">
                  <Upload aria-hidden="true" className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Upload your own SVG
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Outlined paths and basic shapes work best.
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={() => {
                    onUploadShape(stop.id)
                    onOpenShapePicker(null)
                  }}
                >
                  Upload SVG
                </Button>
                <ul className="mt-1 flex flex-wrap justify-center gap-1.5 text-2xs text-muted-foreground">
                  {[
                    "Outline text & strokes",
                    "Flatten masks",
                    "Expand <use> and <defs>",
                  ].map((tip) => (
                    <li
                      key={tip}
                      className="flex items-center gap-1 rounded-full bg-muted/60 px-2 py-1"
                    >
                      <Check aria-hidden="true" className="size-3" />
                      {tip}
                    </li>
                  ))}
                </ul>
                <p className="max-w-sm text-2xs leading-relaxed text-muted-foreground/70">
                  Scripts, images, and external references are removed for safe
                  3D conversion.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Base UI keeps the closing dialog alive for its exit animation. After it
// closes, ignore document updates until the next open supplies fresh props.
export const ShapePickerContent = memo(
  ShapePickerDialog,
  (previous, next) => !previous.open && !next.open
)
