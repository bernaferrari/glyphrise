import type { ExportRenderOptions, SvgCanvasProps } from "../3d/SvgTypes"

/** Frames per side of the sheet; 1 is a single still. */
export type FrameSheetGrid = 1 | 2 | 3 | 4

export const FRAME_SHEET_GRIDS: FrameSheetGrid[] = [1, 2, 3, 4]

const MIN_CELL = 64

/**
 * The image keeps the chosen size and each frame gets an equal cell, so a
 * 16:9 sheet stays 16:9 whatever the grid.
 */
export const frameSheetLayout = (
  grid: FrameSheetGrid,
  size: { width: number; height: number }
) => {
  const cellWidth = Math.max(MIN_CELL, Math.floor(size.width / grid))
  const cellHeight = Math.max(MIN_CELL, Math.floor(size.height / grid))
  return {
    grid,
    count: grid * grid,
    cellWidth,
    cellHeight,
    width: cellWidth * grid,
    height: cellHeight * grid,
  }
}

/**
 * Evenly spaced through one loop, without the end frame: on a looping
 * animation it repeats the first, and sprite players (CSS `steps()`) would
 * show it twice.
 */
export const frameSheetTimes = (count: number, duration: number) =>
  Array.from({ length: count }, (_, index) => (index * duration) / count)

type FrameRenderer = {
  prepareExportRender: (options: ExportRenderOptions) => void
  renderExportFrame: (props: SvgCanvasProps) => Promise<HTMLCanvasElement>
  restorePreviewRender: () => void
}

/** Renders every frame through the export path and tiles them row by row. */
export const renderFrameSheet = async ({
  canvas,
  grid,
  options,
  duration,
  evaluateFrame,
}: {
  canvas: FrameRenderer
  grid: FrameSheetGrid
  options: ExportRenderOptions
  duration: number
  evaluateFrame: (time: number) => SvgCanvasProps
}): Promise<Blob> => {
  const layout = frameSheetLayout(grid, options)
  const sheet = document.createElement("canvas")
  sheet.width = layout.width
  sheet.height = layout.height
  const context = sheet.getContext("2d")
  if (!context) throw new Error("The browser could not create the image.")

  canvas.prepareExportRender({
    width: layout.cellWidth,
    height: layout.cellHeight,
    backgroundColor: options.backgroundColor,
  })
  try {
    const times = frameSheetTimes(layout.count, duration)
    for (const [index, time] of times.entries()) {
      // The renderer reuses one capture canvas, so copy each frame right away.
      const frame = await canvas.renderExportFrame(evaluateFrame(time))
      context.drawImage(
        frame,
        (index % grid) * layout.cellWidth,
        Math.floor(index / grid) * layout.cellHeight,
        layout.cellWidth,
        layout.cellHeight
      )
    }
  } finally {
    canvas.restorePreviewRender()
  }

  return new Promise<Blob>((resolve, reject) =>
    sheet.toBlob(
      (blob) =>
        blob && blob.size > 0
          ? resolve(blob)
          : reject(new Error("The browser could not create the PNG.")),
      "image/png"
    )
  )
}
