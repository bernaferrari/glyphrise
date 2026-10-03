import { useState, type RefObject } from "react"
import { Upload } from "lucide-react"
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

export function ShapePickerContent({
  open,
  finalFocusRef,
  onOpenChange,
  stop,
  visibleShapeOptions,
  favoriteMaterialSymbols,
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
  onToggleMaterialSymbolFavorite,
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
  favoriteMaterialSymbols: string[]
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
  onToggleMaterialSymbolFavorite: (symbolName: string) => void
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
  const searching = shapeSearchQuery.trim().length > 0
  const searchSymbols = [
    ...favoriteMaterialSymbols,
    ...recentMaterialSymbols,
    ...filteredMaterialSymbols,
  ]
  const firstSearchResult = searchSymbols.includes(normalizedShapeQuery)
    ? normalizedShapeQuery.replace(/_/g, " ")
    : (visibleShapeOptions[0]?.name ?? searchSymbols[0]?.replace(/_/g, " "))
  const searchActionLabel = firstSearchResult
    ? `Use first result: ${firstSearchResult}`
    : "Try exact symbol name"
  const chooseSearchResult = (shapeId: string) => {
    if (searchSymbols.includes(normalizedShapeQuery)) {
      onChooseMaterialSymbol(shapeId, normalizedShapeQuery)
    } else if (visibleShapeOptions[0]) {
      onShapeIconChange(shapeId, visibleShapeOptions[0])
      onOpenShapePicker(null)
    } else if (searchSymbols[0]) {
      onChooseMaterialSymbol(shapeId, searchSymbols[0])
    } else {
      onImportMaterialSymbol(shapeId)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        finalFocus={finalFocusRef}
        className="!flex max-h-[min(78vh,620px)] !w-[min(720px,calc(100vw-32px))] !max-w-[min(720px,calc(100vw-32px))] flex-col gap-0 overflow-hidden p-0 shadow-2xl"
        onPointerDown={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
        onContextMenu={(event) => event.stopPropagation()}
      >
        <DialogHeader className="shrink-0 px-4 pt-3.5 pr-12 pb-1">
          <div className="flex min-w-0 items-center gap-2.5">
            <span
              aria-hidden="true"
              className="grid size-7 shrink-0 place-items-center rounded-md bg-muted [&_svg]:size-4 [&_svg]:fill-current [&_svg]:stroke-current"
              style={{ color: stop.color }}
              dangerouslySetInnerHTML={{ __html: stop.svgContent }}
            />
            <DialogTitle className="min-w-0 truncate text-sm font-semibold text-foreground">
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

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background px-3 pb-3">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="min-h-0 flex-1 gap-2.5"
          >
            <TabsList
              variant="line"
              className="w-full shrink-0 justify-start gap-1 border-b border-border px-1 group-data-horizontal/tabs:h-10"
            >
              <TabsTrigger value="symbols" className="flex-none px-2 text-xs">
                Symbols
              </TabsTrigger>
              <TabsTrigger value="wipe" className="flex-none px-2 text-xs">
                Wipe pairs
              </TabsTrigger>
              <TabsTrigger value="presets" className="flex-none px-2 text-xs">
                Presets
              </TabsTrigger>
              <TabsTrigger value="upload" className="flex-none px-2 text-xs">
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
                searchActionLabel={searchActionLabel}
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

            <TabsContent
              value="symbols"
              className="editor-scrollbar min-h-0 overflow-y-auto outline-none"
            >
              {searching && visibleShapeOptions.length > 0 && (
                <section className="mb-3">
                  <h3 className="mb-2 text-xs font-medium">Matching presets</h3>
                  <ShapePresetGrid
                    stop={stop}
                    visibleShapeOptions={visibleShapeOptions}
                    onShapeIconChange={onShapeIconChange}
                    onOpenShapePicker={onOpenShapePicker}
                  />
                  <h3 className="mt-3 text-xs font-medium">Material Symbols</h3>
                </section>
              )}
              {favoriteMaterialSymbols.length > 0 && (
                <section className="mb-3">
                  <div className="mb-1.5 px-0.5 text-[11px] font-medium tracking-[0.12em] text-muted-foreground uppercase">
                    Favorites
                  </div>
                  <MaterialSymbolGrid
                    stop={stop}
                    filteredMaterialSymbols={favoriteMaterialSymbols}
                    normalizedShapeQuery={normalizedShapeQuery}
                    materialSymbolClass={materialSymbolClass}
                    symbolStyle={symbolStyle}
                    materialSymbolStatus={materialSymbolStatus}
                    favoriteMaterialSymbols={favoriteMaterialSymbols}
                    className="mb-0 max-h-24"
                    onChooseMaterialSymbol={onChooseMaterialSymbol}
                    onImportMaterialSymbol={onImportMaterialSymbol}
                    onToggleMaterialSymbolFavorite={
                      onToggleMaterialSymbolFavorite
                    }
                  />
                </section>
              )}

              {recentMaterialSymbols.length > 0 && (
                <section className="mb-3">
                  <div className="mb-1.5 px-0.5 text-[11px] font-medium tracking-[0.12em] text-muted-foreground uppercase">
                    Recent
                  </div>
                  <MaterialSymbolGrid
                    stop={stop}
                    filteredMaterialSymbols={recentMaterialSymbols}
                    normalizedShapeQuery={normalizedShapeQuery}
                    materialSymbolClass={materialSymbolClass}
                    symbolStyle={symbolStyle}
                    materialSymbolStatus={materialSymbolStatus}
                    favoriteMaterialSymbols={favoriteMaterialSymbols}
                    className="mb-0 max-h-24"
                    onChooseMaterialSymbol={onChooseMaterialSymbol}
                    onImportMaterialSymbol={onImportMaterialSymbol}
                    onToggleMaterialSymbolFavorite={
                      onToggleMaterialSymbolFavorite
                    }
                  />
                </section>
              )}

              <MaterialSymbolGrid
                stop={stop}
                filteredMaterialSymbols={filteredMaterialSymbols}
                normalizedShapeQuery={normalizedShapeQuery}
                materialSymbolClass={materialSymbolClass}
                symbolStyle={symbolStyle}
                materialSymbolStatus={materialSymbolStatus}
                favoriteMaterialSymbols={favoriteMaterialSymbols}
                className="mb-0 max-h-[min(36vh,300px)]"
                onChooseMaterialSymbol={onChooseMaterialSymbol}
                onImportMaterialSymbol={onImportMaterialSymbol}
                onToggleMaterialSymbolFavorite={onToggleMaterialSymbolFavorite}
              />
            </TabsContent>

            <TabsContent
              value="wipe"
              className="editor-scrollbar min-h-0 overflow-y-auto outline-none"
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
                <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 text-xs text-muted-foreground">
                  No wipe pairs match
                </div>
              )}
            </TabsContent>

            <TabsContent
              value="presets"
              className="editor-scrollbar min-h-0 overflow-y-auto outline-none"
            >
              {visibleShapeOptions.length > 0 ? (
                <ShapePresetGrid
                  stop={stop}
                  visibleShapeOptions={visibleShapeOptions}
                  className="max-h-[min(36vh,300px)]"
                  onShapeIconChange={onShapeIconChange}
                  onOpenShapePicker={onOpenShapePicker}
                />
              ) : !searching || searchSymbols.length === 0 ? (
                <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 text-xs text-muted-foreground">
                  No presets match
                </div>
              ) : null}
              {searching && searchSymbols.length > 0 && (
                <section className="mt-3">
                  <h3 className="mb-2 text-xs font-medium">
                    Matching Material Symbols
                  </h3>
                  <MaterialSymbolGrid
                    stop={stop}
                    filteredMaterialSymbols={searchSymbols}
                    normalizedShapeQuery={normalizedShapeQuery}
                    materialSymbolClass={materialSymbolClass}
                    symbolStyle={symbolStyle}
                    materialSymbolStatus={materialSymbolStatus}
                    onChooseMaterialSymbol={onChooseMaterialSymbol}
                    onImportMaterialSymbol={onImportMaterialSymbol}
                  />
                </section>
              )}
            </TabsContent>

            <TabsContent
              value="upload"
              className="editor-scrollbar min-h-0 overflow-y-auto outline-none"
            >
              <div className="flex min-h-40 flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border bg-muted/25 p-6 text-center">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Clean, path-based SVG
                  </p>
                  <p className="mt-1 max-w-md text-[11px] leading-relaxed text-muted-foreground">
                    Use an SVG made from outlined paths and basic shapes.
                    Scripts, images, text, masks, and external references are
                    removed or rejected for safe 3D conversion.
                  </p>
                </div>
                <Button
                  type="button"
                  size="lg"
                  variant="outline"
                  onClick={() => {
                    onUploadShape(stop.id)
                    onOpenShapePicker(null)
                  }}
                >
                  <Upload className="size-4" />
                  Upload SVG
                </Button>
                <div className="max-w-md text-left text-[11px] leading-relaxed text-muted-foreground">
                  <p className="font-medium text-foreground">
                    Before uploading
                  </p>
                  <p className="mt-1">
                    Outline text and strokes, flatten masks, and expand{" "}
                    <code>&lt;use&gt;</code>/<code>&lt;defs&gt;</code> instances
                    in your vector editor.
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}
